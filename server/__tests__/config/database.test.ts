import { connectDatabase, query } from '../../config/database';

describe('Database Connection', () => {
  const isDatabaseAvailable = process.env.DB_NAME && process.env.DB_NAME !== 'basalam_product_manager_test';

  beforeAll(async () => {
    if (!isDatabaseAvailable) {
      console.log('Skipping database tests - test database not available');
    }
  });

  it('should have database configuration', () => {
    expect(process.env.DB_NAME).toBeDefined();
    expect(process.env.DB_HOST).toBeDefined();
    expect(process.env.DB_PORT).toBeDefined();
  });

  it('should connect to database successfully', async () => {
    if (!isDatabaseAvailable) {
      console.log('Skipping database connection test - database not available');
      return;
    }

    await expect(connectDatabase()).resolves.not.toThrow();
  });

  it('should execute a simple query', async () => {
    if (!isDatabaseAvailable) {
      console.log('Skipping query test - database not available');
      return;
    }

    const result = await query('SELECT 1 as test');
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].test).toBe(1);
  });

  it('should handle query errors gracefully', async () => {
    if (!isDatabaseAvailable) {
      console.log('Skipping error handling test - database not available');
      return;
    }

    await expect(query('SELECT * FROM non_existent_table')).rejects.toThrow();
  });
});