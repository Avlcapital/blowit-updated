const brand = {
  name: "Blowit • AVLC Group",
  site: "https://blowit.africa",
  supportEmail: "support@blowit.africa",
};

const wrap = (title, body) => `
  <div style="font-family:Arial,sans-serif;padding:20px;color:#111;background:#f7f9fc">
    <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:#0b3d91;color:#fff;padding:16px 20px;font-size:18px;font-weight:700">
        ${brand.name}
      </div>
      <div style="padding:20px">
        <h2 style="margin:0 0 8px 0;color:#0b3d91;">${title}</h2>
        <div style="line-height:1.6;font-size:15px;">${body}</div>
        <p style="margin-top:24px;font-size:13px;color:#6b7280">
          Need help? Reply to this email or contact ${brand.supportEmail}.
        </p>
      </div>
      <div style="background:#f3f4f6;color:#6b7280;padding:12px 20px;font-size:12px;text-align:center">
        © ${new Date().getFullYear()} ${brand.name}. All rights reserved.
      </div>
    </div>
  </div>
`;

export const orderEmails = {
  created: ({ customerName, orderId, vehicleTitle, totalPrice, depositAmount }) => ({
    subject: `Order Received • #${orderId}`,
    html: wrap(
      "We received your order ",
      `
        <p>Hi ${customerName},</p>
        <p>Thanks for choosing Blowit. We’ve received your request for <b>${vehicleTitle}</b>.</p>
        <ul>
          <li>Order ID: <b>#${orderId}</b></li>
          <li>Total Price: <b>KES ${Number(totalPrice).toLocaleString()}</b></li>
          <li>Deposit (50%): <b>KES ${Number(depositAmount).toLocaleString()}</b></li>
        </ul>
        <p>We’ll notify you as soon as your deposit is confirmed.</p>
      `
    ),
  }),

  depositPaid: ({ customerName, orderId }) => ({
    subject: `Deposit Confirmed • #${orderId}`,
    html: wrap(
      "Deposit confirmed ",
      `
        <p>Hi ${customerName},</p>
        <p>Your 50% deposit for order <b>#${orderId}</b> is confirmed. AVLC will now process your financing and purchase from Be Forward.</p>
        <p>We’ll update you when financing is approved.</p>
      `
    ),
  }),

  financed: ({ customerName, orderId }) => ({
    subject: `Financing Approved • #${orderId}`,
    html: wrap(
      "AVLC Financing approved ",
      `
        <p>Hi ${customerName},</p>
        <p>Your order <b>#${orderId}</b> is now financed by AVLC. We’re placing the purchase and preparing shipping.</p>
        <p>Next update: <b>Shipped</b> with tracking details.</p>
      `
    ),
  }),

  shipped: ({ customerName, orderId, portFrom }) => ({
    subject: `Your Car Has Shipped • #${orderId}`,
    html: wrap(
      "Your car is on the way ",
      `
        <p>Hi ${customerName},</p>
        <p>Your order <b>#${orderId}</b> has shipped${portFrom ? ` from <b>${portFrom}</b>` : ""}. We’ll notify you when it arrives at the Port of Mombasa.</p>
      `
    ),
  }),

  arrived: ({ customerName, orderId }) => ({
    subject: `Arrived at Mombasa • #${orderId}`,
    html: wrap(
      "Your car has arrived ",
      `
        <p>Hi ${customerName},</p>
        <p>Great news! Your order <b>#${orderId}</b> has arrived at the Port of Mombasa. We’re clearing customs and processing the logbook.</p>
        <p>We’ll let you know when the car is ready for pickup and settlement of the final 50%.</p>
      `
    ),
  }),

  completed: ({ customerName, orderId }) => ({
    subject: `Ready for Pickup • #${orderId}`,
    html: wrap(
      "Order completed ",
      `
        <p>Hi ${customerName},</p>
        <p>Your order <b>#${orderId}</b> is complete. The vehicle is ready for pickup/delivery once the final balance is settled.</p>
        <p>Thank you for choosing Blowit.</p>
      `
    ),
  }),

  docsUploaded: ({ customerName, orderId }) => ({
    subject: `Documents Updated • #${orderId}`,
    html: wrap(
      "New documents available ",
      `
        <p>Hi ${customerName},</p>
        <p>We’ve uploaded new documents for order <b>#${orderId}</b> (e.g., invoice/shipping/logbook). You can view them in your account.</p>
      `
    ),
  }),
};
