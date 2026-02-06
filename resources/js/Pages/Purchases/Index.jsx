import { useState, useCallback, useRef, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import {
  Plus, Eye, Edit, Trash2, Search,
  ShoppingCart, Calendar, User, DollarSign,
  Filter, Printer, Download
} from 'lucide-react';

// Custom debounce hook
function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  };
}

export default function Index({ purchases, suppliers, filters }) {
  const [search, setSearch] = useState(filters.search || '');
  const [supplierId, setSupplierId] = useState(filters.supplier_id || '');
  const [purchaseType, setPurchaseType] = useState(filters.purchase_type || '');
  const [currency, setCurrency] = useState(filters.currency || '');
  const [unpaidOnly, setUnpaidOnly] = useState(filters.unpaid_only || false);
  const [fromDate, setFromDate] = useState(filters.from_date || '');
  const [toDate, setToDate] = useState(filters.to_date || '');

  // Use custom debounce hook
  const applyFilters = useCallback((newFilters = {}) => {
    const params = {
      search: newFilters.search ?? search,
      supplier_id: supplierId,
      purchase_type: purchaseType,
      currency: currency,
      unpaid_only: unpaidOnly,
      from_date: fromDate,
      to_date: toDate,
      ...newFilters
    };

    router.get('/purchases', params, {
      preserveState: true,
      replace: true,
    });
  }, [search, supplierId, purchaseType, currency, unpaidOnly, fromDate, toDate]);

  const debouncedApplyFilters = useDebounce(applyFilters, 500);

  const handleSearchChange = (value) => {
    setSearch(value);
    debouncedApplyFilters({ search: value });
  };

  const handleClearFilters = () => {
    setSearch('');
    setSupplierId('');
    setPurchaseType('');
    setCurrency('');
    setUnpaidOnly(false);
    setFromDate('');
    setToDate('');
    router.get('/purchases');
  };

  const handleDelete = (id) => {
    if (confirm('دڵنیایت لە سڕینەوەی ئەم کڕینە؟ ئەمە بڕەکان لە ستۆک کەم دەکاتەوە!')) {
      router.delete(`/purchases/${id}`);
    }
  };

  const formatCurrency = (amount, curr) => {
    return new Intl.NumberFormat('ar-IQ').format(amount) + ' ' + curr;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (purchase) => {
    if (purchase.is_paid) {
      return (
        <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
          پارەدراو
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-full">
        ماوە: {formatCurrency(purchase.remaining_amount, purchase.currency)}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    return type === 'cash' ? (
      <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
        کاش
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
        قەرز
      </span>
    );
  };

  const stats = {
    total: purchases.total,
    cash: purchases.data.filter(p => p.purchase_type === 'cash').length,
    credit: purchases.data.filter(p => p.purchase_type === 'credit').length,
    totalAmount: purchases.data.reduce((sum, p) => sum + p.total_amount, 0),
    unpaidAmount: purchases.data.reduce((sum, p) => sum + p.remaining_amount, 0),
  };

  return (
    <AuthenticatedLayout>
      <PageHeader
        title="کڕینەکان"
        subtitle="بەڕێوەبردنی هەموو کڕینەکان"
        action={{
          href: '/purchases/create',
          label: 'کڕینی نوێ',
          icon: Plus,
        }}
      />

      {/* کارتەکانی ئامار */}
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">کۆی کڕینەکان</p>
              <p className="mt-2 text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">کاش</p>
              <p className="mt-2 text-2xl font-bold text-green-900">{stats.cash}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">قەرز</p>
              <p className="mt-2 text-2xl font-bold text-blue-900">{stats.credit}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">کۆی ماوە</p>
              <p className="mt-2 text-2xl font-bold text-orange-900">
                {new Intl.NumberFormat('ar-IQ').format(stats.unpaidAmount)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* فلتەرەکان */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-700">فلتەرەکان</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 right-3 top-1/2" />
            <input
              type="text"
              placeholder="گەڕان بە ژمارەی وەسڵ..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pr-10 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <select
            value={supplierId}
            onChange={(e) => {
              setSupplierId(e.target.value);
              applyFilters({ supplier_id: e.target.value });
            }}
            className="border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">هەموو دابینکەرەکان</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            value={purchaseType}
            onChange={(e) => {
              setPurchaseType(e.target.value);
              applyFilters({ purchase_type: e.target.value });
            }}
            className="border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">هەموو جۆرەکان</option>
            <option value="cash">کاش</option>
            <option value="credit">قەرز</option>
          </select>

          <select
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value);
              applyFilters({ currency: e.target.value });
            }}
            className="border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">هەموو دراوەکان</option>
            <option value="IQD">دینار</option>
            <option value="USD">دۆلار</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="unpaid-only"
              checked={unpaidOnly}
              onChange={(e) => {
                setUnpaidOnly(e.target.checked);
                applyFilters({ unpaid_only: e.target.checked });
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="unpaid-only" className="text-sm font-medium text-gray-700">
              تەنها کڕینە پارەنەدراوەکان
            </label>
          </div>

          <div className="flex gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                applyFilters({ from_date: e.target.value });
              }}
              className="flex-1 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                applyFilters({ to_date: e.target.value });
              }}
              className="flex-1 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => applyFilters()}
              className="flex items-center justify-center flex-1 gap-2 btn btn-primary"
            >
              <Filter className="w-4 h-4" />
              جێبەجێکردنی فلتەر
            </button>
            <button
              onClick={handleClearFilters}
              className="flex-1 btn btn-secondary"
            >
              پاککردنەوە
            </button>
          </div>
        </div>
      </Card>

      {/* خشتە */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  وەسڵ
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  دابینکەر
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  بەروار
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  بڕ
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  جۆر
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  دۆخ
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  کردارەکان
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchases.data.length > 0 ? (
                purchases.data.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-right">
                        <Link
                          href={`/purchases/${purchase.id}`}
                          className="font-mono font-medium text-blue-600 hover:text-blue-800"
                        >
                          #{purchase.invoice_number}
                        </Link>
                        <div className="text-xs text-gray-500">
                          {purchase.items_count} بەرهەم
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {purchase.supplier?.name || 'بێ دابینکەر'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {purchase.user?.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {formatDate(purchase.purchase_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(purchase.total_amount, purchase.currency)}
                        </div>
                        <div className="text-xs text-gray-500">
                          پارەدراو: {formatCurrency(purchase.paid_amount, purchase.currency)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getTypeBadge(purchase.purchase_type)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(purchase)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/purchases/${purchase.id}`}
                          className="p-2 text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                          title="بینین"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/purchases/${purchase.id}/edit`}
                          className="p-2 text-green-600 transition-colors rounded-lg hover:bg-green-50"
                          title="دەستکاری"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/purchases/${purchase.id}/print`}
                          className="p-2 text-purple-600 transition-colors rounded-lg hover:bg-purple-50"
                          title="چاپکردن"
                        >
                          <Printer className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(purchase.id)}
                          className="p-2 text-red-600 transition-colors rounded-lg hover:bg-red-50"
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
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <ShoppingCart className="w-12 h-12 mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900">کڕین نەدۆزرایەوە</h3>
                      <p className="mt-2 text-gray-600">
                        {search || supplierId || purchaseType || currency || unpaidOnly || fromDate || toDate
                          ? 'کڕینێک بەم فلتەرە نەدۆزرایەوە'
                          : 'هیچ کڕینێک تۆمار نەکراوە'}
                      </p>
                      {!search && !supplierId && !purchaseType && !currency && !unpaidOnly && !fromDate && !toDate && (
                        <Link
                          href="/purchases/create"
                          className="inline-flex items-center gap-2 px-4 py-2 mt-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4" />
                          زیادکردنی کڕینی نوێ
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
        {purchases.data.length > 0 && purchases.links && purchases.links.length > 3 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                نیشاندان <span className="font-medium">{purchases.from}</span> بۆ{' '}
                <span className="font-medium">{purchases.to}</span> لە{' '}
                <span className="font-medium">{purchases.total}</span> کڕین
              </div>
              <div className="flex gap-1">
                {purchases.links.map((link, index) => (
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
          </div>
        )}
      </Card>
    </AuthenticatedLayout>
  );
}
