import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import { Plus, Edit, Trash2, Eye, Search, Users, Truck, DollarSign, Calendar, User, CheckCircle, XCircle, Ban, RefreshCw, CreditCard, Receipt, Wallet, FileText, Image, X } from 'lucide-react';

// Modal کۆمپۆنێنتی پیشاندانی وێنە
const ImageModal = ({ isOpen, onClose, imageUrl, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75" onClick={onClose}>
      <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <img
            src={imageUrl}
            alt={title}
            className="max-w-full max-h-[70vh] mx-auto rounded-lg"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5XyZtuybUgbmHrh5xuysxzxYHhua0gYsqYa8OuwJs8L3RleHQ+PC9zdmc+';
            }}
          />
        </div>
        <div className="flex justify-end gap-2 p-4 border-t">
          <a
            href={imageUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            داگرتن
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            داخستن
          </button>
        </div>
      </div>
    </div>
  );
};

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
        نیشاندان <span className="font-medium">{meta?.from || 0}</span> بۆ{' '}
        <span className="font-medium">{meta?.to || 0}</span> لە{' '}
        <span className="font-medium">{meta?.total || 0}</span> دانەوە
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

// Format numbers in English
const formatNumber = (number) => {
  if (number === null || number === undefined || isNaN(number)) return '0';
  return new Intl.NumberFormat('en-US').format(number);
};

export default function Index({ payments, customers, suppliers, filters }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [type, setType] = useState(filters?.type || 'all');
  const [status, setStatus] = useState(filters?.status || 'all');
  const [currency, setCurrency] = useState(filters?.currency || 'all');
  const [hasExcess, setHasExcess] = useState(filters?.has_excess || false);

  // State بۆ مۆداڵی وێنە
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    imageUrl: '',
    title: ''
  });

  // ✅ چاککردنەوەی داتاکە
  const paymentData = payments?.data || [];
  const paginationLinks = payments?.links || [];
  const paginationMeta = payments?.meta || {
    from: 0,
    to: 0,
    total: 0,
    current_page: 1,
    last_page: 1
  };

  // ✅ فیلترکردنی تەنها پارەدانی گواستنەوە
  const transferPayments = paymentData.filter(payment => payment.payment_method === 'transfer');

  const handleSearch = (value) => {
    setSearch(value);
    applyFilters({
      search: value,
      type: type !== 'all' ? type : '',
      status: status !== 'all' ? status : '',
      currency: currency !== 'all' ? currency : '',
      has_excess: hasExcess ? '1' : '',
    });
  };

  const handleTypeChange = (value) => {
    setType(value);
    applyFilters({
      search,
      type: value !== 'all' ? value : '',
      status: status !== 'all' ? status : '',
      currency: currency !== 'all' ? currency : '',
      has_excess: hasExcess ? '1' : '',
    });
  };

  const handleStatusChange = (value) => {
    setStatus(value);
    applyFilters({
      search,
      type: type !== 'all' ? type : '',
      status: value !== 'all' ? value : '',
      currency: currency !== 'all' ? currency : '',
      has_excess: hasExcess ? '1' : '',
    });
  };

  const handleCurrencyChange = (value) => {
    setCurrency(value);
    applyFilters({
      search,
      type: type !== 'all' ? type : '',
      status: status !== 'all' ? status : '',
      currency: value !== 'all' ? value : '',
      has_excess: hasExcess ? '1' : '',
    });
  };

  const handleHasExcessChange = (value) => {
    setHasExcess(value);
    applyFilters({
      search,
      type: type !== 'all' ? type : '',
      status: status !== 'all' ? status : '',
      currency: currency !== 'all' ? currency : '',
      has_excess: value ? '1' : '',
    });
  };

  const applyFilters = (params) => {
    router.get('/payments', params, {
      preserveState: true,
      replace: true,
    });
  };

  const handleDelete = (id) => {
    if (confirm('دڵنیایت لە سڕینەوەی ئەم دانەوەیە؟')) {
      router.delete(`/payments/${id}`);
    }
  };

  // فەنکشنی کردنەوەی مۆداڵی وێنە
  const openImageModal = (imageUrl, title) => {
    setImageModal({
      isOpen: true,
      imageUrl: `/storage/${imageUrl}`,
      title: title
    });
  };

  // فەنکشنی داخستنی مۆداڵ
  const closeImageModal = () => {
    setImageModal({
      isOpen: false,
      imageUrl: '',
      title: ''
    });
  };

  // Format currency - ONLY NUMBERS in English
  const formatCurrency = (amount, curr) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '0';

    try {
      const numAmount = Number(amount);
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(numAmount);

      return curr === 'IQD' ? `${formatted} دینار` : `$${formatted}`;
    } catch (error) {
      console.error('Format error:', error, amount);
      return '0';
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      case 'pending':
        return <RefreshCw className="w-3 h-3" />;
      case 'cancelled':
        return <Ban className="w-3 h-3" />;
      case 'refunded':
        return <RefreshCw className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'refunded':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'تەواوبوو';
      case 'pending':
        return 'چاوەڕوانی';
      case 'cancelled':
        return 'هەڵوەشاوە';
      case 'refunded':
        return 'گەڕاوەتەوە';
      default:
        return status;
    }
  };

  const getPaymentMethodIcon = (method) => {
    // تەنها ئایکۆنی گواستنەوە نمایش بدە
    return <RefreshCw className="w-3 h-3" />;
  };

  const getPaymentMethodText = (method) => {
    // تەنها شێوازی گواستنەوە نمایش بدە
    return 'گواستنەوە';
  };

  const getPaymentMethodColor = (method) => {
    // تەنها ڕەنگی گواستنەوە نمایش بدە
    return 'bg-purple-100 text-purple-700';
  };

  const getTypeIcon = (type) => {
    return type === 'customer' ? (
      <Users className="w-3 h-3" />
    ) : (
      <Truck className="w-3 h-3" />
    );
  };

  const getTypeColor = (type) => {
    return type === 'customer'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-purple-100 text-purple-700';
  };

  const getTypeText = (type) => {
    return type === 'customer' ? 'کڕیار' : 'دابینکەر';
  };

  return (
    <AuthenticatedLayout>
      <PageHeader
        title="دانەوەی گواستنەوە"
        subtitle="بەڕێوەبردنی دانەوەکانی گواستنەوە"
        action={{
          href: '/payments/create',
          label: 'دانەوەی نوێ',
          icon: Plus,
        }}
      />

      {/* مۆداڵی پیشاندانی وێنە */}
      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={closeImageModal}
        imageUrl={imageModal.imageUrl}
        title={imageModal.title}
      />

      <Card className="overflow-hidden border border-gray-200">
        {/* بەشی گەڕان و فلتەرەکان */}
        <div className="px-6 py-4 space-y-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <SearchInput
              value={search}
              onChange={handleSearch}
              placeholder="گەڕان بەناوی کڕیار، دابینکەر..."
            />

            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">هەموو جۆرەکان</option>
              <option value="customer">کڕیار</option>
              <option value="supplier">دابینکەر</option>
            </select>

            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">هەموو دراوەکان</option>
              <option value="IQD">دینار</option>
              <option value="USD">دۆلار</option>
            </select>

            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">هەموو دۆخەکان</option>
              <option value="completed">تەواوبوو</option>
              <option value="pending">چاوەڕوانی</option>
              <option value="cancelled">هەڵوەشاوە</option>
              <option value="refunded">گەڕاوەتەوە</option>
            </select>

            <div className="flex items-center justify-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasExcess}
                  onChange={(e) => handleHasExcessChange(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">تەنها زیادەی پارە</span>
              </label>
            </div>
          </div>

          {/* نیشاندانی تێبینی کە تەنها پارەدانی گواستنەوە نیشان دەدرێت */}
          <div className="p-3 text-sm text-center text-blue-800 bg-blue-100 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" />
              <span>تەنها دانەوەکانی <strong>گواستنەوە</strong> نیشان دەدرێت</span>
            </div>
          </div>
        </div>

        {/* خشتەی دانەوەکان */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  جۆر
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  لایەن
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  بڕ
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  شێوازی پارەدان
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  دۆخ
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  پسوولە
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  وەرگر
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
              {transferPayments.length > 0 ? (
                transferPayments.map((payment) => (
                  <tr key={payment.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(payment.type)}`}>
                          {getTypeIcon(payment.type)}
                          {getTypeText(payment.type)}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {payment.type === 'customer'
                            ? payment.customer?.name
                            : payment.supplier?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.type === 'customer'
                            ? payment.customer?.phone
                            : payment.supplier?.phone}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center">
                        <span className={`text-lg font-bold ${
                          payment.currency === 'IQD' ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          {formatCurrency(payment.amount, payment.currency)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {payment.currency === 'IQD' ? 'دینار' : 'دۆلار'}
                        </span>
                        {payment.excess_amount > 0 && (
                          <span className="mt-1 text-xs font-medium text-red-600">
                            (زیادە: {formatCurrency(payment.excess_amount, payment.currency)})
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getPaymentMethodColor(payment.payment_method)}`}>
                        {getPaymentMethodIcon(payment.payment_method)}
                        {getPaymentMethodText(payment.payment_method)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        {getStatusText(payment.status)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {payment.attachment ? (
                        <button
                          onClick={() => openImageModal(payment.attachment, `پسوولەی دانەوە #${payment.id}`)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors bg-blue-100 rounded-lg hover:bg-blue-200"
                          title="بینینی پسوولە"
                        >
                          <Image className="w-4 h-4" />
                          پسوولە
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">بێ پسوولە</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{payment.user?.name}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{formatDate(payment.payment_date)}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/payments/${payment.id}`}
                          className="p-2 text-blue-600 transition-colors border border-blue-100 rounded-lg hover:bg-blue-50"
                          title="بینین"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/payments/${payment.id}/edit`}
                          className="p-2 text-green-600 transition-colors border border-green-100 rounded-lg hover:bg-green-50"
                          title="دەستکاری"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(payment.id)}
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
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <RefreshCw className="w-12 h-12 mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900">دانەوەی گواستنەوە نەدۆزرایەوە</h3>
                      <p className="mt-2 text-gray-600">
                        {search || type !== 'all' || status !== 'all' || currency !== 'all' || hasExcess
                          ? 'دانەوەیەکی گواستنەوە بەم فلتەرە نەدۆزرایەوە'
                          : 'هیچ دانەوەیەکی گواستنەوە زیاد نەکراوە'}
                      </p>
                      {!search && type === 'all' && status === 'all' && currency === 'all' && !hasExcess && (
                        <Link
                          href="/payments/create"
                          className="inline-flex items-center gap-2 px-4 py-2 mt-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4" />
                          زیادکردنی دانەوە
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
        {transferPayments.length > 0 && paginationLinks.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Pagination links={paginationLinks} meta={paginationMeta} />
          </div>
        )}
      </Card>

      {/* کارتی ڕێنمایی */}
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <div className="space-y-2 text-sm text-blue-900">
          <h3 className="text-lg font-medium">ڕێنمایی بەکارھێنەر - دانەوەی گواستنەوە</h3>
          <ul className="list-disc list-inside">
            <li>تەنها <strong>دانەوەکانی گواستنەوە</strong> نیشان دەدرێن.</li>
            <li>بۆ زیادکردنی دانەوەی نوێی گواستنەوە، کرتە لەسەر دوگمەی "دانەوەی نوێ" بکە.</li>
            <li>دەتوانیت لە خانەی گەڕان بە ناوی کڕیار یان دابینکەر گەڕان بکەیت.</li>
            <li>فلتەرەکان بۆ جۆر، دۆخ، دراوە و زیادەی پارە بەکاربەر بۆ دۆزینەوەی دانەوەکان.</li>
            <li>ئەگەر دانەوەیەک زیادەی پارەی هەبێت، بە ڕەنگی سوور نیشان دەدرێت.</li>
            <li>کرتە لەسەر ناوی کڕیار یان دابینکەر بۆ بینینی وردەکاری زیاتر.</li>
            <li>دەتوانیت پسوولەکانی دانەوەکان ببینی و داگرتن بکەیت.</li>
            <li>بۆ دەستکاری یان سڕینەوەی دانەوە، لە خانەی کردارەکان بەکاربەر بکە.</li>
          </ul>
        </div>
      </Card>
    </AuthenticatedLayout>
  );
}
