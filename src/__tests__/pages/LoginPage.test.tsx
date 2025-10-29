import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../../app/auth/login/page';

const mockPush = jest.fn();
const mockSearchParams = {
  get: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock sessionStorage
const mockSessionStorage = {
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    mockSessionStorage.setItem.mockClear();
    
    // Mock window.location.href
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  it('renders login page correctly', () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Not authenticated'));

    render(<LoginPage />);

    expect(screen.getByText('مدیریت محصولات باسلام')).toBeInTheDocument();
    expect(screen.getByText('ابزار پیشرفته مدیریت محصولات برای غرفه‌داران')).toBeInTheDocument();
    expect(screen.getByText('ورود امن با حساب باسلام')).toBeInTheDocument();
  });

  it('redirects to dashboard if user is already authenticated', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    render(<LoginPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('stays on login page if user is not authenticated', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Not authenticated'));

    render(<LoginPage />);

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('handles login button click', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Not authenticated'));

    render(<LoginPage />);

    const loginButton = screen.getByText('ورود با حساب باسلام');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('oauth_state', expect.any(String));
      expect(window.location.href).toMatch(/\/api\/auth\/login\?state=/);
    });
  });

  it('shows loading state during login', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Not authenticated'));

    render(<LoginPage />);

    const loginButton = screen.getByText('ورود با حساب باسلام');
    fireEvent.click(loginButton);

    expect(screen.getByText('در حال انتقال...')).toBeInTheDocument();
    expect(loginButton).toBeDisabled();
  });

  it('displays error message when provided', () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Not authenticated'));

    render(<LoginPage />);

    // Simulate an error by clicking login and then simulating an error
    const loginButton = screen.getByText('ورود با حساب باسلام');
    
    // Mock an error in the login process
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: {
        href: '',
        set href(url) {
          throw new Error('Navigation error');
        }
      },
      writable: true,
    });

    fireEvent.click(loginButton);

    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  it('displays required permissions information', () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Not authenticated'));

    render(<LoginPage />);

    expect(screen.getByText('دسترسی‌های مورد نیاز:')).toBeInTheDocument();
    expect(screen.getByText('• خواندن اطلاعات محصولات')).toBeInTheDocument();
    expect(screen.getByText('• ویرایش و به‌روزرسانی محصولات')).toBeInTheDocument();
  });

  it('displays important information about the tool', () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Not authenticated'));

    render(<LoginPage />);

    expect(screen.getByText('• این ابزار برای غرفه‌داران با بیش از 1500 محصول طراحی شده است')).toBeInTheDocument();
    expect(screen.getByText('• امکان ویرایش دسته‌ای و استفاده از الگوهای محصول')).toBeInTheDocument();
    expect(screen.getByText('• نیاز به اشتراک ماهانه برای استفاده از تمام امکانات')).toBeInTheDocument();
  });

  it('generates random state for OAuth security', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Not authenticated'));

    // Mock Math.random to return a predictable value
    const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.123456789);

    render(<LoginPage />);

    const loginButton = screen.getByText('ورود با حساب باسلام');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('oauth_state', expect.stringMatching(/^3456789/));
    });

    mockRandom.mockRestore();
  });

  it('calls auth status check on component mount', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Not authenticated'));

    render(<LoginPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/status', {
        credentials: 'include',
      });
    });
  });
});