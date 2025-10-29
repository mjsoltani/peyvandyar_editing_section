import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductSelection from '../../components/ProductSelection';

const mockProducts = [
  {
    id: 1,
    title: 'محصول تست 1',
    price: 100000,
    discount_price: 80000,
    stock: 5,
    status: 'active',
    category: 'دسته 1',
  },
  {
    id: 2,
    title: 'محصول تست 2',
    price: 200000,
    stock: 15,
    status: 'inactive',
    category: 'دسته 2',
  },
  {
    id: 3,
    title: 'محصول تست 3',
    price: 1500000,
    stock: 3,
    status: 'active',
    category: 'دسته 1',
  },
];

describe('ProductSelection', () => {
  const mockOnSelectionChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders product selection component', () => {
    render(
      <ProductSelection
        products={mockProducts}
        selectedProducts={new Set()}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByText('انتخاب محصولات')).toBeInTheDocument();
  });

  it('shows selected products count', () => {
    const selectedProducts = new Set([1, 2]);
    
    render(
      <ProductSelection
        products={mockProducts}
        selectedProducts={selectedProducts}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByText('2 انتخاب شده')).toBeInTheDocument();
  });

  it('handles select all functionality', () => {
    render(
      <ProductSelection
        products={mockProducts}
        selectedProducts={new Set()}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    fireEvent.click(screen.getByText('انتخاب همه صفحه'));
    
    expect(mockOnSelectionChange).toHaveBeenCalledWith(new Set([1, 2, 3]));
  });

  it('handles deselect all when all products are selected', () => {
    const selectedProducts = new Set([1, 2, 3]);
    
    render(
      <ProductSelection
        products={mockProducts}
        selectedProducts={selectedProducts}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    fireEvent.click(screen.getByText('لغو انتخاب همه'));
    
    expect(mockOnSelectionChange).toHaveBeenCalledWith(new Set());
  });

  it('handles inverse selection', () => {
    const selectedProducts = new Set([1]);
    
    render(
      <ProductSelection
        products={mockProducts}
        selectedProducts={selectedProducts}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    fireEvent.click(screen.getByText('انتخاب معکوس'));
    
    expect(mockOnSelectionChange).toHaveBeenCalledWith(new Set([2, 3]));
  });

  it('handles clear selection', () => {
    const selectedProducts = new Set([1, 2]);
    
    render(
      <ProductSelection
        products={mockProducts}
        selectedProducts={selectedProducts}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    fireEvent.click(screen.getByText('پاک کردن انتخاب‌ها'));
    
    expect(mockOnSelectionChange).toHaveBeenCalledWith(new Set());
  });

  it('shows advanced selection options when toggled', () => {
    render(
      <ProductSelection
        products={mockProducts}
        selectedProducts={new Set()}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    fireEvent.click(screen.getByText('گزینه‌های پیشرفته'));
    
    expect(screen.getByText('انتخاب بر اساس شرایط:')).toBeInTheDocument();
    expect(screen.getByText('انتخاب بر اساس وضعیت:')).toBeInTheDocument();
    expect(screen.getByText('انتخاب بر اساس دسته‌بندی:')).toBeInTheDocument();
  });

  it('handles selection by status', () => {
    render(
      <ProductSelection
        products={mockProducts}
        selectedProducts={new Set()}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    // Show advanced options
    fireEvent.click(screen.getByText('گزینه‌های پیشرفته'));
    
    // Click on active status
    fireEvent.click(screen.getByText('فعال'));
    
    expect(mockOnSelectionChange).toHaveBeenCalledWith(new Set([1, 3]));
  });

  it('handles selection by low stock condition', () => {
    render(
      <ProductSelection
        products={mockProducts}
        selectedProducts={new Set()}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    // Show advanced options
    fireEvent.click(screen.getByText('گزینه‌های پیشرفته'));
    
    // Click on low stock
    fireEvent.click(screen.getByText('موجودی کم (کمتر از 10)'));
    
    expect(mockOnSelectionChange).toHaveBeenCalledWith(new Set([1, 3]));
  });

  it('handles selection by high price condition', () => {
    render(
      <ProductSelection
        products={mockProducts}
        selectedProducts={new Set()}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    // Show advanced options
    fireEvent.click(screen.getByText('گزینه‌های پیشرفته'));
    
    // Click on high price
    fireEvent.click(screen.getByText('قیمت بالا (بیش از 1 میلیون)'));
    
    expect(mockOnSelectionChange).toHaveBeenCalledWith(new Set([3]));
  });

  it('handles selection by discounted products', () => {
    render(
      <ProductSelection
        products={mockProducts}
        selectedProducts={new Set()}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    // Show advanced options
    fireEvent.click(screen.getByText('گزینه‌های پیشرفته'));
    
    // Click on discounted
    fireEvent.click(screen.getByText('دارای تخفیف'));
    
    expect(mockOnSelectionChange).toHaveBeenCalledWith(new Set([1]));
  });

  it('shows selection summary when products are selected', () => {
    const selectedProducts = new Set([1, 2]);
    
    render(
      <ProductSelection
        products={mockProducts}
        selectedProducts={selectedProducts}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByText('ویرایش دسته‌ای')).toBeInTheDocument();
    expect(screen.getByText('اعمال الگو')).toBeInTheDocument();
  });

  it('handles price range selection', () => {
    render(
      <ProductSelection
        products={mockProducts}
        selectedProducts={new Set()}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    // Show advanced options
    fireEvent.click(screen.getByText('گزینه‌های پیشرفته'));
    
    // Click on price range 100-500k
    fireEvent.click(screen.getByText('100 تا 500 هزار'));
    
    expect(mockOnSelectionChange).toHaveBeenCalledWith(new Set([2]));
  });
});