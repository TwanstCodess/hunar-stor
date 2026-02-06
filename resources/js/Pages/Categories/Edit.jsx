// resources/js/Pages/Categories/Edit.jsx
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import FormInput from '@/Components/FormInput';
import FormTextarea from '@/Components/FormTextarea';
import ImageUpload from '@/Components/ImageUpload';
import { ArrowRight, Save, Trash2 } from 'lucide-react';

export default function Edit({ category }) {
  const [data, setData] = useState({
    name: category.name,
    description: category.description || '',
    image: null,
    remove_image: false,
  });

  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState(null);

  // پێشبینینی وێنەی کۆن لە کاتی بارکردن
  useEffect(() => {
    if (category.image) {
      setPreview(`/storage/${category.image}`);
    }
  }, [category.image]);

  const handleFileChange = (file) => {
    setData({ ...data, image: file, remove_image: false });
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  };

  const handleRemoveImage = () => {
    setData({ ...data, image: null, remove_image: true });
    setPreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);

    // لەبری `_method` بەکارهێنانی headers
    if (data.image) {
      formData.append('image', data.image);
    }

    if (data.remove_image) {
      formData.append('remove_image', '1');
    }

    // گۆڕین بۆ router.put
    router.put(`/categories/${category.id}`, formData, {
      onSuccess: () => {
        setProcessing(false);
      },
      onError: (errors) => {
        setErrors(errors);
        setProcessing(false);
      },
      onFinish: () => {
        setProcessing(false);
      },
      forceFormData: true,
    });
  };

  return (
    <AuthenticatedLayout>
      <PageHeader
        title="دەستکاریکردنی کاتێگۆری"
        subtitle={`دەستکاریکردنی: ${category.name}`}
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
              disabled={processing}
            />

            <FormTextarea
                    className="block w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

              label="وەسف"
              value={data.description}
              onChange={(value) => setData({ ...data, description: value })}
              error={errors.description}
              disabled={processing}
            />

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                وێنەی کاتێگۆری
              </label>

              {preview && !data.remove_image && (
                <div className="mb-4">
                  <div className="relative inline-block">
                    <img
                      src={preview}
                      alt="پێشبینینی وێنە"
                      className="object-cover w-32 h-32 border rounded-lg"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/128x128?text=No+Image';
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute p-1 text-white bg-red-500 rounded-full -top-2 -right-2 hover:bg-red-600"
                      disabled={processing}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    وێنەی ئێستا. کلیک بکە بۆ سڕینەوە یان وێنەیەکی نوێ هەڵبژێرە.
                  </p>
                </div>
              )}

              <ImageUpload
                onFileChange={handleFileChange}
                error={errors.image}
                accept="image/*"
                disabled={processing}
              />

              {data.remove_image && (
                <p className="mt-1 text-sm text-red-600">
                  وێنەکە بۆ سڕینەوە دیاریکراوە. بەڕەگەزکردن وێنەکە دەسڕێتەوە.
                </p>
              )}

              {errors.image && (
                <p className="mt-1 text-sm text-red-600">{errors.image}</p>
              )}
            </div>

            {errors.message && (
              <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">
                {errors.message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={processing}
                className="flex items-center gap-2 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {processing ? 'تکایە چاوەڕێ بە...' : 'نوێکردنەوە'}
              </button>
              <button
                type="button"
                onClick={() => router.get('/categories')}
                className="flex items-center gap-2 btn btn-secondary"
                disabled={processing}
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
