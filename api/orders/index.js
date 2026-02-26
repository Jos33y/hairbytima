// =============================================================================
// Public Orders API - /api/orders
// =============================================================================
// POST: Create a new order (public - no auth required)
// GET: Get order by ID (for payment page) or by order_number + email (tracking)
// =============================================================================

import { supabase } from './../_lib/supabase.js';
import { sendOrderConfirmation, sendAdminNewOrderNotification } from './../_lib/resend.js';

export default async function handler(req, res) {
  switch (req.method) {
    case 'POST':
      return createOrder(req, res);
    case 'GET':
      return getOrder(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// =============================================================================
// Generate unique order number
// =============================================================================
function generateOrderNumber() {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `HBT-${year}-${timestamp}${random}`;
}

// =============================================================================
// POST - Create new order
// =============================================================================
async function createOrder(req, res) {
  try {
    const {
      // Customer info
      email,
      phone,
      
      // Shipping address
      firstName,
      lastName,
      address,
      apartment,
      city,
      state,
      postalCode,
      country,
      countryCode,
      
      // Cart items
      items,
      
      // Totals
      subtotal,
      discount,
      couponCode,
      couponId,
      shipping,
      total,
      currency,
      
      // Payment
      paymentMethod,
      
      // Optional
      isGift,
      giftMessage,
      customerNotes,
    } = req.body;

    // Validation
    if (!email || !phone) {
      return res.status(400).json({ error: 'Email and phone are required' });
    }

    if (!firstName || !lastName || !address || !city || !country) {
      return res.status(400).json({ error: 'Shipping address is incomplete' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method is required' });
    }

    // Validate payment method against enum: 'klarna', 'bank_transfer'
    const validPaymentMethods = ['klarna', 'bank_transfer'];
    const dbPaymentMethod = paymentMethod === 'bank' ? 'bank_transfer' : paymentMethod;
    
    if (!validPaymentMethods.includes(dbPaymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create customer name
    const customerName = `${firstName} ${lastName}`;

    // ==========================================================================
    // Create or Update Customer Record - FIXED: Prevent duplicates
    // ==========================================================================
    let customerId = req.body.customerId || null;
    const normalizedEmail = email.toLowerCase().trim();

    try {
      // Check if customer exists using maybeSingle (doesn't throw on no result)
      const { data: existingCustomer, error: lookupError } = await supabase
        .from('customers')
        .select('id, total_orders, total_spent')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (lookupError) {
        console.error('Customer lookup error:', lookupError);
      }

      if (existingCustomer) {
        // Update existing customer
        customerId = existingCustomer.id;
        await supabase
          .from('customers')
          .update({
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            last_order_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingCustomer.id);
      } else {
        // Create new customer using upsert to prevent race condition duplicates
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .upsert({
            email: normalizedEmail,
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            total_orders: 0,
            total_spent: 0,
            last_order_at: new Date().toISOString(),
          }, {
            onConflict: 'email',
            ignoreDuplicates: false, // Update if exists
          })
          .select()
          .single();

        if (!customerError && newCustomer) {
          customerId = newCustomer.id;
          
          // Only create notification if this is truly a new customer
          const isNew = !existingCustomer;
          if (isNew) {
            await supabase.from('admin_notifications').insert({
              type: 'new_customer',
              title: 'New Customer',
              message: `${customerName} (${normalizedEmail})`,
              link: '/admin/customers',
              metadata: { customer_id: newCustomer.id },
            });
          }
        } else if (customerError) {
          console.error('Customer upsert error:', customerError);
        }
      }
    } catch (customerErr) {
      console.error('Customer create/update error:', customerErr);
      // Don't fail the order if customer creation fails
    }

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: customerId,
        customer_name: customerName,
        customer_email: normalizedEmail,
        customer_phone: phone,
        
        // Shipping address
        shipping_first_name: firstName,
        shipping_last_name: lastName,
        shipping_address: address,
        shipping_apartment: apartment || null,
        shipping_city: city,
        shipping_state: state || null,
        shipping_postal_code: postalCode || null,
        shipping_country: country,
        shipping_country_code: countryCode || null,
        
        // Totals
        subtotal: parseFloat(subtotal),
        discount: parseFloat(discount) || 0,
        coupon_code: couponCode || null,
        coupon_id: couponId || null,
        shipping_cost: parseFloat(shipping) || 0,
        total: parseFloat(total),
        currency: currency || 'USD',
        
        // Status - uses ENUMs from schema
        status: 'pending_payment',
        payment_status: 'pending',
        payment_method: dbPaymentMethod,
        
        // Gift options
        is_gift: isGift || false,
        gift_message: giftMessage || null,
        
        // Customer notes (added via supabase-altered.sql)
        customer_notes: customerNotes || null,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Create order error:', orderError);
      throw orderError;
    }

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      variant_id: item.variantId || null,
      product_name: item.name,
      product_image: item.image,
      product_sku: item.sku || null,
      length: item.length || null,
      quantity: item.quantity,
      unit_price: parseFloat(item.price),
      total_price: parseFloat(item.price) * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Create order items error:', itemsError);
    }

    // Create initial timeline entry (correct column names per schema!)
    await supabase
      .from('order_timeline')
      .insert({
        order_id: order.id,
        action: 'Order placed',
        description: `Payment method: ${dbPaymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Klarna'}`,
        performed_by: 'Customer',
      });

    // If coupon was used, record usage
    if (couponId) {
      try {
        // Record in coupon_usage table (all fields required by schema)
        await supabase.from('coupon_usage').insert({
          coupon_id: couponId,
          customer_email: email.toLowerCase().trim(),
          order_id: order.id,
          discount_amount: parseFloat(discount) || 0,
          order_total: parseFloat(total) || 0,
          used_at: new Date().toISOString(),
        });

        // Increment usage count
        await supabase.rpc('increment_coupon_usage', { coupon_id: couponId });
        
        // Update coupon analytics (revenue generated & discount given)
        const { data: currentCoupon } = await supabase
          .from('coupons')
          .select('total_revenue_generated, total_discount_given')
          .eq('id', couponId)
          .single();
        
        if (currentCoupon) {
          await supabase
            .from('coupons')
            .update({
              total_revenue_generated: (parseFloat(currentCoupon.total_revenue_generated) || 0) + parseFloat(total),
              total_discount_given: (parseFloat(currentCoupon.total_discount_given) || 0) + parseFloat(discount),
            })
            .eq('id', couponId);
        }
      } catch (couponErr) {
        console.error('Coupon usage recording error:', couponErr);
      }
    }

    // Update customer stats
    if (customerId) {
      try {
        await supabase.rpc('update_customer_stats', {
          p_customer_id: customerId,
          p_order_total: parseFloat(total),
        });
      } catch (statsErr) {
        console.error('Customer stats update error:', statsErr);
      }
    }

    // Get bank account for response (if bank transfer)
    let bankAccount = null;
    if (dbPaymentMethod === 'bank_transfer') {
      const { data: account } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('currency', currency || 'USD')
        .eq('is_active', true)
        .single();

      if (account) {
        bankAccount = {
          bankName: account.bank_name,
          accountName: account.account_name,
          accountNumber: account.account_number,
          sortCode: account.sort_code,
          routingNumber: account.routing_number,
          iban: account.iban,
          swiftCode: account.swift_code,
          branchName: account.branch_name,
          additionalInfo: account.additional_info,
        };
      }
    }

    // Create admin notification for new order
    await supabase.from('admin_notifications').insert({
      type: 'new_order',
      title: 'New Order Received',
      message: `Order ${orderNumber} from ${customerName} - ${currency} ${total}`,
      link: `/admin/orders?id=${order.id}`,
      metadata: { order_id: order.id, order_number: orderNumber },
    });

    // Send order confirmation email (async, don't block response)
    const emailOrder = {
      ...order,
      items: orderItems.map((item, idx) => ({
        ...items[idx],
        name: item.product_name,
        image: item.product_image,
        price: item.unit_price,
        unit_price: item.unit_price,
        total_price: item.total_price,
        length: item.length,
        quantity: item.quantity,
      })),
    };

    // Get bank account with full details for email
    let bankAccountForEmail = null;
    if (dbPaymentMethod === 'bank_transfer' && bankAccount) {
      const { data: account } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('currency', currency || 'USD')
        .eq('is_active', true)
        .single();
      
      if (account) {
        bankAccountForEmail = account;
      }
    }

    // Get exchange rate for the order's currency
    let exchangeRate = 1;
    if (currency && currency !== 'USD') {
      const { data: rateData } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency', 'USD')
        .eq('to_currency', currency)
        .eq('is_active', true)
        .single();
      
      if (rateData?.rate) {
        exchangeRate = parseFloat(rateData.rate);
        console.log(`💱 Exchange rate for ${currency}: ${exchangeRate}`);
      }
    }

    // Send emails - MUST await in serverless functions
    // Using Promise.allSettled so one failure doesn't block the other
    try {
      const emailResults = await Promise.allSettled([
        sendOrderConfirmation(emailOrder, bankAccountForEmail, exchangeRate),
        sendAdminNewOrderNotification(emailOrder),
      ]);

      // Log results
      const [customerResult, adminResult] = emailResults;
      
      if (customerResult.status === 'fulfilled') {
        if (customerResult.value.success) {
          console.log('✅ Order confirmation email sent:', customerResult.value.id);
        } else {
          console.error('❌ Customer email failed:', customerResult.value.error);
        }
      } else {
        console.error('❌ Customer email error:', customerResult.reason);
      }

      if (adminResult.status === 'fulfilled') {
        if (adminResult.value.success) {
          console.log('✅ Admin notification email sent:', adminResult.value.id);
        } else {
          console.error('❌ Admin email failed:', adminResult.value.error);
        }
      } else {
        console.error('❌ Admin email error:', adminResult.reason);
      }
    } catch (emailErr) {
      // Don't fail the order if emails fail
      console.error('❌ Email sending error:', emailErr);
    }

    return res.status(201).json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        total: parseFloat(order.total),
        currency: order.currency,
        customerEmail: order.customer_email,
        createdAt: order.created_at,
      },
      bankAccount,
    });

  } catch (err) {
    console.error('Create order error:', err);
    return res.status(500).json({ 
      error: 'Failed to create order', 
      details: err.message 
    });
  }
}

// =============================================================================
// GET - Get order for payment page (by ID) or tracking (by orderNumber + email)
// =============================================================================
async function getOrder(req, res) {
  try {
    const { id, orderNumber, email } = req.query;

    // =========================================================================
    // SCENARIO 1: Fetch by ID (for payment page refresh)
    // URL: /api/orders?id=xxx
    // =========================================================================
    if (id) {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_email,
          total,
          currency,
          payment_status,
          payment_method,
          payment_proof_url,
          rejection_reason,
          created_at
        `)
        .eq('id', id)
        .single();

      if (orderError || !order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Get bank account for the currency
      let bankAccount = null;
      if (order.payment_method === 'bank_transfer') {
        const { data: account } = await supabase
          .from('bank_accounts')
          .select('*')
          .eq('currency', order.currency)
          .eq('is_active', true)
          .single();

        if (account) {
          bankAccount = {
            bankName: account.bank_name,
            accountName: account.account_name,
            accountNumber: account.account_number,
            sortCode: account.sort_code,
            routingNumber: account.routing_number,
            iban: account.iban,
            swiftCode: account.swift_code,
          };
        }
      }

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

      return res.status(200).json({
        order,
        bankAccount,
        exchangeRate,
      });
    }

    // =========================================================================
    // SCENARIO 2: Fetch by orderNumber only (to check if order exists)
    // URL: /api/orders?orderNumber=xxx
    // Returns: minimal info (just confirms order exists, requires email to view details)
    // =========================================================================
    if (orderNumber && !email) {
      const normalizedOrderNumber = orderNumber.toUpperCase().trim();
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, order_number, created_at')
        .eq('order_number', normalizedOrderNumber)
        .single();

      if (orderError || !order) {
        return res.status(404).json({ 
          error: 'Order not found. Please check your order number.' 
        });
      }

      // Order exists, but require email to view full details
      return res.status(200).json({
        success: true,
        exists: true,
        orderNumber: order.order_number,
        requiresEmail: true,
        message: 'Please enter your email to view order details',
      });
    }

    // =========================================================================
    // SCENARIO 3: Fetch by orderNumber + email (for full tracking)
    // URL: /api/orders?orderNumber=xxx&email=xxx
    // =========================================================================
    if (orderNumber && email) {
      const normalizedOrderNumber = orderNumber.toUpperCase().trim();
      const normalizedEmail = email.toLowerCase().trim();

      // Find order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', normalizedOrderNumber)
        .eq('customer_email', normalizedEmail)
        .single();

      if (orderError || !order) {
        return res.status(404).json({ 
          error: 'Order not found. Please check your order number and email.' 
        });
      }

      // Get order items
      const { data: items } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      // Get timeline (correct column names per schema!)
      const { data: timeline } = await supabase
        .from('order_timeline')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: true });

      // Get bank account if still pending payment
      let bankAccount = null;
      if (order.payment_method === 'bank_transfer' && order.payment_status === 'pending') {
        const { data: account } = await supabase
          .from('bank_accounts')
          .select('*')
          .eq('currency', order.currency)
          .eq('is_active', true)
          .single();

        if (account) {
          bankAccount = {
            bankName: account.bank_name,
            accountName: account.account_name,
            accountNumber: account.account_number,
            sortCode: account.sort_code,
            routingNumber: account.routing_number,
            iban: account.iban,
            swiftCode: account.swift_code,
          };
        }
      }

      return res.status(200).json({
        success: true,
        order: {
          id: order.id,
          orderNumber: order.order_number,
          status: order.status,
          paymentStatus: order.payment_status,
          paymentMethod: order.payment_method,
          
          customer: {
            name: order.customer_name,
            email: order.customer_email,
            phone: order.customer_phone,
          },
          
          shippingAddress: {
            firstName: order.shipping_first_name,
            lastName: order.shipping_last_name,
            address: order.shipping_address,
            apartment: order.shipping_apartment,
            city: order.shipping_city,
            state: order.shipping_state,
            postalCode: order.shipping_postal_code,
            country: order.shipping_country,
          },
          
          items: (items || []).map(item => ({
            id: item.id,
            name: item.product_name,
            image: item.product_image,
            length: item.length,
            quantity: item.quantity,
            price: parseFloat(item.unit_price),
            total: parseFloat(item.total_price),
          })),
          
          subtotal: parseFloat(order.subtotal),
          discount: parseFloat(order.discount) || 0,
          couponCode: order.coupon_code,
          shipping: parseFloat(order.shipping_cost) || 0,
          total: parseFloat(order.total),
          currency: order.currency,
          
          tracking: order.tracking_number ? {
            number: order.tracking_number,
            carrier: order.carrier,
            shippedAt: order.shipped_at,
          } : null,
          
          deliveredAt: order.delivered_at,
          
          // Timeline with correct column names
          timeline: (timeline || []).map(t => ({
            action: t.action,
            description: t.description,
            performedBy: t.performed_by,
            timestamp: t.created_at,
          })),
          
          createdAt: order.created_at,
          updatedAt: order.updated_at,
        },
        bankAccount,
      });
    }

    // No valid parameters provided
    return res.status(400).json({ 
      error: 'Please provide order ID or order number' 
    });

  } catch (err) {
    console.error('Get order error:', err);
    return res.status(500).json({ 
      error: 'Failed to fetch order', 
      details: err.message 
    });
  }
}