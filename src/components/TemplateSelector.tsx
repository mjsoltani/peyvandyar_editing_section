'use client';

import { useState, useEffect } from 'react';

interface Template {
  id: number;
  name: string;
  description?: string;
  source_product_id: string;
  template_data: any;
  fields_to_copy: string[];
  is_favorite: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

interface TemplatePreview {
  template: Template;
  preview_data: any;
  field_count: number;
}

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (templateId: number, fields: string[]) => void;
  selectedProductIds: number[];
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

export default function TemplateSelector({
  isOpen,
  onClose,
  onApplyTemplate,
  selectedProductIds
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templatePreview, setTemplatePreview] = useState<TemplatePreview | null>(null);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, currentPage, searchTerm, showFavoritesOnly]);

  useEffect(() => {
    if (selectedTemplate) {
      loadTemplatePreview(selectedTemplate.id);
      setSelectedFields(new Set(selectedTemplate.fields_to_copy));
    }
  }, [selectedTemplate]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (showFavoritesOnly) {
        params.append('favorites_only', 'true');
      }

      const response = await fetch(`/api/templates?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('خطا در بارگذاری الگوها');
      }

      const data = await response.json();
      setTemplates(data.data.templates);
      setTotalPages(data.data.total_pages);
    } catch (error) {
      console.error('Error loading templates:', error);
      setError('خطا در بارگذاری الگوها');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplatePreview = async (templateId: number) => {
    try {
      const response = await fetch(`/api/templates/${templateId}/preview`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('خطا در بارگذاری پیش‌نمایش الگو');
      }

      const data = await response.json();
      setTemplatePreview(data.data);
    } catch (error) {
      console.error('Error loading template preview:', error);
    }
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate || selectedFields.size === 0) {
      return;
    }

    try {
      setLoading(true);
      onApplyTemplate(selectedTemplate.id, Array.from(selectedFields));
      onClose();
    } catch (error) {
      console.error('Error applying template:', error);
      setError('خطا در اعمال الگو');
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
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">انتخاب الگو</h2>
            <p className="text-sm text-gray-600">
              اعمال الگو به {selectedProductIds.length} محصول انتخاب شده
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Templates List */}
          <div className="w-1/2 border-r">
            {/* Search and Filters */}
            <div className="p-4 border-b bg-gray-50">
              <div className="space-y-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="جستجو در الگوها..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showFavoritesOnly}
                    onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="mr-2 text-sm text-gray-700">فقط الگوهای محبوب</span>
                </label>
              </div>
            </div>

            {/* Templates List */}
            <div className="overflow-y-auto h-full">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">در حال بارگذاری الگوها...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={loadTemplates}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    تلاش مجدد
                  </button>
                </div>
              ) : templates.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600">الگویی یافت نشد</p>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <h3 className="font-medium text-gray-900">{template.name}</h3>
                            {template.is_favorite && (
                              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            )}
                          </div>
                          {template.description && (
                            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                          )}
                          <div className="flex items-center space-x-4 space-x-reverse mt-2 text-xs text-gray-500">
                            <span>{template.fields_to_copy.length} فیلد</span>
                            <span>{template.usage_count} بار استفاده</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t">
                  <div className="flex justify-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      قبلی
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-600">
                      {currentPage} از {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      بعدی
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Template Preview */}
          <div className="w-1/2">
            {selectedTemplate ? (
              <div className="h-full flex flex-col">
                {/* Preview Header */}
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="font-medium text-gray-900">{selectedTemplate.name}</h3>
                  {selectedTemplate.description && (
                    <p className="text-sm text-gray-600 mt-1">{selectedTemplate.description}</p>
                  )}
                </div>

                {/* Fields Selection */}
                <div className="flex-1 overflow-y-auto p-4">
                  <h4 className="font-medium text-gray-900 mb-3">انتخاب فیلدهای قابل کپی:</h4>
                  
                  <div className="space-y-2 mb-6">
                    {selectedTemplate.fields_to_copy.map((field) => (
                      <label key={field} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedFields.has(field)}
                          onChange={() => handleFieldToggle(field)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="mr-3 text-sm text-gray-700">
                          {FIELD_DISPLAY_NAMES[field] || field}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Preview Data */}
                  {templatePreview && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">پیش‌نمایش داده‌ها:</h4>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        {Array.from(selectedFields).map((field) => (
                          <div key={field} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">
                              {FIELD_DISPLAY_NAMES[field] || field}:
                            </span>
                            <span className="text-gray-900 font-medium">
                              {formatValue(field, templatePreview.preview_data[field])}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Apply Button */}
                <div className="p-4 border-t">
                  <button
                    onClick={handleApplyTemplate}
                    disabled={selectedFields.size === 0 || loading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'در حال اعمال...' : `اعمال الگو به ${selectedProductIds.length} محصول`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>الگویی را انتخاب کنید</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}