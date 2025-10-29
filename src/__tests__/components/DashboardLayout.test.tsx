import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardLayout from '../../components/DashboardLayout';

// Mock the SubscriptionStatus component
jest.mock('../../components/SubscriptionStatus', () => {
  return function MockSubscriptionStatus() {
    return <div data-testid="subscription-status">Subscription Status</div>;
  };
});

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/dashboard',
}));

describe('DashboardLayout', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    name: 'Test User',
    email: 'test@example.com',
    vendor_id: 123,
    created_at: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('shows loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    );

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('در حال بارگذاری...')).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('displays user information when authenticated', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('مدیریت محصولات باسلام')).toBeInTheDocument();
      expect(screen.getByText('خوش آمدید، Test User')).toBeInTheDocument();
    });
  });

  it('shows error state when API fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('خطا در بارگذاری اطلاعات کاربر')).toBeInTheDocument();
    });
  });

  it('renders navigation menu with correct links', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('داشبورد')).toBeInTheDocument();
      expect(screen.getByText('محصولات')).toBeInTheDocument();
      expect(screen.getByText('ویرایش دسته‌ای')).toBeInTheDocument();
      expect(screen.getByText('الگوها')).toBeInTheDocument();
      expect(screen.getByText('اشتراک')).toBeInTheDocument();
    });
  });

  it('handles logout button click', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('خروج')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('خروج'));
    expect(mockPush).toHaveBeenCalledWith('/auth/logout');
  });

  it('renders children content when authenticated', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    render(
      <DashboardLayout>
        <div data-testid="child-content">Test Content</div>
      </DashboardLayout>
    );

    await waitFor(() => {
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });
  });

  it('includes subscription status component', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    await waitFor(() => {
      expect(screen.getByTestId('subscription-status')).toBeInTheDocument();
    });
  });
});