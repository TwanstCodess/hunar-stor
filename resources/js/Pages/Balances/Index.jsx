import { Link, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import Card from "@/Components/Card";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  User,
  Phone,
  DollarSign,
  Calendar,
  ChevronRight,
  Wallet,
  FileText
} from "lucide-react";
import Swal from 'sweetalert2';

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

const SearchInput = ({ value, onChange, placeholder }) => (
  <div className="relative">
    <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="block w-full pr-3 pl-10 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
    />
  </div>
);

const Pagination = ({ links, meta }) => {
  if (!links || !meta || links.length <= 3) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div className="text-sm text-gray-700">
        نیشاندان <span className="font-medium">{meta.from || 0}</span> بۆ{" "}
        <span className="font-medium">{meta.to || 0}</span> لە{" "}
        <span className="font-medium">{meta.total || 0}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {links.map((link, index) => (
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
  );
};

export default function Index({ balances, filters, totals }) {
  const [search, setSearch] = useState(filters?.search || "");
  const [currency, setCurrency] = useState(filters?.currency || "");
  const [fromDate, setFromDate] = useState(filters?.from_date || "");
  const [toDate, setToDate] = useState(filters?.to_date || "");
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, []);

  const applyFilters = (next = {}) => {
    router.get(
      route("balances.index"),
      {
        search: search.trim(),
        currency,
        from_date: fromDate,
        to_date: toDate,
        ...next,
      },
      { preserveState: true, replace: true }
    );
  };

  const handleSearch = (v) => {
    setSearch(v);

    if (searchTimeout) clearTimeout(searchTimeout);

    setSearchTimeout(
      setTimeout(() => {
        if (v.trim() !== (filters?.search || "")) {
          applyFilters({ search: v.trim() });
        }
      }, 800)
    );
  };

  const handleCurrency = (v) => {
    setCurrency(v);
    if (v !== (filters?.currency || "")) {
      applyFilters({ currency: v });
    }
  };

  const handleDateFilter = () => {
    if ((fromDate || toDate) && (fromDate !== filters?.from_date || toDate !== filters?.to_date)) {
      applyFilters();
    }
  };

  const clearDateFilter = () => {
    setFromDate("");
    setToDate("");
    if (filters?.from_date || filters?.to_date) {
      applyFilters({ from_date: "", to_date: "" });
    }
  };

  const reset = () => {
    setSearch("");
    setCurrency("");
    setFromDate("");
    setToDate("");
    if (searchTimeout) clearTimeout(searchTimeout);
    router.get(route("balances.index"));
  };

  const handleDelete = (balanceId) => {
    Swal.fire({
      title: 'دڵنیایت؟',
      text: 'ئەم باڵانسە هەمیشەیی سڕایەوە',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'بەڵێ، بسڕەوە',
      cancelButtonText: 'پاشگەزبوونەوە',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        router.delete(route("balances.destroy", balanceId), {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              title: 'سڕایەوە!',
              text: 'باڵانسەکە بەسەرکەوتوویی سڕایەوە.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          },
          onError: () => {
            Swal.fire({
              title: 'هەڵە!',
              text: 'کێشەیەک ڕوویدا، تکایە دووبارە هەوڵبەرەوە.',
              icon: 'error',
              timer: 2000,
              showConfirmButton: false
            });
          }
        });
      }
    });
  };

  const rows = balances?.data || [];

  // Summary Cards
  const SummaryCard = ({ title, value, currency, icon: Icon, color, bgColor }) => (
    <div className={`p-4 rounded-xl border ${color} transition-transform hover:scale-[1.02]`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatNumber(value)} {currency && `(${currency})`}
          </p>
          {!currency && totals && (
            <p className="mt-1 text-sm text-gray-500">
              {formatNumber(totals.iqd || 0)} IQD + {formatNumber(totals.usd || 0)} USD
            </p>
          )}
        </div>
        <div className={`p-3 ${bgColor} rounded-lg`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  return (
    <AuthenticatedLayout title="باڵانسەکان">
      <PageHeader
        title="باڵانسەکان"
        subtitle="بەدواداچوونی هەموو پارەدانی کڕیارەکان"
        action={{
          href: route("balances.create"),
          label: "زیادکردنی باڵانس",
          icon: Plus,
        }}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3 mb-6 md:grid-cols-2 lg:grid-cols-3">

        <SummaryCard
          title="کۆی دینار"
          value={totals?.iqd || 0}
          currency="IQD"
          icon={DollarSign}
          color="bg-gradient-to-r from-green-50 to-green-100 border-green-200"
          bgColor="bg-green-100"
        />
        <SummaryCard
          title="کۆی دۆلار"
          value={totals?.usd || 0}
          currency="USD"
          icon={DollarSign}
          color="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200"
          bgColor="bg-purple-100"
        />
        <div className="p-4 border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">تۆمارەکان</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {balances?.meta?.total || 0}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                لە پەڕەی {balances?.meta?.current_page || 1}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <User className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border border-gray-200">
        {/* Filters - Improved */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex-1 max-w-lg">
                <SearchInput
                  value={search}
                  onChange={handleSearch}
                  placeholder="گەڕان بە ناو، ژمارە، ئیمەیل یان تێبینی..."
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  پاککردنەوە
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Filter className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <select
                  value={currency}
                  onChange={(e) => handleCurrency(e.target.value)}
                  className="pr-3 pl-9 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">هەموو دراوەکان</option>
                  <option value="IQD">دینار (IQD)</option>
                  <option value="USD">دۆلار (USD)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-32 px-2 py-1 text-sm bg-transparent border-none outline-none"
                  placeholder="لە بەروار"
                />
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-32 px-2 py-1 text-sm bg-transparent border-none outline-none"
                  placeholder="بۆ بەروار"
                />
                {(fromDate || toDate) && (
                  <>
                    <button
                      onClick={handleDateFilter}
                      className="px-3 py-1 text-sm text-white transition-colors bg-blue-600 rounded hover:bg-blue-700"
                    >
                      جێبەجێ
                    </button>
                    <button
                      onClick={clearDateFilter}
                      className="px-3 py-1 text-sm text-gray-600 transition-colors bg-gray-100 rounded hover:bg-gray-200"
                    >
                      ×
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase border-b border-gray-200">
                  کڕیار
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase border-b border-gray-200">
                  کۆتا باڵانس
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase border-b border-gray-200">
                  زیادکراو
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase border-b border-gray-200">
                  دراو
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase border-b border-gray-200">
                  بەروار
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase border-b border-gray-200">
                  کردار
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {rows.length > 0 ? (
                rows.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 border border-blue-200 rounded-lg">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {b.customer?.name || "---"}
                          </div>
                          {b.customer?.phone && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                              <Phone className="flex-shrink-0 w-3 h-3" />
                              <span className="truncate">{b.customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <Wallet className="w-4 h-4" />
                        {formatCurrency(b.after_balance || 0, b.currency)}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold bg-green-50 text-green-700 border border-green-200">
                        <DollarSign className="w-4 h-4" />
                        +{formatCurrency(b.amount || 0, b.currency)}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        b.currency === 'IQD'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {b.currency || "---"}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
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

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                      <Link
  href={route("balances.customer.show", b.customer_id)}
  className="p-2 text-green-600 transition-colors duration-200 border border-green-100 rounded-lg hover:bg-green-50 hover:border-green-200"
  title="بینینی هەموو پارەدانەکان"
>
  <Eye className="w-4 h-4" />
</Link>

                        <Link
                          href={route("balances.edit", b.id)}
                          className="p-2 text-blue-600 transition-colors duration-200 border border-blue-100 rounded-lg hover:bg-blue-50 hover:border-blue-200"
                          title="دەسکاری"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Wallet className="w-12 h-12 text-gray-300" />
                      <div className="text-gray-500">هیچ باڵانسێک نەدۆزرایەوە</div>
                      <Link
                        href={route("balances.create")}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4" />
                        زیادکردنی یەکەم باڵانس
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {rows.length > 0 && balances?.links && balances?.meta && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <Pagination links={balances.links} meta={balances.meta} />
          </div>
        )}
      </Card>
    </AuthenticatedLayout>
  );
}
