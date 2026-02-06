// resources/js/Pages/Units/Edit.jsx
import { useState } from 'react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import FormInput from '@/Components/FormInput';
import FormTextarea from '@/Components/FormTextarea';
import { ArrowRight, Save, Scale, Trash2, AlertTriangle, CheckCircle, Package } from 'lucide-react';

export default function Edit({ unit }) {
  const [data, setData] = useState({
    name: unit.name || '',
    name_en: unit.name_en || '',
    symbol: unit.symbol || '',
    type: unit.type || 'base',
    description: unit.description || '',
    is_active: unit.is_active ?? true,
  });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setProcessing(true);

    router.put(`/units/${unit.id}`, data, {
      onError: (errors) => {
        setErrors(errors);
        setProcessing(false);
      },
    });
  };

  const handleDelete = () => {
    if (confirm('دڵنیایت لە سڕینەوەی ئەم یەکەیە؟ ئەم کردارە ناگەڕێتەوە!')) {
      router.delete(`/units/${unit.id}`);
    }
  };

  const totalUsage = (unit.products_as_base_count || 0) +
                     (unit.products_as_purchase_count || 0) +
                     (unit.products_as_sale_count || 0);
  const isBeingUsed = totalUsage > 0;

  return (
    <AuthenticatedLayout>
      <PageHeader
        title="دەستکاریکردنی یەکە"
        subtitle={`دەستکاریکردنی: ${unit.name}`}
      />

      <div className="max-w-3xl">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* سەرپەڕە */}
            <div className="flex items-center gap-3 p-4 border border-blue-200 rounded-lg bg-blue-50">
              <Scale className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-900">زانیاری یەکە</h3>
                <p className="text-sm text-blue-700">زانیاری یەکە دەستکاری بکە</p>
              </div>
            </div>

            {/* زانیاری سەرەکی */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormInput
                    className="block w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

                label="ناوی یەکە (کوردی)"
                value={data.name}
                onChange={(value) => setData({ ...data, name: value })}
                error={errors.name}
                required
                placeholder="دانە، کارتۆن، کیلۆ..."
              />

              <FormInput
                    className="block w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

                label="ناوی یەکە (ئینگلیزی)"
                value={data.name_en}
                onChange={(value) => setData({ ...data, name_en: value })}
                error={errors.name_en}
                placeholder="Piece, Carton, Kilogram..."
              />

              <FormInput
                    className="block w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

                label="نیشانە (Symbol)"
                value={data.symbol}
                onChange={(value) => setData({ ...data, symbol: value })}
                error={errors.symbol}
                placeholder="pcs, ctn, kg..."
                maxLength={10}
              />

              {/* جۆری یەکە */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  جۆری یەکە <span className="text-red-500">*</span>
                </label>
                <select
                  value={data.type}
                  onChange={(e) => setData({ ...data, type: e.target.value })}
                  className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="base">یەکەی بنەڕەت</option>
                  <option value="packed">یەکەی پاکەجکراو</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type}</p>
                )}
              </div>
            </div>

            {/* وەسف */}
            <FormTextarea
              label="وەسف"
                    className="block w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

              value={data.description}
              onChange={(value) => setData({ ...data, description: value })}
              error={errors.description}
              placeholder="وەسفی یەکە بنووسە..."
              rows={3}
            />

            {/* دۆخی چالاکی */}
            <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <input
                type="checkbox"
                id="is_active"
                checked={data.is_active}
                onChange={(e) => setData({ ...data, is_active: e.target.checked })}
                className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <label htmlFor="is_active" className="block font-medium text-gray-700 cursor-pointer">
                  یەکە چالاکە
                </label>
                <p className="mt-1 text-sm text-gray-600">
                  یەکەی ناچالاک ناتوانرێت لە بەرهەمە نوێیەکان بەکاربهێنرێت
                </p>
              </div>
              {data.is_active && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </div>

            {/* ئاماری بەکارهێنان */}
            {isBeingUsed && (
              <Card className="border-blue-200 bg-blue-50">
                <h4 className="flex items-center gap-2 mb-3 font-semibold text-blue-900">
                  <Package className="w-5 h-5" />
                  ئاماری بەکارهێنان
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 text-center bg-white border border-blue-200 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {unit.products_as_base_count || 0}
                    </div>
                    <div className="mt-1 text-sm text-blue-700">یەکەی بنەڕەت</div>
                  </div>
                  <div className="p-4 text-center bg-white border border-blue-200 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {unit.products_as_purchase_count || 0}
                    </div>
                    <div className="mt-1 text-sm text-blue-700">یەکەی کڕین</div>
                  </div>
                  <div className="p-4 text-center bg-white border border-blue-200 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {unit.products_as_sale_count || 0}
                    </div>
                    <div className="mt-1 text-sm text-blue-700">یەکەی فرۆشتن</div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-center text-blue-800">
                  کۆی گشتی: <span className="font-bold">{totalUsage}</span> بەرهەم
                </div>
              </Card>
            )}

            {/* دوگمەکان */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={processing}
                  className="flex items-center gap-2 px-6 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {processing ? 'تکایە چاوەڕێ بە...' : 'نوێکردنەوە'}
                </button>
                <button
                  type="button"
                  onClick={() => router.get('/units')}
                  className="flex items-center gap-2 px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  گەڕانەوە
                </button>
              </div>

              {!isBeingUsed && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-6 py-2.5 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  سڕینەوە
                </button>
              )}
            </div>
          </form>
        </Card>

        {/* ئاگاداری */}
        {isBeingUsed && (
          <Card className="mt-6 border-orange-200 bg-orange-50">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-orange-900">ئاگاداری گرنگ</h4>
                <p className="mt-1 text-sm text-orange-700">
                  ئەم یەکەیە لە <span className="font-bold">{totalUsage}</span> بەرهەمدا بەکاردێت.
                  سڕینەوەی لەم حاڵەتەدا ڕێگەپێنەدراوە بۆ پاراستنی یەکڕێزی داتاکان.
                </p>
                <p className="mt-2 text-xs text-orange-600">
                  بۆ سڕینەوەی ئەم یەکەیە، سەرەتا پێویستە هەموو بەرهەمەکان لە یەکەیەکی تر بەکاربهێنیت.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
