// resources/js/Pages/Units/Create.jsx
import { useState } from 'react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import FormInput from '@/Components/FormInput';
import FormTextarea from '@/Components/FormTextarea';
import { ArrowRight, Save, Scale, Package, CheckCircle } from 'lucide-react';

export default function Create() {
  const [data, setData] = useState({
    name: '',
    name_en: '',
    symbol: '',
    type: 'base',
    description: '',
    is_active: true,
  });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setProcessing(true);

    router.post('/units', data, {
      onError: (errors) => {
        setErrors(errors);
        setProcessing(false);
      },
    });
  };

  return (
    <AuthenticatedLayout>
      <PageHeader
        title="زیادکردنی یەکە"
        subtitle="زیادکردنی یەکەیەکی نوێ بۆ سیستەمی بەرهەمەکان"
      />

      <div className="max-w-3xl">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* سەرپەڕە */}
            <div className="flex items-center gap-3 p-4 border border-blue-200 rounded-lg bg-blue-50">
              <Scale className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-900">زانیاری یەکە</h3>
                <p className="text-sm text-blue-700">زانیاری تەواوی یەکە تۆمار بکە</p>
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
                <p className="mt-1 text-xs text-gray-500">
                  {data.type === 'base'
                    ? 'بنەڕەت: دانە، کیلۆ، لیتر، مەتر'
                    : 'پاکەج: کارتۆن، سندوق، پاکێت'}
                </p>
              </div>
            </div>

            {/* وەسف */}
            <FormTextarea
                    className="block w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

              label="وەسف"
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

            {/* نموونەکان */}
            <Card className="border-yellow-200 bg-yellow-50">
              <h4 className="flex items-center gap-2 mb-3 font-semibold text-yellow-900">
                <Package className="w-5 h-5" />
                نموونەی یەکەکان
              </h4>
              <div className="space-y-3 text-sm text-yellow-800">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-blue-700">یەکەی بنەڕەت:</span>
                  </div>
                  <div className="mr-4 space-y-1 text-xs">
                    <div>• دانە، دەن، تۆپ (pcs, piece)</div>
                    <div>• کیلۆ، گرام (kg, g)</div>
                    <div>• لیتر، میلیلیتر (L, ml)</div>
                    <div>• مەتر، سانتیمەتر (m, cm)</div>
                  </div>
                </div>

                <div className="p-3 bg-yellow-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-purple-700">یەکەی پاکەجکراو:</span>
                  </div>
                  <div className="mr-4 space-y-1 text-xs">
                    <div>• کارتۆن، سندوق (carton, box)</div>
                    <div>• پاکێت، دەستە (packet, bundle)</div>
                    <div>• کیسە، بێچە (bag, roll)</div>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 text-xs bg-yellow-100 rounded-lg">
                  <span className="text-yellow-700">💡</span>
                  <div>
                    <strong>تێبینی:</strong> پاش دروستکردنی یەکەکان، دەتوانیت ڕێژەی گۆڕین زیاد بکەیت
                    (نموونە: 1 کارتۆن = 24 دانە)
                  </div>
                </div>
              </div>
            </Card>

            {/* دوگمەکان */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={processing}
                className="flex items-center gap-2 px-6 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {processing ? 'تکایە چاوەڕێ بە...' : 'پاشەکەوتکردن'}
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
          </form>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
