// resources/js/Pages/Suppliers/Show.jsx
import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import {
  ArrowRight, Edit, Building, Phone, Mail, MapPin, FileText,
  ShoppingCart, DollarSign, Calendar, Package, AlertCircle,
  TrendingUp, CreditCard
} from 'lucide-react';

export default function Show({ supplier, stats }) {
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

  const calculateTotalDebt = () => {
    const totalIQD = supplier.balance_iqd || 0;
    const totalUSD = (supplier.balance_usd || 0) * 1450;
    return totalIQD + totalUSD;
  };

  return (
    <AuthenticatedLayout>
      <PageHeader
        title={supplier.name}
        subtitle="زانیاری تەواوی دابینکەر"
        action={{
          href: `/suppliers/${supplier.id}/edit`,
          label: 'دەستکاریکردن',
        }}
      />

      {/* کارتەکانی سەرەوە */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-blue-200 bg-blue-50">
          <div className="flex items-center gap-4 p-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="mb-1 text-sm text-blue-700">دابینکەر</div>
              <div className="text-lg font-bold text-blue-900">{supplier.name}</div>
              {supplier.company_name && (
                <div className="text-sm text-blue-600">{supplier.company_name}</div>
              )}
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
              <div className={`text-xl font-bold ${supplier.balance_iqd > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(supplier.balance_iqd || 0, 'IQD')}
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
              <div className={`text-xl font-bold ${supplier.balance_usd > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(supplier.balance_usd || 0, 'USD')}
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
              <div className="mb-1 text-sm text-purple-700">کۆی قەرز</div>
              <div className={`text-xl font-bold ${calculateTotalDebt() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(calculateTotalDebt(), 'IQD')}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* زانیارییەکانی دابینکەر */}
      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
        <Card title="زانیارییەکان" className="border border-gray-200">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                <Building className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="mb-1 text-sm text-gray-600">ناوی دابینکەر</div>
                <div className="font-medium text-gray-900">{supplier.name}</div>
              </div>
            </div>

            {supplier.company_name && (
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                  <Package className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 text-sm text-gray-600">ناوی کۆمپانیا</div>
                  <div className="text-gray-900">{supplier.company_name}</div>
                </div>
              </div>
            )}

            {supplier.email && (
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 text-sm text-gray-600">ئیمەیل</div>
                  <div className="text-gray-900">{supplier.email}</div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="mb-1 text-sm text-gray-600">کاتی زیادکردن</div>
                <div className="text-gray-900">{formatDate(supplier.created_at)}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* ناونیشان */}
        <Card title="ناونیشان" className="border border-gray-200">
          {supplier.address ? (
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="mb-1 text-sm text-gray-600">ناونیشانی تەواو</div>
                <div className="text-gray-900 whitespace-pre-line">{supplier.address}</div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              ناونیشان داخڵ نەکراوە
            </div>
          )}
        </Card>

        {/* تێبینی */}
        <Card title="تێبینی" className="border border-gray-200">
          {supplier.notes ? (
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="mb-1 text-sm text-gray-600">تێبینییەکان</div>
                <div className="text-gray-900 whitespace-pre-line">{supplier.notes}</div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              تێبینی داخڵ نەکراوە
            </div>
          )}
        </Card>
      </div>

      {/* ئاماری گشتی */}
      <Card title="ئاماری گشتی" className="mb-8 border border-gray-200">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 border border-blue-100 rounded-lg bg-blue-50">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              <div className="text-sm text-gray-600">کۆی کڕین</div>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats?.total_purchases || 0}</div>
          </div>
          <div className="p-4 border border-green-100 rounded-lg bg-green-50">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-green-600" />
              <div className="text-sm text-gray-600">کۆی پارەدان</div>
            </div>
            <div className="text-2xl font-bold text-green-600">{stats?.total_payments || 0}</div>
          </div>
          <div className="p-4 border border-purple-100 rounded-lg bg-purple-50">
            <div className="mb-1 text-sm text-gray-600">کڕینەکان بە دینار</div>
            <div className="text-xl font-bold text-purple-600">
              {formatCurrency(stats?.total_purchases_amount?.iqd || 0, 'IQD')}
            </div>
          </div>
          <div className="p-4 border border-orange-100 rounded-lg bg-orange-50">
            <div className="mb-1 text-sm text-gray-600">کڕینەکان بە دۆلار</div>
            <div className="text-xl font-bold text-orange-600">
              {formatCurrency(stats?.total_purchases_amount?.usd || 0, 'USD')}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
        {/* Recent Purchases */}
        <Card title="دوایین کڕینەکان" className="border border-gray-200">
          <div className="space-y-3">
            {supplier.purchases?.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>هیچ کڕینێک نییە</p>
              </div>
            ) : (
              supplier.purchases?.map((purchase) => (
                <Link
                  key={purchase.id}
                  href={`/purchases/${purchase.id}`}
                  className="flex items-center justify-between p-4 transition-colors border border-gray-100 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">

                    <div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {formatDate(purchase.purchase_date)}
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(purchase.total_amount, purchase.currency)}
                    </div>
                    {purchase.remaining_amount > 0 && (
                      <div className="mt-1 text-xs text-red-600">
                        ماوە: {formatCurrency(purchase.remaining_amount, purchase.currency)}
                      </div>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
          {supplier.purchases?.length > 0 && (
            <div className="pt-4 mt-6 border-t border-gray-200">
              <Link
                href={`/purchases?supplier=${supplier.id}`}
                className="flex items-center justify-center gap-2 font-medium text-blue-600 hover:text-blue-700"
              >
                بینینی هەموو کڕینەکان
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </Card>

        {/* Recent Payments */}
        <Card title="دوایین پارەدانەکان" className="border border-gray-200">
          <div className="space-y-3">
            {supplier.payments?.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>هیچ پارەدانێک نییە</p>
              </div>
            ) : (
              supplier.payments?.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border border-green-100 rounded-lg bg-green-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <CreditCard className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {payment.payment_method === 'cash' ? 'پارە' :
                           payment.payment_method === 'pos' ? 'پۆس' :
                           payment.payment_method === 'transfer' ? 'گوێزینەوە' :
                           payment.payment_method}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                          پارەدان
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {formatDate(payment.payment_date)}
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-semibold text-green-600">
                      {formatCurrency(payment.amount, payment.currency)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {payment.notes || '---'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {supplier.payments?.length > 0 && (
            <div className="pt-4 mt-6 border-t border-green-100">
              <Link
                href={`/payments?type=supplier&supplier=${supplier.id}`}
                className="flex items-center justify-center gap-2 font-medium text-green-600 hover:text-green-700"
              >
                بینینی هەموو پارەدانەکان
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* دەستەکانی خوارەوە */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="flex gap-3">
          <Link
            href={`/suppliers/${supplier.id}/debt-statement`}
            className="flex items-center gap-2 px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            <FileText className="w-4 h-4" />
            بینینی بارنامەی قەرز
          </Link>
          <Link
            href={`/purchases/create?supplier=${supplier.id}`}
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <ShoppingCart className="w-4 h-4" />
            کڕینی نوێ
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            چاپکردن
          </button>
        </div>
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 btn btn-secondary"
        >
          <ArrowRight className="w-4 h-4" />
          گەڕانەوە
        </button>
      </div>
    </AuthenticatedLayout>
  );
}
