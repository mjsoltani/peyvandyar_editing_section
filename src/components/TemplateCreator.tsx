'use client';

import { useState, useEffect } from 'react';

interface Product {
  id: number;
  title: string;
  price: number;
  discount_price?: number;
  stock: number;
  status: string;
  category: string;
  image_url?: string;
}

interface TemplateCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateCreated: () => void;
  sourceProduct?: Product;
}

const FIELD_DISPLAY_NAMES: Record<string, string> = {
  price: 'قیمت',
  discount_price: 'قیمت تخفیف‌خورده',
  stock: 'موجودی',
  status: 'وضعیت',
  category: 'دسته‌بندی',
  tags: 'برچسب‌ها',
  description: 'توضیحات',
  specifications: 'مشخصات فنی',
  variants: 'تنوع‌ها',
  images: 'تصاویر',
  weight: 'وزن',
  dimensions: 'ابعاد',
  brand: 'برند',
  warranty: 'گارانتی',
  shipping_info: 'اطلاعات ارسال'
};

const AVAILABLE_FIELDS = Object.keys(FIELD_DISPLAY_NAMES);

export default function TemplateCreator({
  isOpen,
  onClose,
  onTemplateCreated,
  sourceProduct
}: TemplateCreatorProps) {
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(['price', 'stock', 'status']));
  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'fields' | 'preview' | 'save'>('fields');

  useEffect(() => {
    if (isOpen && sourceProduct) {
      setTemplateName(`الگو ${sourceProduct.title}`);
      loadProductData(sourceProduct.id);
    }
  }, [isOpen, sourceProduct]);

  const loadProductData = async (productId: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/products/${productId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('خطا در بارگذاری اطلاعات محصول');
      }

      const data = await response.json();
      setProductData(data.data);
    } catch (error) {
      console.error('Error loading product data:', error);
      setError('خطا در بارگذاری اطلاعات محصول');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldToggle = (field: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(field)) {
      newSelected.delete(field);
    } else {
      newSelected.add(field);
    }
    setSelectedFields(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFields.size === AVAILABLE_FIELDS.length) {
      setSelectedFields(new Set());
    } else {
      setSelectedFields(new Set(AVAILABLE_FIELDS));
    }
  };

  const handleCreateTemplate = async () => {
    if (!sourceProduct || !templateName.trim() || selectedFields.size === 0) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/templates/from-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          product_id: sourceProduct.id.toString(),
          name: templateName.trim(),
          description: templateDescription.trim() || undefined,
          fields: Array.from(selectedFields)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در ایجاد الگو');
      }

      onTemplateCreated();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating template:', error);
      setError(error instanceof Error ? error.message : 'خطا در ایجاد الگو');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTemplateName('');
    setTemplateDescription('');
    setSelectedFields(new Set(['price', 'stock', 'status']));
    setProductData(null);
    setStep('fields');
    setError(null);
  };

  const formatValue = (field: string, value: any): string => {
    if (value === null || value === undefined) {
      return 'تعریف نشده';
    }

    switch (field) {
      case 'price':
      case 'discount_price':
        return new Intl.NumberFormat('fa-IR').format(value) + ' تومان';
      case 'stock':
        return value.toString() + ' عدد';
      case 'status':
        return value === 'active' ? 'فعال' : value === 'inactive' ? 'غیرفعال' : value;
      case 'variants':
        return Array.isArray(value) ? `${value.length} تنوع` : 'بدون تنوع';
      case 'images':
        return Array.isArray(value) ? `${value.length} تصویر` : 'بدون تصویر';
      case 'tags':
        return Array.isArray(value) ? value.join(', ') : value;
      default:
        return typeof value === 'object' ? JSON.stringify(value) : value.toString();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">ایجاد الگو جدید</h2>
            {sourceProduct && (
              <p className="text-sm text-gray-600">
                از محصول: {sourceProduct.title}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {step === 'fields' && (
            <div className="space-y-6">
              {/* Template Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    نام الگو *
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="نام الگو را وارد کنید"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    توضیحات (اختیاری)
                  </label>
                  <textarea
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="توضیحات الگو را وارد کنید"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Field Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    انتخاب فیلدهای قابل کپی
                  </h3>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {selectedFields.size === AVAILABLE_FIELDS.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {AVAILABLE_FIELDS.map((field) => (
                    <label key={field} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedFields.has(field)}
                        onChange={() => handleFieldToggle(field)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="mr-3 text-sm text-gray-700">
                        {FIELD_DISPLAY_NAMES[field]}
                      </span>
                    </label>
                  ))}
                </div>

                <p className="text-sm text-gray-500 mt-3">
                  {selectedFields.size} فیلد انتخاب شده
                </p>
              </div>
            </div>
          )}

          {step === 'preview' && productData && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  پیش‌نمایش الگو
                </h3>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900">{templateName}</h4>
                    {templateDescription && (
                      <p className="text-sm text-gray-600 mt-1">{templateDescription}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {Array.from(selectedFields).map((field) => (
                      <div key={field} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          {FIELD_DISPLAY_NAMES[field]}:
                        </span>
                        <span className="text-sm text-gray-900 font-medium">
                          {formatValue(field, productData[field])}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex space-x-2 space-x-reverse">
            {step === 'preview' && (
              <button
                onClick={() => setStep('fields')}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                بازگشت
              </button>
            )}
          </div>

          <div className="flex space-x-2 space-x-reverse">
            <button
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              لغو
            </button>

            {step === 'fields' && (
              <button
                onClick={() => setStep('preview')}
                disabled={!templateName.trim() || selectedFields.size === 0 || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'در حال بارگذاری...' : 'پیش‌نمایش'}
              </button>
            )}

            {step === 'preview' && (
              <button
                onClick={handleCreateTemplate}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'در حال ایجاد...' : 'ایجاد الگو'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}