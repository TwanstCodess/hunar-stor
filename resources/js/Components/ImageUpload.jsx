// resources/js/Components/ImageUpload.jsx
import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

export default function ImageUpload({ onFileChange, error, accept = 'image/*' }) {
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileChange(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4">
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="پێشبینینی وێنە"
              className="object-cover w-32 h-32 border rounded-lg"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute p-1 text-white bg-red-500 rounded-full -top-2 -right-2 hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="cursor-pointer">
            <div className="flex flex-col items-center justify-center w-32 h-32 transition-colors border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-50">
              <Upload className="w-8 h-8 mb-2 text-gray-400" />
              <span className="text-sm text-gray-600">وێنە هەڵبژێرە</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept={accept}
            />
          </label>
        )}
      </div>
    </div>
  );
}
