// resources/js/Pages/Sales/Edit.jsx
import { useState, useMemo, useEffect } from 'react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import {
  Save, ArrowRight, Plus, Minus, X,
  Search, Package, AlertTriangle, ShoppingCart, Info, Calendar, User, DollarSign,
  Trash2, RotateCcw, Edit as EditIcon, Copy, Calculator, Percent, TrendingUp,
  ShieldAlert, CreditCard, Receipt, QrCode, BarChart3, Clock, CheckCircle,
  FileText, Download, Printer, ExternalLink, ChevronDown, Settings
} from 'lucide-react';

export default function Edit({ sale, customers, products }) {
  console.log('Edit Component Loaded');
  console.log('Sale:', sale);
  console.log('Products count:', products?.length);
  console.log('Original sale items:', sale.items);

  const [data, setData] = useState({
    customer_id: sale.customer_id || '',
    sale_type: sale.sale_type,
    currency: sale.currency,
    payment_method: sale.payment_method || 'cash',
    paid_amount: sale.paid_amount,
    sale_date: new Date(sale.sale_date).toISOString().split('T')[0],
    notes: sale.notes || '',
    items: sale.items.map(item => ({
      product_id: item.product_id,
      product_name: item.product?.name || '',
      product_code: item.product?.code || '',
      product_image: item.product?.image_url || null,
      quantity: parseFloat(item.quantity) || 0,
      unit_price: parseFloat(item.unit_price) || 0,
      unit_label: item.product?.sale_unit?.name || 'دانە',
      available_quantity: item.product?.available_quantity || item.product?.quantity || 0,
      min_price: sale.currency === 'IQD' ?
        (item.product?.purchase_price_iqd || 0) :
        (item.product?.purchase_price_usd || 0),
      original_quantity: parseFloat(item.quantity) || 0, // بۆ گەڕانەوە
      original_unit_price: parseFloat(item.unit_price) || 0 // بۆ گەڕانەوە
    }))
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [originalTotal, setOriginalTotal] = useState(sale.total_amount);

  // کاتێک جۆری فرۆشتن دەگۆڕدرێت
  useEffect(() => {
    if (data.sale_type === 'credit') {
      setData(prev => ({ ...prev, payment_method: '', paid_amount: '0' }));
    } else {
      setData(prev => ({ ...prev, payment_method: 'cash' }));
    }
  }, [data.sale_type]);

  // کاتێگۆریەکان
  const categories = useMemo(() => {
    const cats = products.reduce((acc, product) => {
      const catName = product.category_name || 'بێ کاتێگۆری';
      if (!acc.includes(catName)) acc.push(catName);
      return acc;
    }, []);
    return ['all', ...cats];
  }, [products]);

  // بەرهەمە فلتەرکراوەکان
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (product.code && product.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (product.barcode && product.barcode.includes(searchTerm));
      const matchesCategory = selectedCategory === 'all' || product.category_name === selectedCategory;
      return matchesSearch && matchesCategory && product.track_stock;
    });
  }, [products, searchTerm, selectedCategory]);

  // زیادکردنی بەرهەم
  const addProductToCart = (product) => {
    const existingIndex = data.items.findIndex(item => item.product_id === product.id);

    if (existingIndex >= 0) {
      const newItems = [...data.items];
      newItems[existingIndex].quantity += 1;
      setData({ ...data, items: newItems });
    } else {
      const price = data.currency === 'IQD'
        ? product.selling_price_iqd
        : product.selling_price_usd;

      // بەکارهێنانی available_quantity کە لە Controller دێت
      const availableQuantity = product.available_quantity || product.quantity || 0;

      const newItem = {
        product_id: product.id,
        product_name: product.name,
        product_code: product.code,
        product_image: product.image_url,
        quantity: 1,
        unit_price: price,
        unit_label: product.unit_label || 'دانە',
        available_quantity: availableQuantity,
        min_price: data.currency === 'IQD' ? product.purchase_price_iqd : product.purchase_price_usd,
        original_quantity: 1,
        original_unit_price: price
      };

      setData({
        ...data,
        items: [...data.items, newItem]
      });
    }
  };

  // گۆڕینی بڕ
  const updateItemQuantity = (index, change) => {
    const newItems = [...data.items];
    const newQuantity = parseFloat(newItems[index].quantity || 0) + change;

    if (newQuantity > 0 && newQuantity <= newItems[index].available_quantity) {
      newItems[index].quantity = newQuantity;
      setData({ ...data, items: newItems });
    } else if (newQuantity <= 0) {
      removeItem(index);
    }
  };

  // سڕینەوەی بەرهەم
  const removeItem = (index) => {
    const newItems = data.items.filter((_, i) => i !== index);
    setData({ ...data, items: newItems });
  };

  // گەڕانەوە بۆ ڕەسەن
  const restoreItem = (index) => {
    const newItems = [...data.items];
    newItems[index].quantity = newItems[index].original_quantity;
    newItems[index].unit_price = newItems[index].original_unit_price;
    setData({ ...data, items: newItems });
  };

  // تێکردنی بەرهەمەکە
  const updateItemDirectly = (index, field, value) => {
    const newItems = [...data.items];

    if (field === 'unit_price') {
      const minPrice = newItems[index].min_price || 0;
      const price = parseFloat(value) || 0;

      if (price < minPrice) {
        if (!confirm(`نرخی فرۆشتن کەمترە لە نرخی کڕین (${minPrice}). دڵنیایت؟`)) {
          return;
        }
      }
    }

    newItems[index][field] = value;
    setData({ ...data, items: newItems });
  };

  // کۆپی کردنی فرۆشتن
  const duplicateSale = () => {
    if (confirm('دڵنیایت لە دروستکردنی کۆپی لەم فرۆشتنە؟')) {
      router.post('/sales/duplicate', {
        sale_id: sale.id
      }, {
        onSuccess: () => {
          alert('فرۆشتن بە سەرکەوتوویی کۆپی کرا');
          window.location.reload();
        }
      });
    }
  };

  // حیسابی کۆی گشتی
  const calculateSubtotal = () => {
    return data.items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0));
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal - discount + tax + shipping;
  };

  // حیسابی قازانج
  const calculateProfit = () => {
    return data.items.reduce((profit, item) => {
      const cost = parseFloat(item.min_price || 0) * parseFloat(item.quantity || 0);
      const revenue = parseFloat(item.unit_price || 0) * parseFloat(item.quantity || 0);
      return profit + (revenue - cost);
    }, 0);
  };

  // حیسابی ڕێژەی قازانج
  const calculateProfitPercentage = () => {
    const subtotal = calculateSubtotal();
    const profit = calculateProfit();
    return subtotal > 0 ? (profit / subtotal) * 100 : 0;
  };

  // ناردنی فۆرم
  const handleSubmit = (e) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    if (data.items.length === 0) {
      setErrors({ items: 'کەمێک بەرهەم زیاد بکە' });
      setProcessing(false);
      alert('کەمێک بەرهەم زیاد بکە');
      return;
    }

    const total = calculateTotal();
    const paid = parseFloat(data.paid_amount || 0);

    // پشکنینەکان
    if (data.sale_type === 'cash') {
      if (paid <= 0) {
        setErrors({ paid_amount: 'بۆ فرۆشتنی ڕاستەوخۆ، بڕێکی دراو پێویستە' });
        setProcessing(false);
        alert('بۆ فرۆشتنی ڕاستەوخۆ، بڕێکی دراو پێویستە');
        return;
      }
      if (!data.payment_method) {
        setErrors({ payment_method: 'شێوازی پارەدان بۆ فرۆشتنی ڕاستەوخۆ پێویستە' });
        setProcessing(false);
        alert('شێوازی پارەدان بۆ فرۆشتنی ڕاستەوخۆ پێویستە');
        return;
      }
    }

    if (paid > total) {
      setErrors({ paid_amount: 'بڕی پارەی دراو نابێت زیاتر بێت لە کۆی گشتی' });
      setProcessing(false);
      alert('بڕی پارەی دراو نابێت زیاتر بێت لە کۆی گشتی');
      return;
    }

    // پشکنینی قەرزی بێ کڕیار
    if (data.sale_type === 'credit' && !data.customer_id) {
      if (!confirm('فرۆشتنەکەت وەک قەرزە بێ کڕیار! دڵنیایت لە نوێکردنەوە؟')) {
        setProcessing(false);
        return;
      }
    }

    // پشکنینی گۆڕانکاریەکان
    const changes = data.items.filter(item =>
      item.quantity !== item.original_quantity ||
      item.unit_price !== item.original_unit_price
    ).length;

    if (changes > 0 && !confirm(`دەتەوێت ${changes} گۆڕانکاری لە بەرهەمەکان جێبەجێ بکەیت؟`)) {
      setProcessing(false);
      return;
    }

    // پاککردنەوەی فیلدەکانی زێدەر بۆ ناردن
    const submitData = {
      ...data,
      items: data.items.map(item => ({
        product_id: item.product_id,
        quantity: parseFloat(item.quantity) || 0,
        unit_price: parseFloat(item.unit_price) || 0,
      })),
      paid_amount: parseFloat(data.paid_amount) || 0,
      discount: parseFloat(discount) || 0,
      tax: parseFloat(tax) || 0,
      shipping: parseFloat(shipping) || 0,
    };

    router.put(`/sales/${sale.id}`, submitData, {
      onError: (errors) => {
        setErrors(errors);
        setProcessing(false);
      },
      onSuccess: () => {
        setProcessing(false);
      }
    });
  };

  const subtotal = calculateSubtotal();
  const total = calculateTotal();
  const paidAmount = parseFloat(data.paid_amount || 0);
  const remaining = total - paidAmount;
  const profit = calculateProfit();
  const profitPercentage = calculateProfitPercentage();

  // بڕەکانی خێرای پارەدان
  const quickPayAmounts = data.currency === 'IQD' ?
    [10000, 25000, 50000, 100000, 250000] :
    [10, 25, 50, 100, 250];

  // ڕێژەکانی خێرای داھات
  const quickDiscounts = [0, 5, 10, 15, 20];
  const quickTaxes = [0, 5, 10, 15];

  return (
    <AuthenticatedLayout>
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <EditIcon className="w-6 h-6 text-blue-600" />
            <span>دەستکاری فرۆشتن <span className="font-mono text-blue-600">#{sale.invoice_number}</span></span>
          </div>
        }
        subtitle="نوێکردنەوەی زانیاریەکانی فرۆشتن"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => router.get(`/sales/${sale.id}`)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <ArrowRight className="w-4 h-4" />
              گەڕانەوە
            </button>
            <button
              onClick={duplicateSale}
              className="flex items-center gap-2 px-4 py-2 text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200"
            >
              <Copy className="w-4 h-4" />
              دروستکردنی کۆپی
            </button>
          </div>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* لای چەپ - بەرهەمەکان */}
          <div className="space-y-4 lg:col-span-2">
            {/* Action Bar */}
            <div className="flex items-center justify-between p-4 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">بەرهەمەکان</h3>
                  <p className="text-sm text-blue-700">زیادکردن و دەستکاری بەرهەمەکان</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setData({ ...data, items: [] })}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-lg bg-red-50 hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                  پاککردنەوەی هەموو
                </button>
              </div>
            </div>

            {/* گەڕان */}
            <Card className="border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="relative md:col-span-2">
                  <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 right-3 top-1/2" />
                  <input
                    type="text"
                    placeholder="گەڕان بە ناو، بارکۆد، کۆد..."
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
                  <option value="all">هەموو کاتێگۆریەکان</option>
                  {categories.filter(c => c !== 'all').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </Card>

            {/* لیستی بەرهەمەکان */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map(product => {
                // بەکارهێنانی available_quantity کە لە Controller دێت
                const available = product.available_quantity !== undefined ?
                  product.available_quantity :
                  product.quantity;
                const isLowStock = available <= (product.min_stock_level || 0);
                const isOutOfStock = available <= 0;
                const existingItem = data.items.find(item => item.product_id === product.id);
                const isInCart = !!existingItem;

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => !isOutOfStock && addProductToCart(product)}
                    disabled={isOutOfStock}
                    className={`p-3 text-right transition-all rounded-lg border-2 relative group ${
                      isOutOfStock
                        ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50'
                        : isInCart
                        ? 'bg-blue-50 border-blue-300 hover:border-blue-500 hover:shadow-md cursor-pointer'
                        : 'bg-white border-gray-200 hover:border-blue-500 hover:shadow-md cursor-pointer'
                    }`}
                  >
                    {isInCart && (
                      <div className="absolute top-2 left-2">
                        <span className="px-1.5 py-0.5 text-xs font-medium text-white bg-blue-600 rounded">
                          {existingItem.quantity}
                        </span>
                      </div>
                    )}

                    {/* وێنەی بەرهەم */}
                    <div className="flex items-start justify-between mb-2">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="object-cover w-10 h-10 rounded-lg"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=4F46E5&color=fff`;
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                          <Package className="w-6 h-6 text-blue-600" />
                        </div>
                      )}

                      <div className="flex flex-col items-end">
                        {isLowStock && !isOutOfStock && (
                          <span className="px-1.5 py-0.5 mb-1 text-xs font-medium text-orange-700 bg-orange-100 rounded">
                            کەم
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="px-1.5 py-0.5 text-xs font-medium text-red-700 bg-red-100 rounded">
                            تەواو
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="mb-1 text-sm font-medium text-gray-900 line-clamp-2">
                      {product.name}
                    </h3>

                    <div className="mb-1 text-xs text-gray-500">
                      کۆد: {product.code || '---'}
                      {product.barcode && (
                        <span className="mr-2">| بارکۆد: {product.barcode}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">
                        بەردەست: {available.toFixed(3)} {product.unit_label}
                      </span>
                      <span className="text-xs font-medium text-blue-600">
                        {new Intl.NumberFormat('ar-IQ').format(
                          data.currency === 'IQD' ? product.selling_price_iqd : product.selling_price_usd
                        )}
                      </span>
                    </div>

                    {/* نرخی کڕین */}
                    <div className="text-xs font-medium text-green-600">
                      قازانج: {new Intl.NumberFormat('ar-IQ').format(
                        (data.currency === 'IQD' ? product.selling_price_iqd : product.selling_price_usd) -
                        (data.currency === 'IQD' ? product.purchase_price_iqd : product.purchase_price_usd)
                      )} {data.currency}
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="py-12 text-center">
                <Search className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">هیچ بەرهەمێک بەم فلتەرە نەدۆزرایەوە</p>
              </div>
            )}
          </div>

          {/* لای ڕاست - سەبەتە و ڕێکخستنەکان */}
          <div className="space-y-4">
            {/* ڕێکخستنەکان */}
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-700">زانیاریە سەرەکییەکان</h3>

                </div>

                <div>
                  <label className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                    <User className="w-4 h-4" />
                    کڕیار
                  </label>
                  <select
                    value={data.customer_id}
                    onChange={(e) => setData({ ...data, customer_id: e.target.value })}
                    className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">کڕیار هەڵبژێرە (ئارەزوومەندانە)</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone || 'بێ ژمارە'})
                        {data.currency === 'IQD' && c.balance_iqd > 0 ? ` - قەرز: ${c.balance_iqd}` : ''}
                        {data.currency === 'USD' && c.balance_usd > 0 ? ` - قەرز: ${c.balance_usd}` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.customer_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.customer_id}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      جۆری فرۆشتن
                    </label>
                    <select
                      value={data.sale_type}
                      onChange={(e) => setData({ ...data, sale_type: e.target.value })}
                      className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="cash">ڕاستەوخۆ</option>
                      <option value="credit">قەرز</option>
                    </select>
                    {errors.sale_type && (
                      <p className="mt-1 text-sm text-red-600">{errors.sale_type}</p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                      <DollarSign className="w-4 h-4" />
                      دراو
                    </label>
                    <select
                      value={data.currency}
                      onChange={(e) => {
                        // نوێکردنەوەی نرخەکان کاتێک دراو دەگۆڕدرێت
                        const newItems = data.items.map(item => {
                          const product = products.find(p => p.id === item.product_id);
                          if (!product) return item;

                          return {
                            ...item,
                            unit_price: e.target.value === 'IQD'
                              ? product.selling_price_iqd
                              : product.selling_price_usd,
                            min_price: e.target.value === 'IQD'
                              ? product.purchase_price_iqd
                              : product.purchase_price_usd
                          };
                        });

                        setData({
                          ...data,
                          currency: e.target.value,
                          items: newItems,
                          paid_amount: '0'
                        });
                      }}
                      className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="IQD">دینار (IQD)</option>
                      <option value="USD">دۆلار (USD)</option>
                    </select>
                    {errors.currency && (
                      <p className="mt-1 text-sm text-red-600">{errors.currency}</p>
                    )}
                  </div>
                </div>

                {/* شێوازی پارەدان تەنها بۆ ڕاستەوخۆ */}
                {data.sale_type === 'cash' && (
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      شێوازی پارەدان
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setData({ ...data, payment_method: 'cash' })}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          data.payment_method === 'cash'
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                        }`}
                      >
                        ڕاستەوخۆ
                      </button>
                      <button
                        type="button"
                        onClick={() => setData({ ...data, payment_method: 'pos' })}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          data.payment_method === 'pos'
                            ? 'bg-blue-100 text-blue-700 border border-blue-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                        }`}
                      >
                        پۆس
                      </button>
                      <button
                        type="button"
                        onClick={() => setData({ ...data, payment_method: 'transfer' })}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          data.payment_method === 'transfer'
                            ? 'bg-purple-100 text-purple-700 border border-purple-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                        }`}
                      >
                        گواستنەوە
                      </button>
                    </div>
                    {errors.payment_method && (
                      <p className="mt-1 text-sm text-red-600">{errors.payment_method}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                    <Calendar className="w-4 h-4" />
                    بەرواری فرۆشتن
                  </label>
                  <input
                    type="date"
                    value={data.sale_date}
                    onChange={(e) => setData({ ...data, sale_date: e.target.value })}
                    className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.sale_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.sale_date}</p>
                  )}
                </div>

                {/* ڕێکخستنە پێشکەوتووەکان */}
                {showAdvanced && (
                  <div className="p-3 space-y-3 border border-gray-200 rounded-lg bg-gray-50">
                    <h4 className="font-medium text-gray-700">ڕێکخستنە پێشکەوتووەکان</h4>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">
                        داھات
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {quickDiscounts.map(d => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDiscount(subtotal * (d / 100))}
                            className={`px-2 py-1 text-xs rounded ${
                              discount === subtotal * (d / 100)
                                ? 'bg-orange-100 text-orange-700 border border-orange-300'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {d}%
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={subtotal}
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        className="w-full mt-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                        placeholder="بڕی داھات"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">
                        باج
                      </label>
                      <div className="grid grid-cols-4 gap-1">
                        {quickTaxes.map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTax((subtotal - discount) * (t / 100))}
                            className={`px-2 py-1 text-xs rounded ${
                              tax === (subtotal - discount) * (t / 100)
                                ? 'bg-red-100 text-red-700 border border-red-300'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {t}%
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={tax}
                        onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                        className="w-full mt-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                        placeholder="بڕی باج"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">
                        نێردن
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={shipping}
                        onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                        className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                        placeholder="بڕی نێردن"
                      />
                    </div>
                  </div>
                )}

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
            <Card title={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span>سەبەتە ({data.items.length})</span>
                  {data.items.length > 0 && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                      {new Intl.NumberFormat('ar-IQ').format(subtotal)} {data.currency}
                    </span>
                  )}
                </div>
                {errors.items && (
                  <span className="text-sm text-red-600">{errors.items}</span>
                )}
              </div>
            }>
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
                  data.items.map((item, index) => {
                    const itemTotal = item.quantity * item.unit_price;
                    const itemProfit = (item.unit_price - item.min_price) * item.quantity;
                    const isModified = item.quantity !== item.original_quantity ||
                                      item.unit_price !== item.original_unit_price;

                    return (
                      <div key={index} className={`p-3 border rounded-lg ${isModified ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-start gap-3 mb-2">
                          {/* وێنەی بەرهەم */}
                          {item.product_image ? (
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              className="object-cover w-12 h-12 rounded-lg"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.product_name)}&background=4F46E5&color=fff&size=48`;
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                              <Package className="w-6 h-6 text-blue-600" />
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
                                {isModified && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 text-xs font-medium text-orange-700 bg-orange-100 rounded">
                                    <EditIcon className="w-3 h-3" />
                                    دەستکاری کراوە
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1">
                                {isModified && (
                                  <button
                                    type="button"
                                    onClick={() => restoreItem(index)}
                                    className="p-1 text-orange-600 hover:text-orange-700"
                                    title="گەڕانەوە بۆ ڕەسەن"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeItem(index)}
                                  className="p-1 text-red-600 hover:text-red-700"
                                  title="سڕینەوە"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
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
                                max={item.available_quantity}
                                value={item.quantity}
                                onChange={(e) => updateItemDirectly(index, 'quantity', e.target.value)}
                                className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:border-blue-500"
                              />
                              <span className="font-medium">
                                {item.unit_label}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateItemQuantity(index, 1)}
                                disabled={item.quantity >= item.available_quantity}
                                className="p-1 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              min={item.min_price || 0}
                              value={item.unit_price}
                              onChange={(e) => updateItemDirectly(index, 'unit_price', e.target.value)}
                              className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500"
                              placeholder="نرخ"
                            />
                            <div className="text-xs text-gray-500">
                              کەمترین: {new Intl.NumberFormat('ar-IQ').format(item.min_price || 0)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">کۆی بەرهەم</div>
                            <span className="text-lg font-bold text-blue-600">
                              {new Intl.NumberFormat('ar-IQ').format(itemTotal)} {data.currency}
                            </span>
                            <div className="text-xs font-medium text-green-600">
                              قازانج: {new Intl.NumberFormat('ar-IQ').format(itemProfit)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            {/* پارەدان */}
            {data.items.length > 0 && (
              <Card>
                <div className="space-y-4">
                  {/* پێشبینی قازانج */}
                  <div className="p-3 border border-green-200 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="text-sm font-medium text-green-900">قازانج</div>
                          <div className="text-xs text-green-700">کۆی قازانجی ئەم فرۆشتنە</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {new Intl.NumberFormat('ar-IQ').format(profit)} {data.currency}
                        </div>
                        <div className="text-sm text-green-700">
                          {profitPercentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* کۆی گشتی */}
                  <div className="p-4 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="mb-1 text-sm text-gray-600">کۆی گشتی</div>
                    <div className="text-3xl font-bold text-blue-600">
                      {new Intl.NumberFormat('ar-IQ').format(total)} {data.currency}
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                      <span>بەرچاوەکان:</span>
                      <span>
                        {data.items.length} بەرهەم
                      </span>
                    </div>

                    {/* وەسفەکان */}
                    <div className="pt-3 mt-3 border-t border-blue-200">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">سەب تۆتاڵ:</span>
                          <span>{new Intl.NumberFormat('ar-IQ').format(subtotal)}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>داھات:</span>
                            <span>-{new Intl.NumberFormat('ar-IQ').format(discount)}</span>
                          </div>
                        )}
                        {tax > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>باج:</span>
                            <span>+{new Intl.NumberFormat('ar-IQ').format(tax)}</span>
                          </div>
                        )}
                        {shipping > 0 && (
                          <div className="flex justify-between text-blue-600">
                            <span>نێردن:</span>
                            <span>+{new Intl.NumberFormat('ar-IQ').format(shipping)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* گۆڕانکاری */}
                  <div className="p-3 border border-orange-200 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-orange-600" />
                        <div>
                          <div className="text-sm font-medium text-orange-900">گۆڕانکاری</div>
                          <div className="text-xs text-orange-700">بەراورد بە ڕەسەن</div>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${total > originalTotal ? 'text-green-600' : total < originalTotal ? 'text-red-600' : 'text-gray-600'}`}>
                        {total > originalTotal ? '+' : total < originalTotal ? '-' : ''}
                        {new Intl.NumberFormat('ar-IQ').format(Math.abs(total - originalTotal))}
                      </div>
                    </div>
                  </div>

                  {/* ئاگاداری بۆ قەرز */}
                  {data.sale_type === 'credit' && (
                    <div className="p-4 border border-orange-200 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 mt-0.5 text-orange-600" />
                        <div className="flex-1">
                          <h4 className="font-medium text-orange-900">فرۆشتنی قەرز</h4>
                          <p className="mt-1 text-sm text-orange-700">
                            بۆ فرۆشتنی قەرز، دەتوانیت بڕێکی دراو بنووسیت یان بە سفر بمێنێتەوە.
                          </p>
                          {!data.customer_id && (
                            <p className="mt-2 text-sm font-medium text-orange-800">
                              ⚠️ ئەم فرۆشتنە بێ کڕیارە!
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* پارەدانی خێرا تەنها بۆ ڕاستەوخۆ */}
                  {data.sale_type === 'cash' && (
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        پارەدانی خێرا
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {quickPayAmounts.map(amount => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => setData({ ...data, paid_amount: amount.toString() })}
                            className={`px-2 py-1.5 text-sm font-medium rounded transition-colors ${
                              parseFloat(data.paid_amount) === amount
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                            }`}
                          >
                            {new Intl.NumberFormat('ar-IQ').format(amount)}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setData({ ...data, paid_amount: total.toString() })}
                          className="col-span-3 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                        >
                          تەواو
                        </button>
                      </div>
                    </div>
                  )}

                  {/* پارەی دراو بۆ هەردوو جۆری فرۆشتن */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      پارەی دراو {data.sale_type === 'credit' && '(ئارەزوومەندانە)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={total}
                      value={data.paid_amount}
                      onChange={(e) => setData({ ...data, paid_amount: e.target.value })}
                      className={`w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 ${
                        errors.paid_amount ? 'border-red-500' : ''
                      }`}
                      placeholder={data.sale_type === 'cash' ? 'بڕی پارەی دراو' : 'بڕی دراو (ئارەزوومەندانە)'}
                    />
                    {errors.paid_amount && (
                      <p className="mt-1 text-sm text-red-600">{errors.paid_amount}</p>
                    )}
                    {data.sale_type === 'credit' && !errors.paid_amount && (
                      <p className="mt-1 text-xs text-gray-500">
                        بۆ فرۆشتنی قەرز، بڕی دراو کەمکردنەوەی قەرزی کڕیارە.
                      </p>
                    )}
                  </div>

                  {/* پێشبینی ماوە */}
                  <div className={`p-4 rounded-lg ${
                    data.sale_type === 'credit'
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
                          {data.sale_type === 'credit'
                            ? paidAmount > 0 ? 'بڕی دراو' : 'کۆی قەرز'
                            : remaining > 0 ? 'ماوە'
                            : remaining < 0 ? 'گەڕاوە'
                            : 'تەواو'
                          }
                        </div>
                        <div className={`text-2xl font-bold ${
                          data.sale_type === 'credit'
                            ? paidAmount > 0 ? 'text-green-600' : 'text-blue-600'
                            : remaining > 0 ? 'text-orange-600'
                            : remaining < 0 ? 'text-green-600'
                            : 'text-gray-600'
                        }`}>
                          {new Intl.NumberFormat('ar-IQ').format(
                            data.sale_type === 'credit' && paidAmount === 0
                              ? total
                              : Math.abs(remaining)
                          )} {data.currency}
                        </div>
                      </div>

                      {data.sale_type === 'credit' && data.customer_id && (
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            قەرزی کڕیار
                          </div>
                          <div className="text-sm font-medium text-blue-600">
                            {paidAmount > 0
                              ? `کەمکرا بۆ ${new Intl.NumberFormat('ar-IQ').format(total - paidAmount)}`
                              : 'زیادکرا بۆ ' + new Intl.NumberFormat('ar-IQ').format(total)
                            }
                          </div>
                        </div>
                      )}
                    </div>

                    {data.sale_type === 'credit' && paidAmount > 0 && (
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
                      disabled={processing || data.items.length === 0}
                      className="flex items-center justify-center gap-2 py-3 text-white rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                          چاوەڕێ بکە...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          نوێکردنەوە
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.get(`/sales/${sale.id}`)}
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
