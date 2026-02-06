import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import { ArrowRight, Save, AlertCircle, Upload, DollarSign, X } from 'lucide-react';

export default function Edit({ product, categories, units }) {
  const [data, setData] = useState({
    category_id: product.category_id || '',
    name: product.name || '',
    code: product.code || '',
    barcode: product.barcode || '',
    base_unit_id: product.base_unit_id || '',
    purchase_unit_id: product.purchase_unit_id || '',
    sale_unit_id: product.sale_unit_id || '',
    purchase_to_base_factor: product.purchase_to_base_factor || 1,
    sale_to_base_factor: product.sale_to_base_factor || 1,
    purchase_price_iqd: product.purchase_price_iqd || 0,
    purchase_price_usd: product.purchase_price_usd || 0,
    selling_price_iqd: product.selling_price_iqd || 0,
    selling_price_usd: product.selling_price_usd || 0,
    quantity: product.quantity || 0,
    min_stock_level: product.min_stock_level || 20,
    track_stock: product.track_stock || true,
    description: product.description || '',
    image: null,
    remove_image: false,
  });

  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(product.image_url || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // کاتێک یەکەی بنەڕەت دەگۆڕێت، ئەوانی تریش نوێ بکەرەوە
  useEffect(() => {
    if (data.base_unit_id && !data.purchase_unit_id) {
      setData(prev => ({ ...prev, purchase_unit_id: data.base_unit_id }));
    }
    if (data.base_unit_id && !data.sale_unit_id) {
      setData(prev => ({ ...prev, sale_unit_id: data.base_unit_id }));
    }
  }, [data.base_unit_id]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);

    const formData = new FormData();

    // زیادکردنی هەموو فیلدەکان بە شێوەی دروست
    formData.append('_method', 'PUT');
    formData.append('category_id', data.category_id || '');
    formData.append('name', data.name || '');
    formData.append('code', data.code || '');
    formData.append('barcode', data.barcode || '');
    formData.append('base_unit_id', data.base_unit_id || '');
    formData.append('purchase_unit_id', data.purchase_unit_id || data.base_unit_id || '');
    formData.append('sale_unit_id', data.sale_unit_id || data.base_unit_id || '');
    formData.append('purchase_to_base_factor', data.purchase_to_base_factor || 1);
    formData.append('sale_to_base_factor', data.sale_to_base_factor || 1);
    formData.append('purchase_price_iqd', data.purchase_price_iqd || 0);
    formData.append('purchase_price_usd', data.purchase_price_usd || 0);
    formData.append('selling_price_iqd', data.selling_price_iqd || 0);
    formData.append('selling_price_usd', data.selling_price_usd || 0);
    formData.append('quantity', data.quantity || 0);
    formData.append('min_stock_level', data.min_stock_level || 20);
    formData.append('track_stock', data.track_stock ? '1' : '0');
    formData.append('description', data.description || '');
    formData.append('remove_image', data.remove_image ? '1' : '0');

    if (data.image instanceof File) {
      formData.append('image', data.image);
    }

    router.post(`/products/${product.id}`, formData, {
      onError: (errors) => {
        console.error('هەڵەکان:', errors);
        setErrors(errors);
        setIsSubmitting(false);
      },
      onSuccess: () => {
        setIsSubmitting(false);
      },
      preserveScroll: true,
      forceFormData: true,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setData({ ...data, image: file, remove_image: false });

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setData({ ...data, image: null, remove_image: true });
    setPreviewImage(null);
  };

  const generateBarcode = () => {
    const barcode = 'BRC-' + Date.now().toString().slice(-8);
    setData({ ...data, barcode });
  };

  const handleInputChange = (field, value) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const selectedBaseUnit = units.find(u => u.id == data.base_unit_id);
  const selectedPurchaseUnit = units.find(u => u.id == data.purchase_unit_id);
  const selectedSaleUnit = units.find(u => u.id == data.sale_unit_id);

  return (
    <AuthenticatedLayout>
      <PageHeader
        title="دەستکاریکردنی بەرهەم"
        subtitle={`دەستکاریکردنی: ${product.name}`}
      />

      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ستونی چەپ - زانیاری سەرەکی */}
          <div className="space-y-6 lg:col-span-2">
            {/* زانیاری بنەڕەتی */}
            <Card>
              <h3 className="pb-3 mb-6 text-lg font-semibold border-b border-gray-200">
                زانیاری بنەڕەتی
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* کاتێگۆری */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      کاتێگۆری *
                    </label>
                    <select
                      value={data.category_id}
                      onChange={(e) => handleInputChange('category_id', e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.category_id ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">هەڵبژێرە</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    {errors.category_id && (
                      <p className="mt-1 text-xs text-red-600">{errors.category_id}</p>
                    )}
                  </div>

                  {/* کۆد */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      کۆدی بەرهەم *
                    </label>
                    <input
                      type="text"
                      value={data.code}
                      onChange={(e) => handleInputChange('code', e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.code ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="PRD-001"
                      required
                    />
                    {errors.code && (
                      <p className="mt-1 text-xs text-red-600">{errors.code}</p>
                    )}
                  </div>
                </div>

                {/* ناوی بەرهەم */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    ناوی بەرهەم *
                  </label>
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="چەمەنتۆ"
                    required
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* بارکۆد */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      کۆدی بارکۆد
                    </label>
                    <button
                      type="button"
                      onClick={generateBarcode}
                      className="px-3 py-1 text-xs text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200"
                    >
                      دروستکردنی بارکۆد
                    </button>
                  </div>
                  <input
                    type="text"
                    value={data.barcode}
                    onChange={(e) => handleInputChange('barcode', e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.barcode ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="123456789012"
                  />
                  {errors.barcode && (
                    <p className="mt-1 text-xs text-red-600">{errors.barcode}</p>
                  )}
                </div>

                {/* وەسف */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    وەسف
                  </label>
                  <textarea
                    value={data.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows="3"
                    className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="وەسفی کورت..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-xs text-red-600">{errors.description}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* سیستەمی یەکەکان */}
            <Card>
              <h3 className="pb-3 mb-6 text-lg font-semibold border-b border-gray-200">
                سیستەمی یەکەکان
              </h3>

              {/* کارتی ڕێنمایی */}
              <div className="p-4 mb-6 border border-blue-200 rounded-lg bg-blue-50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="mb-2 font-semibold">چۆنیەتی کارکردنی سیستەمی یەکەکان:</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">•</span>
                        <span><strong>یەکەی بنەڕەت:</strong> یەکەی سەرەکی بۆ هەڵگرتنی بڕ (وەک دانە)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">•</span>
                        <span><strong>یەکەی کڕین:</strong> بەم شێوەیە دەکڕیت (وەک کارتۆن)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">•</span>
                        <span><strong>یەکەی فرۆشتن:</strong> بەم شێوەیە دەفرۆشیت (وەک پاکێت)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* یەکەکان */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* یەکەی بنەڕەت */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    یەکەی بنەڕەت *
                  </label>
                  <select
                    value={data.base_unit_id}
                    onChange={(e) => handleInputChange('base_unit_id', e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.base_unit_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">هەڵبژێرە</option>
                    {units.map(unit => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name} ({unit.symbol})
                      </option>
                    ))}
                  </select>
                  {errors.base_unit_id && (
                    <p className="mt-1 text-xs text-red-600">{errors.base_unit_id}</p>
                  )}
                </div>

                {/* یەکەی کڕین */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    یەکەی کڕین
                  </label>
                  <select
                    value={data.purchase_unit_id}
                    onChange={(e) => handleInputChange('purchase_unit_id', e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.purchase_unit_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={!data.base_unit_id}
                  >
                    <option value="">وەک بنەڕەت</option>
                    {units.map(unit => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name} ({unit.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                {/* یەکەی فرۆشتن */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    یەکەی فرۆشتن
                  </label>
                  <select
                    value={data.sale_unit_id}
                    onChange={(e) => handleInputChange('sale_unit_id', e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.sale_unit_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={!data.base_unit_id}
                  >
                    <option value="">وەک بنەڕەت</option>
                    {units.map(unit => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name} ({unit.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ڕێژەی گۆڕین */}
              {(data.purchase_unit_id && data.purchase_unit_id !== data.base_unit_id) && (
                <div className="p-4 mt-6 border border-purple-200 rounded-lg bg-purple-50">
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    ڕێژەی گۆڕینی کڕین
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">1 {selectedPurchaseUnit?.name} =</span>
                    <input
                      type="number"
                      step="0.000001"
                      min="0.000001"
                      value={data.purchase_to_base_factor}
                      onChange={(e) => handleInputChange('purchase_to_base_factor', e.target.value)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium">{selectedBaseUnit?.name}</span>
                  </div>
                  <p className="mt-2 text-xs text-purple-700">
                    نموونە: 1 کارتۆن = 24 دانە
                  </p>
                  {errors.purchase_to_base_factor && (
                    <p className="mt-1 text-xs text-red-600">{errors.purchase_to_base_factor}</p>
                  )}
                </div>
              )}

              {(data.sale_unit_id && data.sale_unit_id !== data.base_unit_id) && (
                <div className="p-4 mt-4 border border-green-200 rounded-lg bg-green-50">
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    ڕێژەی گۆڕینی فرۆشتن
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">1 {selectedSaleUnit?.name} =</span>
                    <input
                      type="number"
                      step="0.000001"
                      min="0.000001"
                      value={data.sale_to_base_factor}
                      onChange={(e) => handleInputChange('sale_to_base_factor', e.target.value)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium">{selectedBaseUnit?.name}</span>
                  </div>
                  {errors.sale_to_base_factor && (
                    <p className="mt-1 text-xs text-red-600">{errors.sale_to_base_factor}</p>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* ستونی ڕاست - وێنە و نرخەکان */}
          <div className="space-y-6">
            {/* وێنەی بەرهەم */}
            <Card>
              <h3 className="pb-3 mb-6 text-lg font-semibold border-b border-gray-200">
                وێنەی بەرهەم
              </h3>

              <div className="text-center">
                {previewImage ? (
                  <div className="relative">
                    <img
                      src={previewImage}
                      alt="پێشبینینی وێنە"
                      className="object-cover w-full h-48 mb-4 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute p-2 text-white bg-red-600 rounded-full top-2 right-2 hover:bg-red-700"
                      title="سڕینەوەی وێنە"
                    >
                      <X className="w-4 h-4" />
                    </button>

                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 transition-colors border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500">
                    <Upload className="w-12 h-12 mb-4 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-600">راکێشە یان کلیک بکە بۆ هەڵبژاردنی وێنە</p>
                    <p className="text-xs text-gray-500">JPG, PNG یان WEBP (بەرزی 2MB)</p>
                  </div>
                )}

                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                <label
                  htmlFor="image"
                  className={`inline-flex items-center gap-2 px-4 py-2 mt-4 text-sm font-medium rounded-lg cursor-pointer ${
                    previewImage
                      ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                      : 'text-white bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  {previewImage ? 'گۆڕینی وێنە' : 'هەڵبژاردنی وێنە'}
                </label>

                {errors.image && (
                  <p className="mt-2 text-xs text-red-600">{errors.image}</p>
                )}
              </div>
            </Card>

            {/* نرخەکان */}
            <Card>
              <h3 className="pb-3 mb-6 text-lg font-semibold border-b border-gray-200">
                نرخەکان
              </h3>

              <div className="space-y-6">
                {/* نرخی کڕین */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-5 h-5 text-red-600" />
                    <h4 className="text-sm font-semibold text-gray-700">نرخی کڕین</h4>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block mb-1.5 text-xs font-medium text-gray-600">
                        دینار (IQD) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.purchase_price_iqd}
                        onChange={(e) => handleInputChange('purchase_price_iqd', e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.purchase_price_iqd ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                        required
                      />
                      {errors.purchase_price_iqd && (
                        <p className="mt-1 text-xs text-red-600">{errors.purchase_price_iqd}</p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1.5 text-xs font-medium text-gray-600">
                        دۆلار (USD) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.purchase_price_usd}
                        onChange={(e) => handleInputChange('purchase_price_usd', e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.purchase_price_usd ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                        required
                      />
                      {errors.purchase_price_usd && (
                        <p className="mt-1 text-xs text-red-600">{errors.purchase_price_usd}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* نرخی فرۆشتن */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h4 className="text-sm font-semibold text-gray-700">نرخی فرۆشتن</h4>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block mb-1.5 text-xs font-medium text-gray-600">
                        دینار (IQD) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.selling_price_iqd}
                        onChange={(e) => handleInputChange('selling_price_iqd', e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.selling_price_iqd ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                        required
                      />
                      {errors.selling_price_iqd && (
                        <p className="mt-1 text-xs text-red-600">{errors.selling_price_iqd}</p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1.5 text-xs font-medium text-gray-600">
                        دۆلار (USD) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.selling_price_usd}
                        onChange={(e) => handleInputChange('selling_price_usd', e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.selling_price_usd ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                        required
                      />
                      {errors.selling_price_usd && (
                        <p className="mt-1 text-xs text-red-600">{errors.selling_price_usd}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* ستۆک */}
            <Card>
              <h3 className="pb-3 mb-6 text-lg font-semibold border-b border-gray-200">
                بەڕێوەبردنی ستۆک
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    بڕی ستۆک *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={data.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.quantity ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    بە یەکەی بنەڕەت: {selectedBaseUnit?.name || '---'}
                  </p>
                  {errors.quantity && (
                    <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    سنووری کەمترین ستۆک *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={data.min_stock_level}
                    onChange={(e) => handleInputChange('min_stock_level', e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.min_stock_level ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="20"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    ئاگاداری کاتێک ستۆک کەمتر بوو لەم ژمارەیە
                  </p>
                  {errors.min_stock_level && (
                    <p className="mt-1 text-xs text-red-600">{errors.min_stock_level}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                  <input
                    type="checkbox"
                    id="track_stock"
                    checked={data.track_stock}
                    onChange={(e) => handleInputChange('track_stock', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="track_stock" className="text-sm font-medium text-gray-700">
                    چاودێری ستۆک بکە
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  ئەگەر ناچالاک بکەیت، ستۆک تۆمار ناکرێت و ئاگاداری کەمبوونەوە نادرێت
                </p>
              </div>
            </Card>

            {/* دوگمەی پاشەکەوت */}
            <Card className="border-green-200 bg-green-50">
              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'تکایە چاوەڕێ بکە...' : 'نوێکردنەوەی بەرهەم'}
                </button>

                <button
                  type="button"
                  onClick={() => router.get('/products')}
                  className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <ArrowRight className="w-4 h-4" />
                  گەڕانەوە بۆ پەنجەی بەرهەمەکان
                </button>
              </div>

              {/* نمایشی هەڵەکان */}
              {Object.keys(errors).length > 0 && (
                <div className="p-3 mt-4 border border-red-200 rounded-lg bg-red-50">
                  <h4 className="mb-2 text-sm font-semibold text-red-700">هەڵەکان:</h4>
                  <ul className="text-xs text-red-600">
                    {Object.entries(errors).map(([field, message]) => (
                      <li key={field} className="flex items-center gap-1">
                        <span className="font-medium">{field}:</span>
                        <span>{Array.isArray(message) ? message[0] : message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </div>
        </div>
      </form>
    </AuthenticatedLayout>
  );
}
