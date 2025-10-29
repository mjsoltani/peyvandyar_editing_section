import { 
  PaymentRequest, 
  PaymentStatus,
  CreatePaymentRequestData 
} from '../../models/PaymentRequest';

describe('PaymentRequest Model', () => {
  describe('PaymentRequest interface', () => {
    it('should have correct structure for PaymentRequest interface', () => {
      const paymentRequest: PaymentRequest = {
        id: 1,
        user_id: 1,
        subscription_plan: '1_month',
        amount: 150000,
        status: 'pending',
        payment_method: 'card_to_card',
        admin_card_number: '1234567890123456',
        transaction_reference: 'TXN123456',
        notes: 'Test payment',
        created_at: new Date(),
        approved_at: new Date(),
        approved_by: 1,
      };

      expect(paymentRequest.id).toBe(1);
      expect(paymentRequest.user_id).toBe(1);
      expect(paymentRequest.subscription_plan).toBe('1_month');
      expect(paymentRequest.amount).toBe(150000);
      expect(paymentRequest.status).toBe('pending');
      expect(paymentRequest.payment_method).toBe('card_to_card');
    });
  });

  describe('Type validation', () => {
    it('should accept valid PaymentStatus values', () => {
      const validStatuses: PaymentStatus[] = ['pending', 'approved', 'rejected'];
      validStatuses.forEach(status => {
        expect(['pending', 'approved', 'rejected']).toContain(status);
      });
    });
  });

  describe('CreatePaymentRequestData interface', () => {
    it('should have correct structure', () => {
      const createData: CreatePaymentRequestData = {
        user_id: 1,
        subscription_plan: '3_month',
        amount: 450000,
        admin_card_number: '1234567890123456',
        transaction_reference: 'TXN123456',
      };

      expect(createData.user_id).toBe(1);
      expect(createData.subscription_plan).toBe('3_month');
      expect(createData.amount).toBe(450000);
      expect(createData.admin_card_number).toBe('1234567890123456');
    });

    it('should allow optional transaction_reference', () => {
      const createData: CreatePaymentRequestData = {
        user_id: 1,
        subscription_plan: '1_month',
        amount: 150000,
        admin_card_number: '1234567890123456',
      };

      expect(createData.transaction_reference).toBeUndefined();
    });
  });
});