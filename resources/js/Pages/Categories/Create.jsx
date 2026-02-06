// resources/js/Pages/Categories/Create.jsx
import { useState } from 'react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import FormInput from '@/Components/FormInput';
import FormTextarea from '@/Components/FormTextarea';
import ImageUpload from '@/Components/ImageUpload'; // زیادکردنی ئەم کۆمپۆنێنتە
import { ArrowRight, Save } from 'lucide-react';

export default function Create() {
  const [data, setData] = useState({
    name: '',
    description: '',
    image: null,
  });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  const handleFileChange = (file) => {
    setData({ ...data, image: file });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setProcessing(true);

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    if (data.image) {
      formData.append('image', data.image);
    }

    router.post('/categories', formData, {
      onError: (errors) => {
        setErrors(errors);
        setProcessing(false);
      },
      forceFormData: true,
    });
  };

  return (
    <AuthenticatedLayout>
      <PageHeader
        title="زیادکردنی کاتێگۆری"
        subtitle="زیادکردنی کاتێگۆرییەکی نوێ"
      />

      <div className="max-w-2xl">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormInput
                    className="block w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

              label="ناوی کاتێگۆری"
              value={data.name}
              onChange={(value) => setData({ ...data, name: value })}
              error={errors.name}
              required
              placeholder="وەک: چەمەنتۆ، قووم، کەچ"
            />

            <FormTextarea
                    className="block w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

              label="وەسف"
              value={data.description}
              onChange={(value) => setData({ ...data, description: value })}
              error={errors.description}
              placeholder="وەسفی کاتێگۆری..."
            />

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                وێنەی کاتێگۆری
              </label>
              <ImageUpload
                onFileChange={handleFileChange}
                error={errors.image}
                accept="image/*"
              />
              {errors.image && (
                <p className="mt-1 text-sm text-red-600">{errors.image}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={processing}
                className="flex items-center gap-2 btn btn-primary"
              >
                <Save className="w-4 h-4" />
                {processing ? 'تکایە چاوەڕێ بە...' : 'پاشەکەوتکردن'}
              </button>
              <button
                type="button"
                onClick={() => router.get('/categories')}
                className="flex items-center gap-2 btn btn-secondary"
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
