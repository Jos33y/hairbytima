// =============================================================================
// Upload Payment Proof API - /api/orders/upload-proof
// =============================================================================

import { supabase } from './../_lib/supabase.js';
import { sendPaymentProofUploaded, sendAdminPaymentProofNotification } from './../_lib/resend.js';
import { formidable } from 'formidable';
import fs from 'fs';
import path from 'path';

// Disable body parser for file uploads 
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowEmptyFiles: false,
    });

    const [fields, files] = await form.parse(req);

    const file = files.file?.[0];
    const orderId = fields.orderId?.[0];
    const orderNumber = fields.orderNumber?.[0];

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Please upload an image (JPG, PNG, WebP) or PDF.' 
      });
    }

    // Fetch FULL order details (need currency, total, customer_email for email)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, payment_status, currency, total, customer_email')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Read file
    const fileBuffer = fs.readFileSync(file.filepath);

    // Generate unique filename
    const ext = path.extname(file.originalFilename || '.jpg');
    const filename = `payment-proofs/${order.order_number}/${Date.now()}${ext}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('orders')
      .upload(filename, fileBuffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload file');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('orders')
      .getPublicUrl(filename);

    const publicUrl = urlData?.publicUrl;

    // Update order with payment proof
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_proof_url: publicUrl,
        payment_proof_type: file.mimetype.startsWith('image/') ? 'image' : 'pdf',
        payment_proof_uploaded_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error('Failed to update order');
    }

    // Add timeline entry
    await supabase
      .from('order_timeline')
      .insert({
        order_id: orderId,
        action: 'Payment proof uploaded',
        description: 'Awaiting verification',
        performed_by: 'Customer',
      });

    // Create admin notification
    await supabase.from('admin_notifications').insert({
      type: 'payment_proof_uploaded',
      title: 'Payment Proof Uploaded',
      message: `Order ${order.order_number} - Customer uploaded payment proof`,
      link: `/admin/orders?id=${orderId}`,
      metadata: { order_id: orderId, order_number: order.order_number },
    });

    // Get exchange rate for the order's currency
    let exchangeRate = 1;
    if (order.currency && order.currency !== 'USD') {
      const { data: rateData } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency', 'USD')
        .eq('to_currency', order.currency)
        .eq('is_active', true)
        .single();
      
      if (rateData?.rate) {
        exchangeRate = parseFloat(rateData.rate);
      }
    }

    // Send confirmation email to customer
    try {
      const emailResult = await sendPaymentProofUploaded(order, exchangeRate);
      if (emailResult.success) {
        console.log('✅ Payment proof confirmation email sent:', emailResult.id);
      } else {
        console.error('❌ Payment proof email failed:', emailResult.error);
      }
    } catch (emailErr) {
      // Don't fail the upload if email fails
      console.error('❌ Email sending error:', emailErr);
    }

    // Send notification email to admin
    try {
      const adminEmailResult = await sendAdminPaymentProofNotification(order);
      if (adminEmailResult.success) {
        console.log('✅ Admin payment proof notification sent:', adminEmailResult.id);
      } else {
        console.error('❌ Admin email failed:', adminEmailResult.error);
      }
    } catch (emailErr) {
      console.error('❌ Admin email error:', emailErr);
    }

    // Cleanup temp file
    fs.unlinkSync(file.filepath);

    return res.status(200).json({
      success: true,
      message: 'Payment proof uploaded successfully',
      proofUrl: publicUrl,
    });

  } catch (err) {
    console.error('Upload proof error:', err);
    return res.status(500).json({ 
      error: err.message || 'Failed to upload payment proof' 
    });
  }
}