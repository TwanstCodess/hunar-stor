import { useState, useEffect } from 'react';
import { router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import { ArrowRight, Save, Users, Truck, Building2, AlertCircle, DollarSign, Calendar, FileText, Upload, X, CheckCircle, CreditCard } from 'lucide-react';

// Helper function for formatting numbers
const formatNumber = (num) => {
  return new Intl.NumberFormat('ar-IQ').format(num || 0);
};

// Helper function for formatting currency
const formatCurrency = (amount, currency) => {
  const formattedAmount = formatNumber(amount);
  if (currency === 'IQD') return `${formattedAmount} دینار`;
  if (currency === 'USD') return `$${formattedAmount}`;
  return `${formattedAmount} ${currency}`;
};

export default function Create({ type: initialType = 'customer', customer_id, supplier_id, customers, suppliers, sales = [], purchases = [] }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    type: initialType,
    customer_id: customer_id || '',
    supplier_id: supplier_id || '',
    sale_id: '',
    purchase_id: '',
    currency: 'IQD',
    payment_method: 'cash',
    amount: '',
    notes: '',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    invoice_number: '',
    bank_name: '',
    account_number: '',
    transaction_id: '',
    status: 'completed',
    attachment: null,
  });

  const [attachmentFile, setAttachmentFile] = useState(null);
  const [filteredSales, setFilteredSales] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [advanceApplied, setAdvanceApplied] = useState(false);

  const selectedEntity = data.type === 'customer'
    ? customers.find(c => c.id == data.customer_id)
    : suppliers.find(s => s.id == data.supplier_id);

  // حسابکردنی قەرزی ئێستا بۆ کڕیار (قەرز - زیادە)
  const calculateCurrentDebt = () => {
    if (!selectedEntity) return 0;

    if (data.type === 'customer') {
      if (data.currency === 'IQD') {
        return Math.max(0, selectedEntity.balance_iqd - selectedEntity.negative_balance_iqd);
      } else {
        return Math.max(0, selectedEntity.balance_usd - selectedEntity.negative_balance_usd);
      }
    } else {
      return data.currency === 'IQD' ? selectedEntity.balance_iqd : selectedEntity.balance_usd;
    }
  };

  const currentDebt = calculateCurrentDebt();
  const maxAmount = currentDebt;

  useEffect(() => {
    if (data.type === 'customer' && data.customer_id) {
      const filtered = sales.filter(sale =>
        sale.customer_id == data.customer_id &&
        sale.remaining_amount > 0
      );
      setFilteredSales(filtered);
    } else {
      setFilteredSales([]);
    }
  }, [data.customer_id, data.type, sales]);

  useEffect(() => {
    if (data.type === 'supplier' && data.supplier_id) {
      const filtered = purchases.filter(purchase =>
        purchase.supplier_id == data.supplier_id &&
        purchase.remaining_amount > 0
      );
      setFilteredPurchases(filtered);
    } else {
      setFilteredPurchases([]);
    }
  }, [data.supplier_id, data.type, purchases]);

  // تێبینی: ئەگەر کڕیار زیادەی هەبێت، بەشێکی لە پارەدان لە زیادەوە کەم بکە
  useEffect(() => {
    if (data.type === 'customer' && selectedEntity && data.amount) {
      const paymentAmount = parseFloat(data.amount) || 0;
      const availableAdvance = data.currency === 'IQD'
        ? selectedEntity.negative_balance_iqd
        : selectedEntity.negative_balance_usd;

      const debtAmount = data.currency === 'IQD'
        ? selectedEntity.balance_iqd
        : selectedEntity.balance_usd;

      if (availableAdvance > 0 && paymentAmount > 0 && debtAmount > 0) {
        setAdvanceApplied(true);
      } else {
        setAdvanceApplied(false);
      }
    }
  }, [data.amount, data.currency, data.type, selectedEntity]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData();

    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== '' && key !== 'attachment') {
        formData.append(key, data[key]);
      }
    });

    if (attachmentFile) {
      formData.append('attachment', attachmentFile);
    }

    post('/payments', {
      data: formData,
      preserveScroll: true,
      onSuccess: () => {
        reset();
        setAttachmentFile(null);
      },
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('تەنها فایلەکانی JPEG، PNG، PDF قبوڵ کراوە');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('قەبارەی فایل نابێت لە 5MB زیاتر بێت');
        return;
      }

      setAttachmentFile(file);
      setData('attachment', file);
    }
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setData('attachment', null);
  };

  const requiresBankInfo = ['transfer', 'cheque'].includes(data.payment_method);

  // فەنکشنی بۆ زیادکردنی پارەی خێرا
  const addQuickAmount = (amount) => {
    setData('amount', amount.toString());
  };

  return (
    <AuthenticatedLayout>
      <PageHeader
        title="دانەوەی قەرز"
        subtitle="تۆمارکردنی دانەوەیەکی نوێ"
      />

      <div className="max-w-4xl mx-auto">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header باڵی سەرەوە */}
            <div className="flex items-center gap-3 p-4 border border-blue-200 rounded-lg bg-blue-50">
              {data.type === 'customer' ? (
                <Users className="w-6 h-6 text-blue-600" />
              ) : (
                <Truck className="w-6 h-6 text-purple-600" />
              )}
              <div className="flex-1">
                <h3 className="font-medium text-blue-900">
                  دانەوەی قەرزی {data.type === 'customer' ? 'کڕیار' : 'دابینکەر'}
                </h3>
              </div>
            </div>

            {/* نمایشی هەڵەکان */}
            {Object.keys(errors).length > 0 && (
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900">هەڵەکان:</h4>
                    <ul className="mt-2 space-y-1 text-sm text-red-700">
                      {Object.entries(errors).map(([key, value]) => (
                        <li key={key}>• {value}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* جۆری دانەوە و بەروار */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  جۆری دانەوە *
                </label>
                <select
                  value={data.type}
                  onChange={(e) => setData({
                    ...data,
                    type: e.target.value,
                    customer_id: '',
                    supplier_id: '',
                    sale_id: '',
                    purchase_id: ''
                  })}
                  className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="customer">کڕیار</option>
                  <option value="supplier">دابینکەر</option>
                </select>
                {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  بەرواری پارەدان *
                </label>
                <div className="relative">
                  <Calendar className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                  <input
                    type="date"
                    value={data.payment_date}
                    onChange={(e) => setData('payment_date', e.target.value)}
                    className="block w-full pr-3 pl-10 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                {errors.payment_date && <p className="mt-1 text-sm text-red-600">{errors.payment_date}</p>}
              </div>
            </div>

            {/* بەشی کڕیار/دابینکەر */}
            {data.type === 'customer' ? (
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    کڕیار *
                  </label>
                  <select
                    value={data.customer_id}
                    onChange={(e) => {
                      const customerId = e.target.value;
                      setData({ ...data, customer_id: customerId, sale_id: '' });

                      if (customerId) {
                        const filtered = sales.filter(sale =>
                          sale.customer_id == customerId &&
                          sale.remaining_amount > 0
                        );
                        setFilteredSales(filtered);
                      } else {
                        setFilteredSales([]);
                      }
                    }}
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">کڕیارێک هەڵبژێرە</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} - قەرز: {formatCurrency(c.balance_iqd, 'IQD')} / {formatCurrency(c.balance_usd, 'USD')}
                        {c.negative_balance_iqd > 0 || c.negative_balance_usd > 0 ? ' (زیادەی پارە هەیە)' : ''}
                      </option>
                    ))}
                  </select>
                  {errors.customer_id && <p className="mt-1 text-sm text-red-600">{errors.customer_id}</p>}
                </div>

                {filteredSales.length > 0 && (
                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <label className="block mb-2 text-sm font-medium text-blue-700">
                      فرۆشتنەکان (قەرزەکانی ئەم کڕیارە)
                    </label>
                    <select
                      value={data.sale_id}
                      onChange={(e) => setData('sale_id', e.target.value)}
                      className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">هەموو وەسڵەکان (دابەشکردنی پارە بەسەر هەموو قەرزەکان)</option>
                      {filteredSales.map(sale => (
                        <option key={sale.id} value={sale.id}>
                          وەسڵی #{sale.invoice_number} - قەرز: {formatCurrency(sale.remaining_amount, sale.currency)}
                        </option>
                      ))}
                    </select>
                    {data.sale_id && (
                      <p className="flex items-start gap-2 mt-2 text-sm text-blue-700">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>پارەکە تەنها بۆ ئەم وەسڵە دیاریکراوە دەچێت و دابەش ناکرێت.</span>
                      </p>
                    )}
                    {!data.sale_id && (
                      <p className="flex items-start gap-2 mt-2 text-sm text-green-700">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>پارەکە بە شێوەی خودکار دابەش دەکرێت بەسەر هەموو وەسڵەکانی ئەم کڕیارە.</span>
                      </p>
                    )}
                    {errors.sale_id && <p className="mt-1 text-sm text-red-600">{errors.sale_id}</p>}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    دابینکەر *
                  </label>
                  <select
                    value={data.supplier_id}
                    onChange={(e) => {
                      const supplierId = e.target.value;
                      setData({ ...data, supplier_id: supplierId, purchase_id: '' });

                      if (supplierId) {
                        const filtered = purchases.filter(purchase =>
                          purchase.supplier_id == supplierId &&
                          purchase.remaining_amount > 0
                        );
                        setFilteredPurchases(filtered);
                      } else {
                        setFilteredPurchases([]);
                      }
                    }}
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">دابینکەرێک هەڵبژێرە</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} - قەرز: {formatCurrency(s.balance_iqd, 'IQD')} / {formatCurrency(s.balance_usd, 'USD')}
                      </option>
                    ))}
                  </select>
                  {errors.supplier_id && <p className="mt-1 text-sm text-red-600">{errors.supplier_id}</p>}
                </div>

                {filteredPurchases.length > 0 && (
                  <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                    <label className="block mb-2 text-sm font-medium text-purple-700">
                      کڕینەکان (قەرزەکانی ئەم دابینکەرە)
                    </label>
                    <select
                      value={data.purchase_id}
                      onChange={(e) => setData('purchase_id', e.target.value)}
                      className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">هەموو وەسڵەکان (دابەشکردنی پارە بەسەر هەموو قەرزەکان)</option>
                      {filteredPurchases.map(purchase => (
                        <option key={purchase.id} value={purchase.id}>
                          وەسڵی #{purchase.invoice_number} - قەرز: {formatCurrency(purchase.remaining_amount, purchase.currency)}
                        </option>
                      ))}
                    </select>
                    {data.purchase_id && (
                      <p className="flex items-start gap-2 mt-2 text-sm text-purple-700">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>پارەکە تەنها بۆ ئەم وەسڵە دیاریکراوە دەچێت و دابەش ناکرێت.</span>
                      </p>
                    )}
                    {!data.purchase_id && (
                      <p className="flex items-start gap-2 mt-2 text-sm text-green-700">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>پارەکە بە شێوەی خودکار دابەش دەکرێت بەسەر هەموو وەسڵەکانی ئەم دابینکەرە.</span>
                      </p>
                    )}
                    {errors.purchase_id && <p className="mt-1 text-sm text-red-600">{errors.purchase_id}</p>}
                  </div>
                )}
              </div>
            )}

            {/* نمایشی قەرز و زیادە */}
            {selectedEntity && (
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <h4 className="mb-4 font-medium text-gray-700">زانیاری قەرز و زیادە</h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* قەرز */}
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-red-500" />
                      <span className="text-sm font-medium text-red-700">قەرز</span>
                    </div>
                    <div className="mt-2 space-y-2">
                      <div>
                        <div className="text-xs text-gray-600">دینار</div>
                        <div className="text-lg font-bold text-red-600">
                          {formatCurrency(selectedEntity.balance_iqd, 'IQD')}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">دۆلار</div>
                        <div className="text-lg font-bold text-red-600">
                          {formatCurrency(selectedEntity.balance_usd, 'USD')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* زیادە */}
                  {data.type === 'customer' && (
                    <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        <span className="text-sm font-medium text-green-700">زیادەی پارە</span>
                      </div>
                      <div className="mt-2 space-y-2">
                        <div>
                          <div className="text-xs text-gray-600">دینار</div>
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(selectedEntity.negative_balance_iqd, 'IQD')}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600">دۆلار</div>
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(selectedEntity.negative_balance_usd, 'USD')}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* قەرزی خالص (قەرز - زیادە) */}
                {data.type === 'customer' && (
                  <div className="p-4 mt-4 border border-blue-200 rounded-lg bg-blue-50">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-blue-500" />
                      <span className="text-sm font-medium text-blue-700">قەرزی خالص ({data.currency})</span>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-blue-600">
                      {formatCurrency(currentDebt, data.currency)}
                    </div>
                    <p className="mt-1 text-sm text-blue-700">
                      قەرز: {formatCurrency(data.currency === 'IQD' ? selectedEntity.balance_iqd : selectedEntity.balance_usd, data.currency)}
                      {' '}- زیادە: {formatCurrency(data.currency === 'IQD' ? selectedEntity.negative_balance_iqd : selectedEntity.negative_balance_usd, data.currency)}
                    </p>
                  </div>
                )}

                {/* ئاگاداری */}
                {currentDebt === 0 ? (
                  <div className="p-4 mt-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <h4 className="font-medium text-green-900">کەسایەتی بێ قەرزە</h4>
                        <p className="text-sm text-green-700">
                          {selectedEntity.name} هیچ قەرزی خالصی نییە.
                          {data.type === 'customer' && selectedEntity.negative_balance_iqd > 0 && ' (زیادەی پارەی هەیە)'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 mt-4 border border-blue-200 rounded-lg bg-blue-50">
                    <p className="text-sm text-blue-700">
                      زۆرترین بڕی پارەی دراو: <span className="font-bold">{formatCurrency(maxAmount, data.currency)}</span>
                    </p>
                    {advanceApplied && (
                      <p className="mt-2 text-sm text-green-700">
                        ✅ پارەدانەکەت لە یەکەم قەرزەکان کەم دەکرێتەوە و ئەگەر زیاتر بێت، زیادە دەکرێت.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* دراو و شێوازی پارەدان */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  دراو *
                </label>
                <select
                  value={data.currency}
                  onChange={(e) => setData({ ...data, currency: e.target.value })}
                  className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="IQD">دینار (IQD)</option>
                  <option value="USD">دۆلار (USD)</option>
                </select>
                {errors.currency && <p className="mt-1 text-sm text-red-600">{errors.currency}</p>}
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  شێوازی پارەدان *
                </label>
                <select
                  value={data.payment_method}
                  onChange={(e) => setData({ ...data, payment_method: e.target.value })}
                  className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="cash">کاش</option>
                  <option value="pos">پۆس</option>
                  <option value="transfer">گواستنەوە</option>
                  <option value="cheque">چێک</option>
                  <option value="other">ئەوانی تر</option>
                </select>
                {errors.payment_method && <p className="mt-1 text-sm text-red-600">{errors.payment_method}</p>}
              </div>
            </div>

            {/* بڕی پارە */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                بڕی پارە ({data.currency}) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={data.amount}
                  onChange={(e) => setData({ ...data, amount: e.target.value })}
                  className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  required
                  disabled={maxAmount === 0 && data.type !== 'customer'}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500">{data.currency === 'IQD' ? 'دینار' : 'دۆلار'}</span>
                </div>
              </div>
              {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}

              {selectedEntity && maxAmount > 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  زۆرترین بڕ: {formatCurrency(maxAmount, data.currency)}
                </p>
              )}

              {/* بڕەکانی خێرا */}
              {selectedEntity && maxAmount > 0 && (
                <div className="mt-3">
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    بڕەکانی خێرا:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {data.currency === 'IQD' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => addQuickAmount(10000)}
                          className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                        >
                          10,000
                        </button>
                        <button
                          type="button"
                          onClick={() => addQuickAmount(50000)}
                          className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                        >
                          50,000
                        </button>
                        <button
                          type="button"
                          onClick={() => addQuickAmount(100000)}
                          className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                        >
                          100,000
                        </button>
                        <button
                          type="button"
                          onClick={() => addQuickAmount(maxAmount)}
                          className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                        >
                          تەواو ({formatNumber(maxAmount)})
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => addQuickAmount(10)}
                          className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                        >
                          $10
                        </button>
                        <button
                          type="button"
                          onClick={() => addQuickAmount(50)}
                          className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                        >
                          $50
                        </button>
                        <button
                          type="button"
                          onClick={() => addQuickAmount(100)}
                          className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                        >
                          $100
                        </button>
                        <button
                          type="button"
                          onClick={() => addQuickAmount(maxAmount)}
                          className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                        >
                          تەواو (${formatNumber(maxAmount)})
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ئاگاداری بۆ زیادەی پارە */}
            {data.amount && parseFloat(data.amount) > maxAmount && data.type === 'customer' && (
              <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <div>
                    <h4 className="font-medium text-orange-900">پارە زیاترە لە قەرز!</h4>
                    <p className="mt-1 text-sm text-orange-700">
                      بڕی پارە ({formatCurrency(data.amount, data.currency)}) زیاترە لە قەرز ({formatCurrency(maxAmount, data.currency)}).
                      <br />
                      <span className="font-bold">
                        {formatCurrency(parseFloat(data.amount) - maxAmount, data.currency)} زیادە دەکرێت بۆ هەژماری کڕیار.
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}


            {/* زانیاری بانک */}
            {requiresBankInfo && (
              <Card className="border-purple-200 bg-purple-50">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-900">زانیاری بانک</h4>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      ناوی بانک
                    </label>
                    <input
                      type="text"
                      value={data.bank_name}
                      onChange={(e) => setData({ ...data, bank_name: e.target.value })}
                      className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="بانکی کوردستان"
                    />
                    {errors.bank_name && <p className="mt-1 text-sm text-red-600">{errors.bank_name}</p>}
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      ژمارەی هەژمار
                    </label>
                    <input
                      type="text"
                      value={data.account_number}
                      onChange={(e) => setData({ ...data, account_number: e.target.value })}
                      className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="1234567890"
                    />
                    {errors.account_number && <p className="mt-1 text-sm text-red-600">{errors.account_number}</p>}
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      ژمارەی مامەڵە
                    </label>
                    <input
                      type="text"
                      value={data.transaction_id}
                      onChange={(e) => setData({ ...data, transaction_id: e.target.value })}
                      className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="TXN123456"
                    />
                    {errors.transaction_id && <p className="mt-1 text-sm text-red-600">{errors.transaction_id}</p>}
                  </div>
                </div>
              </Card>
            )}

            {/* فایلە پەیوەندیدارەکان */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                فایلە پەیوەندیدارەکان
              </label>

              {attachmentFile ? (
                <div className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-green-50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">{attachmentFile.name}</p>
                      <p className="text-sm text-green-600">
                        {(attachmentFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeAttachment}
                    className="p-1 text-red-600 transition-colors rounded-full hover:bg-red-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400">
                  <div className="text-center">
                    <Upload className="w-12 h-12 mx-auto text-gray-400" />
                    <div className="flex mt-4 text-sm text-gray-600">
                      <label className="relative font-medium text-blue-600 bg-white rounded-md cursor-pointer hover:text-blue-500">
                        <span>فایلێک هەڵبژێرە</span>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          accept=".jpg,.jpeg,.png,.pdf"
                        />
                      </label>
                      <p className="pr-1">یان بیسڕەوە</p>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">JPEG، PNG، PDF تا 5MB</p>
                  </div>
                </div>
              )}
              {errors.attachment && <p className="mt-1 text-sm text-red-600">{errors.attachment}</p>}
            </div>

            {/* دۆخ */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                دۆخی دانەوە *
              </label>
              <select
                value={data.status}
                onChange={(e) => setData({ ...data, status: e.target.value })}
                className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="completed">تەواوبوو</option>
                <option value="pending">چاوەڕوانی</option>
                <option value="cancelled">هەڵوەشاوە</option>
                <option value="refunded">گەڕاوەتەوە</option>
              </select>
              {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
            </div>

            {/* تێبینی */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                تێبینی
              </label>
              <textarea
                value={data.notes}
                onChange={(e) => setData({ ...data, notes: e.target.value })}
                rows={4}
                className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="تێبینیەکان لەسەر ئەم دانەوەیە بنووسە..."
              />
              {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes}</p>}
            </div>

            {/* دووگمەکانی کۆتایی */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={processing ||
                  (!data.customer_id && !data.supplier_id) ||
                  !data.amount ||
                  parseFloat(data.amount) <= 0
                }
                className="flex items-center gap-2 px-6 py-3 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                    تکایە چاوەڕێ بە...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    تۆمارکردنی دانەوە
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.get('/payments')}
                className="flex items-center gap-2 px-6 py-3 font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={processing}
              >
                <ArrowRight className="w-4 h-4" />
                گەڕانەوە بۆ لیست
              </button>
            </div>
          </form>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
