import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import { Plus, Edit, Trash2, Search, Package, AlertTriangle, BarChart, DollarSign, Image as ImageIcon, Tag, Hash, Barcode, Box, Layers } from 'lucide-react';

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

// Pagination کۆمپۆنێنت (چارەسەرکراو)
const Pagination = ({ links, meta }) => {
  if (!links || !meta || links.length <= 3) return null;

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-700">
        نیشاندان <span className="font-medium">{meta.from || 0}</span> بۆ{' '}
        <span className="font-medium">{meta.to || 0}</span> لە{' '}
        <span className="font-medium">{meta.total || 0}</span> بەرهەم
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
const StatCard = ({ title, value, subtitle, icon: Icon, color }) => {
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <Card className={`border-${color}-200 bg-${color}-50`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium text-${color}-600`}>{title}</p>
          <p className={`mt-2 text-2xl font-bold text-${color}-900`}>
            {subtitle ? `${formatNumber(value)} ${subtitle}` : formatNumber(value)}
          </p>
        </div>
        <div className={`p-3 bg-${color}-100 rounded-full`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </Card>
  );
};

// StatusBadge کۆمپۆنێنت
const StatusBadge = ({ product }) => {
  if (product.track_stock && product.quantity <= product.min_stock_level) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full">
        <AlertTriangle className="w-3 h-3" />
        کەمبوونەوە
      </span>
    );
  }

  if (product.quantity === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-100 rounded-full">
        تەواو بووە
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
      بەردەستە
    </span>
  );
};

export default function Index({ products, categories, stats, filters }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [categoryId, setCategoryId] = useState(filters?.category_id || '');
  const [lowStock, setLowStock] = useState(filters?.low_stock || false);

  const handleSearch = (value) => {
    setSearch(value);
    applyFilters({ search: value, category_id: categoryId, low_stock: lowStock });
  };

  const handleCategoryChange = (value) => {
    setCategoryId(value);
    applyFilters({ search, category_id: value, low_stock: lowStock });
  };

  const handleLowStockToggle = () => {
    const newValue = !lowStock;
    setLowStock(newValue);
    applyFilters({ search, category_id: categoryId, low_stock: newValue });
  };

  const applyFilters = (filters) => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.category_id) params.category_id = filters.category_id;
    if (filters.low_stock) params.low_stock = filters.low_stock;

    router.get('/products', params, {
      preserveState: true,
      replace: true,
    });
  };

  const handleDelete = async (id) => {
    if (confirm('دڵنیایت لە سڕینەوەی ئەم بەرهەمە؟ ئەم کردارە گەڕانەوەی نییە!')) {
      try {
        const response = await router.delete(`/products/${id}`);

        if (response?.props?.flash?.error) {
          alert(response.props.flash.error);
        }
      } catch (error) {
        console.error('هەڵە لە سڕینەوە:', error);
      }
    }
  };

  // Format numbers in English
  const formatNumber = (number) => {
    if (number === null || number === undefined || isNaN(number)) return '0';
    return new Intl.NumberFormat('en-US').format(number);
  };

  // Format currency - ONLY NUMBERS in English
  const formatCurrency = (amount, currency) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '0';

    try {
      const numAmount = Number(amount);
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(numAmount);

      return currency === 'IQD' ? `${formatted} دینار` : `$${formatted}`;
    } catch (error) {
      console.error('Format error:', error, amount);
      return '0';
    }
  };

  const productData = products?.data || [];

  return (
    <AuthenticatedLayout>
      <PageHeader
        title="بەرهەمەکان"
        subtitle="بەڕێوەبردنی هەموو بەرهەمەکان"
        action={{
          href: '/products/create',
          label: 'زیادکردنی بەرهەم',
          icon: Plus,
        }}
      />

      {/* کارتەکانی ئامار */}
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="کۆی بەرهەمەکان"
          value={stats?.total_products || 0}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="کۆی بڕی بەرهەم"
          value={stats?.total_stock || 0}
          subtitle=""
          icon={BarChart}
          color="green"
        />
        <StatCard
          title="کەمی ستۆک"
          value={stats?.low_stock_count || 0}
          subtitle="بەرهەم"
          icon={AlertTriangle}
          color="red"
        />
        {/* <StatCard
          title="نرخی گشتی ستۆک"
          value={stats?.stock_value_iqd || 0}
          subtitle="دینار"
          icon={DollarSign}
          color="purple"
        /> */}
      </div>

      <Card className="overflow-hidden border border-gray-200">
        {/* بەشی گەڕان و فلتەرەکان */}
        <div className="px-6 py-4 space-y-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* گەڕان */}
            <SearchInput
              value={search}
              onChange={handleSearch}
              placeholder="گەڕان بە ناو، کۆد یان بارکۆد..."
            />

            {/* فلتەری کاتێگۆری */}
            <select
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">هەموو کاتێگۆریەکان</option>
              {categories?.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>

            {/* فلتەری ستۆکی کەم */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="low-stock"
                checked={lowStock}
                onChange={handleLowStockToggle}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="low-stock" className="text-sm font-medium text-gray-700">
                تەنها بەرهەمە کەمبوونەوەکان
              </label>
            </div>

            {/* دوگمەی پاککردنەوەی فلتەرەکان */}
            {(search || categoryId || lowStock) && (
              <button
                onClick={() => {
                  setSearch('');
                  setCategoryId('');
                  setLowStock(false);
                  router.get('/products');
                }}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                پاککردنەوەی فلتەرەکان
              </button>
            )}
          </div>
        </div>

        {/* خشتەی بەرهەمەکان */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  وێنە
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  ناو
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  کۆد
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  کاتێگۆری
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  یەکە
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  ستۆک
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  نرخی کڕین
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  نرخی فرۆشتن
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  کردارەکان
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productData.length > 0 ? (
                productData.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-gray-50">
                    {/* وێنە */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="object-cover w-12 h-12 rounded-lg"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=4F46E5&color=fff&size=48`;
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* ناو */}
                    <td className="px-6 py-4">
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="mt-1">
                          <StatusBadge product={product} />
                        </div>
                        {product.description && (
                          <div className="mt-1 text-xs text-gray-500 line-clamp-2">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* کۆد */}
                    <td className="px-6 py-4 text-center">
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1">
                          <Hash className="w-4 h-4 text-gray-400" />
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {product.code}
                          </span>
                        </div>
                        {product.barcode && (
                          <div className="flex items-center justify-center gap-1">
                            <Barcode className="w-4 h-4 text-gray-400" />
                            <span className="font-mono text-xs text-gray-500">
                              {product.barcode}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* کاتێگۆری */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Tag className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-700">
                          {product.category?.name || '---'}
                        </span>
                      </div>
                    </td>

                    {/* یەکە */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <Box className="w-4 h-4 text-purple-500" />
                        <span className="text-sm text-gray-700">
                          {product.base_unit?.name || 'دانە'}
                        </span>
                        {(product.purchase_unit_id !== product.base_unit_id || product.sale_unit_id !== product.base_unit_id) && (
                          <div className="mt-1 text-xs text-gray-500">
                            {product.purchase_unit_id !== product.base_unit_id && (
                              <div className="flex items-center gap-1">
                                <span>کڕین: {product.purchase_unit?.name}</span>
                              </div>
                            )}
                            {product.sale_unit_id !== product.base_unit_id && (
                              <div className="flex items-center gap-1">
                                <span>فرۆشتن: {product.sale_unit?.name}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* ستۆک */}
                    <td className="px-6 py-4 text-center">
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1">
                          <Layers className="w-4 h-4 text-green-500" />
                          <div className={`text-lg font-bold ${
                            product.track_stock && product.quantity <= product.min_stock_level
                              ? 'text-red-600'
                              : product.quantity === 0
                              ? 'text-gray-600'
                              : 'text-green-600'
                          }`}>
                            {formatNumber(product.quantity)}
                          </div>
                        </div>
                        {product.track_stock && (
                          <div className="text-xs text-gray-500">
                            کەمترین: {formatNumber(product.min_stock_level)}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* نرخی کڕین */}
                    <td className="px-6 py-4 text-center">
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded">
                            {formatCurrency(product.purchase_price_iqd, 'IQD')}
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <DollarSign className="w-3 h-3 text-green-600" />
                          <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded">
                            {formatCurrency(product.purchase_price_usd, 'USD')}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* نرخی فرۆشتن */}
                    <td className="px-6 py-4 text-center">
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <span className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded">
                            {formatCurrency(product.selling_price_iqd, 'IQD')}
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <DollarSign className="w-3 h-3 text-green-600" />
                          <span className="px-2 py-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded">
                            {formatCurrency(product.selling_price_usd, 'USD')}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* کردارەکان */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/products/${product.id}/edit`}
                          className="p-2 text-blue-600 transition-colors border border-blue-100 rounded-lg hover:bg-blue-50"
                          title="دەستکاری"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
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
                      <Package className="w-12 h-12 mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900">بەرهەم نەدۆزرایەوە</h3>
                      <p className="mt-2 text-gray-600">
                        {search || categoryId || lowStock
                          ? 'بەرهەمێک بەم فلتەرە نەدۆزرایەوە'
                          : 'هیچ بەرهەمێک تۆمار نەکراوە'}
                      </p>
                      {!search && !categoryId && !lowStock && (
                        <Link
                          href="/products/create"
                          className="inline-flex items-center gap-2 px-4 py-2 mt-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4" />
                          زیادکردنی بەرهەم
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
        {productData.length > 0 && products?.links && products?.meta && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Pagination links={products.links} meta={products.meta} />
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
                <strong>ئاگاداری ستۆکی کەم:</strong> بەرهەمەکان کە بڕیان لە کەمترین سنوور کەمترە، بە ڕەنگی سوور نیشان دەدرێن
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <div>
                <strong>سیستەمی یەکە:</strong> هەر بەرهەمێک دەتوانێت یەکەی جیاوازی بۆ کڕین و فرۆشتن هەبێت
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <div>
                دەتوانیت بەرهەمەکان بە ناو، کۆد، بارکۆد، کاتێگۆری و ستۆکی کەم گەڕان بکەیت
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <div>
                <strong>پەنجەی پێوەندی:</strong> کلیک لەسەر دەستکاری بکە بۆ بینینی تەواوی زانیاری و ڕێژەی گۆڕینی یەکەکان
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <div>
                <strong>نرخەکان:</strong> نرخی کڕین بە ڕەنگی سوور، نرخی فرۆشتن بە ڕەنگی شین و سەوز نیشان دەدرێن
              </div>
            </div>
          </div>
        </div>
      </Card>
    </AuthenticatedLayout>
  );
}
