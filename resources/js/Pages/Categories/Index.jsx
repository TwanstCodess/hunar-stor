// resources/js/Pages/Categories/Index.jsx
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import { Plus, Edit, Trash2, Package, Search, Image as ImageIcon } from 'lucide-react';

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

// Pagination کۆمپۆنێنت (چارەسەرکراو)
const Pagination = ({ links, meta }) => {
  if (!links || !meta || links.length <= 3) return null;

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-700">
        نیشاندان <span className="font-medium">{meta.from || 0}</span> بۆ{' '}
        <span className="font-medium">{meta.to || 0}</span> لە{' '}
        <span className="font-medium">{meta.total || 0}</span> کاتێگۆری
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

export default function Index({ categories, filters }) {
  const [search, setSearch] = useState(filters?.search || '');

  const handleSearch = (value) => {
    setSearch(value);
    router.get('/categories', { search: value }, {
      preserveState: true,
      replace: true,
    });
  };

  const handleDelete = (id) => {
    if (confirm('دڵنیایت لە سڕینەوەی ئەم کاتێگۆرییە؟')) {
      router.delete(`/categories/${id}`);
    }
  };

  // پشکنین بۆ ئەوەی categories.data هەبێت
  const categoryData = categories?.data || [];

  return (
    <AuthenticatedLayout>
      <PageHeader
        title="کاتێگۆریەکان"
        subtitle="بەڕێوەبردنی کاتێگۆریەکانی بەرهەمەکان"
        action={{
          href: '/categories/create',
          label: 'زیادکردنی کاتێگۆری',
          icon: Plus,
        }}
      />

      <Card className="overflow-hidden border border-gray-200">
        {/* بەشی گەڕان */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="max-w-md">
            <SearchInput
              value={search}
              onChange={handleSearch}
              placeholder="گەڕان بەناوی کاتێگۆری..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase border-b border-gray-200">
                  وێنە
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase border-b border-gray-200">
                  ناوی کاتێگۆری
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase border-b border-gray-200">
                  وەسف
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase border-b border-gray-200">
                  ژمارەی بەرهەمەکان
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase border-b border-gray-200">
                  کردارەکان
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categoryData.length > 0 ? (
                categoryData.map((category) => (
                  <tr
                    key={category.id}
                    className="transition-colors duration-150 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        {category.image ? (
                          <img
                            src={category.image_url || `/storage/${category.image}`}
                            alt={category.name}
                            className="object-cover w-16 h-16 border border-gray-200 rounded-lg"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = `
                                <div class="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-lg border border-gray-200">
                                  <ImageIcon class="w-8 h-8 text-gray-400" />
                                </div>
                              `;
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center w-16 h-16 bg-gray-100 border border-gray-200 rounded-lg">
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{category.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-md text-sm text-gray-600">
                        {category.description ? (
                          <div className="line-clamp-2">{category.description}</div>
                        ) : (
                          <span className="text-gray-400">---</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <Package className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-gray-800">
                          {category.products_count || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/categories/${category.id}/edit`}
                          className="p-2 text-blue-600 transition-colors duration-200 border border-blue-100 rounded-lg hover:bg-blue-50"
                          title="دەستکاری"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(category.id)}
                          disabled={category.products_count > 0}
                          className={`p-2 rounded-lg border transition-colors duration-200 ${
                            category.products_count > 0
                              ? 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                              : 'text-red-600 hover:bg-red-50 border-red-100 hover:border-red-200'
                          }`}
                          title={
                            category.products_count > 0
                              ? 'ناتوانرێت بسڕدرێتەوە چونکە بەرهەمی تێدایە'
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
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="w-12 h-12 mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900">کاتێگۆرییەک نەدۆزرایەوە</h3>
                      <p className="mt-2 text-gray-600">
                        {search ? 'کاتێگۆرییەک بەم ناوە نەدۆزرایەوە' : 'هیچ کاتێگۆرییەک زیاد نەکراوە'}
                      </p>
                      {!search && (
                        <Link
                          href="/categories/create"
                          className="inline-flex items-center gap-2 px-4 py-2 mt-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4" />
                          زیادکردنی کاتێگۆری
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (چارەسەرکراو) */}
        {categoryData.length > 0 && categories?.links && categories?.meta && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Pagination links={categories.links} meta={categories.meta} />
          </div>
        )}
      </Card>
    </AuthenticatedLayout>
  );
}
