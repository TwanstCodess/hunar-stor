// resources/js/Pages/Sales/Print.jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link } from '@inertiajs/react';
import { Printer, ArrowLeft } from 'lucide-react';

export default function Print({ sale, company }) {
    // Format numbers in English
    const formatNumber = (number) => {
        if (number === null || number === undefined || isNaN(number)) return '0';
        return new Intl.NumberFormat('en-US').format(number);
    };

    const formatCurrency = (amount, currency) => {
        if (amount === null || amount === undefined || isNaN(amount)) return '0';

        try {
            const numAmount = Number(amount);
            const formatted = new Intl.NumberFormat('en-US', {
                style: 'decimal',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }).format(numAmount);

            return currency === 'IQD' ? `${formatted} دینار` : `$${formatted}`;
        } catch (error) {
            console.error('Format error:', error, amount);
            return '0';
        }
    };

    const formatDate = (date) => {
        if (!date) return '---';
        const dateObj = new Date(date);

        // ڕۆژی ھەفتە بە کوردی
        const weekdays = [
            'یەکشەممە', 'دووشەممە', 'سێشەممە',
            'چوارشەممە', 'پێنجشەممە', 'ھەینی', 'شەممە'
        ];

        const year = dateObj.getFullYear();
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const day = dateObj.getDate().toString().padStart(2, '0');
        const weekday = weekdays[dateObj.getDay()];

        return `${year}-${month}-${day}`;
    };

    const calculateSubtotal = () => {
        return sale.items?.reduce((sum, item) => sum + item.total_price, 0) || 0;
    };

    const calculateTotalQuantity = () => {
        return sale.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    };

    // فەنکشنی تایبەت بۆ دەرخستنی ناوی دراو
    const getCurrencyName = (currency) => {
        if (currency === 'IQD') {
            return 'دینار';
        } else if (currency === 'USD') {
            return 'دۆلار';
        } else {
            return currency;
        }
    };

    return (
        <AuthenticatedLayout>
            <div className="max-w-4xl mx-auto">
                {/* Control Buttons */}
                <div className="flex items-center justify-between p-4 mb-6 bg-white rounded-lg shadow-sm print:hidden">
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/sales/${sale.id}`}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            گەڕانەوە
                        </Link>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            <Printer className="w-4 h-4" />
                            چاپکردن
                        </button>
                    </div>
                    <div className="text-sm font-bold text-gray-500">
                        <span className="font-bold">وەسڵ:</span> {sale.invoice_number}
                    </div>
                </div>


                <div className="p-8 overflow-hidden bg-white border rounded-lg shadow-lg print:p-0 print:shadow-none print:border-2 print:border-gray-800">
                    {/* Header - LARGER IN PRINT */}
                    <div className="flex items-center justify-between p-4 mb-4 border-b-2 border-black print:border-b-2 print:border-gray-800 print:mb-3 print:px-2 print:py-3">
                        {/* لۆگۆی لای چەپ */}
                        <div className="flex-shrink-0 w-28 h-28 print:w-24 print:h-24">
                            <img
                                src="/logo/logo.png"
                                alt="لۆگۆی نوسینگەی ئاریان"
                                className="object-contain w-full h-full print:max-h-24"
                            />
                        </div>

                        {/* ناوەڕۆکی ناوەڕاست - LARGER TEXT */}
                        <div className="flex-1 px-6 leading-relaxed text-center print:px-4">
                            <h2 className="mb-2 text-3xl font-extrabold text-black print:text-2xl print:font-black print:text-black">
                                نوسینگەی ئاریان
                            </h2>

                            <div className="mb-2 text-[16px] font-bold text-red-700 print:text-[15px] print:font-bold print:text-red-700">
                                <p className="mb-2 text-[16px] font-bold text-blue-700 print:text-[15px] print:font-bold print:text-blue-700">
                                    بۆ فرۆشتنی کەرەستەی بیناسازی
                                </p>
                                <p className="print:text-[14px] print:leading-tight">
                                    کەرپوچ - ئینگلاینی سەر دەرگا و پەنچەرە - بلوکی سوور - شیش - چیمەنتۆ - لم - چەو - B.R.C
                                </p>
                            </div>

                            <div className="print:mt-3">
                                <p className="text-[14px] font-bold text-black print:text-[13px] print:font-bold print:text-black text-right print:leading-tight">
                                    خاوەن عمر فیصل : 07701578023 - 07501165959
                                </p>
                                <p className="text-[14px] font-bold text-black print:text-[13px] print:font-bold print:text-black text-right print:leading-tight">
                                    ژمێریار : 07501127325
                                </p>
                            </div>
                        </div>

                        {/* لۆگۆی لای ڕاست */}
                        <div className="flex-shrink-0 w-28 h-28 print:w-24 print:h-24">
                            <img
                                src="/logo/logo2.png"
                                alt="لۆگۆی نوسینگەی ئاریان"
                                className="object-contain w-full h-full print:max-h-24"
                            />
                        </div>
                    </div>

                    {/* Customer Info - Always on first page */}
                    <div className="p-3 mb-4 border border-gray-200 rounded-lg bg-gray-50 print:border print:border-gray-300 print:bg-gray-100 print:p-1 print:mb-2 print:rounded-none">
                        <div className="flex flex-wrap items-center justify-between gap-2 print:gap-1">
                            <p className="text-[13px] font-bold text-gray-600 print:text-[10px] print:font-bold print:text-gray-700">
                                ژمارەی وەسڵ: <span className="font-bold text-[13px] print:text-[10px] print:text-black"> {sale.invoice_number.replace('SAL-', '').replace(/^0+/, '')}</span>
                            </p>

                            <div className="flex items-center gap-4 font-bold print:gap-2">
                                <p className="text-[13px] font-bold text-gray-600 print:text-[10px] print:font-bold print:text-gray-700">
                                    ناو: <span className="mr-2 font-bold print:text-black">{sale.customer?.name || 'کڕیاری ناناسراو'}</span>
                                </p>

                                {sale.customer?.phone && (
                                    <p className="text-[13px] font-bold text-gray-600 print:text-[10px] print:font-bold print:text-gray-700">
                                        مۆبایل: <span className="mr-2 font-bold print:text-black">{sale.customer.phone}</span>
                                    </p>
                                )}

                                <p className="text-[13px] font-bold text-gray-600 print:text-[10px] print:font-bold print:text-gray-700">
                                    بەروار: <span className="font-bold print:text-black">{formatDate(sale.sale_date)}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-6 print:mb-0">
                        <div className="overflow-x-auto print:overflow-visible">
                            <table className="w-full text-sm font-bold border-collapse print:text-[9pt] print:font-bold">
                                <thead>
                                    <tr className="bg-gray-50 print:bg-gray-100 print:break-inside-avoid">
                                        <th className="p-2 font-bold text-center border border-gray-300 print:p-1 print:border print:border-gray-400 print:text-[9pt] print:text-black print:break-inside-avoid">
                                            بەرهەم
                                        </th>
                                        <th className="p-2 font-bold text-center border border-gray-300 print:p-1 print:border print:border-gray-400 print:text-[9pt] print:text-black print:break-inside-avoid">
                                            بەروار
                                        </th>
                                        <th className="p-2 font-bold text-center border border-gray-300 print:p-1 print:border print:border-gray-400 print:text-[9pt] print:text-black print:break-inside-avoid">
                                            عدد
                                        </th>
                                        <th className="p-2 font-bold text-center border border-gray-300 print:p-1 print:border print:border-gray-400 print:text-[9pt] print:text-black print:break-inside-avoid">
                                            نرخی تاک
                                        </th>
                                        <th className="p-2 font-bold text-center border border-gray-300 print:p-1 print:border print:border-gray-400 print:text-[9pt] print:text-black print:break-inside-avoid">
                                            کۆی گشتی
                                        </th>
                                        <th className="p-2 font-bold text-center border border-gray-300 print:p-1 print:border print:border-gray-400 print:text-[9pt] print:text-black print:break-inside-avoid">
                                            تێبینی
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="print:break-inside-auto">
                                    {sale.items?.map((item, index) => (
                                        <tr key={item.id} className="font-bold hover:bg-gray-50 print:font-bold print:break-inside-avoid">
                                            <td className="p-2 font-bold text-center border border-gray-300 print:p-1 print:border print:border-gray-300 print:text-black print:break-inside-avoid">
                                                <div className="font-bold print:font-bold">{item.product?.name}</div>
                                            </td>
                                            <td className="p-2 font-bold text-center border border-gray-300 print:p-1 print:border print:border-gray-300 print:text-black print:break-inside-avoid">
                                                {item.product?.production_date
                                                    ? formatDate(item.product.production_date)
                                                    : formatDate(sale.sale_date)}
                                            </td>
                                            <td className="p-2 font-bold text-center border border-gray-300 print:p-1 print:border print:border-gray-300 print:text-black print:break-inside-avoid">
                                                {formatNumber(item.quantity)} {item.product?.base_unit?.name || 'دانە'}
                                            </td>
                                            <td className="p-2 font-bold text-center border border-gray-300 print:p-1 print:border print:border-gray-300 print:text-black print:break-inside-avoid">
                                                {formatCurrency(item.unit_price, sale.currency)}
                                            </td>
                                            <td className="p-2 font-bold text-center border border-gray-300 print:p-1 print:border print:border-gray-300 print:text-black print:break-inside-avoid">
                                                {formatCurrency(item.total_price, sale.currency)}
                                            </td>
                                            <td className="p-2 font-bold text-center border border-gray-300 print:p-1 print:border print:border-gray-300 print:text-black print:break-inside-avoid">
                                                {item.note ? (
                                                    <div className="text-xs text-gray-700 max-w-[120px] mx-auto print:text-[8pt] print:font-bold print:text-gray-700">
                                                        {item.note}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 print:text-[8pt] print:text-gray-500">---</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="print:break-inside-avoid">
                                    {/* Row 1: Totals Row */}
                                    <tr className="font-bold bg-gray-100 print:bg-gray-100 print:break-inside-avoid">
                                        <td colSpan="2" className="p-2 font-bold text-center border border-gray-300 print:p-1 print:border print:border-gray-400 print:text-black print:break-inside-avoid">
                                            کۆی گشتی
                                        </td>
                                        <td className="p-2 font-bold text-center border border-gray-300 print:p-1 print:border print:border-gray-400 print:text-black print:break-inside-avoid">
                                            {formatNumber(calculateTotalQuantity())}
                                        </td>
                                        <td colSpan="1" className="p-2 font-bold text-center border border-gray-300 print:p-1 print:border print:border-gray-400 print:break-inside-avoid">
                                        </td>
                                        <td className="p-2 font-bold text-center border border-gray-300 print:p-1 print:border print:border-gray-400 print:text-black print:break-inside-avoid">
                                            <span className="text-gray-700 print:font-bold print:text-blue-600">
                                                {formatCurrency(sale.total_amount, sale.currency)}
                                            </span>
                                        </td>
                                        <td className="p-2 font-bold text-center border border-gray-300 print:p-1 print:border print:border-gray-400 print:break-inside-avoid">
                                            <span className="text-gray-700">
                                            </span>
                                        </td>
                                    </tr>

                                    {/* Row 2: Summary Information - Always keep together */}
                                    <tr className="bg-gray-100 print:bg-gray-100 print:break-inside-avoid print:break-before-avoid">
                                        <td colSpan="6" className="p-3 border border-gray-300 print:p-2 print:border print:border-gray-400 print:break-inside-avoid">
                                            <div className="grid grid-cols-5 gap-4 text-center print:gap-1">
                                                <div className="print:break-inside-avoid">
                                                    <div className="text-[12px] font-bold text-gray-600 print:text-[9pt] print:font-bold print:text-gray-700">کۆی گشتی</div>
                                                    <div className="text-sm font-bold text-blue-600 print:text-[10pt] print:font-bold print:text-blue-600">
                                                        {formatCurrency(sale.total_amount, sale.currency)}
                                                    </div>
                                                </div>
                                                <div className="print:break-inside-avoid">
                                                    <div className="text-[12px] font-bold text-gray-600 print:text-[9pt] print:font-bold print:text-gray-700">پارەی دراو</div>
                                                    <div className="text-sm font-bold text-green-600 print:text-[10pt] print:font-bold print:text-green-600">
                                                        {formatCurrency(sale.paid_amount, sale.currency)}
                                                    </div>
                                                </div>
                                                <div className="print:break-inside-avoid">
                                                    <div className="text-[12px] font-bold text-gray-600 print:text-[9pt] print:font-bold print:text-gray-700">پارەی ماوە</div>
                                                    <div className={`text-sm font-bold print:text-[10pt] print:font-bold ${
                                                        sale.remaining_amount > 0 ? 'text-red-600 print:text-red-600' : 'text-gray-600 print:text-gray-600'
                                                    }`}>
                                                        {formatCurrency(sale.remaining_amount, sale.currency)}
                                                    </div>
                                                </div>
                                                <div className="print:break-inside-avoid">
                                                    <div className="text-[12px] font-bold text-gray-600 print:text-[9pt] print:font-bold print:text-gray-700">جۆری فرۆشتن</div>
                                                    <div>
                                                        <span className={`px-2 py-1 text-[11px] font-bold rounded print:px-1 print:py-0.5 print:text-[8pt] print:font-bold ${
                                                            sale.sale_type === 'cash'
                                                                ? 'bg-green-100 text-green-800 print:bg-green-100 print:text-green-800'
                                                                : 'bg-blue-100 text-blue-800 print:bg-blue-100 print:text-blue-800'
                                                        }`}>
                                                            {sale.sale_type === 'cash' ? 'ڕاستەوخۆ' : 'قەرز'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="print:break-inside-avoid">
                                                    <div className="text-[12px] font-bold text-gray-600 print:text-[9pt] print:font-bold print:text-gray-700">دراو</div>
                                                    <div className="text-sm font-bold text-purple-600 print:text-[10pt] print:font-bold print:text-purple-600">
                                                        {getCurrencyName(sale.currency)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
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

            {/* Print Styles */}
            <style jsx>{`
                @media print {
                    nav, header, button, .print\\:hidden {
                        display: none !important;
                    }

                    body {
                        font-size: 12pt;
                        color: #000 !important;
                        background: #fff !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    .max-w-4xl {
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                    }

                    .bg-white {
                        background: white !important;
                        box-shadow: none !important;
                        border: none !important;
                    }

                    .border, .border-t, .border-b, .border-r, .border-l {
                        border-color: #000 !important;
                    }

                    .rounded-lg, .rounded {
                        border-radius: 0 !important;
                    }

                    .shadow-lg {
                        box-shadow: none !important;
                    }

                    .p-8 {
                        padding: 0 !important;
                    }

                    .mt-8 {
                        margin-top: 0 !important;
                    }

                    /* پاراستنی ڕەنگەکان */
                    .text-blue-600, .print\\:text-blue-600 {
                        color: #2563eb !important;
                        font-weight: bold !important;
                    }

                    .text-green-600, .print\\:text-green-600 {
                        color: #16a34a !important;
                        font-weight: bold !important;
                    }

                    .text-red-600, .print\\:text-red-600 {
                        color: #dc2626 !important;
                        font-weight: bold !important;
                    }

                    .text-purple-600, .print\\:text-purple-600 {
                        color: #9333ea !important;
                        font-weight: bold !important;
                    }

                    .text-red-700, .print\\:text-red-700 {
                        color: #b91c1c !important;
                        font-weight: bold !important;
                    }

                    .text-blue-700, .print\\:text-blue-700 {
                        color: #1d4ed8 !important;
                        font-weight: bold !important;
                    }

                    table {
                        page-break-inside: auto !important;
                        font-size: 9pt !important;
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

                    /* دڵنیابوون لەوەی کۆتا پەڕە تەنها footer هەیە */
                    .print\\:break-before-always {
                        page-break-before: always !important;
                    }

                    /* نەهێشتنی break لە نێوان ڕیزەکانی تەیبڵ */
                    .print\\:break-inside-avoid {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }

                    .print\\:break-before-avoid {
                        page-break-before: avoid !important;
                        break-before: avoid !important;
                    }

                    /* نەهێشتنی break لە نێوان خانەکان */
                    td, th {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }

                    /* پەڕەی یەکەم هەموو بەشەکان تێدا بێت */
                    .print\\:break-inside-auto {
                        page-break-inside: auto !important;
                        break-inside: auto !important;
                    }

                    .p-1 {
                        padding: 2px !important;
                    }

                    .p-2 {
                        padding: 4px !important;
                    }

                    .p-3 {
                        padding: 6px !important;
                    }

                    .text-lg {
                        font-size: 10pt !important;
                        font-weight: bold !important;
                    }

                    .text-sm {
                        font-size: 9pt !important;
                        font-weight: bold !important;
                    }

                    .text-xs {
                        font-size: 8pt !important;
                        font-weight: bold !important;
                    }

                    .h-12 {
                        height: 36px !important;
                    }

                    .h-16 {
                        height: 48px !important;
                    }

                    /* ستایلی تایبەت بۆ وێنە لە چاپ */
                    .print\\:w-16 {
                        width: 64px !important;
                    }

                    .print\\:h-16 {
                        height: 64px !important;
                    }

                    img {
                        max-width: 100% !important;
                        height: auto !important;
                        object-fit: contain !important;
                    }

                    /* دڵنیابوون لەوەی هەموو تێکستەکان بەرزن */
                    * {
                        font-weight: bold !important;
                    }

                    /* چاککردنی ڕەنگی پاشبنەما */
                    .bg-gray-50, .bg-gray-100, .print\\:bg-gray-100 {
                        background-color: #f5f5f5 !important;
                        -webkit-print-color-adjust: exact;
                    }

                    /* چاککردنی تێکستی ڕەش */
                    .text-black, .text-gray-700, .text-gray-600, .text-gray-800,
                    .print\\:text-black, .print\\:text-gray-700 {
                        color: #000 !important;
                        font-weight: bold !important;
                    }

                    /* ڕەنگی پسپۆڕی بۆ badges */
                    .bg-green-100, .print\\:bg-green-100 {
                        background-color: #dcfce7 !important;
                        -webkit-print-color-adjust: exact;
                    }

                    .bg-blue-100, .print\\:bg-blue-100 {
                        background-color: #dbeafe !important;
                        -webkit-print-color-adjust: exact;
                    }

                    /* ڕەنگی سوور و شین لە سەرەوە */
                    .text-red-700, .print\\:text-red-700 {
                        color: #b91c1c !important;
                    }

                    .text-blue-700, .print\\:text-blue-700 {
                        color: #1d4ed8 !important;
                    }

                    /* دەستکاری کردن بۆ زیادکردنی بۆشایی */
                    .print\\:px-2 {
                        padding-left: 8px !important;
                        padding-right: 8px !important;
                    }

                    .print\\:py-1 {
                        padding-top: 4px !important;
                        padding-bottom: 4px !important;
                    }
                }

                @page {
                    size: A4 portrait;
                    margin: 10mm;

                    @top-center {
                        content: none;
                    }

                    @bottom-center {
                        content: none;
                    }
                }

                @page :first {
                    margin-top: 10mm;
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
