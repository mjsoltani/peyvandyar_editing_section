import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TemplateCreator from '../../components/TemplateCreator';

const mockProduct = {
  id: 1,
  title: 'محصول تست',
  price: 100000,
  discount_price: 80000,
  stock: 10,
  status: 'active',
  category: 'دسته تست',
};

describe('TemplateCreator', () => {
  const mockOnClose = jest.fn();
  const mockOnTemplateCreated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('does not render when isOpen is false', () => {
    render(
      <TemplateCreator
        isOpen={false}
        onClose={mockOnClose}
        onTemplateCreated={mockOnTemplateCreated}
        sourceProduct={mockProduct}
      />
    );

    expect(screen.queryByText('ایجاد الگو جدید')).not.toBeInTheDocument();
  });

  it('renders template creator when isOpen is true', () => {
    render(
      <TemplateCreator
        isOpen={true}
        onClose={mockOnClose}
        onTemplateCreated={mockOnTemplateCreated}
        sourceProduct={mockProduct}
      />
    );

    expect(screen.getByText('ایجاد الگو جدید')).toBeInTheDocument();
    expect(screen.getByText('از محصول: محصول تست')).toBeInTheDocument();
  });

  it('loads product data when opened with source product', async () => {
    const mockProductData = {
      id: 1,
      title: 'محصول تست',
      price: 100000,
      stock: 10,
      status: 'active',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockProductData }),
    });

    render(
      <TemplateCreator
        isOpen={true}
        onClose={mockOnClose}
        onTemplateCreated={mockOnTemplateCreated}
        sourceProduct={mockProduct}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/products/1', {
        credentials: 'include',
      });
    });
  });

  it('handles template name input', () => {
    render(
      <TemplateCreator
        isOpen={true}
        onClose={mockOnClose}
        onTemplateCreated={mockOnTemplateCreated}
        sourceProduct={mockProduct}
      />
    );

    const nameInput = screen.getByPlaceholderText('نام الگو را وارد کنید');
    fireEvent.change(nameInput, { target: { value: 'الگو جدید' } });

    expect(nameInput).toHaveValue('الگو جدید');
  });

  it('handles template description input', () => {
    render(
      <TemplateCreator
        isOpen={true}
        onClose={mockOnClose}
        onTemplateCreated={mockOnTemplateCreated}
        sourceProduct={mockProduct}
      />
    );

    const descriptionInput = screen.getByPlaceholderText('توضیحات الگو را وارد کنید');
    fireEvent.change(descriptionInput, { target: { value: 'توضیحات تست' } });

    expect(descriptionInput).toHaveValue('توضیحات تست');
  });

  it('handles field selection', () => {
    render(
      <TemplateCreator
        isOpen={true}
        onClose={mockOnClose}
        onTemplateCreated={mockOnTemplateCreated}
        sourceProduct={mockProduct}
      />
    );

    const priceCheckbox = screen.getByLabelText('قیمت');
    expect(priceCheckbox).toBeChecked(); // Default selected

    const categoryCheckbox = screen.getByLabelText('دسته‌بندی');
    expect(categoryCheckbox).not.toBeChecked();

    fireEvent.click(categoryCheckbox);
    expect(categoryCheckbox).toBeChecked();
  });

  it('handles select all fields', () => {
    render(
      <TemplateCreator
        isOpen={true}
        onClose={mockOnClose}
        onTemplateCreated={mockOnTemplateCreated}
        sourceProduct={mockProduct}
      />
    );

    const selectAllButton = screen.getByText('انتخاب همه');
    fireEvent.click(selectAllButton);

    // Check that all checkboxes are now checked
    const categoryCheckbox = screen.getByLabelText('دسته‌بندی');
    expect(categoryCheckbox).toBeChecked();
  });

  it('shows field count', () => {
    render(
      <TemplateCreator
        isOpen={true}
        onClose={mockOnClose}
        onTemplateCreated={mockOnTemplateCreated}
        sourceProduct={mockProduct}
      />
    );

    expect(screen.getByText('3 فیلد انتخاب شده')).toBeInTheDocument();
  });

  it('navigates to preview step', async () => {
    const mockProductData = {
      id: 1,
      title: 'محصول تست',
      price: 100000,
      stock: 10,
      status: 'active',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockProductData }),
    });

    render(
      <TemplateCreator
        isOpen={true}
        onClose={mockOnClose}
        onTemplateCreated={mockOnTemplateCreated}
        sourceProduct={mockProduct}
      />
    );

    // Fill in template name
    const nameInput = screen.getByPlaceholderText('نام الگو را وارد کنید');
    fireEvent.change(nameInput, { target: { value: 'الگو تست' } });

    // Click preview button
    const previewButton = screen.getByText('پیش‌نمایش');
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(screen.getByText('پیش‌نمایش الگو')).toBeInTheDocument();
    });
  });

  it('creates template successfully', async () => {
    const mockProductData = {
      id: 1,
      title: 'محصول تست',
      price: 100000,
      stock: 10,
      status: 'active',
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockProductData }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(
      <TemplateCreator
        isOpen={true}
        onClose={mockOnClose}
        onTemplateCreated={mockOnTemplateCreated}
        sourceProduct={mockProduct}
      />
    );

    // Fill in template name
    const nameInput = screen.getByPlaceholderText('نام الگو را وارد کنید');
    fireEvent.change(nameInput, { target: { value: 'الگو تست' } });

    // Go to preview
    fireEvent.click(screen.getByText('پیش‌نمایش'));

    await waitFor(() => {
      expect(screen.getByText('ایجاد الگو')).toBeInTheDocument();
    });

    // Create template
    fireEvent.click(screen.getByText('ایجاد الگو'));

    await waitFor(() => {
      expect(mockOnTemplateCreated).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles close button', () => {
    render(
      <TemplateCreator
        isOpen={true}
        onClose={mockOnClose}
        onTemplateCreated={mockOnTemplateCreated}
        sourceProduct={mockProduct}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles cancel button', () => {
    render(
      <TemplateCreator
        isOpen={true}
        onClose={mockOnClose}
        onTemplateCreated={mockOnTemplateCreated}
        sourceProduct={mockProduct}
      />
    );

    const cancelButton = screen.getByText('لغو');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('disables preview button when template name is empty', () => {
    render(
      <TemplateCreator
        isOpen={true}
        onClose={mockOnClose}
        onTemplateCreated={mockOnTemplateCreated}
        sourceProduct={mockProduct}
      />
    );

    // Clear the default template name
    const nameInput = screen.getByPlaceholderText('نام الگو را وارد کنید');
    fireEvent.change(nameInput, { target: { value: '' } });

    const previewButton = screen.getByText('پیش‌نمایش');
    expect(previewButton).toBeDisabled();
  });

  it('shows error when API fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(
      <TemplateCreator
        isOpen={true}
        onClose={mockOnClose}
        onTemplateCreated={mockOnTemplateCreated}
        sourceProduct={mockProduct}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('خطا در بارگذاری اطلاعات محصول')).toBeInTheDocument();
    });
  });
});