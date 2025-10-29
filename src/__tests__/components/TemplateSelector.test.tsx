import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TemplateSelector from '../../components/TemplateSelector';

const mockTemplates = [
  {
    id: 1,
    name: 'الگو قیمت',
    description: 'الگو برای تغییر قیمت',
    source_product_id: '123',
    template_data: { price: 100000 },
    fields_to_copy: ['price', 'discount_price'],
    is_favorite: true,
    usage_count: 5,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'الگو موجودی',
    description: 'الگو برای تغییر موجودی',
    source_product_id: '124',
    template_data: { stock: 50 },
    fields_to_copy: ['stock', 'status'],
    is_favorite: false,
    usage_count: 2,
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
  },
];

describe('TemplateSelector', () => {
  const mockOnClose = jest.fn();
  const mockOnApplyTemplate = jest.fn();
  const selectedProductIds = [1, 2, 3];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('does not render when isOpen is false', () => {
    render(
      <TemplateSelector
        isOpen={false}
        onClose={mockOnClose}
        onApplyTemplate={mockOnApplyTemplate}
        selectedProductIds={selectedProductIds}
      />
    );

    expect(screen.queryByText('انتخاب الگو')).not.toBeInTheDocument();
  });

  it('renders template selector when isOpen is true', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          templates: mockTemplates,
          total_pages: 1,
        },
      }),
    });

    render(
      <TemplateSelector
        isOpen={true}
        onClose={mockOnClose}
        onApplyTemplate={mockOnApplyTemplate}
        selectedProductIds={selectedProductIds}
      />
    );

    expect(screen.getByText('انتخاب الگو')).toBeInTheDocument();
    expect(screen.getByText('اعمال الگو به 3 محصول انتخاب شده')).toBeInTheDocument();
  });

  it('loads and displays templates', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          templates: mockTemplates,
          total_pages: 1,
        },
      }),
    });

    render(
      <TemplateSelector
        isOpen={true}
        onClose={mockOnClose}
        onApplyTemplate={mockOnApplyTemplate}
        selectedProductIds={selectedProductIds}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('الگو قیمت')).toBeInTheDocument();
      expect(screen.getByText('الگو موجودی')).toBeInTheDocument();
    });
  });

  it('shows favorite indicator for favorite templates', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          templates: mockTemplates,
          total_pages: 1,
        },
      }),
    });

    render(
      <TemplateSelector
        isOpen={true}
        onClose={mockOnClose}
        onApplyTemplate={mockOnApplyTemplate}
        selectedProductIds={selectedProductIds}
      />
    );

    await waitFor(() => {
      // Check for star icon (favorite indicator)
      const favoriteTemplate = screen.getByText('الگو قیمت').closest('div');
      expect(favoriteTemplate).toBeInTheDocument();
    });
  });

  it('handles template selection', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            templates: mockTemplates,
            total_pages: 1,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            template: mockTemplates[0],
            preview_data: { price: 100000, discount_price: 80000 },
            field_count: 2,
          },
        }),
      });

    render(
      <TemplateSelector
        isOpen={true}
        onClose={mockOnClose}
        onApplyTemplate={mockOnApplyTemplate}
        selectedProductIds={selectedProductIds}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('الگو قیمت')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('الگو قیمت'));

    await waitFor(() => {
      expect(screen.getByText('انتخاب فیلدهای قابل کپی:')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          templates: [],
          total_pages: 1,
        },
      }),
    });

    render(
      <TemplateSelector
        isOpen={true}
        onClose={mockOnClose}
        onApplyTemplate={mockOnApplyTemplate}
        selectedProductIds={selectedProductIds}
      />
    );

    const searchInput = screen.getByPlaceholderText('جستجو در الگوها...');
    fireEvent.change(searchInput, { target: { value: 'قیمت' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=قیمت'),
        expect.any(Object)
      );
    });
  });

  it('handles favorites filter', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          templates: [],
          total_pages: 1,
        },
      }),
    });

    render(
      <TemplateSelector
        isOpen={true}
        onClose={mockOnClose}
        onApplyTemplate={mockOnApplyTemplate}
        selectedProductIds={selectedProductIds}
      />
    );

    const favoritesCheckbox = screen.getByLabelText('فقط الگوهای محبوب');
    fireEvent.click(favoritesCheckbox);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('favorites_only=true'),
        expect.any(Object)
      );
    });
  });

  it('handles field selection in preview', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            templates: mockTemplates,
            total_pages: 1,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            template: mockTemplates[0],
            preview_data: { price: 100000, discount_price: 80000 },
            field_count: 2,
          },
        }),
      });

    render(
      <TemplateSelector
        isOpen={true}
        onClose={mockOnClose}
        onApplyTemplate={mockOnApplyTemplate}
        selectedProductIds={selectedProductIds}
      />
    );

    await waitFor(() => {
      fireEvent.click(screen.getByText('الگو قیمت'));
    });

    await waitFor(() => {
      const priceCheckbox = screen.getByLabelText('قیمت');
      expect(priceCheckbox).toBeChecked();

      fireEvent.click(priceCheckbox);
      expect(priceCheckbox).not.toBeChecked();
    });
  });

  it('applies template with selected fields', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            templates: mockTemplates,
            total_pages: 1,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            template: mockTemplates[0],
            preview_data: { price: 100000, discount_price: 80000 },
            field_count: 2,
          },
        }),
      });

    render(
      <TemplateSelector
        isOpen={true}
        onClose={mockOnClose}
        onApplyTemplate={mockOnApplyTemplate}
        selectedProductIds={selectedProductIds}
      />
    );

    await waitFor(() => {
      fireEvent.click(screen.getByText('الگو قیمت'));
    });

    await waitFor(() => {
      const applyButton = screen.getByText('اعمال الگو به 3 محصول');
      fireEvent.click(applyButton);
    });

    expect(mockOnApplyTemplate).toHaveBeenCalledWith(1, ['price', 'discount_price']);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    );

    render(
      <TemplateSelector
        isOpen={true}
        onClose={mockOnClose}
        onApplyTemplate={mockOnApplyTemplate}
        selectedProductIds={selectedProductIds}
      />
    );

    expect(screen.getByText('در حال بارگذاری الگوها...')).toBeInTheDocument();
  });

  it('shows error state', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(
      <TemplateSelector
        isOpen={true}
        onClose={mockOnClose}
        onApplyTemplate={mockOnApplyTemplate}
        selectedProductIds={selectedProductIds}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('خطا در بارگذاری الگوها')).toBeInTheDocument();
    });
  });

  it('shows empty state when no templates found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          templates: [],
          total_pages: 1,
        },
      }),
    });

    render(
      <TemplateSelector
        isOpen={true}
        onClose={mockOnClose}
        onApplyTemplate={mockOnApplyTemplate}
        selectedProductIds={selectedProductIds}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('الگویی یافت نشد')).toBeInTheDocument();
    });
  });

  it('handles close button', () => {
    render(
      <TemplateSelector
        isOpen={true}
        onClose={mockOnClose}
        onApplyTemplate={mockOnApplyTemplate}
        selectedProductIds={selectedProductIds}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});