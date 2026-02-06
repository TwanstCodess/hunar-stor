// resources/js/Pages/Customers/Show.jsx
import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import { ArrowRight, DollarSign, Phone, MapPin, Mail, Calendar, ShoppingCart, CreditCard, User, FileText, AlertCircle, Printer, Edit } from 'lucide-react';
export default function Show({ customer, stats }) {
  const formatCurrency = (amount, currency) => {
    if (!currency) return new Intl.NumberFormat('ar-IQ').format(amount);
    return new Intl.NumberFormat('ar-IQ').format(amount) + ' ' + currency;
  };

const formatDate = (date) => {
    if (!date) return '---';

    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
};

  // گۆڕینی دۆلار بۆ دینار و کۆکردنەوەی کۆی قەرز
  const calculateTotalDebt = () => {
    const iqdDebt = customer.balance_iqd || 0;
    const usdDebt = (customer.balance_usd || 0) * 1450;
    const x= iqdDebt*1;
    return  x+ usdDebt;
  };

  return (
    <AuthenticatedLayout>
      <PageHeader
        title={'کڕیار: '+customer.name}
      />


      {/* دەستەکانی خوارەوە */}
 <div className="flex flex-col gap-4 pt-6 mb-6 border-t border-gray-200 sm:flex-row sm:items-center sm:justify-between">
  <div className="flex flex-wrap items-center gap-3">
    <Link
      href={`/customers/${customer.id}/debt-statement`}
      className="flex items-center gap-2 px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700"
    >
      <FileText className="w-4 h-4" />
      بینینی بارنامەی قەرز
    </Link>

    <div className="flex items-center gap-2">
      <Link
        href={`/customers/${customer.id}/debt-statement/print`}
        className="flex items-center gap-2 p-2 text-red-600 transition-colors duration-200 border border-red-100 rounded-lg hover:bg-red-50 hover:border-red-200"
        title="چاپکردنی کەشف حساب"
      >
        <Printer className="w-4 h-4" />
        <span className="hidden sm:inline">چاپکردنی کشف حساب</span>
      </Link>

      <Link
        href={`/customers/${customer.id}/debt-statement/printInvoice`}
        className="flex items-center gap-2 p-2 text-red-600 transition-colors duration-200 border border-red-100 rounded-lg hover:bg-red-50 hover:border-red-200"
        title="چاپکردنی کۆی قەرزەکان"
      >
        <Printer className="w-4 h-4" />
        <span className="hidden sm:inline">چاپکردنی کۆی قەرزەکان</span>
      </Link>

      <Link
        href={`/customers/${customer.id}/edit`}
        className="flex items-center gap-2 p-2 text-blue-600 transition-colors duration-200 border border-blue-100 rounded-lg hover:bg-blue-50 hover:border-blue-200"
        title="دەستکاریکردن"
      >
        <Edit className="w-4 h-4" />
        <span className="hidden sm:inline">دەستکاری</span>
      </Link>
    </div>
  </div>

  <button
    onClick={() => window.history.back()}
    className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
  >
    <ArrowRight className="w-4 h-4" />
    گەڕانەوە
  </button>
</div>

      {/* کارتەکانی سەرەوە */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border border-gray-200">
          <div className="flex items-center gap-4 p-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="mb-1 text-sm text-gray-600">ژمارە مۆبایل</div>
              <div className="text-lg font-semibold text-gray-900">
                {customer.phone || '---'}
              </div>
            </div>
          </div>
        </Card>

        <Card className="border border-gray-200">
          <div className="flex items-center gap-4 p-4">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="mb-1 text-sm text-gray-600">قەرز (دینار)</div>
              <div className={`text-lg font-semibold ${customer.balance_iqd > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(customer.balance_iqd || 0, 'IQD')}
              </div>
            </div>
          </div>
        </Card>

        <Card className="border border-gray-200">
          <div className="flex items-center gap-4 p-4">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="mb-1 text-sm text-gray-600">قەرز (دۆلار)</div>
              <div className={`text-lg font-semibold ${customer.balance_usd > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(customer.balance_usd || 0, 'USD')}
              </div>
            </div>
          </div>
        </Card>

        <Card className="border border-gray-200">
          <div className="flex items-center gap-4 p-4">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="mb-1 text-sm text-gray-600">کۆی قەرز (دینار)</div>
              <div className={`text-lg font-semibold ${calculateTotalDebt() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(calculateTotalDebt(), 'IQD')}
              </div>
            </div>
          </div>
        </Card>

        <Card className="border border-gray-200">
          <div className="flex items-center gap-4 p-4">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="mb-1 text-sm text-gray-600">فرۆشتنەکانی قەرز</div>
              <div className="text-lg font-semibold text-orange-600">
                {stats?.pending_invoices || 0}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* زانیارییەکانی کڕیار */}
      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
        <Card title="زانیارییەکان" className="border border-gray-200">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="mb-1 text-sm text-gray-600">ناوی کڕیار</div>
                <div className="font-medium text-gray-900">{customer.name}</div>
              </div>
            </div>

            {customer.email && (
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 text-sm text-gray-600">ئیمەیل</div>
                  <div className="text-gray-900">{customer.email}</div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="mb-1 text-sm text-gray-600">کاتی زیادکردن</div>
                <div className="text-gray-900">{formatDate(customer.created_at)}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* ناونیشان */}
        <Card title="ناونیشان" className="border border-gray-200">
          {customer.address ? (
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="mb-1 text-sm text-gray-600">ناونیشانی تەواو</div>
                <div className="text-gray-900 whitespace-pre-line">{customer.address}</div>
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
          {customer.notes ? (
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="mb-1 text-sm text-gray-600">تێبینییەکان</div>
                <div className="text-gray-900 whitespace-pre-line">{customer.notes}</div>
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
            <div className="mb-1 text-sm text-gray-600">کۆی فرۆشتن</div>
            <div className="text-2xl font-bold text-blue-600">{stats?.total_sales || 0}</div>
          </div>
          <div className="p-4 border border-green-100 rounded-lg bg-green-50">
            <div className="mb-1 text-sm text-gray-600">کۆی پارەدان</div>
            <div className="text-2xl font-bold text-green-600">{stats?.total_payments || 0}</div>
          </div>
          <div className="p-4 border border-purple-100 rounded-lg bg-purple-50">
            <div className="mb-1 text-sm text-gray-600">فرۆشتنەکان بە دینار</div>
            <div className="text-xl font-bold text-purple-600">
              {formatCurrency(stats?.total_sales_amount?.iqd || 0, 'IQD')}
            </div>
          </div>
          <div className="p-4 border border-orange-100 rounded-lg bg-orange-50">
            <div className="mb-1 text-sm text-gray-600">فرۆشتنەکان بە دۆلار</div>
            <div className="text-xl font-bold text-orange-600">
              {formatCurrency(stats?.total_sales_amount?.usd || 0, 'USD')}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
        {/* Recent Sales */}
        <Card title="دوایین فرۆشتنەکان" className="border border-gray-200">
          <div className="space-y-3">
            {customer.sales?.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>هیچ فرۆشتنێک نییە</p>
              </div>
            ) : (
              customer.sales?.map((sale) => (
                <Link
                  key={sale.id}
                  href={`/sales/${sale.id}`}
                  className="flex items-center justify-between p-4 transition-colors border border-gray-100 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      sale.sale_type === 'credit' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      <ShoppingCart className={`w-5 h-5 ${
                        sale.sale_type === 'credit' ? 'text-red-600' : 'text-green-600'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{sale.invoice_number}</span>
                        {sale.sale_type === 'credit' && (
                          <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                            قەرز
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {formatDate(sale.sale_date)}
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className={`text-lg font-semibold ${
                      sale.sale_type === 'credit' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatCurrency(sale.total_amount, sale.currency)}
                    </div>
                    {sale.remaining_amount > 0 && (
                      <div className="mt-1 text-xs text-red-600">
                        ماوە: {formatCurrency(sale.remaining_amount, sale.currency)}
                      </div>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
          {customer.sales?.length > 0 && (
            <div className="pt-4 mt-6 border-t border-gray-200">
              <Link
                href={`/sales?customer=${customer.id}`}
                className="flex items-center justify-center gap-2 font-medium text-blue-600 hover:text-blue-700"
              >
                بینینی هەموو فرۆشتنەکان
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </Card>

        {/* Recent Payments */}
        <Card title="دوایین دانەوەکان" className="border border-gray-200">
          <div className="space-y-3">
            {customer.payments?.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>هیچ دانەوەیەک نییە</p>
              </div>
            ) : (
              customer.payments?.map((payment) => (
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
          {customer.payments?.length > 0 && (
            <div className="pt-4 mt-6 border-t border-green-100">
              <Link
                href={`/payments?customer=${customer.id}`}
                className="flex items-center justify-center gap-2 font-medium text-green-600 hover:text-green-700"
              >
                بینینی هەموو پارەدانەکان
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </Card>
      </div>


    </AuthenticatedLayout>
  );
}
