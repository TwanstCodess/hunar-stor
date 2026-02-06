import { Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import { FileText } from 'lucide-react';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  User,
  Phone,
  MapPin,
  DollarSign,
  Filter,
  Printer,
  History,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Wallet
} from 'lucide-react';

// فانکشنەکانی فۆرماتکردن
const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num || 0);
};

const formatCurrency = (amount, curr) => {
  const formattedAmount = formatNumber(amount);
  if (!curr || curr === '---') return formattedAmount;

  if (curr === 'IQD') return formattedAmount + ' دینار';
  if (curr === 'USD') return '$' + formattedAmount;

  return formattedAmount + ' ' + curr;
};

// SearchInput کۆمپۆنێنت
const SearchInput = ({ value, onChange, placeholder, ...props }) => {
  return (
    <div className="relative">
      <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full pr-3 pl-10 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        {...props}
      />
    </div>
  );
};

// Pagination کۆمپۆنێنت
const Pagination = ({ links, meta }) => {
  if (!links || !meta || links.length <= 3) return null;

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-700">
        نیشاندان <span className="font-medium">{meta.from || 0}</span> بۆ{' '}
        <span className="font-medium">{meta.to || 0}</span> لە{' '}
        <span className="font-medium">{meta.total || 0}</span> کڕیار
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

// Stats Cards کۆمپۆنێنت
const StatsCards = ({ customers }) => {
  const customerData = customers?.data || [];

  // حیسابکردنی ئامارەکان لە کڕیارەکان
  const totalCustomers = customers?.meta?.total || 0;

  let totalDebtIQD = 0;
  let totalDebtUSD = 0;
  let totalAdvanceIQD = 0;
  let totalAdvanceUSD = 0;
  let hasDebtCount = 0;
  let hasAdvanceCount = 0;

  customerData.forEach(customer => {
    totalDebtIQD += parseFloat(customer.balance_iqd || 0);
    totalDebtUSD += parseFloat(customer.balance_usd || 0);
    totalAdvanceIQD += parseFloat(customer.negative_balance_iqd || 0);
    totalAdvanceUSD += parseFloat(customer.negative_balance_usd || 0);

    if (parseFloat(customer.balance_iqd || 0) > 0 || parseFloat(customer.balance_usd || 0) > 0) {
      hasDebtCount++;
    }

    if (parseFloat(customer.negative_balance_iqd || 0) > 0 || parseFloat(customer.negative_balance_usd || 0) > 0) {
      hasAdvanceCount++;
    }
  });

  return (
    <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">کۆی کڕیاران</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{totalCustomers}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">قەرزدارەکان</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{hasDebtCount}</p>
          </div>
          <div className="p-3 bg-red-100 rounded-lg">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">سەرمایەدارەکان</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{hasAdvanceCount}</p>
          </div>
          <div className="p-3 bg-green-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">کۆی قەرز (دینار)</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {formatNumber(totalDebtIQD)} دینار
            </p>
          </div>
          <div className="p-3 bg-orange-100 rounded-lg">
            <CreditCard className="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

// AddAdvanceModal کۆمپۆنێنت
const AddAdvanceModal = ({ customer, show, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount_iqd: '',
    amount_usd: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (show) {
      setFormData({ amount_iqd: '', amount_usd: '' });
      setErrors({});
    }
  }, [show, customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount_iqd && !formData.amount_usd) {
      setErrors({ submit: 'هیچێک لە خانەکان بەتاڵ نیە' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(`/customers/${customer.id}/add-advance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'هەڵەیەک ڕوویدا');
      }

      if (data.success) {
        onSuccess(data);
        onClose();
      } else {
        setErrors({ submit: data.message });
      }
    } catch (error) {
      console.error('Error:', error);
      setErrors({ submit: error.message || 'هەڵەیەک ڕوویدا' });
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  // حیسابکردنی کاونتی نوێ
  const newIQD = (parseFloat(customer.negative_balance_iqd || 0) + parseFloat(formData.amount_iqd || 0)).toFixed(2);
  const newUSD = (parseFloat(customer.negative_balance_usd || 0) + parseFloat(formData.amount_usd || 0)).toFixed(2);

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${show ? '' : 'hidden'}`}>
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-right align-middle transition-all transform bg-white rounded-lg shadow-xl dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              زیادکردنی سەرمایە بۆ {customer.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* کاونتی ئێستا */}
            <div className="p-3 mb-4 rounded bg-gray-50 dark:bg-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">سەرمایەی ئێستا:</div>
              <div className="flex justify-between mt-1 text-sm">
                <span className="text-blue-600 dark:text-blue-400">
                  دینار: {formatNumber(customer.negative_balance_iqd || 0)}
                </span>
                <span className="text-green-600 dark:text-green-400">
                  دۆلار: {formatNumber(customer.negative_balance_usd || 0)}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  بڕی دینار
                </label>
                <input
                  type="number"
                  name="amount_iqd"
                  value={formData.amount_iqd}
                  onChange={handleChange}
                  placeholder="0"
                  step="0.01"
                  min="0"
                  className="w-full p-2 bg-white border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  بڕی دۆلار
                </label>
                <input
                  type="number"
                  name="amount_usd"
                  value={formData.amount_usd}
                  onChange={handleChange}
                  placeholder="0"
                  step="0.01"
                  min="0"
                  className="w-full p-2 bg-white border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* کاونتی نوێ */}
            {(formData.amount_iqd || formData.amount_usd) && (
              <div className="p-3 mt-4 border border-blue-200 rounded bg-blue-50 dark:bg-blue-900/30 dark:border-blue-800">
                <div className="mb-2 text-sm font-medium text-blue-800 dark:text-blue-300">
                  کاونتی نوێ پاش زیادکردن:
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700 dark:text-blue-400">
                    دینار: {formatNumber(newIQD)}
                  </span>
                  <span className="text-green-700 dark:text-green-400">
                    دۆلار: {formatNumber(newUSD)}
                  </span>
                </div>
              </div>
            )}

            {/* هەڵە */}
            {errors.submit && (
              <div className="p-2 mt-3 text-sm text-red-700 rounded bg-red-50 dark:bg-red-900/30 dark:text-red-400">
                {errors.submit}
              </div>
            )}

            <div className="flex justify-end mt-6 space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded dark:border-gray-600 dark:text-gray-300 dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                disabled={loading}
              >
                پاشگەزبوونەوە
              </button>
              <button
                type="submit"
                disabled={loading || (!formData.amount_iqd && !formData.amount_usd)}
                className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'زیادکردن...' : 'زیادکردن'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// EditBalanceModal کۆمپۆنێنت
const EditBalanceModal = ({ customer, show, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    negative_balance_iqd: '',
    negative_balance_usd: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (show && customer) {
      setFormData({
        negative_balance_iqd: customer.negative_balance_iqd || '',
        negative_balance_usd: customer.negative_balance_usd || ''
      });
      setErrors({});
    }
  }, [show, customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.negative_balance_iqd || !formData.negative_balance_usd) {
      setErrors({ submit: 'هەردوو خانە پڕبکەرەوە' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(`/customers/${customer.id}/edit-balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'هەڵەیەک ڕوویدا');
      }

      if (data.success) {
        onSuccess(data);
        onClose();
      } else {
        setErrors({ submit: data.message });
      }
    } catch (error) {
      console.error('Error:', error);
      setErrors({ submit: error.message || 'هەڵەیەک ڕوویدا' });
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${show ? '' : 'hidden'}`}>
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-right align-middle transition-all transform bg-white rounded-lg shadow-xl dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              دەستکاری سەرمایەی {customer.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  سەرمایەی دینار
                </label>
                <input
                  type="number"
                  name="negative_balance_iqd"
                  value={formData.negative_balance_iqd}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full p-2 bg-white border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  سەرمایەی دۆلار
                </label>
                <input
                  type="number"
                  name="negative_balance_usd"
                  value={formData.negative_balance_usd}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full p-2 bg-white border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* هەڵە */}
            {errors.submit && (
              <div className="p-2 mt-3 text-sm text-red-700 rounded bg-red-50 dark:bg-red-900/30 dark:text-red-400">
                {errors.submit}
              </div>
            )}

            <div className="flex justify-end mt-6 space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded dark:border-gray-600 dark:text-gray-300 dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                disabled={loading}
              >
                پاشگەزبوونەوە
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'دەستکاری...' : 'دەستکاری'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Customer Row Component
const CustomerRow = ({ customer, selected, onSelect, onDelete, onAddAdvance, onEditBalance }) => {
  return (
    <tr
      className={`transition-colors duration-150 ${
        selected
          ? 'bg-blue-50 hover:bg-blue-100'
          : 'hover:bg-gray-50'
      }`}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(customer.id)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 border border-blue-200 rounded-lg">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{customer.name}</div>
            {customer.address && (
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[150px]">{customer.address}</span>
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="space-y-2">
          {customer.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{customer.phone}</span>
            </div>
          )}
          {customer.email && (
            <div className="text-sm text-gray-600 truncate max-w-[200px]">
              {customer.email}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
          (customer.balance_iqd || 0) > 0
            ? 'bg-red-50 text-red-700 border border-red-200'
            : (customer.balance_iqd || 0) < 0
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-gray-50 text-gray-700 border border-gray-200'
        }`}>
          <DollarSign className="w-4 h-4" />
          {formatCurrency(customer.balance_iqd || 0, 'IQD')}
          {(customer.balance_iqd || 0) < 0 && (
            <span className="text-xs">(سەرمایە)</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
          (customer.balance_usd || 0) > 0
            ? 'bg-red-50 text-red-700 border border-red-200'
            : (customer.balance_usd || 0) < 0
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-gray-50 text-gray-700 border border-gray-200'
        }`}>
          <DollarSign className="w-4 h-4" />
          {formatCurrency(customer.balance_usd || 0, 'USD')}
          {(customer.balance_usd || 0) < 0 && (
            <span className="text-xs">(سەرمایە)</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
          (customer.negative_balance_iqd || 0) > 0
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-gray-50 text-gray-700 border border-gray-200'
        }`}>
          <DollarSign className="w-4 h-4" />
          {formatCurrency(customer.negative_balance_iqd || 0, 'IQD')}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
          (customer.negative_balance_usd || 0) > 0
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-gray-50 text-gray-700 border border-gray-200'
        }`}>
          <DollarSign className="w-4 h-4" />
          {formatCurrency(customer.negative_balance_usd || 0, 'USD')}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center justify-center gap-1">
          {/* زیادکردنی سەرمایە */}
          <button
            onClick={() => onAddAdvance(customer)}
            className="p-1.5 text-green-600 transition-colors duration-200 border border-green-100 rounded-lg hover:bg-green-50 hover:border-green-200"
            title="زیادکردنی سەرمایە"
          >
            <Wallet className="w-4 h-4" />
          </button>

          {/* دەستکاری سەرمایە */}
          <button
            onClick={() => onEditBalance(customer)}
            className="p-1.5 text-blue-600 transition-colors duration-200 border border-blue-100 rounded-lg hover:bg-blue-50 hover:border-blue-200"
            title="دەستکاری سەرمایە"
          >
            <Edit className="w-4 h-4" />
          </button>

          <Link
            href={`/customers/${customer.id}/all-sales/print`}
            className="p-1.5 text-purple-600 transition-colors duration-200 border border-purple-100 rounded-lg hover:bg-purple-50 hover:border-purple-200"
            title="بینینی هەموو فرۆشتنەکان"
          >
            <FileText className="w-4 h-4" />
          </Link>

          <Link
            href={`/customers/${customer.id}`}
            className="p-1.5 text-green-600 transition-colors duration-200 border border-green-100 rounded-lg hover:bg-green-50 hover:border-green-200"
            title="بینین"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <Link
            href={`/customers/${customer.id}/debt-statement/print`}
            className="p-1.5 text-red-600 transition-colors duration-200 border border-red-100 rounded-lg hover:bg-red-50 hover:border-red-200"
            title="چاپکردنی کەشف حساب"
          >
            <Printer className="w-4 h-4" />
          </Link>
          <Link
            href={`/customers/${customer.id}/edit`}
            className="p-1.5 text-blue-600 transition-colors duration-200 border border-blue-100 rounded-lg hover:bg-blue-50 hover:border-blue-200"
            title="دەستکاریکردن"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button
            onClick={() => onDelete(customer.id)}
            disabled={(customer.sales_count || 0) > 0 || (customer.payments_count || 0) > 0}
            className={`p-1.5 rounded-lg border transition-colors duration-200 ${
              (customer.sales_count || 0) > 0 || (customer.payments_count || 0) > 0
                ? 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                : 'text-red-600 hover:bg-red-50 border-red-100 hover:border-red-200'
            }`}
            title={
              (customer.sales_count || 0) > 0 || (customer.payments_count || 0) > 0
                ? 'ناتوانرێت بسڕدرێتەوە چونکە فرۆشتن یان پارەدانی تێدایە'
                : 'سڕینەوە'
            }
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default function Index({ customers, filters }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [showDebtFilter, setShowDebtFilter] = useState(filters?.has_debt || false);
  const [showAdvanceFilter, setShowAdvanceFilter] = useState(filters?.has_advance || false);
  const [selectedCustomers, setSelectedCustomers] = useState([]);

  // زیادکراوەکان:
  const [showAddAdvanceModal, setShowAddAdvanceModal] = useState(false);
  const [showEditBalanceModal, setShowEditBalanceModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const handleSearch = (value) => {
    setSearch(value);
    updateFilters({ search: value });
  };

  const handleDebtFilter = () => {
    const newValue = !showDebtFilter;
    setShowDebtFilter(newValue);
    updateFilters({ has_debt: newValue });
  };

  const handleAdvanceFilter = () => {
    const newValue = !showAdvanceFilter;
    setShowAdvanceFilter(newValue);
    updateFilters({ has_advance: newValue });
  };

  const updateFilters = (newFilters) => {
    const allFilters = {
      search: newFilters.search !== undefined ? newFilters.search : search,
      has_debt: newFilters.has_debt !== undefined ? newFilters.has_debt : showDebtFilter,
      has_advance: newFilters.has_advance !== undefined ? newFilters.has_advance : showAdvanceFilter,
    };

    // پاککردنەوەی ئەو فلتەرانەی کە بەتاڵن
    Object.keys(allFilters).forEach(key => {
      if (allFilters[key] === false || allFilters[key] === '' || allFilters[key] === 0) {
        delete allFilters[key];
      }
    });

    router.get('/customers', allFilters, {
      preserveState: true,
      replace: true,
    });
  };

  const handleDelete = async (id) => {
    if (confirm('دڵنیایت لە سڕینەوەی ئەم کڕیارە؟')) {
      try {
        await router.delete(`/customers/${id}`);
      } catch (error) {
        console.error('هەڵە لە سڕینەوە:', error);
        alert('هەڵەیەک ڕوویدا لە کاتی سڕینەوە');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCustomers.length === 0) return;

    if (confirm(`دڵنیایت لە سڕینەوەی ${selectedCustomers.length} کڕیار؟`)) {
      try {
        await router.post('/customers/bulk-delete', {
          ids: selectedCustomers
        });
        setSelectedCustomers([]);
      } catch (error) {
        console.error('هەڵە لە سڕینەوەی کۆمەڵ:', error);
        alert('هەڵەیەک ڕوویدا لە کاتی سڕینەوەی کۆمەڵ');
      }
    }
  };

  const handleSelectAll = () => {
    const customerData = customers?.data || [];
    if (selectedCustomers.length === customerData.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customerData.map(customer => customer.id));
    }
  };

  const handleSelectCustomer = (id) => {
    setSelectedCustomers(prev => {
      if (prev.includes(id)) {
        return prev.filter(customerId => customerId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const clearFilters = () => {
    setSearch('');
    setShowDebtFilter(false);
    setShowAdvanceFilter(false);
    setSelectedCustomers([]);
    router.get('/customers');
  };

  // فانکشنەکان بۆ مۆدالەکان
  const handleAddAdvance = (customer) => {
    setSelectedCustomer(customer);
    setShowAddAdvanceModal(true);
  };

  const handleEditBalance = (customer) => {
    setSelectedCustomer(customer);
    setShowEditBalanceModal(true);
  };

  const handleAdvanceSuccess = (data) => {
    // نوێکردنەوەی لیست
    router.reload({ only: ['customers'] });
  };

  const handleBalanceEditSuccess = (data) => {
    // نوێکردنەوەی لیست
    router.reload({ only: ['customers'] });
  };

  // پشکنین بۆ ئەوەی customers.data هەبێت
  const customerData = customers?.data || [];

  return (
    <AuthenticatedLayout>
      <PageHeader
        title="کڕیاران"
        subtitle="بەڕێوەبردنی کڕیاران"
        action={{
          href: '/customers/create',
          label: 'زیادکردنی کڕیار',
          icon: Plus,
        }}
      />

      {/* Stats Cards */}
      <StatsCards customers={customers} />

      <Card className="overflow-hidden border border-gray-200">
        {/* بەشی گەڕان و فلتەر */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-1 max-w-md w-[500px]">
                <SearchInput
                  value={search}
                  onChange={handleSearch}
                  placeholder="گەڕان بەناو، ژمارە مۆبایل یان ئیمەیل..."
                />
              </div>

              <button
                onClick={handleDebtFilter}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
                  showDebtFilter
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Filter className="w-4 h-4" />
                قەرزدارەکان
              </button>

              <button
                onClick={handleAdvanceFilter}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
                  showAdvanceFilter
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Filter className="w-4 h-4" />
                سەرمایەدارەکان
              </button>

              <button
                onClick={clearFilters}
                className="px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                پاککردنەوە
              </button>
            </div>

            {/* بەشی سڕینەوەی کۆمەڵ */}
            {selectedCustomers.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">
                  {selectedCustomers.length} کڕیار هەڵبژێردراوە
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2.5 text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  سڕینەوەی کۆمەڵ
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="w-10 px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase border-b border-gray-200">
                  <input
                    type="checkbox"
                    checked={customerData.length > 0 && selectedCustomers.length === customerData.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase border-b border-gray-200">
                  کڕیار
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase border-b border-gray-200">
                  پەیوەندی
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase border-b border-gray-200">
                  قەرز (دینار)
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase border-b border-gray-200">
                  قەرز (دۆلار)
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase border-b border-gray-200">
                  سەرمایە (دینار)
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase border-b border-gray-200">
                  سەرمایە (دۆلار)
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase border-b border-gray-200">
                  کردارەکان
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customerData.length > 0 ? (
                customerData.map((customer) => (
                  <CustomerRow
                    key={customer.id}
                    customer={customer}
                    selected={selectedCustomers.includes(customer.id)}
                    onSelect={handleSelectCustomer}
                    onDelete={handleDelete}
                    onAddAdvance={handleAddAdvance}
                    onEditBalance={handleEditBalance}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <User className="w-12 h-12 mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900">کڕیارێک نەدۆزرایەوە</h3>
                      <p className="mt-2 text-gray-600">
                        {search || showDebtFilter || showAdvanceFilter
                          ? 'کڕیارێک بەم مەرجانە نەدۆزرایەوە'
                          : 'هیچ کڕیارێک زیاد نەکراوە'}
                      </p>
                      {!search && !showDebtFilter && !showAdvanceFilter && (
                        <Link
                          href="/customers/create"
                          className="inline-flex items-center gap-2 px-4 py-2 mt-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4" />
                          زیادکردنی کڕیار
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
        {customerData.length > 0 && customers?.links && customers?.meta && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Pagination links={customers.links} meta={customers.meta} />
          </div>
        )}
      </Card>

      {/* مۆدالەکانی زیادکردن و دەستکاری */}
      {selectedCustomer && (
        <>
          <AddAdvanceModal
            customer={selectedCustomer}
            show={showAddAdvanceModal}
            onClose={() => {
              setShowAddAdvanceModal(false);
              setSelectedCustomer(null);
            }}
            onSuccess={handleAdvanceSuccess}
          />

          <EditBalanceModal
            customer={selectedCustomer}
            show={showEditBalanceModal}
            onClose={() => {
              setShowEditBalanceModal(false);
              setSelectedCustomer(null);
            }}
            onSuccess={handleBalanceEditSuccess}
          />
        </>
      )}
    </AuthenticatedLayout>
  );
}
