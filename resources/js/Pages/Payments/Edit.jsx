import { useState, useEffect } from 'react';
import { router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import { ArrowRight, Save, Users, Truck, CreditCard, Building2, AlertCircle, DollarSign, Calendar, FileText, Upload, X, CheckCircle, Clock, Ban, Eye, History } from 'lucide-react';

export default function Edit({ payment, customers, suppliers, sales = [], purchases = [] }) {
  const { data, setData, put, processing, errors, reset } = useForm({
    type: payment.type,
    customer_id: payment.customer_id || '',
    supplier_id: payment.supplier_id || '',
    sale_id: payment.sale_id || '',
    purchase_id: payment.purchase_id || '',
    currency: payment.currency,
    payment_method: payment.payment_method,
    amount: payment.amount,
    notes: payment.notes || '',
    payment_date: new Date(payment.payment_date).toISOString().split('T')[0],
    reference_number: payment.reference_number || '',
    invoice_number: payment.invoice_number || '',
    bank_name: payment.bank_name || '',
    account_number: payment.account_number || '',
    transaction_id: payment.transaction_id || '',
    status: payment.status,
    attachment: null,
  });

  const [attachmentFile, setAttachmentFile] = useState(null);
  const [existingAttachment, setExistingAttachment] = useState(payment.attachment);
  const [filteredSales, setFilteredSales] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);

  const selectedEntity = data.type === 'customer'
    ? customers.find(c => c.id == data.customer_id)
    : suppliers.find(s => s.id == data.supplier_id);

  // پشکنین بۆ دۆخی پێشووی دانەوە
  const isStatusChanged = data.status !== payment.status;
  const originalEntityChanged = payment.customer_id != data.customer_id || payment.supplier_id != data.supplier_id;

  // فلتەرکردنی فرۆشتنەکان بۆ کڕیاری هەڵبژێردراو - تەنها ئەوانەی قەرزیان ماوەتەوە
  useEffect(() => {
    if (data.type === 'customer' && data.customer_id) {
      const filtered = sales.filter(sale =>
        sale.customer_id == data.customer_id &&
        (sale.remaining_amount > 0 || sale.id == payment.sale_id) // هەروەها فرۆشتنی پێشوویش پیشان بدە
      );
      setFilteredSales(filtered);
    } else {
      setFilteredSales([]);
    }
  }, [data.customer_id, data.type, sales, payment.sale_id]);

  // فلتەرکردنی کڕینەکان بۆ دابینکەری هەڵبژێردراو - تەنها ئەوانەی قەرزیان ماوەتەوە
  useEffect(() => {
    if (data.type === 'supplier' && data.supplier_id) {
      const filtered = purchases.filter(purchase =>
        purchase.supplier_id == data.supplier_id &&
        (purchase.remaining_amount > 0 || purchase.id == payment.purchase_id) // هەروەها کڕینی پێشوویش پیشان بدە
      );
      setFilteredPurchases(filtered);
    } else {
      setFilteredPurchases([]);
    }
  }, [data.supplier_id, data.type, purchases, payment.purchase_id]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!confirm('دڵنیایت لە نوێکردنەوەی ئەم دانەوەیە؟')) {
      return;
    }

    // دروستکردنی فۆرم داتا بۆ ناردنی فایل
    const formData = new FormData();

    // زیادکردنی هەموو فیلدەکان بۆ فۆرم داتا
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== '' && key !== 'attachment') {
        formData.append(key, data[key]);
      }
    });

    // زیادکردنی فایلەکە ئەگەر هەبێت
    if (attachmentFile) {
      formData.append('attachment', attachmentFile);
    }

    // زیادکردنی _method بۆ PUT
    formData.append('_method', 'PUT');

    console.log('Updating payment:', Object.fromEntries(formData));

    put(`/payments/${payment.id}`, {
      data: formData,
      preserveScroll: true,
      onSuccess: () => {
        console.log('Payment updated successfully');
      },
      onError: (errors) => {
        console.error('Payment update errors:', errors);
      },
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // پشکنینی جۆری فایل
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('تەنها فایلەکانی JPEG، PNG، PDF قبوڵ کراوە');
        return;
      }

      // پشکنینی قەبارەی فایل (5MB)
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
    setExistingAttachment(null);
    setData('attachment', null);
  };

  const requiresBankInfo = ['transfer', 'cheque'].includes(data.payment_method);

  const formatCurrency = (amount, curr) => {
    return new Intl.NumberFormat('ar-IQ').format(amount) + ' ' + curr;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AuthenticatedLayout>
      <PageHeader
        title="دەستکاریکردنی دانەوە"
        subtitle={`دەستکاری دانەوەی ژمارە ${payment.id}`}
      />

      <div className="max-w-4xl mx-auto">
        <Card>
          {/* زانیاری بنەڕەتی */}
          <div className="p-4 mb-6 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">زانیاری دانەوە</h3>
              <div className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                {payment.status === 'completed' ? 'تەواوبوو' :
                 payment.status === 'pending' ? 'چاوەڕوانی' :
                 payment.status === 'cancelled' ? 'هەڵوەشاوە' : 'گەڕاوەتەوە'}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">کەسایەتی:</div>
                <div className="font-medium">
                  {payment.type === 'customer'
                    ? payment.customer?.name
                    : payment.supplier?.name}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">بڕ:</div>
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(payment.amount, payment.currency)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">بەروار:</div>
                <div className="font-medium">{formatDate(payment.payment_date)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">وەرگر:</div>
                <div className="font-medium">{payment.user?.name}</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* پیشاندانی هەڵەکان */}
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

            {/* ئاگاداری گۆڕانکارییە گرنگەکان */}
            {(isStatusChanged || originalEntityChanged) && (
              <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-orange-900">ئاگاداری:</h4>
                    <ul className="mt-2 space-y-1 text-sm text-orange-700">
                      {isStatusChanged && (
                        <li>
                          • دۆخی دانەوە لە
                          <span className={`px-2 mx-1 text-xs rounded-full ${getStatusColor(payment.status)}`}>
                            {payment.status === 'completed' ? 'تەواوبوو' :
                             payment.status === 'pending' ? 'چاوەڕوانی' :
                             payment.status === 'cancelled' ? 'هەڵوەشاوە' : 'گەڕاوەتەوە'}
                          </span>
                          بۆ
                          <span className={`px-2 mx-1 text-xs rounded-full ${getStatusColor(data.status)}`}>
                            {data.status === 'completed' ? 'تەواوبوو' :
                             data.status === 'pending' ? 'چاوەڕوانی' :
                             data.status === 'cancelled' ? 'هەڵوەشاوە' : 'گەڕاوەتەوە'}
                          </span>
                          گۆڕاوە
                        </li>
                      )}
                      {originalEntityChanged && (
                        <li>• کەسایەتی گۆڕاوە، ئەمە کاریگەری لەسەر قەرزی کڕیار/دابینکەر دەبێت</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* جۆری دانەوە */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  جۆری دانەوە *
                </label>
                <select
                  value={data.type}
                  onChange={(e) => setData({
                    type: e.target.value,
                    customer_id: '',
                    supplier_id: '',
                    sale_id: '',
                    purchase_id: ''
                  })}
                  className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={processing}
                >
                  <option value="customer">کڕیار</option>
                  <option value="supplier">دابینکەر</option>
                </select>
                {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
              </div>

              {/* بەرواری پارەدان */}
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
                    disabled={processing}
                  />
                </div>
                {errors.payment_date && <p className="mt-1 text-sm text-red-600">{errors.payment_date}</p>}
              </div>
            </div>

            {/* هەڵبژاردنی کڕیار یان دابینکەر */}
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

                      // فلتەرکردنی فرۆشتنەکان
                      if (customerId) {
                        const filtered = sales.filter(sale =>
                          sale.customer_id == customerId &&
                          (sale.remaining_amount > 0 || sale.id == payment.sale_id)
                        );
                        setFilteredSales(filtered);
                      } else {
                        setFilteredSales([]);
                      }
                    }}
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={processing}
                  >
                    <option value="">کڕیارێک هەڵبژێرە</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} - قەرز: {new Intl.NumberFormat('ar-IQ').format(c.balance_iqd)} IQD / {new Intl.NumberFormat('ar-IQ').format(c.balance_usd)} USD
                      </option>
                    ))}
                  </select>
                  {errors.customer_id && <p className="mt-1 text-sm text-red-600">{errors.customer_id}</p>}
                </div>

                {/* فرۆشتنەکانی کڕیار (ئەگەر قەرزی هەبێت) */}
                {filteredSales.length > 0 ? (
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      فرۆشتنەکان (قەرزەکانی ئەم کڕیارە)
                    </label>
                    <select
                      value={data.sale_id}
                      onChange={(e) => setData('sale_id', e.target.value)}
                      className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={processing}
                    >
                      <option value="">هیچ فرۆشتنێک (دانوە بۆ هەموو قەرزەکان)</option>
                      {filteredSales.map(sale => (
                        <option key={sale.id} value={sale.id}>
                          فرۆشتنی #{sale.invoice_number} - قەرز: {new Intl.NumberFormat('ar-IQ').format(sale.remaining_amount)} {sale.currency}
                        </option>
                      ))}
                    </select>
                    {errors.sale_id && <p className="mt-1 text-sm text-red-600">{errors.sale_id}</p>}
                  </div>
                ) : data.customer_id && (
                  <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">کڕیاری هەڵبژێردراو قەرزی نییە</span>
                    </div>
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

                      // فلتەرکردنی کڕینەکان
                      if (supplierId) {
                        const filtered = purchases.filter(purchase =>
                          purchase.supplier_id == supplierId &&
                          (purchase.remaining_amount > 0 || purchase.id == payment.purchase_id)
                        );
                        setFilteredPurchases(filtered);
                      } else {
                        setFilteredPurchases([]);
                      }
                    }}
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={processing}
                  >
                    <option value="">دابینکەرێک هەڵبژێرە</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} - قەرز: {new Intl.NumberFormat('ar-IQ').format(s.balance_iqd)} IQD / {new Intl.NumberFormat('ar-IQ').format(s.balance_usd)} USD
                      </option>
                    ))}
                  </select>
                  {errors.supplier_id && <p className="mt-1 text-sm text-red-600">{errors.supplier_id}</p>}
                </div>

                {/* کڕینەکانی دابینکەر (ئەگەر قەرزی هەبێت) */}
                {filteredPurchases.length > 0 ? (
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      کڕینەکان (قەرزەکانی ئەم دابینکەرە)
                    </label>
                    <select
                      value={data.purchase_id}
                      onChange={(e) => setData('purchase_id', e.target.value)}
                      className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={processing}
                    >
                      <option value="">هیچ کڕینێک (دانوە بۆ هەموو قەرزەکان)</option>
                      {filteredPurchases.map(purchase => (
                        <option key={purchase.id} value={purchase.id}>
                          کڕینی #{purchase.invoice_number} - قەرز: {new Intl.NumberFormat('ar-IQ').format(purchase.remaining_amount)} {purchase.currency}
                        </option>
                      ))}
                    </select>
                    {errors.purchase_id && <p className="mt-1 text-sm text-red-600">{errors.purchase_id}</p>}
                  </div>
                ) : data.supplier_id && (
                  <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">دابینکەری هەڵبژێردراو قەرزی نییە</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ماوەی پەیجی Edit... */}
            {/* بەشی ناوەڕاستی پەیجەکە وەک خۆی دەمێنێتەوە */}
            {/* دوگمەکان... */}
          </form>
        </Card>

        {/* کارتی مێژووی گۆڕانکاری */}
        <Card className="mt-6 border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <History className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-900">مێژووی دروستکردن</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">دروستکراو لە:</span>
              <span className="text-sm font-medium">{formatDate(payment.created_at)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">دوایین نوێکاری:</span>
              <span className="text-sm font-medium">{formatDate(payment.updated_at)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">دروستکەر:</span>
              <span className="text-sm font-medium">{payment.user?.name}</span>
            </div>
          </div>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
