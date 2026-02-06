import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link } from '@inertiajs/react';
import {
  Printer,
  ArrowLeft,
  Filter,
  DollarSign,
  Coins,
  CheckCircle,
  User2,
  Phone,
  CalendarDays,
  Clock3,
  Hash,
  Calendar,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';

export default function DebtStatementPrint({ customer, sales, totalDebt, company, auth, currencyFilter }) {
  const [selectedCurrency, setSelectedCurrency] = useState(currencyFilter || 'both');
  const [lastDebtDate, setLastDebtDate] = useState(null);

  // ✅ فانکشنی فۆرماتی ژمارە بە ئینگلیزی
  const formatNumber = (num) => {
    const n = Number(num) || 0;
    return new Intl.NumberFormat('en-US').format(n);
  };

  // ✅ فانکشنی فۆرماتی دراو
  const formatCurrency = (amount, currencyType) => {
    const n = Number(amount) || 0;
    if (n === 0) return '0';

    const formattedAmount = formatNumber(Math.abs(n));

    if (currencyType === 'IQD') return `${formattedAmount} دینار`;
    if (currencyType === 'USD') return `$${formattedAmount}`;
    return formattedAmount;
  };

  // ✅ فانکشنی فۆرماتی دراو بۆ کۆی گشتی
  const formatTotalCurrency = (amount, currencyType) => {
    const n = Number(amount);
    if (!Number.isFinite(n)) return '---';
    if (n === 0) return '0';

    const formattedAmount = formatNumber(Math.abs(n));

    if (currencyType === 'IQD') return `${formattedAmount} دینار`;
    if (currencyType === 'USD') return `$${formattedAmount}`;
    return formattedAmount;
  };

  // ✅ فانکشنی فۆرماتی بەروار بە ئینگلیزی
const formatDate = (date) => {
    if (!date) return '---';

    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
};

  // ✅ فانکشنی فۆرماتی کات و بەروار بە ئینگلیزی
const formatDateTime = (date) => {
  if (!date) return '---';

  const d = new Date(date);
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');

  // 12-hour format
  let twelveHour = hours % 12;
  if (twelveHour === 0) twelveHour = 12;

  // ڕێکخستنی ئەم/پی ئێم بە کوردی
  let period = '';
  if (hours >= 0 && hours < 12) {
    period = 'کاتژمێر';
  } else {
    period = 'کاتژمێر';
  }

  return `${twelveHour}:${minutes} ${period}`;
};

  // ✅ فانکشنی وەرگرتنی کۆتا بەرواری قەرز
  const getLastDebtDate = () => {
    if (!sales || sales.length === 0) return null;

    // فلتەرکردنی فرۆشتنە قەرزەکان (کە پارەیان ماوەتەوە)
    const debtSales = sales.filter(sale =>
      Number(sale.remaining_amount) > 0
    );

    if (debtSales.length === 0) return null;

    // وەرگرتنی کۆتا بەروار لە فرۆشتنە قەرزەکان
    const lastDates = debtSales.map(sale => new Date(sale.sale_date || sale.created_at));
    const latestDate = new Date(Math.max(...lastDates));

    return latestDate;
  };

  const handlePrint = () => window.print();

  const handleCurrencyChange = (currency) => {
    setSelectedCurrency(currency);
    window.location.href = `/customers/${customer.id}/debt-statement/print?currency=${currency}`;
  };

  // فلتەرکردنی فرۆشتنەکان بەپێی دراو
  const filteredSales = sales.filter((sale) => {
    if (selectedCurrency === 'iqd') return sale.currency === 'IQD';
    if (selectedCurrency === 'usd') return sale.currency === 'USD';
    return true;
  });

  // هەموو بەرهەمەکان (flatten)
  const allProducts = useMemo(() => {
    const products = [];
    filteredSales.forEach((sale) => {
      const items = sale.items || [];
      items.forEach((item, itemIndex) => {
        products.push({
          saleId: sale.id,
          invoiceNumber: sale.invoice_number,
          cashier: sale.user?.name || '---',
          date: formatDate(sale.sale_date),
          productIndex: itemIndex + 1,
          productName: item.product?.name || 'نادیار',
          quantity: Number(item.quantity) || 0,
          unit: item.product?.unit_display || item.product?.unit_name || item.product?.unit_type || 'دانە',
          unitPrice: Number(item.unit_price) || 0,
          productTotal: Number(item.total_price) || 0,
          saleCurrency: sale.currency,
          paidAmount: Number(sale.paid_amount) || 0,
          remainingAmount: Number(sale.remaining_amount) || 0,
          note: item.note || sale.notes || null,
          saleDate: sale.sale_date || sale.created_at,
        });
      });
    });
    return products;
  }, [filteredSales]);

  // کۆی گشتیەکان بەپێی دراو
  const currencyTotals = useMemo(() => {
    const totals = {
      IQD: { total: 0, paid: 0, remaining: 0, product_count: 0 },
      USD: { total: 0, paid: 0, remaining: 0, product_count: 0 },
    };

    filteredSales.forEach((sale) => {
      const productCount =
        sale.items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 0;

      if (sale.currency === 'IQD') {
        totals.IQD.total += Number(sale.total_amount) || 0;
        totals.IQD.paid += Number(sale.paid_amount) || 0;
        totals.IQD.remaining += Number(sale.remaining_amount) || 0;
        totals.IQD.product_count += productCount;
      } else if (sale.currency === 'USD') {
        totals.USD.total += Number(sale.total_amount) || 0;
        totals.USD.paid += Number(sale.paid_amount) || 0;
        totals.USD.remaining += Number(sale.remaining_amount) || 0;
        totals.USD.product_count += productCount;
      }
    });

    return totals;
  }, [filteredSales]);

  const totalProductCount = useMemo(() => {
    return allProducts.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
  }, [allProducts]);

  // ژمارەی قەرز + کات/بەروار
  const now = useMemo(() => new Date(), []);
  const statementNo = useMemo(
    () => `DEBT-${customer?.id}-${Date.now().toString().slice(-6)}`,
    [customer?.id]
  );

  // پارەی ماوە بەپێی فلتەر
  const overallRemaining = useMemo(() => {
    return {
      iqd: selectedCurrency === 'iqd' ? totalDebt?.iqd : selectedCurrency === 'both' ? totalDebt?.iqd : 0,
      usd: selectedCurrency === 'usd' ? totalDebt?.usd : selectedCurrency === 'both' ? totalDebt?.usd : 0,
    };
  }, [selectedCurrency, totalDebt]);

  // کۆی گشتی total
  const overallTotal = useMemo(() => {
    return {
      iqd:
        selectedCurrency === 'iqd'
          ? currencyTotals.IQD.total
          : selectedCurrency === 'both'
          ? currencyTotals.IQD.total
          : 0,
      usd:
        selectedCurrency === 'usd'
          ? currencyTotals.USD.total
          : selectedCurrency === 'both'
          ? currencyTotals.USD.total
          : 0,
    };
  }, [selectedCurrency, currencyTotals]);

  // پارەی دراو
  const overallPaid = useMemo(() => {
    return {
      iqd:
        selectedCurrency === 'iqd'
          ? currencyTotals.IQD.paid
          : selectedCurrency === 'both'
          ? currencyTotals.IQD.paid
          : 0,
      usd:
        selectedCurrency === 'usd'
          ? currencyTotals.USD.paid
          : selectedCurrency === 'both'
          ? currencyTotals.USD.paid
          : 0,
    };
  }, [selectedCurrency, currencyTotals]);

  // دیاریکردنی کۆتا بەرواری قەرز
  useEffect(() => {
    const lastDate = getLastDebtDate();
    setLastDebtDate(lastDate);
  }, [sales]);

  return (
    <AuthenticatedLayout user={auth?.user}>
      <div className="max-w-6xl px-3 mx-auto font-bold sm:px-4">
        {/* Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 mb-6 bg-white border border-gray-100 shadow-sm rounded-2xl print:hidden">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/customers/${customer.id}`}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 transition bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              <ArrowLeft className="w-4 h-4" />
              گەڕانەوە
            </Link>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">نیشاندانی:</span>
              <div className="flex overflow-hidden bg-gray-100 border border-gray-200 rounded-xl">
                <button
                  onClick={() => handleCurrencyChange('both')}
                  className={`px-3 py-2 text-xs transition ${
                    selectedCurrency === 'both'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  هەموو دراوەکان
                </button>

                <button
                  onClick={() => handleCurrencyChange('iqd')}
                  className={`px-3 py-2 text-xs transition ${
                    selectedCurrency === 'iqd'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Coins className="inline w-3 h-3 ml-1" />
                  دینار
                </button>

                <button
                  onClick={() => handleCurrencyChange('usd')}
                  className={`px-3 py-2 text-xs transition ${
                    selectedCurrency === 'usd'
                      ? 'bg-yellow-600 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <DollarSign className="inline w-3 h-3 ml-1" />
                  دۆلار
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-white transition bg-blue-600 shadow-sm rounded-xl hover:bg-blue-700"
          >
            <Printer className="w-4 h-4" />
            چاپکردن
          </button>
        </div>

        {/* Main Content */}
        <div className="overflow-hidden bg-white border border-gray-100 shadow-lg rounded-2xl print:shadow-none print:border-black print:rounded-none">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b-2 border-black print:border-black">
            <div className="flex items-center justify-between gap-4">
              {/* Left Logo */}
              <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 print:w-24 print:h-24">
                <img src="/logo/logo.png" alt="Logo" className="object-contain w-full h-full" />
              </div>

              {/* Center */}
              <div className="flex-1 leading-relaxed text-center">
                <h2 className="text-2xl font-extrabold tracking-tight text-black sm:text-3xl">
                  نوسینگەی ئاریان
                </h2>

                <div className="mb-1 text-[15px] font-bold text-red-700 print:text-red-800">
                  <p className="mb-1 text-[15px] font-bold text-blue-700 print:text-blue-800">
                    بۆ فرۆشتنی کەرەستەی بیناسازی
                  </p>
                  <p>
                    کەرپوچ - ئینگلاینی سەر دەرگا و پەنچەرە - بلوکی سوور - شیش - چیمەنتۆ - لم - چەو - B.R.C
                  </p>
                </div>

                <p className="mt-1 text-[12px] sm:text-[13px] text-gray-800 print:text-black">
                  خاوەن: عمر فیصل — 07701578023 | 07501165959
                </p>
                <p className="text-[12px] sm:text-[13px] text-gray-800 print:text-black">
                  ژمێریار: 07501127325
                </p>
              </div>

              {/* Right Logo */}
              <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 print:w-24 print:h-24">
                <img src="/logo/logo2.png" alt="Logo 2" className="object-contain w-full h-full" />
              </div>
            </div>

            {/* Meta row */}
            <div className="grid grid-cols-1 gap-2 mt-4 sm:grid-cols-4">
              <div className="flex items-center justify-between gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 print:border-black print:bg-gray-100">
                <span className="text-[12px] text-gray-700 print:text-black flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  ژمارەی قەرز
                </span>
                <span className="text-[12px] font-extrabold text-gray-900 print:text-black">
                  {statementNo}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 print:border-black print:bg-gray-100">
                <span className="text-[12px] text-gray-700 print:text-black flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  بەروار
                </span>
                <span className="text-[12px] font-extrabold text-gray-900 print:text-black">
                  {formatDate(now)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 print:border-black print:bg-gray-100">
                <span className="text-[12px] text-gray-700 print:text-black flex items-center gap-2">
                  <Clock3 className="w-4 h-4" />
                  کات
                </span>
                <span className="text-[12px] font-extrabold text-gray-900 print:text-black">
                  {formatDateTime(now)}
                </span>
              </div>

              {/* ✅ زیادکردنی بەشی کۆتا بەرواری قەرز */}
              <div className="flex items-center justify-between gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 print:border-black print:bg-gray-100">
                <span className="text-[12px] text-gray-700 print:text-black flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  کۆتا قەرز
                </span>
                <span className="text-[12px] font-extrabold text-gray-900 print:text-black">
                  {lastDebtDate ? formatDate(lastDebtDate) : 'هیچ قەرز نییە'}
                </span>
              </div>
            </div>
          </div>

          {/* Customer row */}
          <div className="px-6 pt-5">
            <div className="p-3 border border-gray-200 rounded-xl bg-gray-50 print:border-black print:bg-gray-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <User2 className="w-4 h-4 text-blue-700 print:text-black" />
                  <span className="text-xs text-gray-700 print:text-black">کڕیار:</span>
                  <span className="text-xs font-extrabold text-gray-900 print:text-black">
                    {customer?.name || '---'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-700 print:text-black" />
                  <span className="text-xs text-gray-700 print:text-black">مۆبایل:</span>
                  <span className="text-xs font-extrabold text-gray-900 print:text-black">
                    {customer?.phone || '---'}
                  </span>
                </div>

                <div className="text-xs text-gray-700 print:text-black">
                  ID: <span className="font-extrabold text-gray-900">{customer?.id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Table */}
          <div className="px-6 pt-5 pb-4">
            {allProducts.length === 0 ? (
              <div className="p-8 text-center border border-gray-300 rounded-2xl print:border-black print:rounded-none">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 print:text-green-700" />
                <p className="mt-2 font-extrabold text-gray-800 print:text-black">هیچ فرۆشتنێکی قەرز نییە</p>
                <p className="text-sm text-gray-500 print:text-black">کڕیارەکە پارەی هەموو فرۆشتنەکانی داویە</p>
              </div>
            ) : (
              <div className="overflow-hidden border border-gray-200 shadow-sm rounded-2xl print:border-black print:rounded-none">
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] print:text-[9pt] border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-l from-blue-50 to-indigo-50 print:from-blue-100 print:to-indigo-100">
                        <th className="p-2 text-center border border-gray-200 print:border-black">کاشێر</th>
                        <th className="p-2 text-center border border-gray-200 print:border-black">ژمارەی وەسڵ</th>
                        <th className="p-2 text-center border border-gray-200 print:border-black">تێبینی</th>
                        <th className="p-2 text-center border border-gray-200 print:border-black">بەروار</th>
                        <th className="p-2 text-center border border-gray-200 print:border-black">ناوی بەرهەم</th>
                        <th className="p-2 text-center border border-gray-200 print:border-black">عدد</th>
                        <th className="p-2 text-center border border-gray-200 print:border-black">نرخی تاکە</th>
                        <th className="p-2 text-center text-blue-700 border border-blue-700 print:border-blue-700 print:text-blue-900">
                          کۆی بەرهەم
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {allProducts.map((p, idx) => (
                        <tr
                          key={`${p.saleId}-${p.productIndex}`}
                          className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-yellow-50 print:hover:bg-transparent`}
                        >
                          <td className="p-2 text-center border border-gray-200 print:border-black">{p.cashier}</td>

                          <td className="p-2 text-center border border-gray-200 print:border-black">
                            <span className="font-extrabold">
                              {(p.invoiceNumber || '').replace('SAL-', '').replace(/^0+/, '')}
                            </span>
                          </td>

                          <td className="p-2 text-center border border-gray-200 print:border-black">
                            {p.note ? (
                              <div className="text-[10px] text-gray-700 max-w-[160px] mx-auto leading-snug print:text-black">
                                {p.note}
                              </div>
                            ) : (
                              <span className="text-gray-500 print:text-black">---</span>
                            )}
                          </td>

                          <td className="p-2 text-center border border-gray-200 print:border-black">{p.date}</td>
                          <td className="p-2 text-center border border-gray-200 print:border-black">{p.productName}</td>

                          <td className="p-2 text-center border border-gray-200 print:border-black">
                            <span className="font-extrabold">{formatNumber(p.quantity)}</span>{' '}
                          </td>

                          <td className="p-2 text-center border border-gray-200 print:border-black">
                            {p.saleCurrency === 'IQD'
                              ? `${formatNumber(p.unitPrice)} دینار`
                              : `$${formatNumber(p.unitPrice)}`
                            }
                          </td>

                          <td className="p-2 text-center border border-blue-700 print:border-blue-700">
                            <span className="font-extrabold text-blue-700 print:text-blue-900">
                              {p.saleCurrency === 'IQD'
                                ? `${formatNumber(p.productTotal)} دینار`
                                : `$${formatNumber(p.productTotal)}`
                              }
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    <tfoot>
                      <tr className="font-extrabold bg-gray-100 print:bg-gray-200">
                        <td colSpan="5" className="p-2 text-center border border-gray-200 print:border-black">
                          کۆی گشتی هەموو فرۆشتنەکان
                        </td>

                        <td className="p-2 text-center border border-gray-200 print:border-black">
                          <span className="text-purple-700 print:text-purple-900">
                            {formatNumber(totalProductCount)}
                          </span>
                        </td>
                        <td colSpan="2" className="p-2 text-center border border-blue-700 print:border-blue-700">
                          {selectedCurrency === 'both' ? (
                            <div className="space-y-1">
                              <div className="text-blue-700 print:text-blue-900">
                                {formatTotalCurrency(currencyTotals.IQD.total, 'IQD')}
                              </div>
                              <div className="text-blue-700 print:text-blue-900">
                                {formatTotalCurrency(currencyTotals.USD.total, 'USD')}
                              </div>
                            </div>
                          ) : selectedCurrency === 'iqd' ? (
                            <span className="text-blue-700 print:text-blue-900">
                              {formatTotalCurrency(currencyTotals.IQD.total, 'IQD')}
                            </span>
                          ) : (
                            <span className="text-blue-700 print:text-blue-900">
                              {formatTotalCurrency(currencyTotals.USD.total, 'USD')}
                            </span>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ✅ Bottom Summary */}
          {allProducts.length > 0 && (
            <div className="px-6 pb-6">
              <div className="overflow-hidden bg-white border border-gray-200 rounded-2xl print:border-black print:rounded-none">
                <div
                  className={`grid gap-3 p-4 ${
                    selectedCurrency === 'both'
                      ? 'grid-cols-1 sm:grid-cols-2 print-two-cols'
                      : 'grid-cols-1'
                  }`}
                >
                  {/* IQD */}
                  {(selectedCurrency === 'iqd' || selectedCurrency === 'both') && (
                    <div className="p-3 border border-gray-200 rounded-xl bg-gray-50 print:border-black print:bg-gray-100">

                      <div className="mt-3 text-xs">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <div className="font-extrabold text-gray-700 print:text-black">کۆی گشتی</div>
                            <div className="font-extrabold text-blue-800 print:text-black">
                              {formatTotalCurrency(overallTotal.iqd, 'IQD')}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="font-extrabold text-gray-700 print:text-black">پارەی دراو</div>
                            <div className="font-extrabold text-green-800 print:text-black">
                              {formatTotalCurrency(overallPaid.iqd, 'IQD')}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="font-extrabold text-gray-700 print:text-black">پارەی ماوە</div>
                            <div className="font-extrabold text-red-800 print:text-black">
                              {formatTotalCurrency(overallRemaining.iqd, 'IQD')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* USD */}
                  {(selectedCurrency === 'usd' || selectedCurrency === 'both') && (
                    <div className="p-3 border border-gray-200 rounded-xl bg-gray-50 print:border-black print:bg-gray-100">
                      <div className="mt-3 text-xs">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <div className="font-extrabold text-gray-700 print:text-black">کۆی گشتی</div>
                            <div className="font-extrabold text-blue-800 print:text-black">
                              {formatTotalCurrency(overallTotal.usd, 'USD')}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="font-extrabold text-gray-700 print:text-black">پارەی دراو</div>
                            <div className="font-extrabold text-green-800 print:text-black">
                              {formatTotalCurrency(overallPaid.usd, 'USD')}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="font-extrabold text-gray-700 print:text-black">پارەی ماوە</div>
                            <div className="font-extrabold text-red-800 print:text-black">
                              {formatTotalCurrency(overallRemaining.usd, 'USD')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ✅ Footer - چاپکراو لە چاپ */}
          <div className="hidden px-6 py-3 text-xs border-t border-gray-200 print:block print:border-black">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-extrabold text-gray-700 print:text-black">چاپکراو لە:</span>
                <span className="mr-2 font-extrabold text-gray-900 print:text-black">
                  {new Date().toLocaleString('en-US')}
                </span>
              </div>

              <div>
                <span className="font-extrabold text-gray-700 print:text-black">کۆتا قەرز:</span>
                <span className="mr-2 font-extrabold text-gray-900 print:text-black">
                  {lastDebtDate ? formatDate(lastDebtDate) : 'هیچ قەرز نییە'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Print Styles (Color-safe) */}
        <style jsx>{`
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-weight: 700 !important;
          }

          /* ✅ بۆ ئەوەی کارتەکانی both لە چاپداش یەک ڕۆ بن */
          @media print {
            .print-two-cols {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 10px !important;
            }

            nav,
            header,
            button,
            .print\\:hidden {
              display: none !important;
            }

            body {
              background: #fff !important;
              color: #000 !important;
              font-size: 10pt !important;
              font-weight: 700 !important;
            }

            .max-w-6xl {
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .shadow-lg,
            .shadow-sm {
              box-shadow: none !important;
            }

            .border-gray-100,
            .border-gray-200 {
              border-color: #000 !important;
            }

            table {
              font-size: 9pt !important;
            }

            tr {
              page-break-inside: avoid;
            }

            thead {
              display: table-header-group;
            }

            tfoot {
              display: table-footer-group;
            }

            img {
              max-width: 100% !important;
              height: auto !important;
            }

            /* ✅ هێڵکاری Footer لە چاپ */
            .print\\:block {
              display: block !important;
            }
          }

          @page {
            size: A4 portrait;
            margin: 12mm;
          }
        `}</style>
      </div>
    </AuthenticatedLayout>
  );
}
