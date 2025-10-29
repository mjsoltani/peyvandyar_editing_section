import { User, CreateUserData, UpdateUserData } from '../../models/User';

describe('User Model', () => {
  describe('User interface', () => {
    it('should have correct structure for User interface', () => {
      const user: User = {
        id: 1,
        basalam_user_id: 'basalam_123',
        vendor_id: 456,
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        access_token: 'access_token_123',
        refresh_token: 'refresh_token_123',
        is_admin: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(user.id).toBe(1);
      expect(user.basalam_user_id).toBe('basalam_123');
      expect(user.vendor_id).toBe(456);
      expect(user.is_admin).toBe(false);
      expect(user.is_active).toBe(true);
    });
  });

  describe('CreateUserData interface', () => {
    it('should have correct structure for CreateUserData interface', () => {
      const createData: CreateUserData = {
        basalam_user_id: 'basalam_123',
        vendor_id: 456,
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
      };

      expect(createData.basalam_user_id).toBe('basalam_123');
      expect(createData.vendor_id).toBe(456);
      expect(createData.username).toBe('testuser');
    });

    it('should allow optional fields in CreateUserData', () => {
      const minimalData: CreateUserData = {
        basalam_user_id: 'basalam_123',
        vendor_id: 456,
      };

      expect(minimalData.basalam_user_id).toBe('basalam_123');
      expect(minimalData.vendor_id).toBe(456);
      expect(minimalData.username).toBeUndefined();
    });
  });

  describe('UpdateUserData interface', () => {
    it('should allow partial updates', () => {
      const updateData: UpdateUserData = {
        name: 'Updated Name',
        is_active: false,
      };

      expect(updateData.name).toBe('Updated Name');
      expect(updateData.is_active).toBe(false);
      expect(updateData.username).toBeUndefined();
    });
  });
});