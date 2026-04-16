import PDFDocument from "pdfkit";

const formatCurrency = (amount) =>
  `KES ${Number(amount || 0).toLocaleString()}`;

const formatDateTime = (value) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toLocaleString() : date.toLocaleString();
};

const buildOrderCode = (orderId) =>
  `BLW-${String(orderId).slice(-6).toUpperCase()}`;

const buildVehicleTitle = (vehicle = {}) =>
  vehicle.title || [vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(" ");

export const buildReceiptFilename = (payment) =>
  `receipt_${payment.receiptNumber || payment._id}.pdf`;

export const generateReceiptPdfBuffer = ({ order, payment, customer, vehicle }) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const paymentLabel = payment.type === "balance" ? "Balance Payment" : "Deposit Payment";
    const vehicleTitle = buildVehicleTitle(vehicle);
    const orderCode = buildOrderCode(order._id);
    const gatewayReference =
      payment.gatewayMeta?.externalReceipt ||
      payment.gatewayMeta?.mpesaReceiptNumber ||
      payment.gatewayMeta?.paymentIntent ||
      payment.txRef;

    doc.fontSize(24).fillColor("#0b3d91").text("Blowit Payment Receipt");
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#374151");
    doc.text("Blowit by AVLC");
    doc.text("support@blowit.africa");
    doc.moveDown();

    doc.fontSize(14).fillColor("#111827").text("Receipt Details", { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(11);
    doc.text(`Receipt No: ${payment.receiptNumber || payment._id}`);
    doc.text(`Payment Type: ${paymentLabel}`);
    doc.text(`Payment Method: ${payment.method === "CARD" ? "Credit Card" : "M-Pesa"}`);
    doc.text(`Order Code: ${orderCode}`);
    doc.text(`Order ID: ${order._id}`);
    doc.text(`Paid At: ${formatDateTime(payment.paidAt || payment.createdAt)}`);
    doc.text(`Gateway Reference: ${gatewayReference}`);
    doc.moveDown();

    doc.fontSize(14).text("Customer", { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(11);
    doc.text(`Name: ${order.fullName || customer?.name || "Customer"}`);
    doc.text(`Email: ${order.email || customer?.email || "-"}`);
    doc.text(`Phone: ${order.phone || customer?.phone || "-"}`);
    doc.moveDown();

    doc.fontSize(14).text("Vehicle", { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(11);
    doc.text(`Vehicle: ${vehicleTitle || "Vehicle Import Order"}`);
    if (vehicle?.stockNumber) {
      doc.text(`Stock Number: ${vehicle.stockNumber}`);
    }
    if (vehicle?.chassisNumber) {
      doc.text(`Chassis Number: ${vehicle.chassisNumber}`);
    }
    doc.moveDown();

    doc.fontSize(14).text("Amounts", { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(11);
    doc.text(`Total Order Price: ${formatCurrency(order.totalPrice)}`);
    doc.text(`This Payment: ${formatCurrency(payment.amount)}`);
    doc.text(`Deposit Amount: ${formatCurrency(order.depositAmount)}`);
    doc.text(`Outstanding Balance: ${formatCurrency(order.balanceAmount)}`);
    doc.moveDown();

    doc.fontSize(11).fillColor("#6b7280");
    doc.text(
      "This receipt confirms payment received toward your vehicle import order. Keep it for your records."
    );

    doc.end();
  });
