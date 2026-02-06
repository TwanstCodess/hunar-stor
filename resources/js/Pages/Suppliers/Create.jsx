// resources/js/Pages/Suppliers/Create.jsx
import { useState } from 'react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import FormInput from '@/Components/FormInput';
import FormTextarea from '@/Components/FormTextarea';
import { ArrowRight, Save, Building, Phone, Mail, MapPin, FileText, Briefcase } from 'lucide-react';

export default function Create() {
  const [data, setData] = useState({
    name: '',
    company_name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    router.post('/suppliers', data, {
      onSuccess: () => {
        setProcessing(false);
      },
      onError: (errors) => {
        setErrors(errors);
        setProcessing(false);
      },
    });
  };

  return (
    <AuthenticatedLayout>
      <PageHeader
        title="زیادکردنی دابینکەر"
        subtitle="زیادکردنی دابینکەرێکی نوێ بۆ کۆمپانیا"
      />

      <div className="max-w-4xl">
        <Card className="border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* بەشی یەکەم - زانیارییە سەرەکییەکان */}
            <div>
              <h3 className="pb-3 mb-6 text-lg font-semibold text-gray-900 border-b border-gray-200">
                زانیارییە سەرەکییەکان
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <FormInput
                    label="ناوی دابینکەر *"
                    value={data.name}
                    onChange={(value) => setData({ ...data, name: value })}
                    error={errors.name}
                    required
                    disabled={processing}
                    placeholder="ناوی تەواو"
                    icon={Building}
                    border
                    className="block w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <FormInput
                    label="ناوی کۆمپانیا"
                    value={data.company_name}
                    onChange={(value) => setData({ ...data, company_name: value })}
                    error={errors.company_name}
                    disabled={processing}
                    placeholder="ناوی کۆمپانیا"
                    icon={Briefcase}
                    border
                    className="block w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <FormInput
                    label="ژمارە مۆبایل"
                    type="tel"
                    value={data.phone}
                    onChange={(value) => setData({ ...data, phone: value })}
                    error={errors.phone}
                    disabled={processing}
                    placeholder="07XX XXX XXXX"
                    icon={Phone}
                    border
                    className="block w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <FormInput
                    label="ئیمەیل"
                    type="email"
                    value={data.email}
                    onChange={(value) => setData({ ...data, email: value })}
                    error={errors.email}
                    disabled={processing}
                    placeholder="example@email.com"
                    icon={Mail}
                    border
                    className="block w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* بەشی دووەم - ناونیشان و تێبینی */}
            <div>
              <h3 className="pb-3 mb-6 text-lg font-semibold text-gray-900 border-b border-gray-200">
                زانیارییەکانی تر
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <FormTextarea
                    label="ناونیشان"
                    value={data.address}
                    onChange={(value) => setData({ ...data, address: value })}
                    error={errors.address}
                    disabled={processing}
                    placeholder="ناونیشانی تەواو"
                    icon={MapPin}
                    border
                    rows={4}
                    className="block w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <FormTextarea
                    label="تێبینی"
                    value={data.notes}
                    onChange={(value) => setData({ ...data, notes: value })}
                    error={errors.notes}
                    disabled={processing}
                    placeholder="تێبینی تایبەت بە دابینکەر..."
                    icon={FileText}
                    border
                    rows={4}
                    className="block w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* هەڵەکان */}
            {errors.message && (
              <div className="p-4 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {errors.message}
                </div>
              </div>
            )}

            {/* دەستەکانی خوارەوە */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={processing}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {processing ? 'تکایە چاوەڕێ بە...' : 'پاشەکەوتکردن'}
                </button>
                <button
                  type="button"
                  onClick={() => router.get('/suppliers')}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  disabled={processing}
                >
                  <ArrowRight className="w-4 h-4" />
                  گەڕانەوە
                </button>
              </div>

              <div className="text-xs text-gray-500">
                خانەکانی نیشاندراوی * پێویستیان بە داخڵکردنی زانیاری هەیە
              </div>
            </div>
          </form>
        </Card>

        {/* کارتی ئامۆژگاری */}
        <div className="mt-6">
          <Card className="border border-blue-100 bg-blue-50">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">ئامۆژگاری</h4>
                <p className="mt-1 text-sm text-blue-700">
                  • ناوی دابینکەر بە تەواوی داخڵ بکە بۆ ئەوەی لە کاتی گەڕان دا بتوانی بیدۆزیتەوە
                  <br />
                  • ئەگەر کۆمپانیایەک ئەنجامی کڕین دەدات، ناوی کۆمپانیا داخڵ بکە
                  <br />
                  • ناونیشانی تەواو داخڵ بکە بۆ گەیاندنی کڕینەکان
                  <br />
                  • ژمارە مۆبایل بە فۆرماتی 07XX XXX XXXX داخڵ بکە
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
