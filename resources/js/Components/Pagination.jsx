import { Link } from '@inertiajs/react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export default function Pagination({ links, meta }) {
  if (!links || links.length <= 3) return null;

  return (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-gray-600">
        پیشاندانی {meta?.from} بۆ {meta?.to} لە کۆی گشتی {meta?.total}
      </div>

      <div className="flex gap-1">
        {links.map((link, index) => {
          const isActive = link.active;
          const isDisabled = link.url === null;

          let label = link.label;
          if (label.includes('Previous')) label = <ChevronRight className="w-4 h-4" />;
          if (label.includes('Next')) label = <ChevronLeft className="w-4 h-4" />;

          return isDisabled ? (
            <span
              key={index}
              className="px-3 py-2 text-sm text-gray-400 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
            >
              {label}
            </span>
          ) : (
            <Link
              key={index}
              href={link.url}
              preserveState
              className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
