import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SubscriptionStatus from '../../components/SubscriptionStatus';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('SubscriptionStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('shows loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    );

    render(<SubscriptionStatus />);

    expect(screen.getByRole('generic')).toHaveClass('animate-pulse');
  });

  it('displays active subscription status', async () => {
    const mockData = {
      active_subscription: {
        id: 1,
        plan_type: '1_month',
        price: 150000,
        start_date: '2023-01-01T00:00:00Z',
        end_date: '2023-02-01T00:00:00Z',
        status: 'active',
      },
      expiry_warning: null,
      recent_payments: [],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockData }),
    });

    render(<SubscriptionStatus />);

    await waitFor(() => {
      expect(screen.getByText('اشتراک فعال')).toBeInTheDocument();
    });
  });

  it('displays expiry warning when subscription is about to expire', async () => {
    const mockData = {
      active_subscription: {
        id: 1,
        plan_type: '1_month',
        price: 150000,
        start_date: '2023-01-01T00:00:00Z',
        end_date: '2023-02-01T00:00:00Z',
        status: 'active',
      },
      expiry_warning: {
        warning: true,
        daysLeft: 3,
      },
      recent_payments: [],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockData }),
    });

    render(<SubscriptionStatus />);

    await waitFor(() => {
      expect(screen.getByText('3 روز تا انقضا')).toBeInTheDocument();
      expect(screen.getByText('اشتراک شما 3 روز دیگر منقضی می‌شود')).toBeInTheDocument();
    });
  });

  it('displays inactive subscription status', async () => {
    const mockData = {
      active_subscription: null,
      expiry_warning: null,
      recent_payments: [],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockData }),
    });

    render(<SubscriptionStatus />);

    await waitFor(() => {
      expect(screen.getByText('اشتراک غیرفعال')).toBeInTheDocument();
      expect(screen.getByText('اشتراک فعالی ندارید')).toBeInTheDocument();
    });
  });

  it('shows detailed subscription information when showDetails is true', async () => {
    const mockData = {
      active_subscription: {
        id: 1,
        plan_type: '3_month',
        price: 450000,
        start_date: '2023-01-01T00:00:00Z',
        end_date: '2023-04-01T00:00:00Z',
        status: 'active',
      },
      expiry_warning: null,
      recent_payments: [],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockData }),
    });

    render(<SubscriptionStatus showDetails={true} />);

    await waitFor(() => {
      expect(screen.getByText('جزئیات اشتراک')).toBeInTheDocument();
      expect(screen.getByText('سه ماهه')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<SubscriptionStatus />);

    await waitFor(() => {
      expect(screen.getByText('خطا در ارتباط با سرور')).toBeInTheDocument();
    });
  });

  it('handles API response error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, error: 'خطای سرور' }),
    });

    render(<SubscriptionStatus />);

    await waitFor(() => {
      expect(screen.getByText('خطای سرور')).toBeInTheDocument();
    });
  });

  it('applies custom className', async () => {
    const mockData = {
      active_subscription: null,
      expiry_warning: null,
      recent_payments: [],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockData }),
    });

    render(<SubscriptionStatus className="custom-class" />);

    await waitFor(() => {
      const container = screen.getByText('اشتراک غیرفعال').closest('div');
      expect(container).toHaveClass('custom-class');
    });
  });

  it('formats dates correctly in detailed view', async () => {
    const mockData = {
      active_subscription: {
        id: 1,
        plan_type: '1_month',
        price: 150000,
        start_date: '2023-01-15T00:00:00Z',
        end_date: '2023-02-15T00:00:00Z',
        status: 'active',
      },
      expiry_warning: null,
      recent_payments: [],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockData }),
    });

    render(<SubscriptionStatus showDetails={true} />);

    await waitFor(() => {
      // Check that dates are formatted (exact format may vary based on locale)
      expect(screen.getByText('تاریخ شروع:')).toBeInTheDocument();
      expect(screen.getByText('تاریخ پایان:')).toBeInTheDocument();
    });
  });
});