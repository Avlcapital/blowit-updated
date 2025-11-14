import api from "./api";
import { BASE_URL } from "./config";

// 1. Create Order
export const createImportOrder = async (payload) => {
  return await api.post(`${BASE_URL}/api/orders/create`, payload);
};

// 2. Initiate PesaLink Payment
export const initiatePesaLinkPayment = async ({ orderId, amount, phone, email }) => {
  return await api.post(`${BASE_URL}/api/payments/ipay/pesa-link`, {
    orderId,
    amount,
    phone,
    email,
  });
};
