import axios from "axios";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

const paystackClient = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

export interface SubaccountData {
  business_name: string;
  settlement_bank: string;
  account_number: string;
  percentage_charge: number;
}

export async function createSubaccount(data: SubaccountData) {
  try {
    const response = await paystackClient.post("/subaccount", data);
    return response.data.data;
  } catch (error: any) {
    console.error("Paystack subaccount creation error:", error.response?.data || error);
    throw new Error(error.response?.data?.message || "Failed to create subaccount");
  }
}

export async function verifyBankAccount(accountNumber: string, bankCode: string) {
  try {
    const response = await paystackClient.get(
      `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Bank verification error:", error.response?.data || error);
    throw new Error(error.response?.data?.message || "Failed to verify bank account");
  }
}

export async function initializePayment(email: string, amount: number, metadata: any, subaccount?: string) {
  try {
    const payload: any = {
      email,
      amount: amount * 100, // Convert to kobo
      metadata,
      callback_url: metadata.callback_url,
    };

    if (subaccount) {
      payload.subaccount = subaccount;
      payload.transaction_charge = metadata.platformFee * 100; // Platform fee in kobo
    }

    const response = await paystackClient.post("/transaction/initialize", payload);
    return response.data.data;
  } catch (error: any) {
    console.error("Payment initialization error:", error.response?.data || error);
    throw new Error(error.response?.data?.message || "Failed to initialize payment");
  }
}

export async function verifyPayment(reference: string) {
  try {
    const response = await paystackClient.get(`/transaction/verify/${reference}`);
    return response.data.data;
  } catch (error: any) {
    console.error("Payment verification error:", error.response?.data || error);
    throw new Error(error.response?.data?.message || "Failed to verify payment");
  }
}

export async function listBanks() {
  try {
    const response = await paystackClient.get("/bank?country=nigeria");
    return response.data.data;
  } catch (error: any) {
    console.error("List banks error:", error.response?.data || error);
    throw new Error("Failed to fetch banks");
  }
}

export async function refundPayment(reference: string, amount?: number) {
  try {
    const payload: any = { transaction: reference };
    if (amount) {
      payload.amount = amount * 100; // Convert to kobo
    }
    
    const response = await paystackClient.post("/refund", payload);
    return response.data.data;
  } catch (error: any) {
    console.error("Refund error:", error.response?.data || error);
    throw new Error(error.response?.data?.message || "Failed to process refund");
  }
}
