'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Tooltip, { InfoTooltip } from './Tooltip';

interface Product {
  id: number;
  title: string;
  price: number;
  discount_price?: number;
  stock: number;
  status: string;
  category: string;
}

interface ProductSelectionProps {
  products: Product[];
  selectedProducts: Set<number>;
  onSelectionChange: (selected: Set<number>) => void;
  filters?: {
    status?: string;
    category?: string;
    priceRange?: { min: string; max: string };
  };
}

export default function ProductSelection({
  products,
  selectedProducts,
  onSelectionChange,
  filters = {}
}: ProductSelectionProps) {
  const t = useTranslations();
  const [showAdvancedSelection, setShowAdvancedSelection] = useState(false);

  const handleSelectProduct = (productId: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    onSelectionChange(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(products.map(p => p.id)));
    }
  };

  const handleSelectByFilter = (filterType: string, filterValue: string) => {
    let filteredProducts: Product[] = [];

    switch (filterType) {
      case 'status':
        filteredProducts = products.filter(p => p.status === filterValue);
        break;
      case 'category':
        filteredProducts = products.filter(p => p.category === filterValue);
        break;
      case 'price_range':
        const [min, max] = filterValue.split('-').map(Number);
        filteredProducts = products.filter(p => {
          const price = p.discount_price || p.price;
          return price >= min && (max === 0 || price <= max);
        });
        break;
      case 'low_stock':
        filteredProducts = products.filter(p => p.stock < 10);
        break;
      case 'high_price':
        filteredProducts = products.filter(p => (p.discount_price || p.price) > 1000000);
        break;
      case 'discounted':
        filteredProducts = products.filter(p => p.discount_price && p.discount_price < p.price);
        break;
      default:
        filteredProducts = products;
    }

    const newSelected = new Set(selectedProducts);
    filteredProducts.forEach(p => newSelected.add(p.id));
    onSelectionChange(newSelected);
  };

  const handleSelectInverse = () => {
    const allProductIds = new Set(products.map(p => p.id));
    const newSelected = new Set<number>();
    
    allProductIds.forEach(id => {
      if (!selectedProducts.has(id)) {
        newSelected.add(id);
      }
    });
    
    onSelectionChange(newSelected);
  };

  const clearSelection = () => {
    onSelectionChange(new Set());
  };

  // Get unique values for filter options
  const uniqueStatuses = [...new Set(products.map(p => p.status))];
  const uniqueCategories = [...new Set(products.map(p => p.category))];

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <h3 className="text-lg font-medium text-gray-900">
              {t('products.selectAll')}
            </h3>
            <InfoTooltip content="می‌توانید محصولات را به صورت تکی، دسته‌ای یا بر اساس شرایط خاص انتخاب کنید" />
          </div>
          {selectedProducts.size > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {selectedProducts.size} {t('products.selected')}
            </span>
          )}
        </div>
        <Tooltip content="گزینه‌های پیشرفته برای انتخاب محصولات بر اساس شرایط مختلف">
          <button
            onClick={() => setShowAdvancedSelection(!showAdvancedSelection)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showAdvancedSelection ? 'مخفی کردن گزینه‌های پیشرفته' : 'گزینه‌های پیشرفته'}
          </button>
        </Tooltip>
      </div>

      {/* Basic Selection Actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Tooltip content="انتخاب یا لغو انتخاب تمام محصولات صفحه فعلی">
          <button
            onClick={handleSelectAll}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            {selectedProducts.size === products.length ? 'لغو انتخاب همه' : t('products.selectAll')}
          </button>
        </Tooltip>
        
        <Tooltip content="انتخاب محصولاتی که انتخاب نشده‌اند و لغو انتخاب محصولات انتخاب شده">
          <button
            onClick={handleSelectInverse}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            انتخاب معکوس
          </button>
        </Tooltip>

        {selectedProducts.size > 0 && (
          <Tooltip content="پاک کردن تمام انتخاب‌ها">
            <button
              onClick={clearSelection}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              پاک کردن انتخاب‌ها
            </button>
          </Tooltip>
        )}
      </div>

      {/* Advanced Selection Options */}
      {showAdvancedSelection && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">انتخاب بر اساس شرایط:</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Select by Status */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                انتخاب بر اساس وضعیت:
              </label>
              <div className="space-y-1">
                {uniqueStatuses.map(status => (
                  <button
                    key={status}
                    onClick={() => handleSelectByFilter('status', status)}
                    className="block w-full text-left px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                  >
                    {status === 'active' ? 'فعال' : status === 'inactive' ? 'غیرفعال' : status}
                  </button>
                ))}
              </div>
            </div>

            {/* Select by Category */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                انتخاب بر اساس دسته‌بندی:
              </label>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {uniqueCategories.slice(0, 5).map(category => (
                  <button
                    key={category}
                    onClick={() => handleSelectByFilter('category', category)}
                    className="block w-full text-left px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 truncate"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Select by Special Conditions */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                انتخاب بر اساس شرایط خاص:
              </label>
              <div className="space-y-1">
                <button
                  onClick={() => handleSelectByFilter('low_stock', '')}
                  className="block w-full text-left px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100"
                >
                  موجودی کم (کمتر از 10)
                </button>
                <button
                  onClick={() => handleSelectByFilter('high_price', '')}
                  className="block w-full text-left px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded hover:bg-purple-100"
                >
                  قیمت بالا (بیش از 1 میلیون)
                </button>
                <button
                  onClick={() => handleSelectByFilter('discounted', '')}
                  className="block w-full text-left px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100"
                >
                  دارای تخفیف
                </button>
              </div>
            </div>
          </div>

          {/* Price Range Selection */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              انتخاب بر اساس محدوده قیمت:
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSelectByFilter('price_range', '0-100000')}
                className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100"
              >
                کمتر از 100 هزار
              </button>
              <button
                onClick={() => handleSelectByFilter('price_range', '100000-500000')}
                className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100"
              >
                100 تا 500 هزار
              </button>
              <button
                onClick={() => handleSelectByFilter('price_range', '500000-1000000')}
                className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100"
              >
                500 هزار تا 1 میلیون
              </button>
              <button
                onClick={() => handleSelectByFilter('price_range', '1000000-0')}
                className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100"
              >
                بیش از 1 میلیون
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {selectedProducts.size > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-800">
              <strong>{selectedProducts.size}</strong> محصول انتخاب شده از مجموع <strong>{products.length}</strong> محصول
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                ویرایش دسته‌ای
              </button>
              <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                اعمال الگو
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}