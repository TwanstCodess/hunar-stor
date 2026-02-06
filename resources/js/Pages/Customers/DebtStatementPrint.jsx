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

              {/* Center - LARGER FONT IN PRINT */}
              <div className="flex-1 leading-relaxed text-center">
                <h2 className="text-2xl font-extrabold tracking-tight text-black sm:text-3xl print:text-2xl print:font-black print:text-black">
                  شوێنی هونەر
                </h2>

                <div className="mb-1 text-[15px] font-bold text-red-700 print:text-[15px] print:font-bold print:text-red-700">
                  <p className="mb-1 text-[15px] font-bold text-blue-700 print:text-[15px] print:font-bold print:text-blue-700">
                    بۆ فرۆشتنی کەرەستەی بیناسازی
                  </p>
                  <p className="print:text-[14px] print:leading-tight">
                    کەرپوچ - ئینگلاینی سەر دەرگا و پەنچەرە - بلوکی سوور - شیش - چیمەنتۆ - لم - چەو - B.R.C
                  </p>
                </div>

                <div className="print:mt-2">
                  <p className="mt-1 text-[12px] sm:text-[13px] text-gray-800 print:text-[13px] print:font-bold print:text-black">
                    خاوەن: عمر فیصل — 07701578023 | 07501165959
                  </p>
                  <p className="text-[12px] sm:text-[13px] text-gray-800 print:text-[13px] print:font-bold print:text-black">
                    ژمێریار: 07501127325
                  </p>
                </div>
              </div>

              {/* Right Logo */}
              <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 print:w-24 print:h-24">
                <img src="/logo/logo2.png" alt="Logo 2" className="object-contain w-full h-full" />
              </div>
            </div>

            {/* Meta row - EXTRA LARGE */}
            <div className="grid grid-cols-1 gap-3 mt-5 sm:grid-cols-4 print:grid-cols-4 print:gap-2 print:mt-4">
              <div className="flex items-center justify-between gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 print:border-black print:bg-gray-100 print:p-3 print:rounded-none">
                <span className="text-sm text-gray-700 print:text-[10px] print:font-bold print:text-black flex items-center gap-2">
                  <Hash className="w-5 h-5 print:w-4 print:h-4" />
                  ژمارەی قەرز
                </span>
                <span className="text-sm font-extrabold text-gray-900 print:text-[9px] print:font-extrabold print:text-black">
                  {statementNo}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 print:border-black print:bg-gray-100 print:p-3 print:rounded-none">
                <span className="text-sm text-gray-700 print:text-[12px] print:font-bold print:text-black flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 print:w-4 print:h-4" />
                  بەروار
                </span>
                <span className="text-sm font-extrabold text-gray-900 print:text-[12px] print:font-extrabold print:text-black">
                  {formatDate(now)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 print:border-black print:bg-gray-100 print:p-3 print:rounded-none">
                <span className="text-sm text-gray-700 print:text-[12px] print:font-bold print:text-black flex items-center gap-2">
                  <Clock3 className="w-5 h-5 print:w-4 print:h-4" />
                  کات
                </span>
                <span className="text-sm font-extrabold text-gray-900 print:text-[12px] print:font-extrabold print:text-black">
                  {formatDateTime(now)}
                </span>
              </div>

              {/* ✅ زیادکردنی بەشی کۆتا بەرواری قەرز */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 print:border-black print:bg-gray-100 print:p-3 print:rounded-none">
                <span className="text-sm text-gray-700 print:text-[12px] print:font-bold print:text-black flex items-center gap-2">
                  <Calendar className="w-5 h-5 print:w-4 print:h-4" />
                  کۆتا قەرز
                </span>
                <span className="text-sm font-extrabold text-gray-900 print:text-[12px] print:font-extrabold print:text-black">
                  {lastDebtDate ? formatDate(lastDebtDate) : 'هیچ قەرز نییە'}
                </span>
              </div>
            </div>
          </div>

          {/* Customer row - EXTRA LARGE */}
          <div className="px-6 pt-6 print:px-2 print:pt-4">
            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 print:border-black print:bg-gray-100 print:p-3 print:rounded-none">
              <div className="flex flex-wrap items-center justify-between gap-3 print:gap-4">
                <div className="flex items-center gap-3 print:gap-4">
                  <User2 className="w-5 h-5 text-blue-700 print:w-5 print:h-5 print:text-black" />
                  <span className="text-sm text-gray-700 print:text-[12px] print:font-bold print:text-black">کڕیار:</span>
                  <span className="text-sm font-extrabold text-gray-900 print:text-[12px] print:font-extrabold print:text-black">
                    {customer?.name || '---'}
                  </span>
                </div>

                <div className="flex items-center gap-3 print:gap-4">
                  <Phone className="w-5 h-5 text-gray-700 print:w-5 print:h-5 print:text-black" />
                  <span className="text-sm text-gray-700 print:text-[12px] print:font-bold print:text-black">مۆبایل:</span>
                  <span className="text-sm font-extrabold text-gray-900 print:text-[12px] print:font-extrabold print:text-black">
                    {customer?.phone || '---'}
                  </span>
                </div>

                <div className="text-sm text-gray-700 print:text-[12px] print:font-bold print:text-black">
                  ID: <span className="font-extrabold text-gray-900 print:text-black">{customer?.id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Table */}
          <div className="px-6 pt-5 pb-4 print:px-2 print:pt-3 print:pb-3">
            {allProducts.length === 0 ? (
              <div className="p-8 text-center border border-gray-300 rounded-2xl print:border-black print:rounded-none print:p-4">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 print:text-green-700 print:w-8 print:h-8" />
                <p className="mt-2 font-extrabold text-gray-800 print:text-[12pt] print:font-bold print:text-black">هیچ فرۆشتنێکی قەرز نییە</p>
                <p className="text-sm text-gray-500 print:text-[10pt] print:text-black">کڕیارەکە پارەی هەموو فرۆشتنەکانی داویە</p>
              </div>
            ) : (
              <div className="overflow-hidden border border-gray-200 shadow-sm rounded-2xl print:border-black print:rounded-none">
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full text-[10px] text-sm font-bold print:text-[9pt] print:font-bold border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-l from-blue-50 to-indigo-50 print:from-blue-100 print:to-indigo-100 print:break-inside-avoid">
                        <th className="p-2 text-center border border-gray-200 print:border print:border-black print:p-1">کاشێر</th>
                        <th className="p-2 text-center border border-gray-200 print:border print:border-black print:p-1">ژمارەی وەسڵ</th>
                        <th className="p-2 text-center border border-gray-200 print:border print:border-black print:p-1">تێبینی</th>
                        <th className="p-2 text-center border border-gray-200 print:border print:border-black print:p-1">بەروار</th>
                        <th className="p-2 text-center border border-gray-200 print:border print:border-black print:p-1">ناوی بەرهەم</th>
                        <th className="p-2 text-center border border-gray-200 print:border print:border-black print:p-1">عدد</th>
                        <th className="p-2 text-center border border-gray-200 print:border print:border-black print:p-1">نرخی تاکە</th>
                        <th className="p-2 text-center text-blue-700 border border-blue-700 print:border print:border-blue-700 print:text-blue-900 print:p-1">
                          کۆی بەرهەم
                        </th>
                      </tr>
                    </thead>

                    <tbody className="print:break-inside-auto">
                      {allProducts.map((p, idx) => (
                        <tr
                          key={`${p.saleId}-${p.productIndex}`}
                          className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-yellow-50 print:hover:bg-transparent print:break-inside-avoid`}
                        >
                          <td className="p-2 text-center border border-gray-200 print:border print:border-black print:p-1 print:text-[9pt] print:font-bold print:text-black">
                            {p.cashier}
                          </td>

                          <td className="p-2 text-center border border-gray-200 print:border print:border-black print:p-1 print:text-[9pt] print:font-bold print:text-black">
                            <span className="font-extrabold">
                              {(p.invoiceNumber || '').replace('SAL-', '').replace(/^0+/, '')}
                            </span>
                          </td>

                          <td className="p-2 text-center border border-gray-200 print:border print:border-black print:p-1">
                            {p.note ? (
                              <div className="text-[10px] text-gray-700 max-w-[160px] mx-auto leading-snug print:text-[8pt] print:font-bold print:text-black">
                                {p.note}
                              </div>
                            ) : (
                              <span className="text-gray-500 print:text-[8pt] print:text-black">---</span>
                            )}
                          </td>

                          <td className="p-2 text-center border border-gray-200 print:border print:border-black print:p-1 print:text-[9pt] print:font-bold print:text-black">
                            {p.date}
                          </td>
                          <td className="p-2 text-center border border-gray-200 print:border print:border-black print:p-1 print:text-[9pt] print:font-bold print:text-black">
                            {p.productName}
                          </td>

                          <td className="p-2 text-center border border-gray-200 print:border print:border-black print:p-1 print:text-[9pt] print:font-bold print:text-black">
                            <span className="font-extrabold">{formatNumber(p.quantity)}</span>{' '}
                          </td>

                          <td className="p-2 text-center border border-gray-200 print:border print:border-black print:p-1 print:text-[9pt] print:font-bold print:text-black">
                            {p.saleCurrency === 'IQD'
                              ? `${formatNumber(p.unitPrice)} دینار`
                              : `$${formatNumber(p.unitPrice)}`
                            }
                          </td>

                          <td className="p-2 text-center border border-blue-700 print:border print:border-blue-700 print:p-1">
                            <span className="font-extrabold text-blue-700 print:text-[9pt] print:font-bold print:text-blue-900">
                              {p.saleCurrency === 'IQD'
                                ? `${formatNumber(p.productTotal)} دینار`
                                : `$${formatNumber(p.productTotal)}`
                              }
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    <tfoot className="print:break-inside-avoid">
                      <tr className="font-extrabold bg-gray-100 print:bg-gray-200">
                        <td colSpan="5" className="p-2 text-center border border-gray-200 print:border print:border-black print:p-1 print:text-[9pt] print:font-bold print:text-black">
                          کۆی گشتی هەموو فرۆشتنەکان
                        </td>

                        <td className="p-2 text-center border border-gray-200 print:border print:border-black print:p-1">
                          <span className="text-purple-700 print:text-[9pt] print:font-bold print:text-purple-900">
                            {formatNumber(totalProductCount)}
                          </span>
                        </td>
                        <td colSpan="2" className="p-2 text-center border border-blue-700 print:border print:border-blue-700 print:p-1">
                          {selectedCurrency === 'both' ? (
                            <div className="space-y-1 print:space-y-0">
                              <div className="text-blue-700 print:text-[9pt] print:font-bold print:text-blue-900">
                                {formatTotalCurrency(currencyTotals.IQD.total, 'IQD')}
                              </div>
                              <div className="text-blue-700 print:text-[9pt] print:font-bold print:text-blue-900">
                                {formatTotalCurrency(currencyTotals.USD.total, 'USD')}
                              </div>
                            </div>
                          ) : selectedCurrency === 'iqd' ? (
                            <span className="text-blue-700 print:text-[9pt] print:font-bold print:text-blue-900">
                              {formatTotalCurrency(currencyTotals.IQD.total, 'IQD')}
                            </span>
                          ) : (
                            <span className="text-blue-700 print:text-[9pt] print:font-bold print:text-blue-900">
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
            <div className="px-6 pb-6 print:px-2 print:pb-4">
              <div className="overflow-hidden bg-white border border-gray-200 rounded-2xl print:border-black print:rounded-none">
                <div
                  className={`grid gap-3 p-4 print:p-3 ${
                    selectedCurrency === 'both'
                      ? 'grid-cols-1 sm:grid-cols-1 print-two-cols'
                      : 'grid-cols-1'
                  }`}
                >
                  {/* IQD */}
                  {(selectedCurrency === 'iqd' || selectedCurrency === 'both') && (
                    <div className="p-3 border border-gray-200 rounded-xl bg-gray-50 print:border-black print:bg-gray-100 print:p-2 print:rounded-none">
                      <div className="mt-3 text-xs print:mt-1">
                        <div className="grid grid-cols-3 gap-2 print:gap-1">
                          <div className="text-center print:break-inside-avoid">
                            <div className="text-sm font-extrabold text-gray-700 print:text-[10pt] print:font-bold print:text-black">کۆی گشتی</div>
                            <div className="text-sm font-extrabold text-blue-800 print:text-[10pt] print:font-bold print:text-blue-900">
                              {formatTotalCurrency(overallTotal.iqd, 'IQD')}
                            </div>
                          </div>

                          <div className="text-center print:break-inside-avoid">
                            <div className="text-sm font-extrabold text-gray-700 print:text-[10pt] print:font-bold print:text-black">پارەی دراو</div>
                            <div className="text-sm font-extrabold text-green-800 print:text-[10pt] print:font-bold print:text-green-900">
                              {formatTotalCurrency(overallPaid.iqd, 'IQD')}
                            </div>
                          </div>

                          <div className="text-center print:break-inside-avoid">
                            <div className="text-sm font-extrabold text-gray-700 print:text-[10pt] print:font-bold print:text-black">پارەی ماوە</div>
                            <div className="text-sm font-extrabold text-red-800 print:text-[10pt] print:font-bold print:text-red-900">
                              {formatTotalCurrency(overallRemaining.iqd, 'IQD')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* USD */}
                  {(selectedCurrency === 'usd' || selectedCurrency === 'both') && (
                    <div className="p-3 border border-gray-200 rounded-xl bg-gray-50 print:border-black print:bg-gray-100 print:p-2 print:rounded-none">
                      <div className="mt-3 text-xs print:mt-1">
                        <div className="grid grid-cols-3 gap-2 print:gap-1">
                          <div className="text-center print:break-inside-avoid">
                            <div className="text-sm font-extrabold text-gray-700 print:text-[10pt] print:font-bold print:text-black">کۆی گشتی</div>
                            <div className="text-sm font-extrabold text-blue-800 print:text-[10pt] print:font-bold print:text-blue-900">
                              {formatTotalCurrency(overallTotal.usd, 'USD')}
                            </div>
                          </div>

                          <div className="text-center print:break-inside-avoid">
                            <div className="text-sm font-extrabold text-gray-700 print:text-[10pt] print:font-bold print:text-black">پارەی دراو</div>
                            <div className="text-sm font-extrabold text-green-800 print:text-[10pt] print:font-bold print:text-green-900">
                              {formatTotalCurrency(overallPaid.usd, 'USD')}
                            </div>
                          </div>

                          <div className="text-center print:break-inside-avoid">
                            <div className="text-sm font-extrabold text-gray-700 print:text-[10pt] print:font-bold print:text-black">پارەی ماوە</div>
                            <div className="text-sm font-extrabold text-red-800 print:text-[10pt] print:font-bold print:text-red-900">
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
          <div className="hidden px-6 py-3 text-xs border-t border-gray-200 print:block print:border-black print:px-2 print:py-2">
            <div className="flex items-center justify-between print:gap-4">
              <div className="print:flex print:items-center print:gap-2">
                <span className="font-extrabold text-gray-700 print:text-[8pt] print:font-bold print:text-black">چاپکراو لە:</span>
                <span className="mr-2 font-extrabold text-gray-900 print:text-[8pt] print:font-bold print:text-black">
                  {new Date().toLocaleString('en-US')}
                </span>
              </div>

              <div className="print:flex print:items-center print:gap-2">
                <span className="font-extrabold text-gray-700 print:text-[8pt] print:font-bold print:text-black">کۆتا قەرز:</span>
                <span className="mr-2 font-extrabold text-gray-900 print:text-[8pt] print:font-bold print:text-black">
                  {lastDebtDate ? formatDate(lastDebtDate) : 'هیچ قەرز نییە'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Print Instructions */}
        <div className="p-4 mt-8 text-sm text-blue-700 border border-blue-200 rounded-lg bg-blue-50 print:hidden">
          <p className="mb-2 font-bold">ڕێنمایی چاپکردن:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>دوگمەی "چاپکردن" کلیک بکە یان کلتوری Ctrl+P بکەرەوە</li>
            <li>لە دیالۆگی چاپکردندا، "زیاترەکان" هەڵبژێرە</li>
            <li>ڕووکار: پۆرترێیت | قەبارە: A4 | مەودا: هەموو پەڕەکان</li>
            <li>هێڵە ناسێنراوەکان و پێناسەکان چاپ مەکە</li>
            <li>پێشبینینی پەڕەکە ببینە پێش چاپکردن</li>
          </ul>
        </div>
      </div>

      {/* Print Styles (Updated for Larger Fonts) */}
      <style jsx>{`
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        @media print {
          nav,
          header,
          button,
          .print\\:hidden {
            display: none !important;
          }

          body {
            background: #fff !important;
            color: #000 !important;
            font-size: 12pt !important;
            font-weight: bold !important;
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1.2 !important;
          }

          .max-w-6xl {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }

          .shadow-lg,
          .shadow-sm {
            box-shadow: none !important;
          }

          .border-gray-100,
          .border-gray-200 {
            border-color: #000 !important;
            border-width: 1px !important;
          }

          img {
            max-width: 100% !important;
            height: auto !important;
          }

          /* ✅ هێڵکاری Footer لە چاپ */
          .print\\:block {
            display: block !important;
          }

          /* Font Sizes for Print - EVEN LARGER */
          .print\\:text-2xl {
            font-size: 20pt !important;
            font-weight: bold !important;
          }

          .print\\:text-\[15px\] {
            font-size: 11pt !important;
            font-weight: bold !important;
          }

          .print\\:text-\[14px\] {
            font-size: 10pt !important;
            font-weight: bold !important;
          }

          .print\\:text-\[13px\] {
            font-size: 9.5pt !important;
            font-weight: bold !important;
          }

          /* GIGANTIC FONT FOR METADATA */
          .print\\:text-\[12px\] {
            font-size: 10.5pt !important;
            font-weight: bold !important;
          }

          .print\\:text-sm {
            font-size: 11pt !important;
            font-weight: bold !important;
          }

          .print\\:text-\[10px\] {
            font-size: 8pt !important;
            font-weight: bold !important;
          }

          .print\\:text-\[9pt\] {
            font-size: 8pt !important;
            font-weight: bold !important;
          }

          .print\\:text-\[8pt\] {
            font-size: 7pt !important;
            font-weight: bold !important;
          }

          .print\\:text-\[10pt\] {
            font-size: 9pt !important;
            font-weight: bold !important;
          }

          .print\\:text-\[12pt\] {
            font-size: 10pt !important;
            font-weight: bold !important;
          }

          /* Table Styles */
          table {
            page-break-inside: auto !important;
            font-size: 8pt !important;
            font-weight: bold !important;
            width: 100% !important;
            table-layout: fixed !important;
          }

          th, td {
            font-weight: bold !important;
            padding: 3px !important;
            text-align: center !important;
            vertical-align: middle !important;
            word-wrap: break-word !important;
          }

          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }

          thead {
            display: table-header-group !important;
            background-color: #f0f0f0 !important;
            -webkit-print-color-adjust: exact;
          }

          tfoot {
            display: table-footer-group !important;
            background-color: #f0f0f0 !important;
            -webkit-print-color-adjust: exact;
            page-break-inside: avoid !important;
          }

          tbody {
            display: table-row-group !important;
            page-break-inside: auto !important;
          }

          /* Colors in Print */
          .print\\:text-black {
            color: #000 !important;
            font-weight: bold !important;
          }

          .print\\:text-blue-900 {
            color: #1e3a8a !important;
            font-weight: bold !important;
          }

          .print\\:text-red-900 {
            color: #7f1d1d !important;
            font-weight: bold !important;
          }

          .print\\:text-green-900 {
            color: #14532d !important;
            font-weight: bold !important;
          }

          .print\\:text-purple-900 {
            color: #4c1d95 !important;
            font-weight: bold !important;
          }

          .print\\:text-blue-700 {
            color: #1d4ed8 !important;
            font-weight: bold !important;
          }

          .print\\:text-red-700 {
            color: #b91c1c !important;
            font-weight: bold !important;
          }

          /* Background Colors */
          .print\\:bg-gray-100 {
            background-color: #f5f5f5 !important;
            -webkit-print-color-adjust: exact;
          }

          .print\\:bg-gray-200 {
            background-color: #e5e5e5 !important;
            -webkit-print-color-adjust: exact;
          }

          .print\\:from-blue-100 {
            background-color: #dbeafe !important;
            -webkit-print-color-adjust: exact;
          }

          .print\\:to-indigo-100 {
            background-color: #e0e7ff !important;
            -webkit-print-color-adjust: exact;
          }

          /* Ensure all text is bold */
          * {
            font-weight: bold !important;
          }

          /* Larger padding for meta boxes */
          .print\\:p-3 {
            padding: 10px !important;
          }

          /* Larger spacing */
          .print\\:gap-2 {
            gap: 8px !important;
          }

          .print\\:gap-3 {
            gap: 12px !important;
          }

          .print\\:gap-4 {
            gap: 16px !important;
          }

          /* Larger icons */
          .print\\:w-4 {
            width: 16px !important;
          }

          .print\\:h-4 {
            height: 16px !important;
          }

          .print\\:w-5 {
            width: 20px !important;
          }

          .print\\:h-5 {
            height: 20px !important;
          }

          /* Spacing */
          .print\\:p-1 {
            padding: 3px !important;
          }

          .print\\:p-2 {
            padding: 6px !important;
          }

          .print\\:p-3 {
            padding: 9px !important;
          }

          .print\\:px-2 {
            padding-left: 8px !important;
            padding-right: 8px !important;
          }

          .print\\:py-2 {
            padding-top: 6px !important;
            padding-bottom: 6px !important;
          }

          /* Borders */
          .print\\:border {
            border-width: 1px !important;
            border-color: #000 !important;
          }

          .print\\:border-black {
            border-color: #000 !important;
            border-width: 1px !important;
          }

          .print\\:border-blue-700 {
            border-color: #1d4ed8 !important;
            border-width: 1px !important;
          }

          /* Remove rounded corners */
          .rounded-2xl,
          .rounded-xl,
          .rounded-lg,
          .rounded {
            border-radius: 0 !important;
          }

          .print\\:rounded-none {
            border-radius: 0 !important;
          }

          /* Page Break Control */
          .print\\:break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .print\\:break-before-avoid {
            page-break-before: avoid !important;
            break-before: avoid !important;
          }

          /* Prevent splitting tables */
          .print\\:break-inside-auto {
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
        }

        @page {
          size: A4 portrait;
          margin: 12mm;
        }
      `}</style>
    </AuthenticatedLayout>
  );
}
