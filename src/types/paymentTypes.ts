export interface ICreateRazorpayOrderPayload {
  subscription_uuid: string;
}

export interface IRazorpayOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
}

export interface IVerifyRazorpayPaymentPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface IRazorpayPaymentVerificationResponse {
  verified: true;
  order_id: string;
  payment_id: string;
  user_subscription_uuid: string;
}

export interface IVerifyGooglePlaySubscriptionPayload {
  subscription_uuid: string;
  purchase_token: string;
}

export interface IGooglePlayVerificationResponse {
  verified: true;
  subscription_uuid: string;
  product_id: string;
  subscription_state: string;
  expiry_at: Date;
}
