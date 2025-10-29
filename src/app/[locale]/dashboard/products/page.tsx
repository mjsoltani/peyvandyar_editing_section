'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
  id: number;
  title: string;
  price: number;
  discount_price?: number;
  stock: number;
  status: string;
  category: string;
  selected?: boolean;
}

export default function ProductsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      title: 'محصول نمونه 1',
      price: 100000,
      discount_price: 80000,
      stock: 10,
      status: 'active',
      category: 'دسته 1'
    },
    {
      id: 2,
      title: 'محصول نمونه 2',
      price: 200000,
      stock: 5,
      status: 'active',
      category: 'دسته 2'
    },
    {
      id: 3,
      title: 'محصول نمونه 3',
      price: 150000,
      stock: 8,
      status: 'inactive',
      category: 'دسته 1'
    }
  ]);

  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [showBatchEdit, setShowBatchEdit] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [batchEditData, setBatchEditData] = useState({
    price: '',
    discount_price: '',
    stock: '',
    status: ''
  });
  const [newProductData, setNewProductData] = useState({
    title: '',
    price: '',
    discount_price: '',
    stock: '',
    status: 'active',
    category: ''
  });

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/fa/auth/login');
      return;
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/fa');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSelectProduct = (productId: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  const handleBatchEdit = () => {
    if (selectedProducts.size === 0) {
      alert('لطفاً ابتدا محصولاتی را انتخاب کنید');
      return;
    }
    setShowBatchEdit(true);
  };

  const applyBatchEdit = () => {
    const updatedProducts = products.map(product => {
      if (selectedProducts.has(product.id)) {
        return {
          ...product,
          ...(batchEditData.price && { price: parseInt(batchEditData.price) }),
          ...(batchEditData.discount_price && { discount_price: parseInt(batchEditData.discount_price) }),
          ...(batchEditData.stock && { stock: parseInt(batchEditData.stock) }),
          ...(batchEditData.status && { status: batchEditData.status })
        };
      }
      return product;
    });

    setProducts(updatedProducts);
    setShowBatchEdit(false);
    setSelectedProducts(new Set());
    setBatchEditData({ price: '', discount_price: '', stock: '', status: '' });
    alert(`${selectedProducts.size} محصول با موفقیت ویرایش شد!`);
  };

  const addNewProduct = () => {
    if (!newProductData.title || !newProductData.price || !newProductData.category) {
      alert('لطفاً تمام فیلدهای ضروری را پر کنید');
      return;
    }

    const newProduct: Product = {
      id: Math.max(...products.map(p => p.id)) + 1,
      title: newProductData.title,
      price: parseInt(newProductData.price),
      ...(newProductData.discount_price && { discount_price: parseInt(newProductData.discount_price) }),
      stock: parseInt(newProductData.stock) || 0,
      status: newProductData.status,
      category: newProductData.category
    };

    setProducts([...products, newProduct]);
    setShowAddProduct(false);
    setNewProductData({ title: '', price: '', discount_price: '', stock: '', status: 'active', category: '' });
    alert('محصول جدید با موفقیت اضافه شد!');
  };

  const deleteProduct = (productId: number) => {
    if (confirm('آیا مطمئن هستید که می‌خواهید این محصول را حذف کنید؟')) {
      setProducts(products.filter(p => p.id !== productId));
      setSelectedProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
      alert('محصول با موفقیت حذف شد!');
    }
  };

  const deleteSelectedProducts = () => {
    if (selectedProducts.size === 0) {
      alert('لطفاً ابتدا محصولاتی را انتخاب کنید');
      return;
    }
    
    if (confirm(`آیا مطمئن هستید که می‌خواهید ${selectedProducts.size} محصول انتخاب شده را حذف کنید؟`)) {
      setProducts(products.filter(p => !selectedProducts.has(p.id)));
      setSelectedProducts(new Set());
      alert(`${selectedProducts.size} محصول با موفقیت حذف شد!`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <a href="/fa/dashboard" className="text-blue-600 hover:text-blue-800">
                ← داشبورد
              </a>
              <span className="text-gray-300">|</span>
              <span className="text-gray-900">مدیریت محصولات</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors text-sm"
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-bold text-blue-900 mb-2">🎮 Demo تعاملی</h2>
            <p className="text-blue-800 text-sm">
              این یک محیط demo کاملاً تعاملی است! شما می‌توانید محصولات را انتخاب کنید، 
              ویرایش دسته‌جمعی انجام دهید و نتایج را مشاهده کنید. تمام تغییرات در این صفحه اعمال می‌شود.
            </p>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">مدیریت محصولات</h1>
          <p className="text-gray-600">مدیریت و ویرایش محصولات باسلام - نسخه Demo</p>
        </div>

        {/* Statistics */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900">کل محصولات</h3>
            <p className="text-2xl font-bold text-blue-700">{products.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-900">محصولات فعال</h3>
            <p className="text-2xl font-bold text-green-700">{products.filter(p => p.status === 'active').length}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-900">انتخاب شده</h3>
            <p className="text-2xl font-bold text-yellow-700">{selectedProducts.size}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-900">کل موجودی</h3>
            <p className="text-2xl font-bold text-purple-700">{products.reduce((sum, p) => sum + p.stock, 0)}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-4 items-center flex-wrap">
          <button 
            onClick={handleBatchEdit}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:bg-gray-300"
            disabled={selectedProducts.size === 0}
          >
            ویرایش دسته‌جمعی ({selectedProducts.size})
          </button>
          <button 
            onClick={() => setShowAddProduct(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            افزودن محصول جدید
          </button>
          <button 
            onClick={handleSelectAll}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            {selectedProducts.size === products.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
          </button>
          <button 
            onClick={deleteSelectedProducts}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-300"
            disabled={selectedProducts.size === 0}
          >
            حذف انتخاب شده ({selectedProducts.size})
          </button>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">لیست محصولات</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedProducts.size === products.length && products.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نام محصول
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    قیمت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    موجودی
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    وضعیت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    دسته‌بندی
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className={`hover:bg-gray-50 ${selectedProducts.has(product.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.discount_price ? (
                          <>
                            <span className="line-through text-gray-500">{product.price.toLocaleString()}</span>
                            <span className="mr-2 text-red-600">{product.discount_price.toLocaleString()}</span>
                          </>
                        ) : (
                          product.price.toLocaleString()
                        )}
                        <span className="text-gray-500 text-xs mr-1">تومان</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.stock}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.status === 'active' ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 ml-4">
                        ویرایش
                      </button>
                      <button className="text-gray-600 hover:text-gray-900 ml-4">
                        مشاهده
                      </button>
                      <button 
                        onClick={() => deleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Product Modal */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  افزودن محصول جدید
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      نام محصول *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="نام محصول را وارد کنید"
                      value={newProductData.title}
                      onChange={(e) => setNewProductData({...newProductData, title: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      قیمت (تومان) *
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="قیمت را وارد کنید"
                      value={newProductData.price}
                      onChange={(e) => setNewProductData({...newProductData, price: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      قیمت تخفیف‌دار (تومان)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="قیمت تخفیف‌دار (اختیاری)"
                      value={newProductData.discount_price}
                      onChange={(e) => setNewProductData({...newProductData, discount_price: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      موجودی
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="موجودی را وارد کنید"
                      value={newProductData.stock}
                      onChange={(e) => setNewProductData({...newProductData, stock: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      دسته‌بندی *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="دسته‌بندی را وارد کنید"
                      value={newProductData.category}
                      onChange={(e) => setNewProductData({...newProductData, category: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      وضعیت
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newProductData.status}
                      onChange={(e) => setNewProductData({...newProductData, status: e.target.value})}
                    >
                      <option value="active">فعال</option>
                      <option value="inactive">غیرفعال</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={addNewProduct}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    افزودن محصول
                  </button>
                  <button
                    onClick={() => setShowAddProduct(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    لغو
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Batch Edit Modal */}
        {showBatchEdit && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  ویرایش دسته‌جمعی ({selectedProducts.size} محصول)
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      قیمت جدید (تومان)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="قیمت جدید را وارد کنید"
                      value={batchEditData.price}
                      onChange={(e) => setBatchEditData({...batchEditData, price: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      قیمت تخفیف‌دار (تومان)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="قیمت تخفیف‌دار را وارد کنید"
                      value={batchEditData.discount_price}
                      onChange={(e) => setBatchEditData({...batchEditData, discount_price: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      موجودی جدید
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="موجودی جدید را وارد کنید"
                      value={batchEditData.stock}
                      onChange={(e) => setBatchEditData({...batchEditData, stock: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      وضعیت
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={batchEditData.status}
                      onChange={(e) => setBatchEditData({...batchEditData, status: e.target.value})}
                    >
                      <option value="">انتخاب کنید</option>
                      <option value="active">فعال</option>
                      <option value="inactive">غیرفعال</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={applyBatchEdit}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    اعمال تغییرات
                  </button>
                  <button
                    onClick={() => setShowBatchEdit(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    لغو
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}