// resources/js/Pages/Customers/DebtStatementPrint.jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link } from '@inertiajs/react';
import { Printer, ArrowLeft, FileText } from 'lucide-react';

export default function DebtStatementPrint({ customer, sales, totalDebt, advanceBalance, netBalance, company, auth }) {
    const formatCurrency = (amount, currency) => {
        const formattedAmount = new Intl.NumberFormat('en-US').format(amount);
        if (!currency || currency === '---') return formattedAmount;
        return formattedAmount + ' ' + currency;
    };

    // فانکشنێکی نوێ بۆ گۆڕینی ژمارە بۆ دەق بە کوردی (چاککراوە)
    const numberToKurdishWords = (num, currencyType) => {
        if (num === 0) return 'سفر';

        const units = ['', 'یەک', 'دوو', 'سێ', 'چوار', 'پێنج', 'شەش', 'حەوت', 'هەشت', 'نۆ'];
        const tens = ['', 'دە', 'بیست', 'سی', 'چل', 'پەنجا', 'شەست', 'حەفتا', 'هەشتا', 'نەوەد'];
        const teens = ['دە', 'یازدە', 'دوازدە', 'سێزدە', 'چواردە', 'پازدە', 'شازدە', 'حەڤدە', 'هەژدە', 'نۆزدە'];

        let result = [];
        let number = Math.abs(Math.floor(num));

        // بەشی ملیار
        if (number >= 1000000000) {
            const billions = Math.floor(number / 1000000000);
            if (billions > 0) {
                result.push(numberToKurdishWords(billions, '') + ' ملیار');
                number %= 1000000000;
            }
        }

        // بەشی ملیۆن
        if (number >= 1000000) {
            const millions = Math.floor(number / 1000000);
            if (millions > 0) {
                result.push(numberToKurdishWords(millions, '') + ' ملیۆن');
                number %= 1000000;
            }
        }

        // بەشی هەزار
        if (number >= 1000) {
            const thousands = Math.floor(number / 1000);
            if (thousands > 0) {
                if (thousands === 1) {
                    result.push('هەزار');
                } else {
                    result.push(numberToKurdishWords(thousands, '') + ' هەزار');
                }
                number %= 1000;
            }
        }

        // بەشی سەد
        if (number >= 100) {
            const hundreds = Math.floor(number / 100);
            if (hundreds > 0) {
                if (hundreds === 1) {
                    result.push('سەد');
                } else if (hundreds === 2) {
                    result.push('دووسەد');
                } else if (hundreds === 3) {
                    result.push('سێسەد');
                } else if (hundreds === 4) {
                    result.push('چوارسەد');
                } else if (hundreds === 5) {
                    result.push('پێنجسەد');
                } else if (hundreds === 6) {
                    result.push('شەشسەد');
                } else if (hundreds === 7) {
                    result.push('حەوتسەد');
                } else if (hundreds === 8) {
                    result.push('هەشتسەد');
                } else if (hundreds === 9) {
                    result.push('نۆسەد');
                }
                number %= 100;
            }
        }

        // بەشی دە و یەک
        if (number > 0) {
            if (number >= 20) {
                const tensNum = Math.floor(number / 10);
                const unitsNum = number % 10;

                if (tensNum === 2) {
                    result.push('بیست');
                } else if (tensNum === 3) {
                    result.push('سی');
                } else if (tensNum === 4) {
                    result.push('چل');
                } else if (tensNum === 5) {
                    result.push('پەنجا');
                } else if (tensNum === 6) {
                    result.push('شەست');
                } else if (tensNum === 7) {
                    result.push('حەفتا');
                } else if (tensNum === 8) {
                    result.push('هەشتا');
                } else if (tensNum === 9) {
                    result.push('نەوەد');
                }

                if (unitsNum > 0) {
                    result.push('و ' + units[unitsNum]);
                }
            } else if (number >= 10) {
                result.push(teens[number - 10]);
            } else {
                result.push(units[number]);
            }
        }

        // بەستنی هەموو بەشەکان بەیەکەوە بە "و"
        let finalResult = '';
        for (let i = 0; i < result.length; i++) {
            if (i > 0) {
                finalResult += ' ';
            }
            finalResult += result[i];
        }

        // زیادکردنی دراو
        if (currencyType) {
            const currencyWords = {
                'IQD': { singular: 'دینار', plural: 'دینار' },
                'USD': { singular: 'دۆلار', plural: 'دۆلار' },
                'دینار': { singular: 'دینار', plural: 'دینار' },
                'دۆلار': { singular: 'دۆلار', plural: 'دۆلار' }
            };

            const amount = Math.abs(Math.floor(num));
            const currencyWord = amount === 1 ?
                currencyWords[currencyType]?.singular || currencyType :
                currencyWords[currencyType]?.plural || currencyType;

            finalResult += ' ' + currencyWord;
        }

        if (num < 0) {
            finalResult = 'سالب ' + finalResult;
        }

        return finalResult.trim();
    };

const formatDate = (date) => {
    if (!date) return '---';

    const d = new Date(date);
    const day = d.getDate();
    const month = d.getMonth() + 1; // مانگ لە ٠ دەست پێ دەکات
    const year = d.getFullYear();

    return `${year}-${month}-${day}`;
};


    const handlePrint = () => {
        window.print();
    };

    // Filter sales by currency
    const iqdSales = sales.filter(sale => sale.currency === 'IQD');
    const usdSales = sales.filter(sale => sale.currency === 'USD');

    // Calculate totals by currency
    const calculateTotal = (items, field) => {
        return items.reduce((sum, item) => sum + (item[field] || 0), 0);
    };

    const renderSalesTable = (salesData, currency) => {
        if (!salesData || salesData.length === 0) return null;

        const totalAmount = calculateTotal(salesData, 'total_amount');
        const paidAmount = calculateTotal(salesData, 'paid_amount');
        const remainingAmount = calculateTotal(salesData, 'remaining_amount');
        const currencyLabel = currency === 'IQD' ? 'دینار' : 'دۆلار';

        return (
          <div></div>
        );
    };

    const renderCopyContent = () => (
        <div className="relative p-4 overflow-hidden bg-white border rounded-lg print:border-black print:p-3 print:shadow-none print-single-copy">

            {/* Header */}
            <div className="flex items-center justify-center p-3 mb-2 border-b-2 print:border-b print:border-black">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <h2 className="text-2xl font-bold text-black-700 print:text-black">{company?.name || 'شوێنی هونەر'}</h2>
                    </div>
                    <div className="text-xl text-center text-red-700 print:text-red-800">
                        <b><p>بەڵگەنامەی قەرز</p></b>
                    </div>
                </div>
            </div>

            {/* Customer Info */}
            <div className="p-3 mb-4 border border-gray-200 rounded-lg bg-gray-50 print:border-black print:bg-gray-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-gray-600 print:text-gray-800">
                        ژمارەی پسوولە: <span className="font-bold">DEBT-{customer.id}-{Date.now().toString().slice(-6)}</span>
                    </p>

                    <div className="flex items-center gap-4">
                        <p className="text-sm text-gray-600 print:text-gray-800">
                            ناو: <span className="mr-2 font-bold">{customer.name}</span>
                        </p>

                        {customer.phone && (
                            <p className="text-sm text-gray-600 print:text-gray-800">
                                مۆبایل: <span className="mr-2 font-bold">{customer.phone}</span>
                            </p>
                        )}

                        <p className="text-sm text-gray-600 print:text-gray-800">
                            بەروار: {formatDate(new Date())}
                        </p>
                    </div>
                </div>
            </div>

            {/* Debt Summary */}
            <div className="mb-4">
                <div className="p-3 border border-purple-200 rounded-lg bg-purple-50 print:border-black print:bg-purple-100">
                    <h3 className="mb-3 text-lg font-bold text-center text-purple-700 print:text-black">کۆی قەرزەکان کڕیار</h3>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 border border-blue-200 rounded bg-blue-50 print:border-black print:bg-blue-100">
                            <p className="mb-1 text-sm font-bold text-blue-700 print:text-black">پارەی ماوە بە دینار</p>
                            <p className={`text-lg font-bold ${totalDebt?.iqd > 0 ? 'text-red-600 print:text-red-800' : 'text-green-600 print:text-green-800'}`}>
                                {formatCurrency(totalDebt?.iqd || 0, 'دینار')}
                            </p>
                            <p className="mt-1 text-xs font-bold text-gray-600 print:text-gray-700">
                                {numberToKurdishWords(totalDebt?.iqd || 0, 'دینار')}
                            </p>
                        </div>
                        <div className="p-3 border border-green-200 rounded bg-green-50 print:border-black print:bg-green-100">
                            <p className="mb-1 text-sm font-bold text-green-700 print:text-black">پارەی ماوە بە دۆلار</p>
                            <p className={`text-lg font-bold ${totalDebt?.usd > 0 ? 'text-red-600 print:text-red-800' : 'text-green-600 print:text-green-800'}`}>
                                {formatCurrency(totalDebt?.usd || 0, '$')}
                            </p>
                            <p className="mt-1 text-xs font-bold text-gray-600 print:text-gray-700">
                                {numberToKurdishWords(totalDebt?.usd || 0, 'دۆلار')}
                            </p>
                        </div>
                        <div className="p-3 border border-orange-200 rounded bg-orange-50 print:border-black print:bg-orange-100">
                            <p className="mb-1 text-sm font-bold text-orange-700 print:text-black">کۆی فرۆشتنە قەرزەکان</p>
                            <p className="text-lg font-bold text-orange-600 print:text-black">{sales.length}</p>
                            <p className="mt-1 text-xs font-bold text-gray-600 print:text-gray-700">
                                {numberToKurdishWords(sales.length, '')} فرۆشتن
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Advance Balance Summary */}
            {advanceBalance && (
                <div className="mb-4">
                    <div className="p-3 border border-red-400 rounded-lg bg-green-50 print:border-black print:bg-green-100">
                        <h3 className="mb-3 text-lg font-bold text-center text-red-700 print:text-black">سەرمایەی کڕیار</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 border border-blue-200 rounded bg-blue-50 print:border-black print:bg-green-100">
                                <p className="mb-1 text-sm font-bold text-red-700 print:text-black">سەرمایەی دینار</p>
                                <p className="text-lg font-bold text-red-600 print:text-green-800">
                                -    {formatCurrency(advanceBalance?.iqd || 0, 'دینار')}
                                </p>
                                <p className="mt-1 text-xs font-bold text-gray-600 print:text-gray-700">
                                -    {numberToKurdishWords(advanceBalance?.iqd || 0, 'دینار')}
                                </p>
                            </div>
                            <div className="p-3 border border-blue-200 rounded bg-blue-50 print:border-black print:bg-blue-100">
                                <p className="mb-1 text-sm font-bold text-red-700 print:text-black">سەرمایەی دۆلار</p>
                                <p className="text-lg font-bold text-red-600 print:text-blue-800">
                                 -   {formatCurrency(advanceBalance?.usd || 0, '$')}
                                </p>
                                <p className="mt-1 text-xs font-bold text-gray-600 print:text-gray-700">
                                  -  {numberToKurdishWords(advanceBalance?.usd || 0, 'دۆلار')}
                                </p>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* Sales Tables */}
            {iqdSales.length > 0 && renderSalesTable(iqdSales, 'IQD')}
            {usdSales.length > 0 && renderSalesTable(usdSales, 'USD')}

        </div>
    );

    return (
        <AuthenticatedLayout user={auth.user}>
            <div className="max-w-6xl mx-auto">
                {/* Control Buttons */}
                <div className="flex items-center justify-between p-4 mb-6 bg-white rounded-lg shadow-sm print:hidden">
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/customers/${customer.id}/debt-statement`}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            گەڕانەوە
                        </Link>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            <Printer className="w-4 h-4" />
                            چاپکردنی بارنامە
                        </button>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div>
                            <span className="font-semibold">بارنامەی قەرز:</span> {customer.name}
                        </div>
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span>{sales.length} فرۆشتن</span>
                        </div>
                    </div>
                </div>

                {/* Print Content */}
                <div className="print-container">
                    {/* First Copy - For Customer */}
                    <div className="mb-4 print:mb-0 print:pb-6 print:border-b-2 print:border-dashed print:border-gray-400">
                        {renderCopyContent()}
                    </div>

                    {/* Second Copy - For Company */}
                    <div className="mt-8 print:mt-0 print:pt-6">
                        {renderCopyContent()}
                    </div>
                </div>

                {/* Print Instructions */}
                <div className="p-4 mt-8 text-sm text-blue-700 border border-blue-200 rounded-lg bg-blue-50 print:hidden">
                    <p className="mb-2 font-medium">ڕێنمایی چاپکردن:</p>
                    <ul className="space-y-1 list-disc list-inside">
                        <li>دوگمەی "چاپکردنی بارنامە" کلیک بکە یان Ctrl+P بکەرەوە</li>
                        <li>لە دیالۆگی چاپکردندا، "زیاترەکان" هەڵبژێرە</li>
                        <li>ڕووکار: پۆرترێیت | قەبارە: A4 | پەیچەکان: هەموو (لا پاڕێوە)</li>
                        <li>لە دوای چاپکردن، بڕین لە هێڵی نیشاندراو بکە بۆ جیاکردنەوەی دوو کۆپیەکە</li>
                        <li>کۆپی یەکەم بۆ کڕیار دەدرێت، کۆپی دووەم بۆ کۆمپانیا دەمێنێتەوە</li>
                    </ul>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 10mm 10mm 10mm 10mm;
                    }

                    nav, header, button, .print\\:hidden {
                        display: none !important;
                    }

                    body {
                        font-size: 10pt;
                        color: #000;
                        background: #fff;
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    * {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    .max-w-6xl {
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    .bg-white {
                        background: white !important;
                        box-shadow: none !important;
                        border: none !important;
                    }

                    .border {
                        border-color: #000 !important;
                    }

                    .rounded-lg {
                        border-radius: 0 !important;
                    }

                    table {
                        page-break-inside: avoid;
                        border-collapse: collapse;
                        width: 100%;
                    }

                    th, td {
                        border: 1px solid #000 !important;
                        padding: 4px 6px !important;
                        font-size: 10pt;
                    }

                    .print-container {
                        page-break-inside: avoid;
                    }

                    .print-single-copy {
                        position: relative;
                        margin-bottom: 10px;
                    }

                    /* ڕەنگە پێشینەکان */
                    .bg-gray-50, .bg-gray-100 {
                        background-color: #f3f4f6 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .bg-blue-50, .bg-blue-100 {
                        background-color: #dbeafe !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .bg-green-50, .bg-green-100 {
                        background-color: #d1fae5 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .bg-red-50, .bg-red-100 {
                        background-color: #fee2e2 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .bg-purple-50, .bg-purple-100 {
                        background-color: #f3e8ff !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .bg-orange-50, .bg-orange-100 {
                        background-color: #ffedd5 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .bg-yellow-50, .bg-yellow-100 {
                        background-color: #fef3c7 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* ڕەنگی دەق */
                    .text-blue-600, .text-blue-700 {
                        color: #1d4ed8 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .text-green-600, .text-green-700, .text-green-800 {
                        color: #059669 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .text-red-600, .text-red-700, .text-red-800 {
                        color: #dc2626 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .text-purple-600, .text-purple-700 {
                        color: #7c3aed !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .text-orange-600, .text-orange-700 {
                        color: #ea580c !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .text-yellow-600, .text-yellow-700 {
                        color: #ca8a04 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .text-gray-600, .text-gray-700, .text-gray-800 {
                        color: #4b5563 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .text-black {
                        color: #000 !important;
                    }

                    /* Padding و Margin */
                    .p-4 {
                        padding: 10px !important;
                    }

                    .p-3 {
                        padding: 8px !important;
                    }

                    .p-2 {
                        padding: 5px !important;
                    }

                    .gap-3, .gap-4 {
                        gap: 6px !important;
                    }

                    .gap-2 {
                        gap: 4px !important;
                    }

                    .mb-4 {
                        margin-bottom: 8px !important;
                    }

                    .mb-3 {
                        margin-bottom: 6px !important;
                    }

                    .mb-2 {
                        margin-bottom: 4px !important;
                    }

                    .mb-1 {
                        margin-bottom: 3px !important;
                    }

                    .grid-cols-3 {
                        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                    }

                    /* Adjust spacing for printed copies */
                    .print\\:pb-6 {
                        padding-bottom: 16px !important;
                    }

                    .print\\:pt-6 {
                        padding-top: 16px !important;
                    }

                    .print\\:border-b-2 {
                        border-bottom-width: 2px !important;
                    }

                    .print\\:border-dashed {
                        border-style: dashed !important;
                    }

                    .print\\:border-gray-400 {
                        border-color: #9ca3af !important;
                    }

                    /* Hide copy indicator in print */
                    .print-single-copy > .absolute {
                        display: none !important;
                    }

                    /* Font sizes - گەورەتر */
                    h2 {
                        font-size: 18pt !important;
                        font-weight: 700 !important;
                    }

                    h3 {
                        font-size: 12pt !important;
                        font-weight: 700 !important;
                    }

                    .text-2xl {
                        font-size: 18pt !important;
                    }

                    .text-xl {
                        font-size: 14pt !important;
                    }

                    .text-lg {
                        font-size: 12pt !important;
                    }

                    .text-base {
                        font-size: 11pt !important;
                    }

                    .text-sm {
                        font-size: 10pt !important;
                    }

                    .text-xs {
                        font-size: 9pt !important;
                    }

                    /* جوانکاری بۆ ژمارەکان */
                    .font-bold {
                        font-weight: 700 !important;
                    }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
