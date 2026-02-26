export const orderShippedTemplate = (order) => {
  const { orderNumber, customerName, trackingNumber, carrier, trackingUrl } = order;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          /* Same styles as order-confirmation */
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">HairByTimaBlaq</div>
            <h1 class="title">Your Order Has Shipped</h1>
            <p class="subtitle">On its way to you, ${customerName}!</p>
          </div>
          
          <div class="card">
            <div class="order-number">Order ${orderNumber}</div>
            <p style="color: #B4B4B4; margin: 20px 0;">
              Your order is on its way! Track your package below.
            </p>
            
            <div style="background: #242424; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <div style="color: #8A8A8A; font-size: 14px; margin-bottom: 5px;">
                Carrier
              </div>
              <div style="color: #F5F5F5; font-size: 16px; margin-bottom: 15px;">
                ${carrier}
              </div>
              
              <div style="color: #8A8A8A; font-size: 14px; margin-bottom: 5px;">
                Tracking Number
              </div>
              <div style="color: #EC4899; font-size: 16px; font-weight: 500;">
                ${trackingNumber}
              </div>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${trackingUrl}" class="button">Track Package</a>
          </div>
          
          <div class="footer">
            <p>Expected delivery: 3-5 business days</p>
            <p>hairbytimablaq.com</p>
          </div>
        </div>
      </body>
    </html>
  `;
};