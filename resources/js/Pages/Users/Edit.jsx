import { useState } from 'react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import FormInput from '@/Components/FormInput';
import { ArrowRight, Save, User, Mail, Lock, ShieldCheck, AlertCircle, Info } from 'lucide-react';

export default function Edit({ user, canChangeRole }) {
  const [data, setData] = useState({
    name: user.name,
    email: user.email,
    password: '',
    password_confirmation: '',
    role: user.role,
  });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setProcessing(true);

    router.put(`/users/${user.id}`, data, {
      onError: (errors) => {
        setErrors(errors);
        setProcessing(false);
      },
    });
  };

  return (
    <AuthenticatedLayout>
      <PageHeader
        title="دەستکاریکردنی بەکارهێنەر"
        subtitle={`دەستکاریکردنی: ${user.name}`}
      />

      <div className="max-w-3xl">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* سەرپەڕە */}
            <div className="flex items-center gap-3 p-4 border border-blue-200 rounded-lg bg-blue-50">
              <User className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-900">زانیاری بەکارهێنەر</h3>
                <p className="text-sm text-blue-700">دەستکاری زانیاری بەکارهێنەر بکە</p>
              </div>
            </div>

            {/* زانیاری سەرەکی */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormInput
                label="ناوی تەواو"
                    className="block w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

                value={data.name}
                onChange={(value) => setData({ ...data, name: value })}
                error={errors.name}
                required
                placeholder="ناوی بەکارهێنەر..."
                icon={User}
              />

              <FormInput
                label="ئیمەیڵ"
                    className="block w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

                type="email"
                value={data.email}
                onChange={(value) => setData({ ...data, email: value })}
                error={errors.email}
                required
                placeholder="example@email.com"
                icon={Mail}
              />
            </div>

            {/* ئاگادارکردنەوە بۆ وشەی نهێنی */}
            <Card className="border-yellow-200 bg-yellow-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>تێبینی:</strong> ئەگەر نەتەوێت وشەی نهێنی بگۆڕیت، بەتاڵی بهێڵەرەوە
                </div>
              </div>
            </Card>

            {/* وشەی نهێنی */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormInput
                label="وشەی نهێنی نوێ (دڵخواز)"
                type="password"
                    className="block w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

                value={data.password}
                onChange={(value) => setData({ ...data, password: value })}
                error={errors.password}
                placeholder="لانیکەم ٨ پیت..."
                icon={Lock}
              />

              <FormInput
                label="دووبارەکردنەوەی وشەی نهێنی"
                type="password"
                    className="block w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

                value={data.password_confirmation}
                onChange={(value) => setData({ ...data, password_confirmation: value })}
                error={errors.password_confirmation}
                placeholder="دووبارەی وشەی نهێنی..."
                icon={Lock}
              />
            </div>

            {/* ڕۆڵ */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                ڕۆڵی بەکارهێنەر <span className="text-red-500">*</span>
              </label>
              <select
                value={data.role}
                onChange={(e) => setData({ ...data, role: e.target.value })}
                disabled={!canChangeRole}
                className={`block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  !canChangeRole ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                <option value="user">بەکارهێنەر (User)</option>
                <option value="admin">ئەدمین (Admin)</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role}</p>
              )}
              {!canChangeRole && (
                <p className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                  <Info className="w-3.5 h-3.5" />
                  ناتوانیت ڕۆڵی خۆت بگۆڕیت
                </p>
              )}
              {canChangeRole && (
                <p className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                  <Info className="w-3.5 h-3.5" />
                  {data.role === 'admin'
                    ? 'ئەدمین: مافی تەواوی بەڕێوەبردنی سیستەمەکە'
                    : 'بەکارهێنەر: دەتوانێت کڕین و فرۆشتن بەڕێوەببات'}
                </p>
              )}
            </div>

            {/* زانیاری زیادە */}
            <Card className="border-gray-200 bg-gray-50">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">بەرواری دروستکردن:</span>
                  <p className="mt-1 font-medium text-gray-900">
                    {new Date(user.created_at).toLocaleDateString('ar-IQ')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">دوایین نوێکردنەوە:</span>
                  <p className="mt-1 font-medium text-gray-900">
                    {new Date(user.updated_at).toLocaleDateString('ar-IQ')}
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
                onClick={() => router.get('/users')}
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
            <h3 className="mb-3 font-semibold text-blue-900">📌 زانیاری گرنگ:</h3>
            <div className="space-y-2 text-blue-800">
              <div className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <div>
                  وشەی نهێنی تەنها دەگۆڕدرێت ئەگەر بنووسیت، ئەگەر نا بەتاڵی بهێڵەرەوە
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <div>
                  ئیمەیڵ دەبێت یەکتا بێت و پێشتر بەکارنەهاتبێت
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <div>
                  ناتوانیت ڕۆڵی خۆت بگۆڕیت بۆ پاراستنی سیستەمەکە
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
