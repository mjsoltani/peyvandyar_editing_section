import { 
  Subscription, 
  SubscriptionPlan, 
  SubscriptionStatus,
  SUBSCRIPTION_PLANS,
  CreateSubscriptionData 
} from '../../models/Subscription';

describe('Subscription Model', () => {
  describe('Subscription interface', () => {
    it('should have correct structure for Subscription interface', () => {
      const subscription: Subscription = {
        id: 1,
        user_id: 1,
        plan_type: '1_month',
        price: 150000,
        start_date: new Date(),
        end_date: new Date(),
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(subscription.id).toBe(1);
      expect(subscription.user_id).toBe(1);
      expect(subscription.plan_type).toBe('1_month');
      expect(subscription.price).toBe(150000);
      expect(subscription.status).toBe('active');
    });
  });

  describe('SUBSCRIPTION_PLANS constant', () => {
    it('should have correct plan configurations', () => {
      expect(SUBSCRIPTION_PLANS['1_month']).toEqual({
        name: 'یک ماهه',
        price: 150000,
        duration_days: 30,
      });

      expect(SUBSCRIPTION_PLANS['3_month']).toEqual({
        name: 'سه ماهه',
        price: 450000,
        duration_days: 90,
      });

      expect(SUBSCRIPTION_PLANS['6_month']).toEqual({
        name: 'شش ماهه',
        price: 690000,
        duration_days: 180,
      });
    });

    it('should have all required plan types', () => {
      const planTypes = Object.keys(SUBSCRIPTION_PLANS);
      expect(planTypes).toContain('1_month');
      expect(planTypes).toContain('3_month');
      expect(planTypes).toContain('6_month');
      expect(planTypes).toHaveLength(3);
    });
  });

  describe('Type validation', () => {
    it('should accept valid SubscriptionPlan values', () => {
      const validPlans: SubscriptionPlan[] = ['1_month', '3_month', '6_month'];
      validPlans.forEach(plan => {
        expect(['1_month', '3_month', '6_month']).toContain(plan);
      });
    });

    it('should accept valid SubscriptionStatus values', () => {
      const validStatuses: SubscriptionStatus[] = ['active', 'expired', 'cancelled'];
      validStatuses.forEach(status => {
        expect(['active', 'expired', 'cancelled']).toContain(status);
      });
    });
  });

  describe('CreateSubscriptionData interface', () => {
    it('should have correct structure', () => {
      const createData: CreateSubscriptionData = {
        user_id: 1,
        plan_type: '1_month',
        price: 150000,
        start_date: new Date(),
        end_date: new Date(),
      };

      expect(createData.user_id).toBe(1);
      expect(createData.plan_type).toBe('1_month');
      expect(createData.price).toBe(150000);
    });
  });
});