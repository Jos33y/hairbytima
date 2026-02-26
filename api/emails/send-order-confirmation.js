import { Resend } from 'resend';
import { orderConfirmationTemplate } from './templates/order-confirmation.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { order } = req.body;

  try {
    const { data, error } = await resend.emails.send({
      from: 'HairByTimaBlaq <noreply@hairbytimablaq.com>',
      to: order.email,
      subject: `Order Confirmed - ${order.orderNumber}`,
      html: orderConfirmationTemplate(order),
    });

    if (error) {
      return res.status(400).json({ error });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}