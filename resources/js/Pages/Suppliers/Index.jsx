// resources/js/Pages/Suppliers/Index.jsx
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import { Plus, Edit, Trash2, Eye, Search, Building, Phone, MapPin, DollarSign, Filter } from 'lucide-react';

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
  if (!links || links.length <= 3) return null;

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-700">
        نیشاندان <span className="font-medium">{meta.from}</span> بۆ{' '}
        <span className="font-medium">{meta.to}</span> لە{' '}
        <span className="font-medium">{meta.total}</span> دابینکەر
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

export default function Index({ suppliers, filters }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [showDebtFilter, setShowDebtFilter] = useState(filters?.has_debt || false);

  const handleSearch = (value) => {
    setSearch(value);
    router.get('/suppliers', {
      search: value,
      has_debt: showDebtFilter
    }, {
      preserveState: true,
      replace: true,
    });
  };

  const handleDebtFilter = () => {
    const newValue = !showDebtFilter;
    setShowDebtFilter(newValue);
    router.get('/suppliers', {
      search: search,
      has_debt: newValue
    }, {
      preserveState: true,
      replace: true,
    });
  };

  const handleDelete = (id) => {
    if (confirm('دڵنیایت لە سڕینەوەی ئەم دابینکەرە؟')) {
      router.delete(`/suppliers/${id}`);
    }
  };

  // پشکنین بۆ ئەوەی suppliers.data هەبێت
  const supplierData = suppliers?.data || [];

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('ar-IQ').format(amount) + ' ' + currency;
  };

  return (
    <AuthenticatedLayout>
      <PageHeader
        title="دابینکەران"
        subtitle="بەڕێوەبردنی دابینکەرانی کۆمپانیا"
        action={{
          href: '/suppliers/create',
          label: 'زیادکردنی دابینکەر',
          icon: Plus,
        }}
      />

      <Card className="overflow-hidden border border-gray-200">
        {/* بەشی گەڕان و فیلتەر */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={handleSearch}
                placeholder="گەڕان بەناو، کۆمپانیا یان ژمارە مۆبایل..."
              />
            </div>
            <div className="flex items-center gap-3">
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
                onClick={() => {
                  setSearch('');
                  setShowDebtFilter(false);
                  router.get('/suppliers');
                }}
                className="px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                پاککردنەوە
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase border-b border-gray-200">
                  دابینکەر
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
                  کڕینەکان
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase border-b border-gray-200">
                  کردارەکان
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {supplierData.length > 0 ? (
                supplierData.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="transition-colors duration-150 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 border border-blue-200 rounded-lg">
                          <Building className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{supplier.name}</div>
                          {supplier.company_name && (
                            <div className="mt-1 text-sm text-gray-600">{supplier.company_name}</div>
                          )}
                          {supplier.address && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">{supplier.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        {supplier.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{supplier.phone}</span>
                          </div>
                        )}
                        {supplier.email && (
                          <div className="text-sm text-gray-600 truncate max-w-[200px]">
                            {supplier.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
                        supplier.balance_iqd > 0
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : supplier.balance_iqd < 0
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}>
                        <DollarSign className="w-4 h-4" />
                        {formatCurrency(supplier.balance_iqd || 0, 'IQD')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
                        supplier.balance_usd > 0
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : supplier.balance_usd < 0
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}>
                        <DollarSign className="w-4 h-4" />
                        {formatCurrency(supplier.balance_usd || 0, 'USD')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <div className="px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 border border-blue-200 rounded-full">
                          {supplier.purchases_count || 0} کڕین
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/suppliers/${supplier.id}`}
                          className="p-2 text-green-600 transition-colors duration-200 border border-green-100 rounded-lg hover:bg-green-50 hover:border-green-200"
                          title="بینین"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/suppliers/${supplier.id}/edit`}
                          className="p-2 text-blue-600 transition-colors duration-200 border border-blue-100 rounded-lg hover:bg-blue-50 hover:border-blue-200"
                          title="دەستکاری"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(supplier.id)}
                          disabled={supplier.purchases_count > 0}
                          className={`p-2 rounded-lg border transition-colors duration-200 ${
                            supplier.purchases_count > 0
                              ? 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                              : 'text-red-600 hover:bg-red-50 border-red-100 hover:border-red-200'
                          }`}
                          title={
                            supplier.purchases_count > 0
                              ? 'ناتوانرێت بسڕدرێتەوە چونکە کڕینی تێدایە'
                              : 'سڕینەوە'
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Building className="w-12 h-12 mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900">دابینکەرێک نەدۆزرایەوە</h3>
                      <p className="mt-2 text-gray-600">
                        {search || showDebtFilter
                          ? 'دابینکەرێک بەم مەرجانە نەدۆزرایەوە'
                          : 'هیچ دابینکەرێک زیاد نەکراوە'}
                      </p>
                      {!search && !showDebtFilter && (
                        <Link
                          href="/suppliers/create"
                          className="inline-flex items-center gap-2 px-4 py-2 mt-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4" />
                          زیادکردنی دابینکەر
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
        {supplierData.length > 0 && suppliers?.links && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Pagination links={suppliers.links} meta={suppliers.meta} />
          </div>
        )}
      </Card>
    </AuthenticatedLayout>
  );
}
