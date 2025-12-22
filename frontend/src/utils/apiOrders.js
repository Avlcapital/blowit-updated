/*import api from "./api";
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
};*/

import api from "./api";
import { BASE_URL } from "./config";

export const createImportOrder = (data) =>
  api.post(`${BASE_URL}/api/orders/create`, data);

// M-Pesa STK initiate (protected)
export const initiateMpesaStk = (data) =>
  api.post(`${BASE_URL}/api/payments/mpesa/stk/initiate`, data);

// Stripe checkout (protected)
export const createStripeCheckout = (data) =>
  api.post(`${BASE_URL}/api/payments/stripe/checkout`, data);