import { useForm, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import Card from "@/Components/Card";
import { Edit } from "lucide-react";

export default function EditPage({ balance }) {
  const { data, setData, put, processing, errors } = useForm({
    amount: balance.amount ?? "",
    note: balance.note ?? "",
  });

  const submit = (e) => {
    e.preventDefault();
    put(route("balances.update", balance.id));
  };

  return (
    <AuthenticatedLayout title="دەسکاری پارەدان">
      <PageHeader
        title="دەسکاری پارەدان"
        subtitle={`کڕیار: ${balance.customer?.name || "---"}`}
        action={{
          href: route("balances.index"),
          label: "گەڕانەوە",
          icon: Edit,
        }}
      />

      <Card className="max-w-2xl p-6 border border-gray-200">
        <div className="mb-4 text-sm text-gray-600">
          <div>دراو: <b>{balance.currency}</b></div>
          <div>بەروار: <b>{new Date(balance.created_at).toLocaleString()}</b></div>
          <div>باڵانسی پێشوو: <b>{balance.before_balance.toLocaleString()}</b></div>
          <div>باڵانسی دوای: <b>{balance.after_balance.toLocaleString()}</b></div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">بڕ</label>
            <input
              type="number"
              step="0.01"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white"
              value={data.amount}
              onChange={(e) => setData("amount", e.target.value)}
            />
            {errors.amount && <div className="mt-1 text-xs text-red-600">{errors.amount}</div>}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">تێبینی</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white"
              value={data.note}
              onChange={(e) => setData("note", e.target.value)}
            />
            {errors.note && <div className="mt-1 text-xs text-red-600">{errors.note}</div>}
          </div>

          <button
            disabled={processing}
            className="bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm disabled:opacity-50"
          >
            {processing ? "چاوەڕوان..." : "پاشەکەوتکردن"}
          </button>

          <div className="text-xs text-gray-500">
            * currency لە edit ناگۆڕدرێت بۆ ئەوەی حسابات تێک نەچێت.
          </div>
        </form>
      </Card>
    </AuthenticatedLayout>
  );
}
