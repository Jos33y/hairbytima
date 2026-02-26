export const verificationCodeTemplate = (data) => {
  const { code, customerName } = data;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          /* Same styles as order-confirmation */
          .code {
            font-size: 36px;
            font-weight: 600;
            color: #EC4899;
            text-align: center;
            letter-spacing: 0.2em;
            padding: 30px;
            background: #242424;
            border-radius: 12px;
            margin: 30px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">HairByTimaBlaq</div>
            <h1 class="title">Verify Your Email</h1>
            <p class="subtitle">Hi ${customerName}, here's your verification code</p>
          </div>
          
          <div class="card">
            <p style="color: #B4B4B4; text-align: center; margin-bottom: 20px;">
              Enter this code to access your dashboard:
            </p>
            
            <div class="code">${code}</div>
            
            <p style="color: #8A8A8A; font-size: 14px; text-align: center; margin-top: 20px;">
              This code expires in 10 minutes
            </p>
          </div>
          
          <div class="footer">
            <p>Didn't request this? You can safely ignore this email.</p>
            <p>hairbytimablaq.com</p>
          </div>
        </div>
      </body>
    </html>
  `;
};