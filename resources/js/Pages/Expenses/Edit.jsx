import { useState } from 'react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import FormInput from '@/Components/FormInput';
import FormTextarea from '@/Components/FormTextarea';
import { ArrowRight, Save, TrendingDown, DollarSign, Calendar, FileText, Info, User } from 'lucide-react';

export default function Edit({ expense }) {
  const [data, setData] = useState({
    title: expense.title,
    description: expense.description || '',
    currency: expense.currency,
    amount: expense.amount,
    expense_date: expense.expense_date,
  });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setProcessing(true);

    router.put(`/expenses/${expense.id}`, data, {
      onError: (errors) => {
        setErrors(errors);
        setProcessing(false);
      },
    });
  };

  return (
    <AuthenticatedLayout>
      <PageHeader
        title="دەستکاریکردنی خەرجی"
        subtitle={`دەستکاریکردنی: ${expense.title}`}
      />

      <div className="max-w-3xl">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* سەرپەڕە */}
            <div className="flex items-center gap-3 p-4 border border-red-200 rounded-lg bg-red-50">
              <TrendingDown className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">زانیاری خەرجی</h3>
                <p className="text-sm text-red-700">دەستکاری زانیاری خەرجی بکە</p>
              </div>
            </div>

            {/* زانیاری سەرەکی */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormInput
                label="ناونیشانی خەرجی"
                value={data.title}
                onChange={(value) => setData({ ...data, title: value })}
                error={errors.title}
                required
                placeholder="سووتەمەنی، کرێ، برەکارگێڕی..."
                icon={FileText}
                    className="block w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

              />

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  بەرواری خەرجی <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 right-3 top-1/2" />
                  <input
                    type="date"
                    value={data.expense_date}
                    onChange={(e) => setData({ ...data, expense_date: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    className="block w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {errors.expense_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.expense_date}</p>
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
              placeholder="وردەکاری زیاتر دەربارەی خەرجییەکە..."
              rows={3}
            />

            {/* دراو و بڕ */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  جۆری دراو <span className="text-red-500">*</span>
                </label>
                <select
                  value={data.currency}
                  onChange={(e) => setData({ ...data, currency: e.target.value })}
                  className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="IQD">دینار (IQD)</option>
                  <option value="USD">دۆلار (USD)</option>
                </select>
                {errors.currency && (
                  <p className="mt-1 text-sm text-red-600">{errors.currency}</p>
                )}
                <p className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                  <Info className="w-3.5 h-3.5" />
                  {data.currency === 'IQD' ? 'دینار عێراقی' : 'دۆلاری ئەمریکی'}
                </p>
              </div>

              <FormInput
                    className="block w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

                label="بڕی پارە"
                type="number"
                step="0.5"
                value={data.amount}
                onChange={(value) => setData({ ...data, amount: value })}
                error={errors.amount}
                required
                placeholder="0.00"
                icon={DollarSign}
              />
            </div>

            {/* زانیاری تۆمارکردن */}
            <Card className="border-gray-200 bg-gray-50">
              <h4 className="mb-3 font-semibold text-gray-900">زانیاری تۆمارکردن</h4>
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>تۆمارکراوە لەلایەن:</span>
                  </div>
                  <p className="mt-1 font-medium text-gray-900">
                    {expense.user?.name}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>بەرواری دروستکردن:</span>
                  </div>
                  <p className="mt-1 font-medium text-gray-900">
                    {new Date(expense.created_at).toLocaleDateString('ar-IQ')}
                  </p>
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
                {processing ? 'تکایە چاوەڕێ بە...' : 'نوێکردنەوە'}
              </button>
              <button
                type="button"
                onClick={() => router.get('/expenses')}
                className="flex items-center gap-2 px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                گەڕانەوە
              </button>
            </div>
          </form>
        </Card>

        {/* ڕێنمایی */}
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <div className="space-y-2 text-sm">
            <h3 className="mb-3 font-semibold text-blue-900">📌 تێبینی:</h3>
            <div className="space-y-2 text-blue-800">
              <div className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <div>
                  دەستکاریکردنی خەرجی کاریگەری لەسەر ئاماری گشتی دەبێت
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <div>
                  بەرواری خەرجی ناتوانێت لە ئەمڕۆ دواتر بێت
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <div>
                  دەتوانیت جۆری دراو بگۆڕیت ئەگەر پێویست بێت
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
