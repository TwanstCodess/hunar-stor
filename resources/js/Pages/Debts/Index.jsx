import { useState } from 'react';
import { router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import { Users, DollarSign, Search, HandCoins, Calendar, Clock, User, TrendingUp, TrendingDown } from 'lucide-react';

export default function Index({ customers, statistics, filters, showAdvance = false }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [currency, setCurrency] = useState(filters?.currency || 'all');
  const [showType, setShowType] = useState(showAdvance ? 'advance' : 'debt');
  const [loading, setLoading] = useState(false);

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'بەرواری نییە';

    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'ئەمڕۆ';
    if (diffInDays === 1) return 'دوێنێ';
    if (diffInDays < 7) return `${diffInDays} ڕۆژ لەمەوپێش`;
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} هەفتە لەمەوپێش`;
    }
    if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} مانگ لەمەوپێش`;
    }

    const years = Math.floor(diffInDays / 365);
    return `${years} ساڵ لەمەوپێش`;
  };

  const handleSearch = (value) => {
    setSearch(value);
    applyFilters({ search: value, currency, show_type: showType });
  };

  const handleCurrencyChange = (value) => {
    setCurrency(value);
    applyFilters({ search, currency: value, show_type: showType });
  };

  const handleShowTypeChange = (type) => {
    setShowType(type);
    applyFilters({ search, currency, show_type: type });
  };

  const applyFilters = (filters) => {
    setLoading(true);
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.currency && filters.currency !== 'all') params.currency = filters.currency;
    if (filters.show_type && filters.show_type !== 'debt') params.show_type = filters.show_type;

    router.get('/debts', params, {
      preserveState: true,
      replace: true,
      onFinish: () => setLoading(false),
    });
  };

  const formatCurrency = (amount, curr) => {
    const absAmount = Math.abs(amount);
    const formatted = new Intl.NumberFormat('en-US').format(absAmount);

    if (curr === 'IQD') {
      return `${formatted} دینار`;
    } else if (curr === 'USD') {
      return `${formatted} $`;
    }

    return `${formatted} ${curr}`;
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US').format(number);
  };

  const getBalanceColor = (amount, showType = 'debt') => {
    if (showType === 'advance') {
      // بۆ سەرمایە - نیشاندانی بە سەوز
      return 'text-green-600 bg-green-50 border-green-200';
    } else {
      // بۆ قەرز - نیشاندانی بە سور
      return amount > 0 ? 'text-red-600 bg-red-50 border-red-200' : 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'بەرواری نییە';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  };

  // فلتەرکردن بۆ جۆری نمایش (قەرز یان سەرمایە)
  const filteredCustomers = customers.filter(customer => {
    if (showType === 'debt') {
      // قەرز: ئەوانەی balance_iqd یان balance_usd > 0
      return (customer.balance_iqd > 0 || customer.balance_usd > 0);
    } else if (showType === 'advance') {
      // سەرمایە: ئەوانەی negative_balance_iqd یان negative_balance_usd > 0
      return (customer.negative_balance_iqd > 0 || customer.negative_balance_usd > 0);
    }
    return true;
  });

  return (
    <AuthenticatedLayout>
      <PageHeader
        title={showType === 'advance' ? 'لیستی سەرمایەکان' : 'لیستی قەرزەکان'}
        subtitle={showType === 'advance' ? 'بەڕێوەبردنی سەرمایەی کڕیاران' : 'بەڕێوەبردنی قەرزی کڕیاران'}
      />

      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className={`border-blue-200 bg-gradient-to-br ${showType === 'advance' ? 'from-blue-50 to-blue-100' : 'from-red-50 to-red-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">
                {showType === 'advance' ? 'کۆی گشتی سەرمایە (IQD)' : 'کۆی گشتی قەرز (IQD)'}
              </p>
              <p className={`mt-2 text-2xl font-bold ${showType === 'advance' ? 'text-blue-900' : 'text-red-900'}`}>
                {formatNumber(statistics.total_iqd)} دینار
              </p>
            </div>
            <div className={`flex items-center justify-center w-12 h-12 rounded-full ${showType === 'advance' ? 'bg-blue-200' : 'bg-red-200'}`}>
              {showType === 'advance' ?
                <TrendingDown className="w-6 h-6 text-blue-700" /> :
                <TrendingUp className="w-6 h-6 text-red-700" />
              }
            </div>
          </div>
        </Card>

        <Card className={`border-purple-200 bg-gradient-to-br ${showType === 'advance' ? 'from-purple-50 to-purple-100' : 'from-orange-50 to-orange-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">
                {showType === 'advance' ? 'کۆی گشتی سەرمایە (USD)' : 'کۆی گشتی قەرز (USD)'}
              </p>
              <p className={`mt-2 text-2xl font-bold ${showType === 'advance' ? 'text-purple-900' : 'text-orange-900'}`}>
                {formatNumber(statistics.total_usd)} $
              </p>
            </div>
            <div className={`flex items-center justify-center w-12 h-12 rounded-full ${showType === 'advance' ? 'bg-purple-200' : 'bg-orange-200'}`}>
              <DollarSign className={`w-6 h-6 ${showType === 'advance' ? 'text-purple-700' : 'text-orange-700'}`} />
            </div>
          </div>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">
                {showType === 'advance' ? 'کڕیاری سەرمایەدار' : 'کڕیاری قەرزدار'}
              </p>
              <p className="mt-2 text-2xl font-bold text-green-900">
                {formatNumber(statistics.customers_count)}
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-green-200 rounded-full">
              <Users className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </Card>
      </div>

      {/* Toggle Buttons for Debt/Advance */}
      <div className="mb-6">
        <div className="inline-flex p-1 bg-white border border-gray-300 rounded-lg">
          <button
            onClick={() => handleShowTypeChange('debt')}
            className={`px-4 py-2 rounded-md font-medium transition-all ${showType === 'debt' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              قەرزەکان
            </div>
          </button>
          <button
            onClick={() => handleShowTypeChange('advance')}
            className={`px-4 py-2 rounded-md font-medium transition-all ${showType === 'advance' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              سەرمایەکان
            </div>
          </button>
        </div>
      </div>

      <Card className="overflow-hidden border border-gray-200">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-t-2 border-b-2 border-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-600">کەمێك چاوەڕێ بکە...</p>
            </div>
          </div>
        )}

        <div className="px-6 py-4 space-y-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="گەڕان بە ناو یان ژمارەی تەلەفۆن..."
                className="block w-full pr-3 pl-10 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">هەموو دراوەکان</option>
              <option value="IQD">دینار (IQD)</option>
              <option value="USD">دۆلار (USD)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-2 p-3 bg-white border rounded-lg md:grid-cols-2">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${showType === 'advance' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-700">
                {showType === 'advance' ? 'سەرمایە: کڕیار پارەی زیاتری دابین کردووە' : 'قەرز: کڕیار قەرزی ئێمەیە'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${showType === 'advance' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
              <span className="text-sm text-gray-700">
                {showType === 'advance' ? 'سەرمایە و قەرز هەیە' : 'کڕیار هەر دوو جۆرە قەرزی هەیە'}
              </span>
            </div>
          </div>
        </div>

        {filteredCustomers.length > 0 ? (
          <div className="px-6 py-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className={`w-5 h-5 ${showType === 'advance' ? 'text-green-600' : 'text-blue-600'}`} />
              <h3 className="text-lg font-semibold text-gray-900">
                {showType === 'advance' ? 'کڕیارانی سەرمایەدار' : 'کڕیارانی قەرزدار'} ({formatNumber(filteredCustomers.length)})
              </h3>
            </div>
            <div className="space-y-3">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-4 transition-shadow border border-gray-200 rounded-lg hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                          showType === 'advance' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          <User className={`w-5 h-5 ${showType === 'advance' ? 'text-green-600' : 'text-blue-600'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{customer.name}</h4>
                            {customer.phone && (
                              <span className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded">
                                {customer.phone}
                              </span>
                            )}
                          </div>
                          {customer.last_transaction_date && (
                            <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>کۆتا مامەڵە: {formatDate(customer.last_transaction_date)}</span>
                              <Clock className="w-3 h-3 ml-2" />
                              <span>({formatRelativeTime(customer.last_transaction_date)})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:items-end">
                      {/* نمایشی قەرز */}
                      {showType === 'debt' && customer.balance_iqd > 0 && (
                        <div className={`px-3 py-2 border rounded-lg ${getBalanceColor(customer.balance_iqd, 'debt')}`}>
                          <div className="text-sm font-semibold">
                            {formatCurrency(customer.balance_iqd, 'IQD')}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            قەرزی دینار
                          </div>
                        </div>
                      )}

                      {showType === 'debt' && customer.balance_usd > 0 && (
                        <div className={`px-3 py-2 border rounded-lg ${getBalanceColor(customer.balance_usd, 'debt')}`}>
                          <div className="text-sm font-semibold">
                            {formatCurrency(customer.balance_usd, 'USD')}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            قەرزی دۆلار
                          </div>
                        </div>
                      )}

                      {/* نمایشی سەرمایە */}
                      {showType === 'advance' && customer.negative_balance_iqd > 0 && (
                        <div className={`px-3 py-2 border text-red-700 rounded-lg ${getBalanceColor(customer.negative_balance_iqd, 'advance')}`}>
                          <div className="text-sm font-semibold">
                          -  {formatCurrency(customer.negative_balance_iqd, 'IQD')}
                          </div>
                          <div className="mt-1 text-xs ">
                            سەرمایەی دینار
                          </div>
                        </div>
                      )}

                      {showType === 'advance' && customer.negative_balance_usd > 0 && (
                        <div className={`px-3 py-2 border text-red-700 rounded-lg ${getBalanceColor(customer.negative_balance_usd, 'advance')}`}>
                          <div className="text-sm font-semibold">
                         -   {formatCurrency(customer.negative_balance_usd, 'USD')}
                          </div>
                          <div className="mt-1 text-xs ">
                            سەرمایەی دۆلار
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={showType === 'advance' ?
                          `/customers/${customer.id}?tab=advance` :
                          `/payments/create?type=customer&customer_id=${customer.id}`
                        }
                        className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg ${
                          showType === 'advance' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        <HandCoins className="w-4 h-4" />
                        {showType === 'advance' ? 'بینین' : 'پارەدان'}
                      </Link>
                      <Link
                        href={`/customers/${customer.id}/debt-statement${showType === 'advance' ? '?type=advance' : ''}`}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                      >
                        وردەکاری
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 mb-4 text-gray-400">
                <Search className="w-full h-full" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                {showType === 'advance' ? 'هیچ سەرمایەیەک نەدۆزرایەوە' : 'هیچ قەرزێک نەدۆزرایەوە'}
              </h3>
              <p className="mt-1 text-gray-600">گەڕان یان فلتەرەکان بگۆڕە</p>
            </div>
          </div>
        )}
      </Card>
    </AuthenticatedLayout>
  );
}
