import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaymentPage from '../../app/subscription/payment/page';

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

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

const mockPlansData = {
  '1_month': {
    name: 'یک ماهه',
    price: 150000,
    duration_days: 30,
  },
  '3_month': {
    name: 'سه ماهه',
    price: 450000,
    duration_days: 90,
  },
  '6_month': {
    name: 'شش ماهه',
    price: 690000,
    duration_days: 180,
  },
};

describe('PaymentPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    mockSearchParams.get.mockReturnValue('1_month');
  });

  it('redirects to plans page when no plan is selected', () => {
    mockSearchParams.get.mockReturnValue(null);

    render(<PaymentPage />);

    expect(mockPush).toHaveBeenCalledWith('/subscription/plans');
  });

  it('shows loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    );

    render(<PaymentPage />);

    expect(screen.getByText('در حال بارگذاری...')).toBeInTheDocument();
  });

  it('displays selected plan information', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockPlansData }),
    });

    render(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText('طرح انتخاب شده: یک ماهه')).toBeInTheDocument();
      expect(screen.getByText('150,000 تومان')).toBeInTheDocument();
      expect(screen.getByText('مدت اشتراک: 30 روز')).toBeInTheDocument();
    });
  });

  it('displays payment information', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockPlansData }),
    });

    render(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText('اطلاعات پرداخت')).toBeInTheDocument();
      expect(screen.getByText('شماره کارت:')).toBeInTheDocument();
      expect(screen.getByText('6037-9977-0000-0000')).toBeInTheDocument();
    });
  });

  it('handles transaction reference input', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockPlansData }),
    });

    render(<PaymentPage />);

    await waitFor(() => {
      const input = screen.getByPlaceholderText('شماره پیگیری دریافتی از بانک را وارد کنید');
      fireEvent.change(input, { target: { value: '123456789' } });
      expect(input).toHaveValue('123456789');
    });
  });

  it('validates required transaction reference', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockPlansData }),
    });

    render(<PaymentPage />);

    await waitFor(() => {
      const submitButton = screen.getByText('تایید پرداخت');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('لطفاً شماره پیگیری تراکنش را وارد کنید')).toBeInTheDocument();
    });
  });

  it('submits payment request successfully', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockPlansData }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 123 } }),
      });

    render(<PaymentPage />);

    await waitFor(() => {
      const input = screen.getByPlaceholderText('شماره پیگیری دریافتی از بانک را وارد کنید');
      fireEvent.change(input, { target: { value: '123456789' } });
    });

    const submitButton = screen.getByText('تایید پرداخت');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/subscription/confirmation?payment=123');
    });
  });

  it('handles payment submission error', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockPlansData }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: 'خطای پرداخت' }),
      });

    render(<PaymentPage />);

    await waitFor(() => {
      const input = screen.getByPlaceholderText('شماره پیگیری دریافتی از بانک را وارد کنید');
      fireEvent.change(input, { target: { value: '123456789' } });
    });

    const submitButton = screen.getByText('تایید پرداخت');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('خطای پرداخت')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockPlansData }),
      })
      .mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<PaymentPage />);

    await waitFor(() => {
      const input = screen.getByPlaceholderText('شماره پیگیری دریافتی از بانک را وارد کنید');
      fireEvent.change(input, { target: { value: '123456789' } });
    });

    const submitButton = screen.getByText('تایید پرداخت');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('در حال ثبت...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  it('toggles payment guide visibility', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockPlansData }),
    });

    render(<PaymentPage />);

    await waitFor(() => {
      const guideButton = screen.getByText('🔽 راهنمای کارت به کارت');
      fireEvent.click(guideButton);
    });

    expect(screen.getByText('راهنمای پرداخت:')).toBeInTheDocument();
    expect(screen.getByText('1. وارد اپلیکیشن بانکی خود شوید')).toBeInTheDocument();

    const guideButton = screen.getByText('🔼 راهنمای کارت به کارت');
    fireEvent.click(guideButton);

    expect(screen.queryByText('راهنمای پرداخت:')).not.toBeInTheDocument();
  });

  it('handles copy to clipboard functionality', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockPlansData }),
    });

    render(<PaymentPage />);

    await waitFor(() => {
      const copyButtons = screen.getAllByText('📋');
      fireEvent.click(copyButtons[0]); // Copy card number
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('6037997700000000');
  });

  it('handles back button click', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockPlansData }),
    });

    render(<PaymentPage />);

    await waitFor(() => {
      const backButton = screen.getByText('بازگشت');
      fireEvent.click(backButton);
    });

    expect(mockPush).toHaveBeenCalledWith('/subscription/plans');
  });

  it('shows error when invalid plan is selected', async () => {
    mockSearchParams.get.mockReturnValue('invalid_plan');
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockPlansData }),
    });

    render(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText('طرح اشتراک نامعتبر است')).toBeInTheDocument();
    });
  });

  it('handles API error when fetching plans', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText('خطا در ارتباط با سرور')).toBeInTheDocument();
    });
  });

  it('formats card number correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockPlansData }),
    });

    render(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText('6037-9977-0000-0000')).toBeInTheDocument();
    });
  });

  it('formats price correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockPlansData }),
    });

    render(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText('150,000 تومان')).toBeInTheDocument();
    });
  });
});