const brand = {
  name: "Blowit by AVLC Group",
  site: "https://blowitafrica.com",
  supportEmail: "support@blowitafrica.com",
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
        &copy; ${new Date().getFullYear()} ${brand.name}. All rights reserved.
      </div>
    </div>
  </div>
`;

export const orderEmails = {
  created: ({
    customerName,
    orderId,
    vehicleTitle,
    totalPrice,
    depositAmount,
    depositPercent,
  }) => ({
    subject: `Order Received - #${orderId}`,
    html: wrap(
      "We received your order",
      `
        <p>Hi ${customerName},</p>
        <p>Thanks for choosing Blowit. We have received your request for <b>${vehicleTitle}</b>.</p>
        <ul>
          <li>Order ID: <b>#${orderId}</b></li>
          <li>Total Price: <b>KES ${Number(totalPrice).toLocaleString()}</b></li>
          <li>Deposit (${Number(depositPercent || 0)}%): <b>KES ${Number(
            depositAmount
          ).toLocaleString()}</b></li>
        </ul>
        <p>We will notify you as soon as your payment is confirmed.</p>
      `
    ),
  }),

  depositPaid: ({ customerName, orderId }) => ({
    subject: `Deposit Confirmed - #${orderId}`,
    html: wrap(
      "Deposit confirmed",
      `
        <p>Hi ${customerName},</p>
        <p>Your deposit for order <b>#${orderId}</b> has been confirmed. AVLC will now continue processing your import request.</p>
        <p>We will keep you updated as your order progresses.</p>
      `
    ),
  }),

  financed: ({ customerName, orderId }) => ({
    subject: `Financing Approved - #${orderId}`,
    html: wrap(
      "AVLC financing approved",
      `
        <p>Hi ${customerName},</p>
        <p>Your order <b>#${orderId}</b> is now financed by AVLC. We are placing the purchase and preparing shipping.</p>
        <p>Next update: <b>Shipped</b> with tracking details.</p>
      `
    ),
  }),

  shipped: ({ customerName, orderId, portFrom }) => ({
    subject: `Your Car Has Shipped - #${orderId}`,
    html: wrap(
      "Your car is on the way",
      `
        <p>Hi ${customerName},</p>
        <p>Your order <b>#${orderId}</b> has shipped${
          portFrom ? ` from <b>${portFrom}</b>` : ""
        }. We will notify you when it arrives at the Port of Mombasa.</p>
      `
    ),
  }),

  arrived: ({ customerName, orderId }) => ({
    subject: `Arrived at Mombasa - #${orderId}`,
    html: wrap(
      "Your car has arrived",
      `
        <p>Hi ${customerName},</p>
        <p>Great news. Your order <b>#${orderId}</b> has arrived at the Port of Mombasa. We are clearing customs and processing the logbook.</p>
        <p>We will let you know when the vehicle is ready for pickup and any final settlement needed.</p>
      `
    ),
  }),

  completed: ({ customerName, orderId }) => ({
    subject: `Order Completed - #${orderId}`,
    html: wrap(
      "Order completed",
      `
        <p>Hi ${customerName},</p>
        <p>Your order <b>#${orderId}</b> is complete. Thank you for choosing Blowit.</p>
      `
    ),
  }),

  docsUploaded: ({ customerName, orderId }) => ({
    subject: `Documents Updated - #${orderId}`,
    html: wrap(
      "New documents available",
      `
        <p>Hi ${customerName},</p>
        <p>We have uploaded new documents for order <b>#${orderId}</b>. You can view them in your account.</p>
      `
    ),
  }),

  paymentReceipt: ({
    customerName,
    orderId,
    vehicleTitle,
    paymentType,
    amount,
    balanceAmount,
    method,
    receiptNumber,
    paidAt,
  }) => ({
    subject: `${paymentType === "balance" ? "Balance" : "Deposit"} Receipt - #${orderId}`,
    html: wrap(
      "Payment receipt",
      `
        <p>Hi ${customerName},</p>
        <p>We have received your ${
          paymentType === "balance" ? "balance payment" : "deposit payment"
        } for <b>${vehicleTitle}</b>.</p>
        <ul>
          <li>Order ID: <b>#${orderId}</b></li>
          <li>Receipt Number: <b>${receiptNumber}</b></li>
          <li>Payment Method: <b>${method}</b></li>
          <li>Amount Paid: <b>KES ${Number(amount).toLocaleString()}</b></li>
          <li>Remaining Balance: <b>KES ${Number(balanceAmount || 0).toLocaleString()}</b></li>
          <li>Paid At: <b>${new Date(paidAt).toLocaleString()}</b></li>
        </ul>
        <p>Your PDF receipt is attached to this email for immediate download.</p>
      `
    ),
  }),
};
