import { useEffect, useMemo, useRef, useState } from "react";
import { router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import Card from "@/Components/Card";
import {
  User,
  Search,
  ChevronDown,
  X,
  DollarSign,
  FileText,
  Save,
  ArrowRight,
} from "lucide-react";

export default function Create({ customers = [], filters = {} }) {
  const [customerSearch, setCustomerSearch] = useState(filters?.search_customer || "");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const { data, setData, post, processing, errors, reset } = useForm({
    customer_id: "",
    amount: "",
    currency: "IQD",
    note: "",
  });

  useEffect(() => {
    const onClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selectedCustomer = useMemo(() => {
    if (!data.customer_id) return null;
    return customers.find((c) => String(c.id) === String(data.customer_id)) || null;
  }, [data.customer_id, customers]);

  const filteredCustomers = useMemo(() => {
    const s = (customerSearch || "").trim().toLowerCase();
    if (!s) return customers;

    return customers.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      return name.includes(s) || phone.includes(s) || email.includes(s);
    });
  }, [customers, customerSearch]);

  const clearCustomer = () => {
    setData("customer_id", "");
    setCustomerSearch("");
    setShowCustomerDropdown(false);
  };

  const fetchCustomers = (v) => {
    setCustomerSearch(v);
    setShowCustomerDropdown(true);

    if (data.customer_id) setData("customer_id", "");

    router.get(
      "/balances/create",
      { search_customer: v },
      { preserveState: true, replace: true, only: ["customers", "filters"] }
    );
  };

  const submit = (e) => {
    e.preventDefault();

    if (!data.customer_id) {
      alert("تکایە کڕیارێک هەڵبژێرە");
      return;
    }

    if (!data.amount || parseFloat(data.amount) <= 0) {
      alert("تکایە بڕێکی دروست بنووسە");
      return;
    }

    post("/balances", {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        clearCustomer();
      },
      onError: (err) => {
        console.error("هەڵە لە تۆمارکردن:", err);
      },
    });
  };

  return (
    <AuthenticatedLayout title="زیادکردنی باڵانس">
      <PageHeader
        title="زیادکردنی باڵانس"
        subtitle="زیادکردنی پارەی کڕیار کە لای تۆ هەیە"
        action={{
          href: "/balances",
          label: "گەڕانەوە",
          icon: ArrowRight,
        }}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Side - Form */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">زانیاری باڵانس</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    کڕیار پارەت پێدەدات - ئەم پارەیە لای تۆ دەمێنێتەوە
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    reset();
                    clearCustomer();
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  پاککردنەوە
                </button>
              </div>
            </div>

            <form onSubmit={submit} className="p-6 space-y-5">
              {/* Customer Selection */}
              <div ref={dropdownRef} className="relative">
                <label className="flex items-center justify-between mb-2 text-sm font-medium text-gray-700">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    کڕیار
                  </span>

                  {data.customer_id && (
                    <button
                      type="button"
                      onClick={clearCustomer}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      سڕینەوە
                    </button>
                  )}
                </label>

                <div className="relative">
                  <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 right-3 top-1/2" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => fetchCustomers(e.target.value)}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder="گەڕان بە ناو، ژمارەی مۆبایل یان ئیمەیل..."
                    className={`w-full pr-10 pl-10 py-3 border rounded-lg focus:border-blue-500 focus:ring-blue-500 ${
                      errors.customer_id ? "border-red-400" : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomerDropdown((s) => !s)}
                    className="absolute transform -translate-y-1/2 left-3 top-1/2"
                    title="کردنەوە/داخستن"
                  >
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        showCustomerDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                {showCustomerDropdown && (
                  <div className="absolute z-20 w-full mt-2 overflow-y-auto bg-white border border-gray-200 shadow-lg rounded-xl max-h-72">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((c) => {
                        const active = String(data.customer_id) === String(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setData("customer_id", String(c.id));
                              setCustomerSearch(c.name || "");
                              setShowCustomerDropdown(false);
                            }}
                            className={`w-full px-4 py-3 text-right hover:bg-gray-50 transition-colors ${
                              active ? "bg-blue-50" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-right">
                                <div className="font-semibold text-gray-900">{c.name}</div>
                                {c.phone && <div className="text-sm text-gray-500">{c.phone}</div>}
                                {c.email && <div className="text-sm text-gray-500">{c.email}</div>}
                              </div>
                              <div className="text-xs text-left text-gray-400">
                                باڵانس: {c.balance_iqd || 0} IQD
                                {c.balance_usd > 0 && ` | ${c.balance_usd} USD`}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-6 text-center text-gray-500">
                        کڕیارێک نەدۆزرایەوە
                      </div>
                    )}
                  </div>
                )}



                {errors.customer_id && (
                  <p className="mt-2 text-sm text-red-600">{errors.customer_id}</p>
                )}
              </div>

              {/* Amount + Currency */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                    <DollarSign className="w-4 h-4" />
                    بڕ
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={data.amount}
                    onChange={(e) => setData("amount", e.target.value)}
                    className={`w-full py-3 px-4 border rounded-lg focus:border-blue-500 focus:ring-blue-500 ${
                      errors.amount ? "border-red-400" : "border-gray-300"
                    }`}
                    placeholder="نمونە: 50000"
                  />
                  {errors.amount && <p className="mt-2 text-sm text-red-600">{errors.amount}</p>}
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                    <DollarSign className="w-4 h-4" />
                    دراو
                  </label>
                  <select
                    value={data.currency}
                    onChange={(e) => setData("currency", e.target.value)}
                    className={`w-full py-3 px-4 border rounded-lg focus:border-blue-500 focus:ring-blue-500 ${
                      errors.currency ? "border-red-400" : "border-gray-300"
                    }`}
                  >
                    <option value="IQD">دینار (IQD)</option>
                    <option value="USD">دۆلار (USD)</option>
                  </select>
                  {errors.currency && <p className="mt-2 text-sm text-red-600">{errors.currency}</p>}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                  <FileText className="w-4 h-4" />
                  تێبینی
                </label>
                <textarea
                  rows={3}
                  value={data.note}
                  onChange={(e) => setData("note", e.target.value)}
                  className={`w-full py-3 px-4 border rounded-lg focus:border-blue-500 focus:ring-blue-500 ${
                    errors.note ? "border-red-400" : "border-gray-300"
                  }`}
                  placeholder="تێبینی (ئارەزوومەندانە)..."
                />
                {errors.note && <p className="mt-2 text-sm text-red-600">{errors.note}</p>}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <button
                  type="submit"
                  disabled={processing}
                  className="flex items-center justify-center gap-2 py-3 text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {processing ? "چاوەڕێ بکە..." : "تۆمارکردن"}
                </button>

                <button
                  type="button"
                  onClick={() => router.get("/balances")}
                  className="flex items-center justify-center gap-2 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
                >
                  <ArrowRight className="w-5 h-5" />
                  گەڕانەوە
                </button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Side - Preview */}
        <div className="space-y-4">
          <Card className="border border-gray-200">
            <div className="p-5 space-y-3">
              <h3 className="text-sm font-bold text-gray-900">پێشبینین</h3>

              <div className="p-4 border border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="text-xs text-gray-600">کڕیار</div>
                <div className="mt-1 font-bold text-gray-900">{selectedCustomer?.name || "---"}</div>

                <div className="mt-2 text-xs text-gray-600">بڕ</div>
                <div className="mt-1 text-2xl font-extrabold text-blue-600">
                  {data.amount ? new Intl.NumberFormat("ar-IQ").format(Number(data.amount)) : "0"}{" "}
                  {data.currency}
                </div>
              </div>

              <div className="p-4 text-sm text-gray-700 border border-gray-200 rounded-xl bg-gray-50">
                <div className="mb-1 font-semibold">تێبینی</div>
                <div className="text-gray-600">{data.note?.trim() ? data.note : "---"}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
