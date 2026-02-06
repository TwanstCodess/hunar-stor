// resources/js/Pages/Units/Index.jsx
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import { Plus, Edit, Trash2, GitBranch, CheckCircle, XCircle, Search, Package } from 'lucide-react';

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
        <span className="font-medium">{meta.total}</span> یەکە
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

export default function Index({ units, filters }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [type, setType] = useState(filters?.type || 'all');
  const [isActive, setIsActive] = useState(filters?.is_active || 'all');

  const handleSearch = (value) => {
    setSearch(value);
    applyFilters({ search: value, type, is_active: isActive });
  };

  const handleTypeChange = (value) => {
    setType(value);
    applyFilters({ search, type: value, is_active: isActive });
  };

  const handleStatusChange = (value) => {
    setIsActive(value);
    applyFilters({ search, type, is_active: value });
  };

  const applyFilters = (filters) => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.type && filters.type !== 'all') params.type = filters.type;
    if (filters.is_active && filters.is_active !== 'all') params.is_active = filters.is_active;

    router.get('/units', params, {
      preserveState: true,
      replace: true,
    });
  };

  const handleDelete = (id) => {
    if (confirm('دڵنیایت لە سڕینەوەی ئەم یەکەیە؟')) {
      router.delete(`/units/${id}`);
    }
  };

  const unitData = units?.data || [];

  return (
    <AuthenticatedLayout>
      <PageHeader
        title="یەکەکان"
        subtitle="بەڕێوەبردنی یەکەکان و گۆڕینەکانیان"
        action={{
          href: '/units/create',
          label: 'زیادکردنی یەکە',
          icon: Plus,
        }}
      />

      <Card className="overflow-hidden border border-gray-200">
        {/* بەشی گەڕان و فلتەرەکان */}
        <div className="px-6 py-4 space-y-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* گەڕان */}
            <SearchInput
              value={search}
              onChange={handleSearch}
              placeholder="گەڕان بەناو، نیشانە یان ئینگلیزی..."
            />

            {/* فلتەری جۆر */}
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">هەموو جۆرەکان</option>
              <option value="base">یەکەی بنەڕەت</option>
              <option value="packed">یەکەی پاکەجکراو</option>
            </select>

            {/* فلتەری دۆخ */}
            <select
              value={isActive}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">هەموو دۆخەکان</option>
              <option value="1">چالاک</option>
              <option value="0">ناچالاک</option>
            </select>
          </div>
        </div>

        {/* خشتەی یەکەکان */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  ناوی یەکە
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  ئینگلیزی
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  نیشانە
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  جۆر
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  دۆخ
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  بەکارهێنان
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  کردارەکان
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {unitData.length > 0 ? (
                unitData.map((unit) => (
                  <tr key={unit.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{unit.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-600">{unit.name_en || '---'}</span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {unit.symbol ? (
                        <span className="inline-block px-2 py-1 font-mono text-sm text-gray-700 bg-gray-100 rounded">
                          {unit.symbol}
                        </span>
                      ) : (
                        <span className="text-gray-400">---</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        unit.type === 'base'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {unit.type === 'base' ? 'بنەڕەت' : 'پاکەج'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {unit.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          چالاک
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                          <XCircle className="w-3 h-3" />
                          ناچالاک
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-center text-gray-600">
                        <div className="flex items-center justify-center gap-1">
                          <Package className="w-4 h-4 text-blue-500" />
                          <span className="font-semibold">
                            {(unit.products_as_base_count || 0) +
                             (unit.products_as_purchase_count || 0) +
                             (unit.products_as_sale_count || 0)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/units/${unit.id}/conversions`}
                          className="p-2 text-purple-600 transition-colors border border-purple-100 rounded-lg hover:bg-purple-50"
                          title="گۆڕینەکان"
                        >
                          <GitBranch className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/units/${unit.id}/edit`}
                          className="p-2 text-blue-600 transition-colors border border-blue-100 rounded-lg hover:bg-blue-50"
                          title="دەستکاری"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(unit.id)}
                          disabled={
                            (unit.products_as_base_count || 0) > 0 ||
                            (unit.products_as_purchase_count || 0) > 0 ||
                            (unit.products_as_sale_count || 0) > 0
                          }
                          className={`p-2 rounded-lg border transition-colors ${
                            (unit.products_as_base_count || 0) > 0 ||
                            (unit.products_as_purchase_count || 0) > 0 ||
                            (unit.products_as_sale_count || 0) > 0
                              ? 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                              : 'text-red-600 hover:bg-red-50 border-red-100'
                          }`}
                          title={
                            (unit.products_as_base_count || 0) > 0 ||
                            (unit.products_as_purchase_count || 0) > 0 ||
                            (unit.products_as_sale_count || 0) > 0
                              ? 'ناتوانرێت بسڕدرێتەوە چونکە بەکاردێت'
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
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="w-12 h-12 mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900">یەکەیەک نەدۆزرایەوە</h3>
                      <p className="mt-2 text-gray-600">
                        {search || type !== 'all' || isActive !== 'all'
                          ? 'یەکەیەک بەم فلتەرە نەدۆزرایەوە'
                          : 'هیچ یەکەیەک زیاد نەکراوە'}
                      </p>
                      {!search && type === 'all' && isActive === 'all' && (
                        <Link
                          href="/units/create"
                          className="inline-flex items-center gap-2 px-4 py-2 mt-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4" />
                          زیادکردنی یەکە
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
        {unitData.length > 0 && units?.links && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Pagination links={units.links} meta={units.meta} />
          </div>
        )}
      </Card>

      {/* کارتی ڕێنمایی */}
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <div className="space-y-2 text-sm">
          <h3 className="mb-3 font-semibold text-blue-900">📌 چۆنیەتی بەکارهێنان:</h3>
          <div className="space-y-2 text-blue-800">
            <div className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <div>
                <strong>یەکەی بنەڕەت:</strong> یەکەی سەرەکی بۆ هەڵگرتنی بڕ (وەک دانە، کیلۆ، لیتر)
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <div>
                <strong>یەکەی پاکەج:</strong> یەکەی کۆکراوە بۆ کڕین و فرۆشتن (وەک کارتۆن، سندوق، پاکێت)
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <div>
                <strong>نموونە:</strong> کڕین بە کارتۆن (1 کارتۆن = 24 دانە)، فرۆشتن بە دانە
              </div>
            </div>
          </div>
        </div>
      </Card>
    </AuthenticatedLayout>
  );
}
