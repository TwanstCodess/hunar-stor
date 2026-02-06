// resources/js/Pages/Suppliers/DebtStatement.jsx
import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import {
  ArrowRight,
  Printer,
  Download,
  DollarSign,
  FileText,
  Calendar,
  CreditCard,
  ShoppingCart,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Building
} from 'lucide-react';
import { useState } from 'react';

export default function DebtStatement({ supplier, purchases, payments, totalDebt }) {
  const [expandedPurchases, setExpandedPurchases] = useState({});
  const [expandedPayments, setExpandedPayments] = useState({});
  const [currencyFilter, setCurrencyFilter] = useState('all'); // 'all', 'iqd', 'usd'

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('ar-IQ').format(amount) + ' ' + currency;
  };

  const formatDate = (date) => {
    if (!date) return '---';
    return new Date(date).toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const togglePurchaseExpand = (id) => {
    setExpandedPurchases(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const togglePaymentExpand = (id) => {
    setExpandedPayments(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // فیلتەرکردنی کڕینەکان بەپێی دراو
  const filteredPurchases = purchases.filter(purchase => {
    if (currencyFilter === 'all') return true;
    return purchase.currency.toLowerCase() === currencyFilter;
  });

  // فیلتەرکردنی پارەدانەکان بەپێی دراو
  const filteredPayments = payments.filter(payment => {
    if (currencyFilter === 'all') return true;
    return payment.currency.toLowerCase() === currencyFilter;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // لێرە دەتوانیت PDF یان Excel دروست بکەیت
    alert('بەرنامەی دروستکردنی فایل لە کارە');
  };

  const calculatePurchaseProgress = (purchase) => {
    if (purchase.total_amount === 0) return 0;
    const paidPercentage = (purchase.paid_amount / purchase.total_amount) * 100;
    return Math.min(100, paidPercentage);
  };

  return (
    <AuthenticatedLayout>
      <PageHeader
        title={`بارنامەی قەرزی ${supplier.name}`}
        subtitle="وردەکارییەکانی قەرز و کڕینەکان"
        action={{
          href: `/suppliers/${supplier.id}`,
          label: 'گەڕانەوە بۆ دابینکەر',
        }}
      />

      {/* کارتەکانی سەرەوە */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
        <Card className="border border-blue-200 bg-blue-50">
          <div className="flex items-center gap-4 p-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="mb-1 text-sm text-blue-700">دابینکەر</div>
              <div className="text-lg font-bold text-blue-900">{supplier.name}</div>
            </div>
          </div>
        </Card>

        <Card className="border border-red-200 bg-red-50">
          <div className="flex items-center gap-4 p-4">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="mb-1 text-sm text-red-700">قەرز (دینار)</div>
              <div className={`text-xl font-bold ${totalDebt?.iqd > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(totalDebt?.iqd || 0, 'IQD')}
              </div>
            </div>
          </div>
        </Card>

        <Card className="border border-green-200 bg-green-50">
          <div className="flex items-center gap-4 p-4">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="mb-1 text-sm text-green-700">قەرز (دۆلار)</div>
              <div className={`text-xl font-bold ${totalDebt?.usd > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(totalDebt?.usd || 0, 'USD')}
              </div>
            </div>
          </div>
        </Card>

        <Card className="border border-purple-200 bg-purple-50">
          <div className="flex items-center gap-4 p-4">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="mb-1 text-sm text-purple-700">کۆی قەرز (دینار)</div>
              <div className="text-xl font-bold text-purple-600">
                {formatCurrency(totalDebt?.total_iqd || 0, 'IQD')}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* دەستەی فیلتەر و کردارەکان */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between print:hidden">
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-gray-700">فیلتەر بە دراو:</div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrencyFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-lg border ${
                currencyFilter === 'all'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              هەموو
            </button>
            <button
              onClick={() => setCurrencyFilter('iqd')}
              className={`px-3 py-1.5 text-sm rounded-lg border ${
                currencyFilter === 'iqd'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              دینار
            </button>
            <button
              onClick={() => setCurrencyFilter('usd')}
              className={`px-3 py-1.5 text-sm rounded-lg border ${
                currencyFilter === 'usd'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              دۆلار
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
        {/* کڕینەکانی قەرز */}
        <Card title="کڕینەکانی قەرز" className="border border-gray-200 print:break-inside-avoid">
          <div className="space-y-4">
            {filteredPurchases.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>هیچ کڕینێکی قەرز نییە</p>
              </div>
            ) : (
              filteredPurchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="overflow-hidden border border-gray-200 rounded-lg"
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 hover:bg-gray-100"
                    onClick={() => togglePurchaseExpand(purchase.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded ${
                        purchase.payment_status === 'unpaid' ? 'bg-red-100' :
                        purchase.payment_status === 'partial' ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                        <ShoppingCart className={`w-5 h-5 ${
                          purchase.payment_status === 'unpaid' ? 'text-red-600' :
                          purchase.payment_status === 'partial' ? 'text-yellow-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          کڕینی ژمارە: {purchase.invoice_number}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {formatDate(purchase.purchase_date)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-lg font-semibold ${
                          purchase.remaining_amount > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatCurrency(purchase.total_amount, purchase.currency)}
                        </div>
                        <div className="text-sm text-gray-600">
                          ماوە: {formatCurrency(purchase.remaining_amount, purchase.currency)}
                        </div>
                      </div>
                      {expandedPurchases[purchase.id] ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </div>

                  {expandedPurchases[purchase.id] && (
                    <div className="p-4 bg-white border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="mb-1 text-sm text-gray-600">کۆی بڕی کڕین</div>
                          <div className="font-medium text-gray-900">
                            {formatCurrency(purchase.total_amount, purchase.currency)}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-sm text-gray-600">بڕی پارە کراوە</div>
                          <div className="font-medium text-green-600">
                            {formatCurrency(purchase.paid_amount, purchase.currency)}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-sm text-gray-600">بڕی ماوە</div>
                          <div className="font-medium text-red-600">
                            {formatCurrency(purchase.remaining_amount, purchase.currency)}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-sm text-gray-600">دۆخی پارەدان</div>
                          <div className="font-medium">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              purchase.payment_status === 'unpaid'
                                ? 'bg-red-100 text-red-700'
                                : purchase.payment_status === 'partial'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {purchase.payment_status === 'unpaid' ? 'پارەنەدراو' :
                               purchase.payment_status === 'partial' ? 'بەشێک پارەدراوە' : 'پارەدراو'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* بار (progress bar) */}
                      <div className="mb-3">
                        <div className="flex justify-between mb-1 text-xs text-gray-600">
                          <span>ڕێژەی پارە کراوە</span>
                          <span>{Math.round(calculatePurchaseProgress(purchase))}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-green-600 rounded-full"
                            style={{ width: `${calculatePurchaseProgress(purchase)}%` }}
                          ></div>
                        </div>
                      </div>

                      {purchase.notes && (
                        <div className="pt-3 mt-3 border-t border-gray-200">
                          <div className="mb-1 text-sm text-gray-600">تێبینی</div>
                          <div className="text-gray-900">{purchase.notes}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* کۆی گشتی */}
          {filteredPurchases.length > 0 && (
            <div className="pt-4 mt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-1 text-sm text-gray-600">کۆی گشتی کڕین</div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(
                      filteredPurchases.reduce((sum, purchase) => sum + purchase.total_amount, 0),
                      currencyFilter === 'all' ? '---' : currencyFilter.toUpperCase()
                    )}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-gray-600">کۆی گشتی ماوە</div>
                  <div className="text-xl font-bold text-red-600">
                    {formatCurrency(
                      filteredPurchases.reduce((sum, purchase) => sum + purchase.remaining_amount, 0),
                      currencyFilter === 'all' ? '---' : currencyFilter.toUpperCase()
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* پارەدانەکان */}
        <Card title="پارەدانەکان" className="border border-gray-200 print:break-inside-avoid">
          <div className="space-y-4">
            {filteredPayments.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>هیچ پارەدانێک نییە</p>
              </div>
            ) : (
              filteredPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="overflow-hidden border border-gray-200 rounded-lg"
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer bg-green-50 hover:bg-green-100"
                    onClick={() => togglePaymentExpand(payment.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-green-100 rounded">
                        <CreditCard className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {payment.payment_method === 'cash' ? 'پارە' :
                           payment.payment_method === 'pos' ? 'پۆس' :
                           payment.payment_method === 'transfer' ? 'گوێزینەوە' :
                           payment.payment_method}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {formatDate(payment.payment_date)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(payment.amount, payment.currency)}
                      </div>
                      {expandedPayments[payment.id] ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </div>

                  {expandedPayments[payment.id] && (
                    <div className="p-4 bg-white border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="mb-1 text-sm text-gray-600">بڕی پارە</div>
                          <div className="font-medium text-green-600">
                            {formatCurrency(payment.amount, payment.currency)}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-sm text-gray-600">جۆری پارەدان</div>
                          <div className="font-medium">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              payment.payment_method === 'cash'
                                ? 'bg-green-100 text-green-700'
                                : payment.payment_method === 'pos'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {payment.payment_method === 'cash' ? 'پارە' :
                               payment.payment_method === 'pos' ? 'پۆس' :
                               payment.payment_method === 'transfer' ? 'گوێزینەوە' :
                               payment.payment_method}
                            </span>
                          </div>
                        </div>
                      </div>

                      {payment.notes && (
                        <div className="pt-3 mt-3 border-t border-gray-200">
                          <div className="mb-1 text-sm text-gray-600">تێبینی</div>
                          <div className="text-gray-900">{payment.notes}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* کۆی گشتی */}
          {filteredPayments.length > 0 && (
            <div className="pt-4 mt-6 border-t border-green-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-1 text-sm text-gray-600">کۆی گشتی پارەدان</div>
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(
                      filteredPayments.reduce((sum, payment) => sum + payment.amount, 0),
                      currencyFilter === 'all' ? '---' : currencyFilter.toUpperCase()
                    )}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-gray-600">تێکڕای پارەدان</div>
                  <div className="text-xl font-bold text-gray-900">
                    {filteredPayments.length} پارەدان
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* کۆی کۆتایی */}
      <Card className="mb-8 border border-gray-200 print:break-before-page">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="p-6 border border-blue-200 rounded-lg bg-blue-50">
            <div className="mb-2 text-sm text-blue-700">کۆی قەرزی ئێستا</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalDebt?.total_iqd || 0, 'IQD')}
            </div>
            <div className="mt-2 text-sm text-blue-600">
              ({formatCurrency(totalDebt?.iqd || 0, 'IQD')} +
              {formatCurrency(totalDebt?.usd || 0, 'USD')} × 1450)
            </div>
          </div>

          <div className="p-6 border border-red-200 rounded-lg bg-red-50">
            <div className="mb-2 text-sm text-red-700">کۆی گشتی کڕینەکان</div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(
                purchases.reduce((sum, purchase) => sum + purchase.total_amount, 0),
                '---'
              )}
            </div>
            <div className="mt-2 text-sm text-red-600">
              {purchases.length} کڕین
            </div>
          </div>

          <div className="p-6 border border-green-200 rounded-lg bg-green-50">
            <div className="mb-2 text-sm text-green-700">کۆی گشتی پارەدانەکان</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(
                payments.reduce((sum, payment) => sum + payment.amount, 0),
                '---'
              )}
            </div>
            <div className="mt-2 text-sm text-green-600">
              {payments.length} پارەدان
            </div>
          </div>
        </div>
      </Card>

      {/* دەستەکانی خوارەوە */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 print:hidden">
        <div className="flex gap-3">
          <Link
            href={`/suppliers/${supplier.id}`}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowRight className="w-4 h-4" />
            گەڕانەوە بۆ دابینکەر
          </Link>
          <Link
            href={`/suppliers/${supplier.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            دەستکاریکردنی دابینکەر
          </Link>
        </div>

        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('ar-IQ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
