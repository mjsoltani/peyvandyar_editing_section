import { 
  ActivityLog, 
  CreateActivityLogData,
  ACTIVITY_TYPES 
} from '../../models/ActivityLog';

describe('ActivityLog Model', () => {
  describe('ActivityLog interface', () => {
    it('should have correct structure for ActivityLog interface', () => {
      const activityLog: ActivityLog = {
        id: 1,
        user_id: 1,
        action: 'user_login',
        details: { ip: '127.0.0.1', browser: 'Chrome' },
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0...',
        created_at: new Date(),
      };

      expect(activityLog.id).toBe(1);
      expect(activityLog.user_id).toBe(1);
      expect(activityLog.action).toBe('user_login');
      expect(activityLog.details).toEqual({ ip: '127.0.0.1', browser: 'Chrome' });
      expect(activityLog.ip_address).toBe('127.0.0.1');
    });

    it('should allow optional fields', () => {
      const minimalLog: ActivityLog = {
        id: 1,
        action: 'system_action',
        created_at: new Date(),
      };

      expect(minimalLog.user_id).toBeUndefined();
      expect(minimalLog.details).toBeUndefined();
      expect(minimalLog.ip_address).toBeUndefined();
    });
  });

  describe('ACTIVITY_TYPES constant', () => {
    it('should have all required activity types', () => {
      expect(ACTIVITY_TYPES.USER_LOGIN).toBe('user_login');
      expect(ACTIVITY_TYPES.USER_LOGOUT).toBe('user_logout');
      expect(ACTIVITY_TYPES.PRODUCT_UPDATE).toBe('product_update');
      expect(ACTIVITY_TYPES.BATCH_UPDATE).toBe('batch_update');
      expect(ACTIVITY_TYPES.PAYMENT_REQUEST).toBe('payment_request');
      expect(ACTIVITY_TYPES.SUBSCRIPTION_CREATED).toBe('subscription_created');
      expect(ACTIVITY_TYPES.SUBSCRIPTION_EXPIRED).toBe('subscription_expired');
      expect(ACTIVITY_TYPES.ADMIN_ACTION).toBe('admin_action');
    });

    it('should have consistent naming convention', () => {
      const activityTypes = Object.values(ACTIVITY_TYPES);
      activityTypes.forEach(type => {
        expect(type).toMatch(/^[a-z_]+$/);
      });
    });
  });

  describe('CreateActivityLogData interface', () => {
    it('should have correct structure', () => {
      const createData: CreateActivityLogData = {
        user_id: 1,
        action: ACTIVITY_TYPES.USER_LOGIN,
        details: { success: true },
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0...',
      };

      expect(createData.user_id).toBe(1);
      expect(createData.action).toBe('user_login');
      expect(createData.details).toEqual({ success: true });
    });

    it('should allow minimal data', () => {
      const minimalData: CreateActivityLogData = {
        action: ACTIVITY_TYPES.SYSTEM_ACTION || 'system_action',
      };

      expect(minimalData.action).toBeTruthy();
      expect(minimalData.user_id).toBeUndefined();
    });
  });
});