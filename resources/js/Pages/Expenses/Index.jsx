import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import { Plus, Edit, Trash2, Search, DollarSign, TrendingDown, Calendar, Wallet } from 'lucide-react';

// SearchInput کۆمپۆنێنت
const SearchInput = ({ value, onChange, placeholder }) => {
  return (
    <div className="relative">
      <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full pr-3 pl-10 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
};

// Pagination کۆمپۆنێنت
const Pagination = ({ links, meta }) => {
  if (!links || links.length <= 3) return null;

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-700">
        نیشاندان <span className="font-medium">{meta.from}</span> بۆ{' '}
        <span className="font-medium">{meta.to}</span> لە{' '}
        <span className="font-medium">{meta.total}</span> خەرجی
      </div>
      <div className="flex gap-1">
        {links.map((link, index) => (
          <button
            key={index}
            onClick={() => link.url && router.get(link.url)}
            disabled={!link.url || link.active}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              link.active
                ? 'bg-blue-600 text-white border-blue-600'
                : link.url
                ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
            }`}
            dangerouslySetInnerHTML={{ __html: link.label }}
          />
        ))}
      </div>
    </div>
  );
};

// StatCard کۆمپۆنێنت
const StatCard = ({ title, amount, currency, icon: Icon, color }) => {
  const formatCurrency = (value, curr) => {
    return new Intl.NumberFormat('ar-IQ').format(value) + ' ' + curr;
  };

  return (
    <Card className={`border-${color}-200 bg-${color}-50`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium text-${color}-600`}>{title}</p>
          <p className={`mt-2 text-2xl font-bold text-${color}-900`}>
            {formatCurrency(amount, currency)}
          </p>
        </div>
        <div className={`p-3 bg-${color}-100 rounded-full`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </Card>
  );
};

export default function Index({ expenses, stats, filters }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [currency, setCurrency] = useState(filters?.currency || '');
  const [fromDate, setFromDate] = useState(filters?.from_date || '');
  const [toDate, setToDate] = useState(filters?.to_date || '');

  const handleSearch = (value) => {
    setSearch(value);
    applyFilters({ search: value, currency, from_date: fromDate, to_date: toDate });
  };

  const handleCurrencyChange = (value) => {
    setCurrency(value);
    applyFilters({ search, currency: value, from_date: fromDate, to_date: toDate });
  };

  const handleDateChange = (from, to) => {
    setFromDate(from);
    setToDate(to);
    applyFilters({ search, currency, from_date: from, to_date: to });
  };

  const applyFilters = (filters) => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.currency) params.currency = filters.currency;
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;

    router.get('/expenses', params, {
      preserveState: true,
      replace: true,
    });
  };

  const handleDelete = (id) => {
    if (confirm('دڵنیایت لە سڕینەوەی ئەم خەرجییە؟')) {
      router.delete(`/expenses/${id}`);
    }
  };

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

  const expenseData = expenses?.data || [];

  return (
    <AuthenticatedLayout>
      <PageHeader
        title="خەرجییەکان"
        subtitle="بەڕێوەبردنی خەرجییەکان و تێچووەکان"
        action={{
          href: '/expenses/create',
          label: 'زیادکردنی خەرجی',
          icon: Plus,
        }}
      />

      {/* کارتەکانی ئامار */}
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="کۆی گشتی (دینار)"
          amount={stats.total_iqd}
          currency="IQD"
          icon={Wallet}
          color="red"
        />
        <StatCard
          title="کۆی گشتی (دۆلار)"
          amount={stats.total_usd}
          currency="USD"
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="خەرجیی ئەمڕۆ (دینار)"
          amount={stats.today_iqd}
          currency="IQD"
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="خەرجیی ئەمڕۆ (دۆلار)"
          amount={stats.today_usd}
          currency="USD"
          icon={TrendingDown}
          color="purple"
        />
      </div>

      <Card className="overflow-hidden border border-gray-200">
        {/* بەشی گەڕان و فلتەرەکان */}
        <div className="px-6 py-4 space-y-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* گەڕان */}
            <SearchInput
              value={search}
              onChange={handleSearch}
              placeholder="گەڕان بە ناونیشان..."
            />

            {/* فلتەری دراو */}
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">هەموو دراوەکان</option>
              <option value="IQD">دینار (IQD)</option>
              <option value="USD">دۆلار (USD)</option>
            </select>

            {/* بەرواری دەستپێک */}
            <input
              type="date"
              value={fromDate}
              onChange={(e) => handleDateChange(e.target.value, toDate)}
              className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="لە بەرواری..."
            />

            {/* بەرواری کۆتایی */}
            <input
              type="date"
              value={toDate}
              onChange={(e) => handleDateChange(fromDate, e.target.value)}
              className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="بۆ بەرواری..."
            />
          </div>
        </div>

        {/* خشتەی خەرجییەکان */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  ناونیشان و وەسف
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  بڕی پارە
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  تۆمارکراو لەلایەن
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  بەروار
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  کردارەکان
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenseData.length > 0 ? (
                expenseData.map((expense) => (
                  <tr key={expense.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{expense.title}</div>
                        {expense.description && (
                          <div className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {expense.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
                        expense.currency === 'IQD'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {expense.currency === 'USD' && <DollarSign className="w-4 h-4" />}
                        {formatCurrency(expense.amount, expense.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="text-sm text-gray-600">{expense.user?.name}</div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {formatDate(expense.expense_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/expenses/${expense.id}/edit`}
                          className="p-2 text-blue-600 transition-colors border border-blue-100 rounded-lg hover:bg-blue-50"
                          title="دەستکاری"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-2 text-red-600 transition-colors border border-red-100 rounded-lg hover:bg-red-50"
                          title="سڕینەوە"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <TrendingDown className="w-12 h-12 mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900">خەرجییەک نەدۆزرایەوە</h3>
                      <p className="mt-2 text-gray-600">
                        {search || currency || fromDate || toDate
                          ? 'خەرجییەک بەم فلتەرە نەدۆزرایەوە'
                          : 'هیچ خەرجییەک تۆمار نەکراوە'}
                      </p>
                      {!search && !currency && !fromDate && !toDate && (
                        <Link
                          href="/expenses/create"
                          className="inline-flex items-center gap-2 px-4 py-2 mt-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4" />
                          زیادکردنی خەرجی
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {expenseData.length > 0 && expenses?.links && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Pagination links={expenses.links} meta={expenses.meta} />
          </div>
        )}
      </Card>

      {/* کارتی ڕێنمایی */}
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <div className="space-y-2 text-sm">
          <h3 className="mb-3 font-semibold text-blue-900">📌 زانیاری:</h3>
          <div className="space-y-2 text-blue-800">
            <div className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <div>
                <strong>خەرجییەکان:</strong> هەموو تێچووەکانی کار وەک کرێ، سووتەمەنی، برەکارگێڕی
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <div>
                <strong>دوو جۆر دراو:</strong> دینار (IQD) و دۆلار (USD)
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <div>
                دەتوانیت گەڕان بکەیت بە ناونیشان، فلتەر بکەیت بە دراو و بەروار
              </div>
            </div>
          </div>
        </div>
      </Card>
    </AuthenticatedLayout>
  );
}
