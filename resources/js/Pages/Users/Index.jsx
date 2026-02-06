import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import { Plus, Edit, Trash2, Search, User, ShieldCheck, Users as UsersIcon } from 'lucide-react';

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
        <span className="font-medium">{meta.total}</span> بەکارهێنەر
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

export default function Index({ users, filters }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [role, setRole] = useState(filters?.role || 'all');

  const handleSearch = (value) => {
    setSearch(value);
    applyFilters({ search: value, role });
  };

  const handleRoleChange = (value) => {
    setRole(value);
    applyFilters({ search, role: value });
  };

  const applyFilters = (filters) => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.role && filters.role !== 'all') params.role = filters.role;

    router.get('/users', params, {
      preserveState: true,
      replace: true,
    });
  };

  const handleDelete = (id) => {
    if (confirm('دڵنیایت لە سڕینەوەی ئەم بەکارهێنەرە؟')) {
      router.delete(`/users/${id}`);
    }
  };

  const userData = users?.data || [];

  return (
    <AuthenticatedLayout>
      <PageHeader
        title="بەکارهێنەران"
        subtitle="بەڕێوەبردنی بەکارهێنەرانی سیستەمەکە"
        action={{
          href: '/users/create',
          label: 'زیادکردنی بەکارهێنەر',
          icon: Plus,
        }}
      />

      <Card className="overflow-hidden border border-gray-200">
        {/* بەشی گەڕان و فلتەرەکان */}
        <div className="px-6 py-4 space-y-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* گەڕان */}
            <SearchInput
              value={search}
              onChange={handleSearch}
              placeholder="گەڕان بە ناو یان ئیمەیڵ..."
            />

            {/* فلتەری ڕۆڵ */}
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">هەموو ڕۆڵەکان</option>
              <option value="admin">ئەدمین</option>
              <option value="user">بەکارهێنەر</option>
            </select>
          </div>
        </div>

        {/* خشتەی بەکارهێنەران */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  ناو
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  ئیمەیڵ
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  ڕۆڵ
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  بەرواری دروستکردن
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  کردارەکان
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userData.length > 0 ? (
                userData.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                          <span className="text-sm font-semibold text-white">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-600">{user.email}</span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role === 'admin' ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            ئەدمین
                          </>
                        ) : (
                          <>
                            <User className="w-3.5 h-3.5" />
                            بەکارهێنەر
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString('ar-IQ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/users/${user.id}/edit`}
                          className="p-2 text-blue-600 transition-colors border border-blue-100 rounded-lg hover:bg-blue-50"
                          title="دەستکاری"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={user.id === window.auth?.user?.id}
                          className={`p-2 rounded-lg border transition-colors ${
                            user.id === window.auth?.user?.id
                              ? 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                              : 'text-red-600 hover:bg-red-50 border-red-100'
                          }`}
                          title={
                            user.id === window.auth?.user?.id
                              ? 'ناتوانیت خۆت بسڕیتەوە'
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
                      <UsersIcon className="w-12 h-12 mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900">بەکارهێنەرێک نەدۆزرایەوە</h3>
                      <p className="mt-2 text-gray-600">
                        {search || role !== 'all'
                          ? 'بەکارهێنەرێک بەم فلتەرە نەدۆزرایەوە'
                          : 'هیچ بەکارهێنەرێک زیاد نەکراوە'}
                      </p>
                      {!search && role === 'all' && (
                        <Link
                          href="/users/create"
                          className="inline-flex items-center gap-2 px-4 py-2 mt-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4" />
                          زیادکردنی بەکارهێنەر
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
        {userData.length > 0 && users?.links && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Pagination links={users.links} meta={users.meta} />
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
                <strong>ئەدمین:</strong> دەتوانێت هەموو بەکارهێنەران بەڕێوەببات و ڕێکخستنەکانی سیستەم بگۆڕێت
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <div>
                <strong>بەکارهێنەر:</strong> دەتوانێت بەرهەمەکان، کڕین و فرۆشتن بەڕێوەببات
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <div>
                ناتوانیت بەکارهێنەرێک بسڕیتەوە کە پەیوەندی بە کردارەکانی سیستەمەوە هەیە
              </div>
            </div>
          </div>
        </div>
      </Card>
    </AuthenticatedLayout>
  );
}
