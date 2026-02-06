import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
  Printer,
  User2,
  Phone,
  CalendarDays,
  Clock3,
  Hash,
  ShoppingBag,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Coins,
  DollarSign
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';

export default function AllSalesPrint({ customer, sales, stats, company, auth, filters }) {
  const [selectedCurrency] = useState(filters?.currency || 'both');
  const [startDate] = useState(filters?.start_date || '');
  const [endDate] = useState(filters?.end_date || '');

  // فانکشنەکانی فۆرماتکردن
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const formatCurrency = (amount, currencyType) => {
    const n = Number(amount) || 0;
    if (n === 0) return '0';

    const formattedAmount = formatNumber(Math.abs(n));

    if (currencyType === 'IQD') return `${formattedAmount} دینار`;
    if (currencyType === 'USD') return `$${formattedAmount}`;
    return formattedAmount;
  };

const formatDate = (date) => {
    if (!date) return '---';

    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
};

  const formatDateTime = (date) => {
    if (!date) return '---';
    const d = new Date(date);
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    let twelveHour = hours % 12;
    if (twelveHour === 0) twelveHour = 12;

    return `${twelveHour}:${minutes} ${hours >= 12 ? 'پ.ن' : 'خ'}`;
  };

  const handlePrint = () => window.print();

  // فلتەرکردنی فرۆشتنەکان بەپێی دراو
  const filteredSales = useMemo(() => {
    let result = [...sales];

    if (selectedCurrency === 'iqd') {
      result = result.filter(sale => sale.currency === 'IQD');
    } else if (selectedCurrency === 'usd') {
      result = result.filter(sale => sale.currency === 'USD');
    }

    return result;
  }, [sales, selectedCurrency]);

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
          status: sale.remaining_amount > 0 ?
            (sale.paid_amount > 0 ? 'بەشەقەرز' : 'قەرز') :
            'تەواو',
        });
      });
    });
    return products;
  }, [filteredSales]);

  // کۆی گشتیەکان بەپێی دراو
  const currencyTotals = useMemo(() => {
    const totals = {
      IQD: { total: 0, paid: 0, remaining: 0, product_count: 0, sales_count: 0 },
      USD: { total: 0, paid: 0, remaining: 0, product_count: 0, sales_count: 0 },
    };

    filteredSales.forEach((sale) => {
      const productCount = sale.items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 0;

      if (sale.currency === 'IQD') {
        totals.IQD.total += Number(sale.total_amount) || 0;
        totals.IQD.paid += Number(sale.paid_amount) || 0;
        totals.IQD.remaining += Number(sale.remaining_amount) || 0;
        totals.IQD.product_count += productCount;
        totals.IQD.sales_count += 1;
      } else if (sale.currency === 'USD') {
        totals.USD.total += Number(sale.total_amount) || 0;
        totals.USD.paid += Number(sale.paid_amount) || 0;
        totals.USD.remaining += Number(sale.remaining_amount) || 0;
        totals.USD.product_count += productCount;
        totals.USD.sales_count += 1;
      }
    });

    return totals;
  }, [filteredSales]);

  const totalProductCount = useMemo(() => {
    return allProducts.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
  }, [allProducts]);

  // دیاریکردنی کۆتا بەرواری فرۆشتن
  const lastSaleDate = useMemo(() => {
    if (filteredSales.length === 0) return null;
    const dates = filteredSales.map(sale => new Date(sale.sale_date || sale.created_at));
    return new Date(Math.max(...dates));
  }, [filteredSales]);

  // ژمارەی ڕاپۆرت
  const reportNo = useMemo(() => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    return `RPT-${customer.id}-${year}${month}${day}-${random}`;
  }, [customer.id]);

  return (
    <AuthenticatedLayout user={auth?.user}>
      <div className="max-w-6xl px-3 mx-auto font-bold sm:px-4">
        {/* Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 mb-6 bg-white border border-gray-100 shadow-sm rounded-2xl print:hidden">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 transition bg-gray-100 rounded-xl hover:bg-gray-200"
          >
            گەڕانەوە
          </button>

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
                  {company?.name || 'شوێنی هونەر'}
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
                  خاوەن: عمر فیصل — {company?.phone?.split(' | ')[0] || '07701578023'}
                </p>
                <p className="text-[12px] sm:text-[13px] text-gray-800 print:text-black">
                  ژمێریار: {company?.phone?.split(' | ')[1] || '07501127325'}
                </p>
              </div>

              {/* Right Logo */}
              <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 print:w-24 print:h-24">
                <img src="/logo/logo2.png" alt="Logo 2" className="object-contain w-full h-full" />
              </div>
            </div>

            {/* Report Title */}
            <div className="mt-4 text-center">
              <h3 className="text-xl font-extrabold text-blue-800 print:text-blue-900">
                ڕاپۆرتی هەموو فرۆشتنەکانی کڕیار
              </h3>
            </div>

            {/* Meta row */}
            <div className="grid grid-cols-1 gap-2 mt-4 sm:grid-cols-3">
              <div className="flex items-center justify-between gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 print:border-black print:bg-gray-100">
                <span className="text-[12px] text-gray-700 print:text-black flex items-center gap-2">
                  <User2 className="w-4 h-4" />
                  کڕیار
                </span>
                <span className="text-[12px] font-extrabold text-gray-900 print:text-black">
                     {customer?.name || '---'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 print:border-black print:bg-gray-100">
                <span className="text-[12px] text-gray-700 print:text-black flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  بەروار
                </span>
                <span className="text-[12px] font-extrabold text-gray-900 print:text-black">
                  {formatDate(new Date())}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 print:border-black print:bg-gray-100">
                <span className="text-[12px] text-gray-700 print:text-black flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  کۆتا فرۆشتن
                </span>
                <span className="text-[12px] font-extrabold text-gray-900 print:text-black">
                  {lastSaleDate ? formatDate(lastSaleDate) : '---'}
                </span>
              </div>
            </div>
          </div>

          {/* Filters Info */}
          {(selectedCurrency !== 'both' || startDate || endDate) && (
            <div className="px-6 pt-4">
              <div className="p-2 border border-gray-200 rounded-lg print:border-black">
                <div className="text-xs text-gray-700 print:text-black">
                  <span className="font-extrabold">فلتەرەکان:</span>
                  <span className="mr-2">
                    {selectedCurrency !== 'both' && (
                      <span className="mx-1">
                        دراو:
                        {selectedCurrency === 'iqd' ? ' دینار' : ' دۆلار'}
                      </span>
                    )}
                    {startDate && <span className="mx-1">لە: {formatDate(startDate)}</span>}
                    {endDate && <span className="mx-1">بۆ: {formatDate(endDate)}</span>}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="px-6 pt-4">
          </div>

          {/* Sales Table */}
          <div className="px-6 pt-5 pb-4">
            {allProducts.length === 0 ? (
              <div className="p-8 text-center border border-gray-300 rounded-2xl print:border-black print:rounded-none">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 print:text-green-700" />
                <p className="mt-2 font-extrabold text-gray-800 print:text-black">هیچ فرۆشتنێک نییە</p>
                <p className="text-sm text-gray-500 print:text-black">کڕیارەکە هیچ فرۆشتنی نییە</p>
              </div>
            ) : (
              <div className="overflow-hidden border border-gray-200 shadow-sm rounded-2xl print:border-black print:rounded-none">
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] print:text-[9pt] border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-l from-blue-50 to-indigo-50 print:from-blue-100 print:to-indigo-100">
                        <th className="p-2 text-sm font-bold text-center border border-gray-200 print:border-black">کاشێر</th>
                        <th className="p-2 text-sm font-bold text-center border border-gray-200 print:border-black">ژمارەی وەسڵ</th>
                        <th className="p-2 text-sm font-bold text-center border border-gray-200 print:border-black">بەروار</th>
                        <th className="p-2 text-sm font-bold text-center border border-gray-200 print:border-black">ناوی بەرهەم</th>
                        <th className="p-2 text-sm font-bold text-center border border-gray-200 print:border-black">عدد</th>
                        <th className="p-2 text-sm font-bold text-center border border-gray-200 print:border-black">نرخی تاکە</th>
                        <th className="p-2 text-sm font-bold text-center border border-gray-200 print:border-black">کۆی بەرهەم</th>
                        <th className="p-2 text-sm font-bold text-center border border-gray-200 print:border-black">تێبینی</th>
                      </tr>
                    </thead>

                    <tbody>
                      {allProducts.map((p, idx) => (
                        <tr
                          key={`${p.saleId}-${p.productIndex}`}
                          className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-yellow-50 print:hover:bg-transparent`}
                        >
                          <td className="p-2 text-sm font-bold text-center border border-gray-200 print:border-black">{p.cashier}</td>

                          <td className="p-2 text-sm font-bold text-center border border-gray-200 print:border-black">
                            <span className="font-extrabold">
                              {(p.invoiceNumber || '').replace('SAL-', '').replace(/^0+/, '')}
                            </span>
                          </td>

                          <td className="p-2 text-sm font-bold text-center border border-gray-200 print:border-black">{p.date}</td>
                          <td className="p-2 text-sm font-bold text-center border border-gray-200 print:border-black">{p.productName}</td>

                          <td className="p-2 text-sm font-bold text-center border border-gray-200 print:border-black">
                            <span className="font-extrabold">{formatNumber(p.quantity)}</span>{' '}
                          </td>

                          <td className="p-2 text-sm font-bold text-center border border-gray-200 print:border-black">
                            {p.saleCurrency === 'IQD'
                              ? `${formatNumber(p.unitPrice)} دینار`
                              : `$${formatNumber(p.unitPrice)}`
                            }
                          </td>

                          <td className="p-2 text-sm font-bold text-center border border-gray-200 print:border-black">
                            <span className="font-extrabold text-blue-700 print:text-blue-900">
                              {p.saleCurrency === 'IQD'
                                ? `${formatNumber(p.productTotal)} دینار`
                                : `$${formatNumber(p.productTotal)}`
                              }
                            </span>
                          </td>

                          <td className="p-2 text-sm text-center border border-gray-200 print:border-black">
                            <div className="max-w-xs mx-auto">
                              {p.note ? (
                                <div className="relative group">
                                  <span className="text-gray-700 print:text-black">
                                    {p.note.length > 20 ? `${p.note.substring(0, 20)}...` : p.note}
                                  </span>
                                  {p.note.length > 20 && (
                                    <div className="absolute z-10 hidden p-2 text-xs bg-white border border-gray-200 rounded-lg shadow-lg group-hover:block print:hidden w-60 -right-2 top-full">
                                      {p.note}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 print:text-gray-500">---</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    <tfoot>
                      <tr className="text-sm font-bold font-extrabold bg-gray-100 print:bg-gray-200">
                        <td colSpan="4" className="p-2 text-center border border-gray-200 print:border-black">
                          کۆی گشتی
                        </td>

                        <td className="p-2 text-sm font-bold text-center border border-gray-200 print:border-black">
                          <span className="text-purple-700 print:text-purple-900">
                            {formatNumber(totalProductCount)}
                          </span>
                        </td>

                        <td colSpan="1" className="p-2 text-sm font-bold text-center border border-gray-200 print:border-black">
                          ---
                        </td>

                        <td className="p-2 text-sm font-bold text-center border border-gray-200 print:border-black">
                          {selectedCurrency === 'both' ? (
                            <div className="space-y-1">
                              <div className="text-blue-700 print:text-blue-900">
                                {formatCurrency(currencyTotals.IQD.total, 'IQD')}
                              </div>
                              <div className="text-blue-700 print:text-blue-900">
                                {formatCurrency(currencyTotals.USD.total, 'USD')}
                              </div>
                            </div>
                          ) : selectedCurrency === 'iqd' ? (
                            <span className="text-blue-700 print:text-blue-900">
                              {formatCurrency(currencyTotals.IQD.total, 'IQD')}
                            </span>
                          ) : (
                            <span className="text-blue-700 print:text-blue-900">
                              {formatCurrency(currencyTotals.USD.total, 'USD')}
                            </span>
                          )}
                        </td>

                        <td className="p-2 text-sm font-bold text-center border border-gray-200 print:border-black">
                          <span className="text-gray-400 print:text-gray-500">---</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Summary Cards */}
          {allProducts.length > 0 && (
            <div className="px-6 pb-6">
              <div className="overflow-hidden bg-white border border-gray-200 rounded-2xl print:border-black print:rounded-none">
                <div
                  className={`grid gap-3 p-4 ${
                    selectedCurrency === 'both'
                      ? 'grid-cols-1 sm:grid-cols-1 print-two-cols'
                      : 'grid-cols-1'
                  }`}
                >
                  {/* IQD Summary */}
                  {(selectedCurrency === 'iqd' || selectedCurrency === 'both') && (
                    <div className="p-3 border border-gray-200 rounded-xl bg-gray-50 print:border-black print:bg-gray-100">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-extrabold text-gray-800 print:text-black">
                          <Coins className="inline w-4 h-4 ml-1" />
                          کۆی دینار
                        </h4>
                        <div className="text-sm font-extrabold text-blue-700 print:text-blue-900">
                          {currencyTotals.IQD.sales_count} فرۆشتن
                        </div>
                      </div>

                      <div className="mt-3 text-xs">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <div className="text-sm font-extrabold text-gray-700 print:text-black">کۆی گشتی</div>
                            <div className="text-sm font-extrabold text-blue-800 print:text-black">
                              {formatCurrency(currencyTotals.IQD.total, 'IQD')}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-sm font-extrabold text-gray-700 print:text-black">پارەی دراو</div>
                            <div className="text-sm font-extrabold text-green-800 print:text-black">
                              {formatCurrency(currencyTotals.IQD.paid, 'IQD')}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-sm font-extrabold text-gray-700 print:text-black">پارەی ماوە</div>
                            <div className="text-sm font-extrabold text-red-800 print:text-black">
                              {formatCurrency(currencyTotals.IQD.remaining, 'IQD')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* USD Summary */}
                  {(selectedCurrency === 'usd' || selectedCurrency === 'both') && (
                    <div className="p-3 border border-gray-200 rounded-xl bg-gray-50 print:border-black print:bg-gray-100">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-extrabold text-gray-800 print:text-black">
                          <DollarSign className="inline w-4 h-4 ml-1" />
                          کۆی دۆلار
                        </h4>
                        <div className="text-xs font-extrabold text-yellow-700 print:text-yellow-900">
                          {currencyTotals.USD.sales_count} فرۆشتن
                        </div>
                      </div>

                      <div className="mt-3 text-xs">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <div className="text-sm font-extrabold text-gray-700 print:text-black">کۆی گشتی</div>
                            <div className="text-sm font-extrabold text-blue-800 print:text-black">
                              {formatCurrency(currencyTotals.USD.total, 'USD')}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-sm font-extrabold text-gray-700 print:text-black">پارەی دراو</div>
                            <div className="text-sm font-extrabold text-green-800 print:text-black">
                              {formatCurrency(currencyTotals.USD.paid, 'USD')}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-sm font-extrabold text-gray-700 print:text-black">پارەی ماوە</div>
                            <div className="text-sm font-extrabold text-red-800 print:text-black">
                              {formatCurrency(currencyTotals.USD.remaining, 'USD')}
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

          {/* Footer */}
          <div className="px-6 py-3 text-xs border-t border-gray-200 print:border-black">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-extrabold text-gray-700 print:text-black">چاپکراو لە:</span>
                <span className="mr-2 font-extrabold text-gray-900 print:text-black">
                  {new Date().toLocaleString('en-US')}
                </span>
              </div>

              <div>
                <span className="font-extrabold text-gray-700 print:text-black">کۆتا فرۆشتن:</span>
                <span className="mr-2 font-extrabold text-gray-900 print:text-black">
                  {lastSaleDate ? formatDate(lastSaleDate) : '---'}
                </span>
              </div>
            </div>

            <div className="mt-1 text-center">
              <span className="font-extrabold text-gray-700 print:text-black">ڕاپۆرتی هەموو فرۆشتنەکانی کڕیار - </span>
              <span className="font-extrabold text-blue-700 print:text-blue-900">{customer.name}</span>
            </div>
          </div>
        </div>

        {/* Print Styles */}
        <style jsx>{`
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-weight: 700 !important;
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
              page-break-inside: auto;
            }

            tr {
              page-break-inside: avoid;
              page-break-after: auto;
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

            /* For long notes in print */
            td {
              word-break: break-word;
            }
          }

          @page {
            size: A4;
            margin: 10mm;
          }
        `}</style>
      </div>
    </AuthenticatedLayout>
  );
}
