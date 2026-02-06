import { useState, useMemo, useEffect } from 'react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import {
  Plus, Minus, X, Search, Save, ArrowRight,
  Package, AlertTriangle, ShoppingCart, DollarSign, Info, Image as ImageIcon
} from 'lucide-react';

export default function Create({ suppliers, products, invoiceNumber }) {
  const [data, setData] = useState({
    supplier_id: '',
    purchase_type: 'cash',
    currency: 'IQD',
    payment_method: 'cash',
    paid_amount: '0',
    purchase_date: new Date().toISOString().split('T')[0],
    notes: '',
    items: [],
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [errors, setErrors] = useState({});

  // کاتێک جۆری کڕین دەگۆڕدرێت، پاککردنەوەی بڕی پارەی دراو
  useEffect(() => {
    if (data.purchase_type === 'credit') {
      setData(prev => ({ ...prev, payment_method: '', paid_amount: '0' }));
    } else {
      setData(prev => ({ ...prev, payment_method: 'cash' }));
    }
  }, [data.purchase_type]);

  // کاتێگۆریەکان
  const categories = useMemo(() => {
    const cats = products.reduce((acc, product) => {
      const catName = product.category?.name || 'بێ کاتێگۆری';
      if (!acc.includes(catName)) acc.push(catName);
      return acc;
    }, []);
    return ['all', ...cats];
  }, [products]);

  // بەرهەمە فلتەرکراوەکان
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (product.code && product.code.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' ||
                            (product.category?.name || 'بێ کاتێگۆری') === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // زیادکردنی بەرهەم بۆ سەبەتە
  const addProductToCart = (product) => {
    const existingIndex = data.items.findIndex(item => item.product_id === product.id);

    if (existingIndex >= 0) {
      const newItems = [...data.items];
      newItems[existingIndex].quantity += 1;
      setData({ ...data, items: newItems });
    } else {
      const purchasePrice = data.currency === 'IQD'
        ? product.purchase_price_iqd || 0
        : product.purchase_price_usd || 0;
      const sellingPrice = data.currency === 'IQD'
        ? product.selling_price_iqd || 0
        : product.selling_price_usd || 0;

      setData({
        ...data,
        items: [...data.items, {
          product_id: product.id,
          product_name: product.name,
          product_code: product.code,
          product_image: product.image_url,
          quantity: 1,
          unit_price: purchasePrice,
          selling_price: sellingPrice,
          unit_label: product.unit_label || 'دانە'
        }]
      });
    }
  };

  // گۆڕینی بڕ
  const updateItemQuantity = (index, change) => {
    const newItems = [...data.items];
    const newQuantity = parseFloat(newItems[index].quantity || 0) + change;

    if (newQuantity > 0) {
      newItems[index].quantity = newQuantity;
      setData({ ...data, items: newItems });
    } else {
      removeItem(index);
    }
  };

  // سڕینەوەی بەرهەم
  const removeItem = (index) => {
    const newItems = data.items.filter((_, i) => i !== index);
    setData({ ...data, items: newItems });
  };

  // نوێکردنەوەی نرخ
  const updateItemPrice = (index, field, value) => {
    const newItems = [...data.items];
    newItems[index][field] = parseFloat(value) || 0;
    setData({ ...data, items: newItems });
  };

  // حیسابی کۆی گشتی
  const calculateTotal = () => {
    return data.items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0));
    }, 0);
  };

  // تێکردنی بەرهەمەکە
  const updateItemDirectly = (index, field, value) => {
    const newItems = [...data.items];
    newItems[index][field] = value;
    setData({ ...data, items: newItems });
  };

  // ناردنی فۆرم
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    if (data.items.length === 0) {
      setErrors({ items: 'کەمێک بەرهەم زیاد بکە' });
      alert('کەمێک بەرهەم زیاد بکە');
      return;
    }

    if (data.purchase_type === 'cash' && data.payment_method === '') {
      setErrors({ payment_method: 'شێوازی پارەدان بۆ کڕینی کاش پێویستە' });
      alert('شێوازی پارەدان بۆ کڕینی کاش پێویستە');
      return;
    }

    // پشکنین بۆ پارەدانە زیاترەکان
    const total = calculateTotal();
    const paid = parseFloat(data.paid_amount || 0);

    if (paid > total) {
      setErrors({ paid_amount: 'بڕی پارەی دراو نابێت زیاتر بێت لە کۆی گشتی' });
      alert('بڕی پارەی دراو نابێت زیاتر بێت لە کۆی گشتی');
      return;
    }

    // پشکنینی قەرزی بێ دابینکەر
    if (data.purchase_type === 'credit' && !data.supplier_id) {
      if (!confirm('کڕینەکەت وەک قەرزە بێ دابینکەر! دڵنیایت لە تۆمارکردن؟')) {
        return;
      }
    }

    // پاککردنەوەی فیلدەکانی زێدەر بۆ ناردن
    const submitData = {
      ...data,
      items: data.items.map(item => ({
        product_id: item.product_id,
        quantity: parseFloat(item.quantity) || 0,
        unit_price: parseFloat(item.unit_price) || 0,
        selling_price: parseFloat(item.selling_price) || 0,
      })),
      paid_amount: parseFloat(data.paid_amount) || 0,
    };

    console.log('ناردنی داتا:', submitData);

    router.post('/purchases', submitData, {
      onError: (errors) => {
        console.log('هەڵەکان:', errors);
        setErrors(errors);
      },
      onSuccess: () => {
        console.log('سەرکەوتوو بوو');
      }
    });
  };

  const total = calculateTotal();
  const paidAmount = parseFloat(data.paid_amount || 0);
  const remaining = total - paidAmount;

  // بڕەکانی خێرای پارەدان
  const quickPayAmounts = [50000, 100000, 250000, 500000, 1000000];

  return (
    <AuthenticatedLayout>
      <PageHeader
        title="کڕینی نوێ"
        subtitle={`وەسڵ: ${invoiceNumber}`}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* لای چەپ - بەرهەمەکان */}
          <div className="space-y-4 lg:col-span-2">
            {/* گەڕان */}
            <Card>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="relative">
                  <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 right-3 top-1/2" />
                  <input
                    type="text"
                    placeholder="گەڕان بە ناو یان کۆد..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-10 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'هەموو کاتێگۆریەکان' : cat}
                    </option>
                  ))}
                </select>
              </div>
            </Card>

            {/* لیستی بەرهەمەکان */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addProductToCart(product)}
                  className="p-4 text-right transition-all bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md"
                >
                  {/* وێنەی بەرهەم */}
                  <div className="flex items-start justify-between mb-3">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="object-cover w-12 h-12 rounded-lg"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=4F46E5&color=fff&size=48`;
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50">
                        <Package className="w-6 h-6 text-blue-500" />
                      </div>
                    )}

                    {product.quantity <= product.min_stock_level && (
                      <span className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded">
                        کەم
                      </span>
                    )}
                  </div>

                  <h3 className="mb-1 font-medium text-gray-900 line-clamp-2">
                    {product.name}
                  </h3>

                  <p className="mb-1 text-sm text-gray-500">
                    کۆد: {product.code || '---'}
                  </p>

                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">
                      ستۆک: {product.quantity} {product.unit_label || 'دانە'}
                    </span>
                    <span className="text-xs font-medium text-blue-600">
                      {new Intl.NumberFormat('ar-IQ').format(
                        data.currency === 'IQD' ? (product.purchase_price_iqd || 0) : (product.purchase_price_usd || 0)
                      )} {data.currency}
                    </span>
                  </div>

                  {/* نرخی فرۆشتن */}
                  {(product.selling_price_iqd || product.selling_price_usd) > 0 && (
                    <div className="text-xs font-medium text-green-600">
                      فرۆشتن: {new Intl.NumberFormat('ar-IQ').format(
                        data.currency === 'IQD' ? (product.selling_price_iqd || 0) : (product.selling_price_usd || 0)
                      )} {data.currency}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* لای ڕاست - سەبەتە و ڕێکخستنەکان */}
          <div className="space-y-4">
            {/* ڕێکخستنەکان */}
            <Card>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    دابینکەر
                  </label>
                  <select
                    value={data.supplier_id}
                    onChange={(e) => setData({ ...data, supplier_id: e.target.value })}
                    className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">دابینکەر هەڵبژێرە (ئارەزوومەندانە)</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {errors.supplier_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.supplier_id}</p>
                  )}
                  {data.purchase_type === 'credit' && !data.supplier_id && (
                    <p className="mt-1 text-xs text-orange-600">
                      ⚠️ قەرزی بێ دابینکەر
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      جۆری کڕین
                    </label>
                    <select
                      value={data.purchase_type}
                      onChange={(e) => {
                        setData({
                          ...data,
                          purchase_type: e.target.value
                        });
                      }}
                      className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="cash">کاش</option>
                      <option value="credit">قەرز</option>
                    </select>
                    {errors.purchase_type && (
                      <p className="mt-1 text-sm text-red-600">{errors.purchase_type}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      دراو
                    </label>
                    <select
                      value={data.currency}
                      onChange={(e) => {
                        const newItems = data.items.map(item => {
                          const product = products.find(p => p.id === item.product_id);
                          if (!product) return item;

                          return {
                            ...item,
                            unit_price: e.target.value === 'IQD'
                              ? product.purchase_price_iqd || 0
                              : product.purchase_price_usd || 0,
                            selling_price: e.target.value === 'IQD'
                              ? product.selling_price_iqd || 0
                              : product.selling_price_usd || 0
                          };
                        });

                        setData({
                          ...data,
                          currency: e.target.value,
                          items: newItems
                        });
                      }}
                      className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="IQD">دینار</option>
                      <option value="USD">دۆلار</option>
                    </select>
                    {errors.currency && (
                      <p className="mt-1 text-sm text-red-600">{errors.currency}</p>
                    )}
                  </div>
                </div>

                {/* شێوازی پارەدان تەنها بۆ کاش */}
                {data.purchase_type === 'cash' && (
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      شێوازی پارەدان
                    </label>
                    <select
                      value={data.payment_method}
                      onChange={(e) => setData({ ...data, payment_method: e.target.value })}
                      className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="cash">کاش</option>
                      <option value="pos">پۆس</option>
                      <option value="transfer">گواستنەوە</option>
                    </select>
                    {errors.payment_method && (
                      <p className="mt-1 text-sm text-red-600">{errors.payment_method}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    بەرواری کڕین
                  </label>
                  <input
                    type="date"
                    value={data.purchase_date}
                    onChange={(e) => setData({ ...data, purchase_date: e.target.value })}
                    className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.purchase_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.purchase_date}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    تێبینی
                  </label>
                  <textarea
                    value={data.notes}
                    onChange={(e) => setData({ ...data, notes: e.target.value })}
                    rows="3"
                    className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                    placeholder="تێبینیەکان..."
                  />
                  {errors.notes && (
                    <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* سەبەتە */}
            <Card title={`سەبەتە (${data.items.length})`}>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {data.items.length === 0 ? (
                  <div className="py-8 text-center">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">سەبەتە بەتاڵە</p>
                    {errors.items && (
                      <p className="mt-2 text-sm text-red-600">{errors.items}</p>
                    )}
                  </div>
                ) : (
                  data.items.map((item, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-start gap-3 mb-2">
                        {/* وێنەی بەرهەم */}
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="object-cover w-16 h-16 rounded-lg"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.product_name)}&background=4F46E5&color=fff&size=64`;
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50">
                            <Package className="w-6 h-6 text-blue-500" />
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {item.product_name}
                              </h4>
                              {item.product_code && (
                                <p className="text-xs text-gray-500">کۆد: {item.product_code}</p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="p-1 text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => updateItemQuantity(index, -1)}
                              className="p-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              step="0.001"
                              min="0.001"
                              value={item.quantity}
                              onChange={(e) => updateItemDirectly(index, 'quantity', e.target.value)}
                              className="w-20 px-2 py-1 text-center border border-gray-300 rounded"
                            />
                            <span className="font-medium">
                              {item.unit_label}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateItemQuantity(index, 1)}
                              className="p-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                        <div>
                          <label className="text-xs text-gray-600">نرخی کڕین</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) => updateItemPrice(index, 'unit_price', e.target.value)}
                            className="w-full text-sm border-gray-300 rounded focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">نرخی فرۆشتن</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.selling_price}
                            onChange={(e) => updateItemPrice(index, 'selling_price', e.target.value)}
                            className="w-full text-sm border-gray-300 rounded focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="mt-3 text-right">
                        <div className="text-sm text-gray-600">کۆی بەرهەم</div>
                        <span className="text-lg font-bold text-blue-600">
                          {new Intl.NumberFormat('ar-IQ').format((item.quantity || 0) * (item.unit_price || 0))} {data.currency}
                        </span>
                        {item.selling_price > item.unit_price && (
                          <div className="mt-1 text-xs font-medium text-green-600">
                            قازانج: {new Intl.NumberFormat('ar-IQ').format((item.selling_price - item.unit_price) * item.quantity)} {data.currency}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* پارەدان */}
            {data.items.length > 0 && (
              <Card>
                <div className="space-y-4">
                  <div className="p-4 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="mb-1 text-sm text-gray-600">کۆی گشتی</div>
                    <div className="text-3xl font-bold text-blue-600">
                      {new Intl.NumberFormat('ar-IQ').format(total)} {data.currency}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {data.items.length} بەرهەم • قازانج چاوەڕوانکراو: {new Intl.NumberFormat('ar-IQ').format(
                        data.items.reduce((sum, item) => sum + ((item.selling_price - item.unit_price) * item.quantity), 0)
                      )} {data.currency}
                    </div>
                  </div>

                  {/* ئاگاداری بۆ قەرز */}
                  {data.purchase_type === 'credit' && (
                    <div className="p-4 border border-orange-200 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 mt-0.5 text-orange-600" />
                        <div className="flex-1">
                          <h4 className="font-medium text-orange-900">کڕینی قەرز</h4>
                          <p className="mt-1 text-sm text-orange-700">
                            بۆ کڕینی قەرز، دەتوانیت بڕێکی دراو بنووسیت یان بە سفر بمێنێتەوە.
                          </p>
                          {!data.supplier_id && (
                            <p className="mt-2 text-sm font-medium text-orange-800">
                              ⚠️ ئەم کڕینە بێ دابینکەرە!
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* پارەدانی خێرا تەنها بۆ کاش */}
                  {data.currency === 'IQD' && data.purchase_type === 'cash' && (
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        پارەدانی خێرا
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {quickPayAmounts.map(amount => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => setData({ ...data, paid_amount: amount.toString() })}
                            className="px-3 py-2 text-sm font-medium text-green-700 transition-colors bg-green-100 rounded hover:bg-green-200"
                          >
                            {new Intl.NumberFormat('ar-IQ').format(amount)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* پارەی دراو بۆ هەردوو جۆری کڕین */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      پارەی دراو {data.purchase_type === 'credit' && '(ئارەزوومەندانە)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={data.paid_amount}
                      onChange={(e) => {
                        setData({ ...data, paid_amount: e.target.value });
                      }}
                      className={`w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 ${
                        errors.paid_amount ? 'border-red-500' : ''
                      }`}
                      placeholder={data.purchase_type === 'cash' ? 'بڕی پارەی دراو' : 'بڕی دراو (ئارەزوومەندانە)'}
                    />
                    {errors.paid_amount && (
                      <p className="mt-1 text-sm text-red-600">{errors.paid_amount}</p>
                    )}
                    {data.purchase_type === 'credit' && !errors.paid_amount && (
                      <p className="mt-1 text-xs text-gray-500">
                        بۆ کڕینی قەرز، بڕی دراو کەمکردنەوەی قەرزی دابینکەرە.
                      </p>
                    )}
                  </div>

                  {/* پێشبینی ماوە */}
                  <div className={`p-4 rounded-lg ${
                    data.purchase_type === 'credit'
                      ? paidAmount > 0
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
                        : 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200'
                      : remaining > 0
                      ? 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200'
                      : remaining < 0
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
                      : 'bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="mb-1 text-sm font-medium text-gray-700">
                          {data.purchase_type === 'credit'
                            ? paidAmount > 0 ? 'بڕی دراو' : 'کۆی قەرز'
                            : remaining > 0 ? 'ماوە'
                            : remaining < 0 ? 'گەڕاوە'
                            : 'تەواو'
                          }
                        </div>
                        <div className={`text-2xl font-bold ${
                          data.purchase_type === 'credit'
                            ? paidAmount > 0 ? 'text-green-600' : 'text-blue-600'
                            : remaining > 0 ? 'text-orange-600'
                            : remaining < 0 ? 'text-green-600'
                            : 'text-gray-600'
                        }`}>
                          {new Intl.NumberFormat('ar-IQ').format(
                            data.purchase_type === 'credit' && paidAmount === 0
                              ? total  // کۆی قەرز
                              : Math.abs(remaining)
                          )} {data.currency}
                        </div>
                      </div>

                      {data.purchase_type === 'credit' && (
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            قەرزی دابینکەر
                          </div>
                          <div className="text-sm font-medium text-blue-600">
                            {paidAmount > 0
                              ? `کەمکرا بۆ ${new Intl.NumberFormat('ar-IQ').format(total - paidAmount)}`
                              : 'بە تەواوی قەرز'
                            }
                          </div>
                        </div>
                      )}
                    </div>

                    {data.purchase_type === 'credit' && paidAmount > 0 && (
                      <div className="pt-3 mt-3 border-t border-blue-200">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">کۆی گشتی:</span>
                          <span className="font-medium">{new Intl.NumberFormat('ar-IQ').format(total)}</span>
                        </div>
                        <div className="flex justify-between mt-1 text-sm">
                          <span className="text-gray-600">پارەدراو:</span>
                          <span className="font-medium text-green-600">{new Intl.NumberFormat('ar-IQ').format(paidAmount)}</span>
                        </div>
                        <div className="flex justify-between mt-1 text-sm font-medium">
                          <span className="text-gray-700">قەرزی ماوە:</span>
                          <span className="text-orange-600">{new Intl.NumberFormat('ar-IQ').format(total - paidAmount)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="submit"
                      disabled={data.items.length === 0}
                      className="flex items-center justify-center gap-2 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-5 h-5" />
                      تۆمارکردنی کڕین
                    </button>
                    <button
                      type="button"
                      onClick={() => router.get('/purchases')}
                      className="flex items-center justify-center gap-2 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      <ArrowRight className="w-5 h-5" />
                      گەڕانەوە
                    </button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </form>
    </AuthenticatedLayout>
  );
}
