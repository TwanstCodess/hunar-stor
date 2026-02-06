import { useState } from 'react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import {
  ArrowRight,
  Trash2,
  ShoppingCart,
  User,
  Calendar,
  DollarSign,
  FileText,
  Package,
  Building,
  CreditCard,
  Printer,
  PlusCircle,
  Edit
} from 'lucide-react';

export default function Show({ purchase }) {
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_method: 'cash',
    notes: ''
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-IQ').format(amount) + ' ' + purchase.currency;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = () => {
    if (confirm('دڵنیایت لە سڕینەوەی ئەم کڕینە؟ ئەمە بڕەکان لە ستۆک کەم دەکاتەوە!')) {
      router.delete(`/purchases/${purchase.id}`);
    }
  };

  const handlePrint = () => {
    router.get(`/purchases/${purchase.id}/print`);
  };

  const handleAddPayment = () => {
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      alert('بڕی پارە بنووسە');
      return;
    }

    if (parseFloat(paymentData.amount) > purchase.remaining_amount) {
      alert('بڕی پارە نابێت زیاتر بێت لە ماوە');
      return;
    }

    router.post(`/purchases/${purchase.id}/payments`, paymentData, {
      preserveScroll: true,
      onSuccess: () => {
        setPaymentData({
          amount: '',
          payment_method: 'cash',
          notes: ''
        });
      }
    });
  };

  const paymentMethods = {
    cash: 'کاش',
    pos: 'پۆس',
    transfer: 'گواستنەوە'
  };

  return (
    <AuthenticatedLayout>
      <PageHeader
        title={`کڕین ${purchase.invoice_number}`}
        subtitle="وردەکاری کڕین"
        actions={[
          {
            href: `/purchases/${purchase.id}/edit`,
            label: 'دەستکاری',
            icon: Edit,
            color: 'primary'
          },
          {
            onClick: handlePrint,
            label: 'چاپکردن',
            icon: Printer,
            color: 'secondary'
          }
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ناوەڕۆک */}
        <div className="space-y-6 lg:col-span-2">
          {/* زانیاری کڕین */}
          <Card>
            <div className="flex items-center gap-3 pb-4 mb-4 border-b">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  وەسڵ #{purchase.invoice_number}
                </h3>
                <p className="text-sm text-gray-600">
                  {formatDate(purchase.purchase_date)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {purchase.supplier && (
                <div className="flex items-start gap-3">
                  <Building className="w-5 h-5 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">دابینکەر</p>
                    <p className="font-medium text-gray-900">{purchase.supplier.name}</p>
                    {purchase.supplier.phone && (
                      <p className="text-sm text-gray-600">{purchase.supplier.phone}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 mt-0.5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">تۆمارکراو لەلایەن</p>
                  <p className="font-medium text-gray-900">{purchase.user.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 mt-0.5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">جۆری کڕین</p>
                  <span className={`px-2 py-1 text-sm font-medium rounded-full ${
                    purchase.purchase_type === 'cash'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {purchase.purchase_type === 'cash' ? 'کاش' : 'قەرز'}
                  </span>
                </div>
              </div>

              {purchase.payment_method && (
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">شێوازی پارەدان</p>
                    <p className="font-medium text-gray-900">
                      {paymentMethods[purchase.payment_method]}
                    </p>
                  </div>
                </div>
              )}

              {purchase.notes && (
                <div className="flex items-start gap-3 md:col-span-2">
                  <FileText className="w-5 h-5 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">تێبینی</p>
                    <p className="font-medium text-gray-900">{purchase.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* بەرهەمەکان */}
          <Card title="بەرهەمەکان">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                      بەرهەم
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                      بڕ
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                      نرخی کڕین
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                      نرخی فرۆشتن
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                      قازانج
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                      کۆ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchase.items.map((item, index) => {
                    const itemProfit = (item.selling_price - item.unit_price) * item.quantity;
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {item.product.name}
                            </span>
                          </div>
                          {item.product.code && (
                            <div className="mt-1 text-xs text-gray-500">
                              کۆد: {item.product.code}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900">
                            {item.quantity} {item.product.unit_label || 'دانە'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-green-600">
                            {formatCurrency(item.selling_price)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-medium ${itemProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(itemProfit)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900">
                            {formatCurrency(item.total_price)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* لایەن */}
        <div className="space-y-6">
          {/* پوختەی دارایی */}
          <Card>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">پوختەی دارایی</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <span className="text-gray-600">کۆی گشتی</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatCurrency(purchase.total_amount)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <span className="text-green-700">پارەدراو</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(purchase.paid_amount)}
                </span>
              </div>

              {purchase.remaining_amount > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50">
                  <span className="text-orange-700">ماوە</span>
                  <span className="text-lg font-bold text-orange-600">
                    {formatCurrency(purchase.remaining_amount)}
                  </span>
                </div>
              )}

              {purchase.remaining_amount === 0 && purchase.paid_amount > 0 && (
                <div className="p-3 text-center bg-green-100 rounded-lg">
                  <span className="text-sm font-medium text-green-800">
                    ✓ تەواو پارەدراوە
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* شیکاری قازانج */}
          <Card>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">شیکاری قازانج</h3>

            <div className="space-y-3">
              <div className="p-4 border-t-2 border-blue-200 rounded-lg bg-blue-50">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-900">کۆی قازانج چاوەڕوانکراو</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency(purchase.expected_profit)}
                  </span>
                </div>
                <div className="mt-2 text-sm text-blue-700">
                  ڕێژە: {purchase.expected_profit_percentage.toFixed(2)}%
                </div>
              </div>
            </div>
          </Card>

          {/* پارەدان */}
          {!purchase.is_paid && purchase.purchase_type === 'credit' && (
            <Card>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">زیادکردنی پارەدان</h3>

              <div className="space-y-3">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    بڕی پارە
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                    placeholder={`کەمترین: 0.01 | زۆرترین: ${purchase.remaining_amount}`}
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    شێوازی پارەدان
                  </label>
                  <select
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                    className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="cash">کاش</option>
                    <option value="pos">پۆس</option>
                    <option value="transfer">گواستنەوە</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    تێبینی
                  </label>
                  <textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                    rows="2"
                    className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                    placeholder="تێبینی..."
                  />
                </div>

                <button
                  onClick={handleAddPayment}
                  disabled={!paymentData.amount || parseFloat(paymentData.amount) <= 0}
                  className="flex items-center justify-center w-full gap-2 py-2.5 btn btn-primary"
                >
                  <PlusCircle className="w-4 h-4" />
                  زیادکردنی پارەدان
                </button>
              </div>
            </Card>
          )}

          {/* کردارەکان */}
          <Card>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">کردارەکان</h3>
            <div className="space-y-2">
              <button
                onClick={() => router.get(`/purchases/${purchase.id}/print`)}
                className="flex items-center justify-center w-full gap-2 btn btn-secondary"
              >
                <Printer className="w-4 h-4" />
                چاپکردنی وەسڵ
              </button>

              <button
                onClick={() => router.get('/purchases')}
                className="flex items-center justify-center w-full gap-2 btn btn-secondary"
              >
                <ArrowRight className="w-4 h-4" />
                گەڕانەوە بۆ لیست
              </button>

              <button
                onClick={handleDelete}
                className="flex items-center justify-center w-full gap-2 btn btn-danger"
              >
                <Trash2 className="w-4 h-4" />
                سڕینەوەی کڕین
              </button>
            </div>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
