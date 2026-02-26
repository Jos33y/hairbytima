import { Resend } from 'resend';
import { verificationCodeTemplate } from './templates/verification-code.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, code, customerName } = req.body;

  try {
    const { data, error } = await resend.emails.send({
      from: 'HairByTimaBlaq <noreply@hairbytimablaq.com>',
      to: email,
      subject: 'Verify Your Email',
      html: verificationCodeTemplate({ code, customerName }),
    });

    if (error) {
      return res.status(400).json({ error });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}