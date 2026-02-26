export const orderConfirmationTemplate = (order) => {
  const { orderNumber, customerName, items, total, currency, trackingUrl } = order;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
          body {
            font-family: 'Inter', Arial, sans-serif;
            background-color: #111111;
            color: #F5F5F5;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
          }
          .logo {
            font-family: 'Italiana', serif;
            font-size: 32px;
            color: #EC4899;
            margin-bottom: 10px;
          }
          .title {
            font-size: 24px;
            color: #F5F5F5;
            margin-bottom: 10px;
          }
          .subtitle {
            font-size: 16px;
            color: #B4B4B4;
          }
          .card {
            background-color: #1E1E1E;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 20px;
          }
          .order-number {
            font-size: 18px;
            color: #EC4899;
            font-weight: 500;
            margin-bottom: 20px;
          }
          .item {
            display: flex;
            justify-content: space-between;
            padding: 15px 0;
            border-bottom: 1px solid #333333;
          }
          .item:last-child {
            border-bottom: none;
          }
          .item-name {
            color: #F5F5F5;
          }
          .item-price {
            color: #B4B4B4;
          }
          .total {
            font-size: 20px;
            font-weight: 500;
            color: #EC4899;
            text-align: right;
            margin-top: 20px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%);
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-top: 30px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            color: #8A8A8A;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">HairByTimaBlaq</div>
            <h1 class="title">Order Confirmed</h1>
            <p class="subtitle">Thank you for your purchase, ${customerName}!</p>
          </div>
          
          <div class="card">
            <div class="order-number">Order ${orderNumber}</div>
            
            ${items.map(item => `
              <div class="item">
                <div class="item-name">
                  ${item.name} × ${item.quantity}
                </div>
                <div class="item-price">
                  ${currency}${item.price}
                </div>
              </div>
            `).join('')}
            
            <div class="total">
              Total: ${currency}${total}
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${trackingUrl}" class="button">Track Your Order</a>
          </div>
          
          <div class="footer">
            <p>Questions? Reply to this email or visit our website.</p>
            <p>hairbytimablaq.com</p>
          </div>
        </div>
      </body>
    </html>
  `;
};