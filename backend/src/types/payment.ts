export interface PaymentOrder {
  id: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  qrCodeUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentOrderRequest {
  amount: number;
  type: string;
  subType: string;
}

export interface CreatePaymentOrderResponse {
  orderId: string;
  qrCodeUrl: string;
}

export interface PaymentStatusResponse {
  status: PaymentOrder['status'];
} 