import { Link, router } from "@inertiajs/react";
import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import Card from "@/Components/Card";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  Filter,
  Wallet,
  TrendingUp,
  Clock,
  FileText,
  Trash2,
  Edit,
  Eye
} from "lucide-react";

const formatNumber = (num) => {
  if (num === undefined || num === null) return "0";
  return new Intl.NumberFormat("en-US").format(parseFloat(num) || 0);
};

const formatCurrency = (amount, curr) => {
  const a = formatNumber(amount);
  if (curr === "IQD") return a + " دینار";
  if (curr === "USD") return "$" + a;
  return a;
};

export default function Show({ customer, balances, filters, totals }) {
  const [currency, setCurrency] = useState(filters?.currency || "");
  const [fromDate, setFromDate] = useState(filters?.from_date || "");
  const [toDate, setToDate] = useState(filters?.to_date || "");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const applyFilters = () => {
    router.get(route("balances.show", customer.id), {
      currency,
      from_date: fromDate,
      to_date: toDate,
    }, { preserveState: true });
  };

  const reset = () => {
    setCurrency("");
    setFromDate("");
    setToDate("");
    router.get(route("balances.show", customer.id));
  };

  const handleDelete = (balanceId) => {
    if (window.confirm("دڵنیای لە سڕینەوەی ئەم باڵانسە؟")) {
      router.delete(route("balances.destroy", balanceId), {
        preserveScroll: true,
        onSuccess: () => {
          setConfirmDelete(null);
        },
      });
    }
  };

  const rows = balances?.data || [];

  return (
    <AuthenticatedLayout title={`باڵانسەکانی ${customer.name}`}>
      <PageHeader
        title={`باڵانسەکانی ${customer.name}`}
        subtitle="هەموو پارەدانەکانی کڕیار"
        action={{
          href: route("balances.index"),
          label: "گەڕانەوە",
          icon: ArrowLeft,
        }}
      />

      {/* Customer Info */}
      <Card className="mb-6 border border-blue-200">
        <div className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 border border-blue-200 rounded-full">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{customer.name}</h3>
                <div className="flex flex-wrap gap-4 mt-2">
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {customer.phone}
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      {customer.email}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                <div className="text-sm text-gray-600">کۆی دینار</div>
                <div className="text-xl font-bold text-green-700">
                  {formatCurrency(totals?.total_iqd || 0, 'IQD')}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {totals?.total_count || 0} تۆمار
                </div>
              </div>
              <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                <div className="text-sm text-gray-600">کۆی دۆلار</div>
                <div className="text-xl font-bold text-purple-700">
                  {formatCurrency(totals?.total_usd || 0, 'USD')}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {totals?.total_count || 0} تۆمار
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">فیلتەرەکان</h3>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Filter className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="py-2 pr-3 text-gray-900 bg-white border border-gray-300 rounded-lg pl-9"
              >
                <option value="">هەموو دراوەکان</option>
                <option value="IQD">دینار (IQD)</option>
                <option value="USD">دۆلار (USD)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="لە بەروار"
              />
              <span className="text-gray-500">بۆ</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="بۆ بەروار"
              />
            </div>

            <button
              onClick={applyFilters}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              جێبەجێ
            </button>

            <button
              onClick={reset}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              پاککردنەوە
            </button>
          </div>

          {/* Filter Summary */}
          {totals && (
            <div className="p-3 mt-4 rounded-lg bg-gray-50">
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">پەنجەرە: </span>
                  <span className="font-bold">{totals.filtered_count || 0}</span> تۆمار
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">دینار: </span>
                  <span className="font-bold text-green-700">
                    {formatCurrency(totals.filtered_iqd || 0, 'IQD')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">دۆلار: </span>
                  <span className="font-bold text-purple-700">
                    {formatCurrency(totals.filtered_usd || 0, 'USD')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Balances List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  #
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  پێش باڵانس
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  زیادکراو
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  دوای باڵانس
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  دراو
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  تێبینی
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  بەروار
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  کردارەکان
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {rows.length > 0 ? (
                rows.map((b, index) => (
                  <tr key={b.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {index + 1 + (balances.meta?.per_page * (balances.meta?.current_page - 1) || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatCurrency(b.before_balance || 0, b.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold bg-green-50 text-green-700 border border-green-200">
                        <TrendingUp className="w-4 h-4" />
                        +{formatCurrency(b.amount || 0, b.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <Wallet className="w-4 h-4" />
                        {formatCurrency(b.after_balance || 0, b.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        b.currency === 'IQD'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {b.currency}
                      </div>
                    </td>
                    <td className="max-w-xs px-6 py-4 text-sm text-gray-700">
                      <div className="flex items-start gap-2">
                        <FileText className="flex-shrink-0 w-4 h-4 mt-0.5 text-gray-400" />
                        <span className="truncate">{b.note || "---"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex flex-col">
                        <span>{new Date(b.created_at).toLocaleDateString('en-GB')}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(b.created_at).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={route("balances.edit", b.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                          دەسکاری
                        </Link>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-red-600 rounded hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                          سڕینەوە
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Wallet className="w-12 h-12 text-gray-300" />
                      <div className="text-gray-500">هیچ پارەدانێک بۆ ئەم کڕیارە نەدۆزرایەوە</div>
                      <Link
                        href={route("balances.create")}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                      >
                        <DollarSign className="w-4 h-4" />
                        زیادکردنی باڵانسی نوێ
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {rows.length > 0 && balances?.links && balances?.meta && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="text-sm text-gray-700">
                نیشاندان <span className="font-medium">{balances.meta.from || 0}</span> بۆ{" "}
                <span className="font-medium">{balances.meta.to || 0}</span> لە{" "}
                <span className="font-medium">{balances.meta.total || 0}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {balances.links.map((link, index) => (
                  <button
                    key={index}
                    onClick={() => link.url && router.get(link.url)}
                    disabled={!link.url || link.active}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors min-w-[2.5rem] ${
                      link.active
                        ? "bg-blue-600 text-white border-blue-600"
                        : link.url
                        ? "text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
                        : "text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed"
                    }`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>
    </AuthenticatedLayout>
  );
}
