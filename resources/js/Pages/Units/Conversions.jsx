// resources/js/Pages/Units/Conversions.jsx
import { useState } from 'react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import { ArrowRight, Plus, Trash2, ArrowRightLeft, X, Info } from 'lucide-react';

export default function Conversions({ unit, availableUnits }) {
  const [showForm, setShowForm] = useState(false);
  const [data, setData] = useState({
    to_unit_id: '',
    conversion_factor: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    router.post(`/units/${unit.id}/conversions`, data, {
      onSuccess: () => {
        setShowForm(false);
        setData({ to_unit_id: '', conversion_factor: '', notes: '' });
        setErrors({});
      },
      onError: (errors) => {
        setErrors(errors);
      },
    });
  };

  const handleDelete = (conversionId) => {
    if (confirm('دڵنیایت لە سڕینەوەی ئەم گۆڕینە؟')) {
      router.delete(`/unit-conversions/${conversionId}`);
    }
  };

  const selectedUnit = availableUnits.find(u => u.id == data.to_unit_id);

  return (
    <AuthenticatedLayout>
      <PageHeader
        title={`گۆڕینەکانی: ${unit.name}`}
        subtitle="بەڕێوەبردنی ڕێژەی گۆڕین بۆ یەکەکانی تر"
      />

      {/* فۆڕمی زیادکردنی گۆڕین */}
      {showForm ? (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-900">زیادکردنی گۆڕینی نوێ</h3>
            <button
              onClick={() => {
                setShowForm(false);
                setData({ to_unit_id: '', conversion_factor: '', notes: '' });
                setErrors({});
              }}
              className="p-2 text-blue-600 transition-colors rounded-lg hover:bg-blue-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                گۆڕین بۆ یەکەی <span className="text-red-500">*</span>
              </label>
              <select
                value={data.to_unit_id}
                onChange={(e) => setData({ ...data, to_unit_id: e.target.value })}
                className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">یەکە هەڵبژێرە</option>
                {availableUnits.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.name_en && `(${u.name_en})`} {u.symbol && `- ${u.symbol}`}
                  </option>
                ))}
              </select>
              {errors.to_unit_id && (
                <p className="mt-1 text-sm text-red-600">{errors.to_unit_id}</p>
              )}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                ڕێژەی گۆڕین <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-700 whitespace-nowrap">1 {unit.name} =</span>
                <input
                  type="number"
                  step="0.000001"
                  value={data.conversion_factor}
                  onChange={(e) => setData({ ...data, conversion_factor: e.target.value })}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="24"
                  required
                />
                <span className="font-medium text-gray-700 whitespace-nowrap">
                  {selectedUnit ? selectedUnit.name : '...'}
                </span>
              </div>
              {errors.conversion_factor && (
                <p className="mt-1 text-sm text-red-600">{errors.conversion_factor}</p>
              )}
              <p className="mt-2 text-xs text-gray-600">
                <strong>نموونە:</strong> ئەگەر 1 کارتۆن = 24 دانە، ئەوە ڕێژە = 24
              </p>
              {data.conversion_factor > 0 && selectedUnit && (
                <div className="p-3 mt-2 border border-blue-200 rounded-lg bg-blue-50">
                  <p className="text-sm text-blue-800">
                    <strong>گۆڕینی پێچەوانە:</strong> 1 {selectedUnit.name} = {(1 / parseFloat(data.conversion_factor)).toFixed(6)} {unit.name}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                تێبینی
              </label>
              <input
                type="text"
                value={data.notes}
                onChange={(e) => setData({ ...data, notes: e.target.value })}
                className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="تێبینی (دڵخواز)"
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                زیادکردن
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setData({ to_unit_id: '', conversion_factor: '', notes: '' });
                  setErrors({});
                }}
                className="flex items-center gap-2 px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                پاشگەزبوونەوە
              </button>
            </div>
          </form>
        </Card>
      ) : (
        <div className="mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            زیادکردنی گۆڕینی نوێ
          </button>
        </div>
      )}

      {/* لیستی گۆڕینەکان */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* گۆڕینەکان لە ئەم یەکەیەوە */}
        <Card>
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-gray-200">
            <ArrowRightLeft className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              لە {unit.name} بۆ یەکەکانی تر
            </h3>
          </div>

          <div className="space-y-3">
            {unit.conversions_from?.length === 0 ? (
              <div className="py-12 text-center">
                <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500">هیچ گۆڕینێک زیاد نەکراوە</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 mt-3 text-sm text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4" />
                  یەکەمین گۆڕین زیاد بکە
                </button>
              </div>
            ) : (
              unit.conversions_from?.map((conversion) => (
                <div
                  key={conversion.id}
                  className="flex items-center justify-between gap-3 p-4 transition-all border border-blue-200 rounded-lg bg-blue-50 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <ArrowRightLeft className="w-5 h-5 mt-0.5 text-blue-600 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">
                        1 {unit.name} = <span className="text-blue-600">{conversion.conversion_factor}</span> {conversion.to_unit?.name}
                      </div>
                      {conversion.notes && (
                        <div className="mt-1 text-sm text-gray-600">{conversion.notes}</div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(conversion.id)}
                    className="flex-shrink-0 p-2 text-red-600 transition-colors rounded-lg hover:bg-red-100"
                    title="سڕینەوە"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* گۆڕینەکان بۆ ئەم یەکەیە */}
        <Card>
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-gray-200">
            <ArrowRightLeft className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              لە یەکەکانی تر بۆ {unit.name}
            </h3>
          </div>

          <div className="space-y-3">
            {unit.conversions_to?.length === 0 ? (
              <div className="py-12 text-center">
                <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500">هیچ گۆڕینێک بوونی نییە</p>
                <p className="mt-2 text-xs text-gray-400">
                  گۆڕینەکانی پێچەوانە خۆکار دروست دەبن
                </p>
              </div>
            ) : (
              unit.conversions_to?.map((conversion) => (
                <div
                  key={conversion.id}
                  className="flex items-start gap-3 p-4 transition-all border border-green-200 rounded-lg bg-green-50 hover:shadow-md"
                >
                  <ArrowRightLeft className="w-5 h-5 mt-0.5 text-green-600 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">
                      1 {conversion.from_unit?.name} = <span className="text-green-600">{conversion.conversion_factor}</span> {unit.name}
                    </div>
                    {conversion.notes && (
                      <div className="mt-1 text-sm text-gray-600">{conversion.notes}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* کارتی زانیاری */}
      <Card className="mt-6 border-yellow-200 bg-yellow-50">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 mt-0.5 text-yellow-600 flex-shrink-0" />
          <div className="space-y-2 text-sm text-yellow-800">
            <h3 className="font-semibold">📌 گرنگ بزانە:</h3>
            <ul className="space-y-1.5 mr-4">
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>کاتێک گۆڕینێک زیاد دەکەیت، گۆڕینی پێچەوانەش خۆکار دروست دەبێت</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span><strong>نموونە:</strong> ئەگەر 1 کارتۆن = 24 دانە، ئەوە 1 دانە = 0.041667 کارتۆن</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>سڕینەوەی گۆڕینێک، هەردووک لای دەسڕێتەوە (دووەمە و پێچەوانەکەی)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>ڕێژەی گۆڕین دەتوانێت ژمارەی دەیی بێت (وەک 0.5، 2.5، 1.25)</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* دوگمەی گەڕانەوە */}
      <div className="mt-6">
        <button
          onClick={() => router.get('/units')}
          className="flex items-center gap-2 px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          گەڕانەوە بۆ یەکەکان
        </button>
      </div>
    </AuthenticatedLayout>
  );
}
