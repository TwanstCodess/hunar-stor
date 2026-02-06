import { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import {
  ArrowRight,
  Users,
  Truck,
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  Clock,
  Ban,
  RefreshCw,
  CreditCard,
  Building2,
  FileText,
  Eye,
  Printer,
  Download,
  Edit,
  Image as ImageIcon,
  File,
  AlertCircle,
  QrCode,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  MessageSquare,
  History // ئایکۆنی نوێ بۆ مێژووی قەرز
} from 'lucide-react';

// فانکشنەکانی فۆرماتکردن
const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num || 0);
};

const formatCurrency = (amount, curr) => {
  const formattedAmount = formatNumber(amount);
  if (!curr || curr === '---') return formattedAmount;

  if (curr === 'IQD') return formattedAmount + ' دینار';
  if (curr === 'USD') return '$' + formattedAmount;

  return formattedAmount + ' ' + curr;
};

const formatDate = (date) => {
    if (!date) return '---';
    const d = new Date(date);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();

    return `${year}-${month}-${day}`;
};

const formatDateTime = (date) => {
    if (!date) return '---';
    const d = new Date(date);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const hour = d.getHours().toString().padStart(2, '0');
    const minute = d.getMinutes().toString().padStart(2, '0');

    return `${day}-${month}-${year} ${hour}:${minute}`;
};

// AttachmentModal Component
const AttachmentModal = ({ attachment, onClose }) => {
  if (!attachment) return null;

  const isImage = attachment.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);
  const isPDF = attachment.match(/\.pdf$/i);
  const fileName = attachment.split('/').pop();
  const fileUrl = `/storage/${attachment}`;
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-90">
      <div className={`relative w-full bg-black rounded-lg ${isFullscreen ? 'h-screen' : 'max-w-4xl max-h-[90vh]'}`}>
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-3">
            {isImage ? (
              <ImageIcon className="w-5 h-5 text-white" />
            ) : (
              <FileText className="w-5 h-5 text-white" />
            )}
            <h3 className="font-semibold text-white">
              {fileName}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-white transition-colors rounded-lg hover:bg-white/20"
              title={isFullscreen ? "بچووککردنەوە" : "گەورەکردن"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-white transition-colors rounded-lg hover:bg-white/20"
              title="کردنەوە لە پەنجەرەی نوێ"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <a
              href={fileUrl}
              download
              className="p-2 text-white transition-colors rounded-lg hover:bg-white/20"
              title="داگرتن"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-white transition-colors rounded-lg hover:bg-white/20"
              title="داخستن"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center h-full p-4 pt-20">
          {isImage ? (
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-full max-h-full rounded-lg"
              style={{ objectFit: 'contain' }}
            />
          ) : isPDF ? (
            <div className="w-full h-full">
              <iframe
                src={fileUrl}
                title={fileName}
                className="w-full h-full border-0 rounded-lg"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <File className="w-16 h-16 mb-4 text-white" />
              <p className="mb-4 text-white">فایلەکە نەتوانرا پیشان بدرێت</p>
              <a
                href={fileUrl}
                download
                className="inline-flex items-center gap-2 px-6 py-3 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                داگرتن
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Last Debt Component
const LastDebtCard = ({ customerId, type = 'customer' }) => {
  const [lastDebt, setLastDebt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLastDebt = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/${type === 'customer' ? 'customers' : 'suppliers'}/${customerId}/last-debt`);
        const data = await response.json();
        setLastDebt(data);
      } catch (error) {
        console.error('Error fetching last debt:', error);
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchLastDebt();
    }
  }, [customerId, type]);

  if (!customerId) return null;

  return (
    <Card className="border-2 border-purple-200">
      <div className="p-6">
        <h3 className="flex items-center gap-2 pb-3 mb-6 font-bold text-gray-900 border-b border-gray-200">
          <History className="w-5 h-5 text-purple-600" />
          کۆتا قەرز
        </h3>

        {loading ? (
          <div className="py-4 text-center">
            <div className="inline-block w-6 h-6 border-2 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
            <p className="mt-2 text-sm text-gray-500">بارکردنی زانیاری قەرز...</p>
          </div>
        ) : lastDebt ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border border-purple-200 rounded-lg bg-purple-50">
                <div className="text-sm text-purple-700">بەرواری کۆتا قەرز</div>
                <div className="mt-1 text-lg font-bold text-purple-900">
                  {formatDate(lastDebt.payment_date)}
                </div>
              </div>
              <div className="p-3 border border-purple-200 rounded-lg bg-purple-50">
                <div className="text-sm text-purple-700">بڕی قەرز</div>
                <div className="mt-1 text-lg font-bold text-purple-900">
                  {formatCurrency(lastDebt.amount, lastDebt.currency)}
                </div>
              </div>
            </div>

            <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-600">ژمارەی پارەدان</div>
                  <div className="font-medium text-gray-900">#{lastDebt.reference_number || lastDebt.id}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">وەرگر</div>
                  <div className="font-medium text-gray-900">{lastDebt.user?.name || '---'}</div>
                </div>
              </div>

              {lastDebt.notes && (
                <div className="pt-3 mt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-600">تێبینی</div>
                  <div className="mt-1 text-sm text-gray-700 line-clamp-2">{lastDebt.notes}</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            <History className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500">هیچ قەرزێکی پێشوو نەدۆزرایەوە</p>
          </div>
        )}
      </div>
    </Card>
  );
};

const PaymentReceipt = ({ payment, company, onClose }) => {
  // زانیاری پارەدانەکان بۆ پرێنت
  const getPaymentDetails = () => {
    const relatedInvoice = payment.type === 'customer' ? payment.sale : payment.purchase;
    const invoiceTotal = relatedInvoice?.total_amount || 0;
    const totalPaid = relatedInvoice?.paid_amount || 0;
    const remaining = invoiceTotal - totalPaid;
    const currentPayment = payment.amount;

    return {
      invoiceNumber: relatedInvoice?.invoice_number || '---',
      invoiceDate: relatedInvoice?.invoice_date ? formatDate(relatedInvoice.invoice_date) : '---',
      invoiceTotal: formatCurrency(invoiceTotal, payment.currency),
      totalPaid: formatCurrency(totalPaid, payment.currency),
      currentPayment: formatCurrency(currentPayment, payment.currency),
      remaining: formatCurrency(remaining, payment.currency),
      previousBalance: formatCurrency(totalPaid - currentPayment, payment.currency)
    };
  };

  const paymentDetails = getPaymentDetails();

  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'cash': return 'کاش';
      case 'pos': return 'پۆس';
      case 'transfer': return 'گواستنەوە';
      case 'cheque': return 'چێک';
      case 'other': return 'ئەوانی تر';
      default: return method;
    }
  };

  const renderCopyContent = (isCompanyCopy = false) => (
    <div className="relative p-6 overflow-hidden bg-white border rounded-lg print:border-black print:p-4 print:shadow-none print-single-copy">
      {/* Cut Line for Printing */}
      <div className="absolute inset-x-0 hidden h-1 border-t-2 border-dashed print:block print-cut-line border-rose-500 -bottom-2">
        <div className="absolute left-0 text-xs transform -translate-y-1/2 text-rose-600 top-1/2">
          ← بڕین لێرە
        </div>
        <div className="absolute right-0 text-xs transform -translate-y-1/2 text-rose-600 top-1/2">
          بڕین لێرە →
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-center p-4 mb-1 border-b-2 print:border-b print:border-black">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-black-700 print:text-black">نوسینگەی ئاریان</h2>
          </div>
          <div className="text-xl text-center text-red-700 print:text-red-800">
            <b><p>بەڵگەنامەی وەرگرتن - سند قبض</p></b>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="p-3 mb-6 border border-gray-200 rounded-lg bg-gray-50 print:border-black print:bg-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-gray-600 print:text-gray-800">
            ژمارەی پسوولە: <span className="font-bold">{payment.reference_number || payment.id}</span>
          </p>

          <div className="flex items-center gap-4">
            <p className="text-xs text-gray-600 print:text-gray-800">
              ناو: <span className="mr-2 font-bold">
                {payment.type === 'customer' ? payment.customer?.name : payment.supplier?.name}
              </span>
            </p>

            {((payment.type === 'customer' && payment.customer?.phone) ||
              (payment.type === 'supplier' && payment.supplier?.phone)) && (
              <p className="text-xs text-gray-600 print:text-gray-800">
                مۆبایل: <span className="mr-2 font-bold">
                  {payment.type === 'customer' ? payment.customer?.phone : payment.supplier?.phone}
                </span>
              </p>
            )}

            <p className="text-xs text-gray-600 print:text-gray-800">
              بەروار: {formatDate(payment.payment_date)}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="mb-4">
        <div className="p-3 border border-purple-200 rounded-lg bg-purple-50 print:border-black print:bg-gray-100">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-2 border border-green-200 rounded bg-green-50 print:border-black print:bg-gray-100">
              <p className="mb-1 text-xs text-green-700 print:text-black">پارەی پێشوو</p>
              <p className="text-base font-bold text-green-600 print:text-black">
                {paymentDetails.previousBalance}
              </p>
            </div>
            <div className="p-2 border border-blue-200 rounded bg-blue-50 print:border-black print:bg-gray-100">
              <p className="mb-1 text-xs text-blue-700 print:text-black">بڕی پارەدان</p>
              <p className="text-base font-bold text-blue-600 print:text-black">
                {formatCurrency(payment.amount, payment.currency)}
              </p>
            </div>
            <div className="p-2 border border-orange-200 rounded bg-orange-50 print:border-black print:bg-gray-100">
              <p className="mb-1 text-xs text-orange-700 print:text-black">وەرگر</p>
              <p className="text-base font-bold text-orange-600 print:text-black">{payment.user?.name}</p>
              <p className="mt-1 text-xs text-gray-600 print:text-gray-700">
                بەروار: {formatDate(new Date())}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details Table */}
      {payment.sale || payment.purchase ? (
        <div className="mb-6">
          <div className="p-3 mb-3 border border-blue-200 rounded-lg bg-blue-50 print:border-black print:bg-gray-100">
            <h3 className="text-sm font-bold text-center text-blue-700 print:text-black">
              زانیاری پارەدانەکان
            </h3>
          </div>

          <div className="overflow-hidden border border-gray-300 rounded-lg print:border-black">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-100 print:bg-gray-200">
                  <th className="p-2 font-bold text-center border border-gray-300 print:border-black print:text-black">ناونیشان</th>
                  <th className="p-2 font-bold text-center border border-gray-300 print:border-black print:text-black">بڕ</th>
                  <th className="p-2 font-bold text-center border border-gray-300 print:border-black print:text-black">تێبینی</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="p-2 font-medium text-center border border-gray-300 print:border-black print:text-black">بڕی قەرزی گشتی</td>
                  <td className="p-2 font-bold text-center border border-gray-300 print:border-black print:text-black">{paymentDetails.invoiceTotal}</td>
                  <td className="p-2 text-center border border-gray-300 print:border-black print:text-black">کۆی گشتی قەرز</td>
                </tr>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="p-2 font-medium text-center border border-gray-300 print:border-black print:text-black">پارەی پێشوو</td>
                  <td className="p-2 font-bold text-center border border-gray-300 print:border-black print:text-black">{paymentDetails.previousBalance}</td>
                  <td className="p-2 text-center border border-gray-300 print:border-black print:text-black">کۆی پارەدراوەکان پێش ئێستا</td>
                </tr>
                <tr className="border-b border-gray-200 bg-green-50">
                  <td className="p-2 font-bold text-center text-green-700 border border-gray-300 print:border-black print:text-black">پارەی ئێستا</td>
                  <td className="p-2 text-lg font-black text-center text-green-700 border border-gray-300 print:border-black print:text-black">+ {paymentDetails.currentPayment}</td>
                  <td className="p-2 font-medium text-center text-green-700 border border-gray-300 print:border-black print:text-black">پارەدانەی ئێستا</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-2 font-medium text-center border border-gray-300 print:border-black print:text-black">کۆی پارەدراو</td>
                  <td className="p-2 font-bold text-center border border-gray-300 print:border-black print:text-black">{paymentDetails.totalPaid}</td>
                  <td className="p-2 text-center border border-gray-300 print:border-black print:text-black">کۆی پارەدراوەکان</td>
                </tr>
                <tr className="bg-yellow-50">
                  <td className="p-2 font-bold text-center text-yellow-700 border border-gray-300 print:border-black print:text-black">پارەی ماوە</td>
                  <td className="p-2 text-lg font-black text-center text-yellow-700 border border-gray-300 print:border-black print:text-black">{paymentDetails.remaining}</td>
                  <td className="p-2 font-medium text-center text-yellow-700 border border-gray-300 print:border-black print:text-black">کۆی قەرز</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Payment Method and Type */}
      <div className="p-3 mb-6 border border-blue-200 rounded-lg bg-blue-50 print:border-black print:bg-gray-100">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1 text-xs text-blue-700 print:text-black">شێوازی پارەدان</p>
            <p className="text-base font-bold text-blue-600 print:text-black">
              {getPaymentMethodText(payment.payment_method)}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs text-purple-700 print:text-black">جۆری دانەوە</p>
            <p className="text-base font-bold text-purple-600 print:text-black">
              {payment.type === 'customer' ? 'دانەوەی کڕیار' : 'دانەوەی دابینکەر'}
            </p>
          </div>
        </div>
      </div>

      {/* تێبینیەکان - بەشی نوێ */}
      {payment.notes && (
        <div className="mb-6 border rounded-lg border-amber-200 bg-amber-50 print:border-black print:bg-gray-100">
          <div className="p-3 border-b border-amber-200 print:border-black">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-600 print:text-black" />
              <h3 className="text-sm font-bold text-amber-700 print:text-black">تێبینیەکان</h3>
            </div>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-700 whitespace-pre-line print:text-black">
              {payment.notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ڕیسیتی پارەدان - ${payment.reference_number || payment.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap');

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'IBM Plex Sans Arabic';
          }

          body {
            background: white;
            padding: 0;
            direction: rtl;
            font-size: 10pt;
            color: #000;
          }

          @page {
            size: A4 portrait;
            margin: 15mm;
            marks: crop;
          }

          .receipt-copy {
            position: relative;
            margin-bottom: 10mm;
            border: none;
            padding: 0;
            background: white;
          }

          .receipt-header {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 2px solid #000;
          }

          .company-name {
            font-size: 20pt;
            font-weight: 800;
            margin-bottom: 5px;
          }

          .receipt-title {
            font-size: 16pt;
            font-weight: 700;
            color: #d00;
            margin: 10px 0;
          }

          .customer-info {
            padding: 10px;
            margin-bottom: 15px;
            border: 1px solid #000;
            background: #f5f5f5;
            font-size: 9pt;
            border-radius: 0;
          }

          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-bottom: 15px;
          }

          .summary-box {
            padding: 8px;
            border: 1px solid #000;
            background: #f5f5f5;
            text-align: center;
            border-radius: 0;
          }

          .summary-label {
            font-size: 8pt;
            margin-bottom: 4px;
            font-weight: 600;
          }

          .summary-value {
            font-size: 12pt;
            font-weight: 800;
            margin-bottom: 4px;
          }

          .summary-subtext {
            font-size: 7pt;
            color: #666;
          }

          .payment-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 9pt;
          }

          .payment-table th {
            background: #ddd;
            border: 1px solid #000;
            padding: 6px 4px;
            font-weight: 700;
            text-align: center;
          }

          .payment-table td {
            border: 1px solid #000;
            padding: 6px 4px;
            text-align: center;
          }

          .payment-table .highlight {
            background: #e8f5e8;
            font-weight: 700;
          }

          .payment-table .warning {
            background: #fff3cd;
            font-weight: 700;
          }

          .notes-box {
            padding: 10px;
            margin: 10px 0;
            border: 1px solid #000;
            background: #fff8e1;
            font-size: 9pt;
            border-radius: 0;
          }

          .notes-header {
            padding: 6px 10px;
            border-bottom: 1px solid #000;
            background: #ffecb3;
            font-weight: 700;
            font-size: 9pt;
          }

          .notes-content {
            padding: 8px 10px;
            font-size: 9pt;
            line-height: 1.5;
            white-space: pre-line;
          }

          .payment-method-box {
            padding: 10px;
            margin: 10px 0;
            border: 1px solid #000;
            background: #e8f5e8;
            font-size: 9pt;
            border-radius: 0;
          }

          .method-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }

          .method-label {
            font-weight: 600;
          }

          .method-value {
            font-weight: 700;
          }

          .signatures {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-top: 25px;
            padding-top: 15px;
            border-top: 1px dashed #000;
            text-align: center;
          }

          .signature-box {
            font-size: 9pt;
          }

          .signature-line {
            width: 120px;
            height: 1px;
            background: #000;
            margin: 15px auto 5px;
          }

          .footer {
            text-align: center;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #ccc;
            font-size: 8pt;
            color: #666;
          }

          .cut-line {
            position: absolute;
            bottom: -10px;
            left: 0;
            right: 0;
            border-top: 2px dashed #f00;
            text-align: center;
            color: #f00;
            font-size: 7pt;
          }

          .cut-text {
            position: absolute;
            top: -8px;
            background: white;
            padding: 0 5px;
          }

          .print-single-copy {
            position: relative;
            margin-bottom: 10px;
          }

          .print-cut-line {
            border-color: #ff0000 !important;
            border-style: dashed !important;
            border-width: 3px !important;
            display: block !important;
            position: absolute !important;
            bottom: -20px !important;
            left: 0 !important;
            right: 0 !important;
          }

          @media print {
            nav, header, button, .print-hidden {
              display: none !important;
            }

            .max-w-3xl {
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
              font-size: 9pt;
            }

            .print-container {
              page-break-inside: avoid;
            }

            .bg-gray-50, .bg-blue-50, .bg-green-50, .bg-red-50, .bg-purple-50, .bg-orange-50, .bg-amber-50 {
              background-color: #f5f5f5 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .text-blue-600, .text-green-600, .text-red-600, .text-purple-600, .text-orange-600, .text-amber-600,
            .text-blue-700, .text-green-700, .text-red-700, .text-purple-700, .text-orange-700, .text-amber-700 {
              color: #000 !important;
            }

            .p-6 {
              padding: 15px !important;
            }

            .gap-3, .gap-4, .gap-6 {
              gap: 8px !important;
            }

            .grid-cols-4 {
              grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            }

            .grid-cols-3 {
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            }

            .print-pb-8 {
              padding-bottom: 30px !important;
            }

            .print-pt-8 {
              padding-top: 30px !important;
            }
          }
        </style>
      </head>
      <body>
        <!-- کۆپی یەکەم - بۆ کڕیار/دابینکەر -->
        <div class="receipt-copy print-single-copy">
          <div class="receipt-header">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div class="company-name">نوسینگەی ئاریان</div>
            <div class="receipt-title">بەڵگەنامەی وەرگرتن - سند قبض</div>
          </div>
          </div>

          <div class="customer-info">
            <div class="info-row">
              <span>ژمارەی پسوولە: <strong>${payment.reference_number || payment.id}</strong></span>
              <span>ناو: <strong>${payment.type === 'customer' ? payment.customer?.name : payment.supplier?.name}</strong></span>
              <span>مۆبایل: <strong>${payment.type === 'customer' ? payment.customer?.phone || '---' : payment.supplier?.phone || '---'}</strong></span>
              <span>بەروار: <strong>${formatDate(payment.payment_date)}</strong></span>
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-box">
              <div class="summary-label">پارەی پێشوو</div>
              <div class="summary-value">${paymentDetails.previousBalance}</div>
            </div>
            <div class="summary-box">
              <div class="summary-label">بڕی پارەدان</div>
              <div class="summary-value">${formatCurrency(payment.amount, payment.currency)}</div>
            </div>
            <div class="summary-box">
              <div class="summary-label">وەرگر</div>
              <div class="summary-value">${payment.user?.name}</div>
              <div class="summary-subtext">بەروار: ${formatDate(new Date())}</div>
            </div>
          </div>

          ${payment.sale || payment.purchase ? `
          <table class="payment-table">
            <thead>
              <tr>
                <th>ناونیشان</th>
                <th>بڕ</th>
                <th>تێبینی</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>بڕی قەرزی گشتی</td>
                <td>${paymentDetails.invoiceTotal}</td>
                <td>کۆی گشتی قەرز</td>
              </tr>
              <tr>
                <td>پارەی پێشوو</td>
                <td>${paymentDetails.previousBalance}</td>
                <td>کۆی پارەدراوەکان پێش ئێستا</td>
              </tr>
              <tr class="highlight">
                <td>پارەی ئێستا</td>
                <td>+ ${paymentDetails.currentPayment}</td>
                <td>پارەدانەی ئێستا</td>
              </tr>
              <tr>
                <td>کۆی پارەدراو</td>
                <td>${paymentDetails.totalPaid}</td>
                <td>کۆی پارەدراوەکان</td>
              </tr>
              <tr class="warning">
                <td>پارەی ماوە</td>
                <td>${paymentDetails.remaining}</td>
                <td>کۆی قەرز</td>
              </tr>
            </tbody>
          </table>
          ` : ''}




          <div class="cut-line">
            <span class="cut-text">بڕین لێرە</span>
          </div>
        </div>

        <!-- کۆپی دووەم - بۆ کۆمپانیا -->
        <div class="receipt-copy second-copy print-single-copy">
          <div class="receipt-header">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div class="company-name">نوسینگەی ئاریان</div>
            <div class="receipt-title">بەڵگەنامەی وەرگرتن - سند قبض (کۆپی کۆمپانیا)</div>
          </div>
          </div>

          <div class="customer-info">
            <div class="info-row">
              <span>ژمارەی پسوولە: <strong>${payment.reference_number || payment.id}</strong></span>
              <span>ناو: <strong>${payment.type === 'customer' ? payment.customer?.name : payment.supplier?.name}</strong></span>
              <span>مۆبایل: <strong>${payment.type === 'customer' ? payment.customer?.phone || '---' : payment.supplier?.phone || '---'}</strong></span>
              <span>بەروار: <strong>${formatDate(payment.payment_date)}</strong></span>
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-box">
              <div class="summary-label">پارەی پێشوو</div>
              <div class="summary-value">${paymentDetails.previousBalance}</div>
            </div>
            <div class="summary-box">
              <div class="summary-label">بڕی پارەدان</div>
              <div class="summary-value">${formatCurrency(payment.amount, payment.currency)}</div>
            </div>
            <div class="summary-box">
              <div class="summary-label">وەرگر</div>
              <div class="summary-value">${payment.user?.name}</div>
              <div class="summary-subtext">بەروار: ${formatDate(new Date())}</div>
            </div>
          </div>

          ${payment.sale || payment.purchase ? `
          <table class="payment-table">
            <thead>
              <tr>
                <th>ناونیشان</th>
                <th>بڕ</th>
                <th>تێبینی</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>بڕی قەرزی گشتی</td>
                <td>${paymentDetails.invoiceTotal}</td>
                <td>کۆی گشتی قەرز</td>
              </tr>
              <tr>
                <td>پارەی پێشوو</td>
                <td>${paymentDetails.previousBalance}</td>
                <td>کۆی پارەدراوەکان پێش ئێستا</td>
              </tr>
              <tr class="highlight">
                <td>پارەی ئێستا</td>
                <td>+ ${paymentDetails.currentPayment}</td>
                <td>پارەدانەی ئێستا</td>
              </tr>
              <tr>
                <td>کۆی پارەدراو</td>
                <td>${paymentDetails.totalPaid}</td>
                <td>کۆی پارەدراوەکان</td>
              </tr>
              <tr class="warning">
                <td>پارەی ماوە</td>
                <td>${paymentDetails.remaining}</td>
                <td>کۆی قەرز</td>
              </tr>
            </tbody>
          </table>
          ` : ''}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => {
              window.close();
            }, 2000);
          }
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div className="relative w-full max-w-4xl bg-white shadow-2xl rounded-2xl">
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-6 text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Printer className="w-6 h-6" />
            <h2 className="text-xl font-bold">پێشبینینی ڕیسیت</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              <Printer className="w-4 h-4" />
              چاپکردن
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white rounded-lg hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-8 mt-16 max-h-[80vh] overflow-y-auto">
          {/* First Copy Preview */}
          <div className="mb-4">
            {renderCopyContent()}
          </div>

          {/* Second Copy Preview */}
          <div className="pt-8 mt-8 border-t-2 border-gray-300">
            {renderCopyContent(true)}
          </div>
        </div>
      </div>
    </div>
  );
};

// QuickInfoCard Component
const QuickInfoCard = ({ icon: Icon, label, value, color = "blue", action }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div className={`p-4 border-2 rounded-xl ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-medium opacity-80">{label}</div>
            <div className="mt-1 text-lg font-bold">{value}</div>
          </div>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="p-2 transition-colors rounded-lg hover:bg-white/50"
            title={action.title}
          >
            {action.icon && <action.icon className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
};

export default function Show({ payment, company = {} }) {
  const [showReceipt, setShowReceipt] = useState(false);
  const [showAttachment, setShowAttachment] = useState(null);
  const [copied, setCopied] = useState(false);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'cancelled':
        return <Ban className="w-5 h-5 text-red-500" />;
      case 'refunded':
        return <RefreshCw className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'refunded':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'تەواوبوو';
      case 'pending':
        return 'چاوەڕوانی';
      case 'cancelled':
        return 'هەڵوەشاوە';
      case 'refunded':
        return 'گەڕاوەتەوە';
      default:
        return status;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash':
        return DollarSign;
      case 'pos':
        return CreditCard;
      case 'transfer':
        return RefreshCw;
      case 'cheque':
        return FileText;
      case 'other':
        return DollarSign;
      default:
        return DollarSign;
    }
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'cash':
        return 'کاش';
      case 'pos':
        return 'پۆس';
      case 'transfer':
        return 'گواستنەوە';
      case 'cheque':
        return 'چێک';
      case 'other':
        return 'ئەوانی تر';
      default:
        return method;
    }
  };

  const getPaymentMethodColor = (method) => {
    switch (method) {
      case 'cash':
        return 'green';
      case 'pos':
        return 'blue';
      case 'transfer':
        return 'purple';
      case 'cheque':
        return 'yellow';
      case 'other':
        return 'gray';
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrint = () => {
    setShowReceipt(true);
  };

  // زانیاری خێرا
  const quickInfoCards = [
    {
      icon: payment.type === 'customer' ? Users : Truck,
      label: payment.type === 'customer' ? 'کڕیار' : 'دابینکەر',
      value: payment.type === 'customer' ? payment.customer?.name : payment.supplier?.name,
      color: payment.type === 'customer' ? 'blue' : 'purple',
      action: payment.type === 'customer' ? {
        onClick: () => router.get(`/customers/${payment.customer_id}`),
        title: 'بینینی زانیاری کڕیار',
        icon: ExternalLink
      } : {
        onClick: () => router.get(`/suppliers/${payment.supplier_id}`),
        title: 'بینینی زانیاری دابینکەر',
        icon: ExternalLink
      }
    },
    {
      icon: getPaymentMethodIcon(payment.payment_method),
      label: 'شێوازی پارەدان',
      value: getPaymentMethodText(payment.payment_method),
      color: getPaymentMethodColor(payment.payment_method)
    },
    {
      icon: Calendar,
      label: 'بەرواری پارەدان',
      value: formatDate(payment.payment_date),
      color: 'green'
    },
    {
      icon: User,
      label: 'وەرگر',
      value: payment.user?.name,
      color: 'blue'
    },
  ];

  const relatedInvoice = payment.type === 'customer' ? payment.sale : payment.purchase;
  const relatedType = payment.type === 'customer' ? 'فرۆشتن' : 'کڕین';

  // زانیاری پارەدانەکان
  const getPaymentDetails = () => {
    const invoiceTotal = relatedInvoice?.total_amount || 0;
    const totalPaid = relatedInvoice?.paid_amount || 0;
    const remaining = invoiceTotal - totalPaid;
    const currentPayment = payment.amount;

    return {
      invoiceTotal: formatCurrency(invoiceTotal, payment.currency),
      totalPaid: formatCurrency(totalPaid, payment.currency),
      currentPayment: formatCurrency(currentPayment, payment.currency),
      remaining: formatCurrency(remaining, payment.currency),
      previousBalance: formatCurrency(totalPaid - currentPayment, payment.currency)
    };
  };

  const paymentDetails = getPaymentDetails();

  return (
    <AuthenticatedLayout>
      {/* Attachment Modal */}
      {showAttachment && (
        <AttachmentModal
          attachment={showAttachment}
          onClose={() => setShowAttachment(null)}
        />
      )}

      {/* Receipt Modal */}
      {showReceipt && (
        <PaymentReceipt
          payment={payment}
          company={company}
          onClose={() => setShowReceipt(false)}
        />
      )}

      <div className="mx-auto space-y-6 max-w-7xl">
        {/* Header Card */}
        <Card className="overflow-hidden border-2 border-blue-200 shadow-xl">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  {payment.type === 'customer' ? (
                    <Users className="w-10 h-10 text-white" />
                  ) : (
                    <Truck className="w-10 h-10 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white">
                    {payment.type === 'customer' ? 'دانەوەی کڕیار' : 'دانەوەی دابینکەر'}
                  </h1>
                  <p className="mt-1 text-white/90">
                    {payment.type === 'customer' ? payment.customer?.name : payment.supplier?.name}
                  </p>
                  {/* نمایشی تێبینی لە سەرەوە */}
                  {payment.notes && (
                    <div className="flex items-start gap-2 mt-2">
                      <MessageSquare className="w-4 h-4 mt-0.5 text-amber-200" />
                      <p className="text-sm text-white/90 line-clamp-1">
                        {payment.notes.length > 100 ? payment.notes.substring(0, 100) + '...' : payment.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  <Printer className="w-4 h-4" />
                  چاپکردنی ڕیسیت
                </button>
                <button
                  onClick={() => router.get('/payments')}
                  className="flex items-center gap-3 px-8 py-3.5 font-bold text-gray-700 border-2 border-gray-300 rounded-xl bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 transition-all"
                >
                  <ArrowRight className="w-5 h-5" />
                  گەڕانەوە بۆ لیست
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
              {quickInfoCards.map((card, index) => (
                <QuickInfoCard key={index} {...card} />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Amount Card */}
              <div className="lg:col-span-2">
                <div className="p-6 border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white rounded-2xl">
                  <div className="text-center">
                    <div className="mb-2 text-sm text-gray-500">بڕی پارەدان</div>
                    <div className="mb-2 text-5xl font-black text-green-600">
                      {formatCurrency(payment.amount, payment.currency)}
                    </div>
                    <div className="inline-flex items-center gap-2 px-6 py-2 text-lg font-bold rounded-full bg-gradient-to-r from-gray-100 to-gray-200">
                      <span className="text-gray-700">{payment.currency}</span>
                      <span className="text-gray-500">•</span>
                      <span className={`px-3 py-1 rounded-full ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        <span className="mr-1">{getStatusText(payment.status)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Related Invoice Card */}
              {relatedInvoice && (
                <div className="p-6 border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">{relatedType}ی پەیوەندیدار</h3>
                    <Link
                      href={payment.type === 'customer' ? `/sales/${payment.sale_id}` : `/purchases/${payment.purchase_id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </Link>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-600">ژمارەی قەرز</div>
                      <div className="font-bold text-gray-900">#{relatedInvoice.invoice_number}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">کۆی گشتی</div>
                        <div className="font-bold text-gray-900">{formatCurrency(relatedInvoice.total_amount, payment.currency)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">قەرز</div>
                        <div className="font-bold text-gray-900">{formatCurrency(relatedInvoice.remaining_amount, payment.currency)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* گەورەترین Grid بۆ کۆتا قەرز و زانیاری پارەدانەکان */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* بەشی کۆتا قەرز - ماوەی لای چەپ */}
          <div>
            <LastDebtCard
              customerId={payment.type === 'customer' ? payment.customer_id : payment.supplier_id}
              type={payment.type}
            />
          </div>

          {/* بەشی تابلۆی پارەدانەکان - ٢ ستون */}
          <div className="lg:col-span-2">
            <Card className="h-full border-2 border-green-200">
              <div className="p-6">
                <h3 className="flex items-center gap-2 pb-3 mb-6 text-xl font-bold text-gray-900 border-b border-gray-200">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  زانیاری پارەدانەکان
                </h3>
                <div className="overflow-hidden border-2 border-gray-300 rounded-xl">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-green-600 to-emerald-700">
                        <th className="p-4 font-bold text-center text-white">ناونیشان</th>
                        <th className="p-4 font-bold text-center text-white">بڕ</th>
                        <th className="p-4 font-bold text-center text-white">تێبینی</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="p-4 font-semibold text-gray-700">بڕی قەرزی گشتی</td>
                        <td className="p-4 text-lg font-bold text-center text-gray-900">{paymentDetails.invoiceTotal}</td>
                        <td className="p-4 text-sm text-center text-gray-600">کۆی گشتی قەرز</td>
                      </tr>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <td className="p-4 font-semibold text-gray-700">پارەی پێشوو</td>
                        <td className="p-4 text-lg font-bold text-center text-gray-900">{paymentDetails.previousBalance}</td>
                        <td className="p-4 text-sm text-center text-gray-600">کۆی پارەدراوەکان پێش ئێستا</td>
                      </tr>
                      <tr className="border-b border-gray-200 bg-green-50">
                        <td className="p-4 font-bold text-green-800">پارەی ئێستا</td>
                        <td className="p-4 text-xl font-black text-center text-green-700">+ {paymentDetails.currentPayment}</td>
                        <td className="p-4 text-sm text-center text-green-700">پارەدانەی ئێستا</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="p-4 font-semibold text-gray-700">کۆی پارەدراو</td>
                        <td className="p-4 text-lg font-bold text-center text-gray-900">{paymentDetails.totalPaid}</td>
                        <td className="p-4 text-sm text-center text-gray-600">کۆی پارەدراوەکان</td>
                      </tr>
                      <tr className="bg-yellow-50">
                        <td className="p-4 font-bold text-yellow-800">پارەی ماوە</td>
                        <td className="p-4 text-xl font-black text-center text-yellow-700">{paymentDetails.remaining}</td>
                        <td className="p-4 text-sm text-center text-yellow-700">کۆی قەرز</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Reference & Notes - نوێکراوە */}
          <Card className="border-2 border-gray-200">
            <div className="p-6">
              <h3 className="flex items-center gap-2 pb-3 mb-6 font-bold text-gray-900 border-b border-gray-200">
                <FileText className="w-5 h-5 text-blue-600" />
                زانیاری نووسین
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-600">ژمارەی پسوولە</div>
                    <button
                      onClick={() => copyToClipboard(payment.reference_number || payment.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-3 font-bold text-gray-900 rounded-lg bg-gray-50">
                    {payment.reference_number || '---'}
                  </div>
                  {copied && (
                    <div className="mt-1 text-sm text-green-600">کۆپی کراوە!</div>
                  )}
                </div>

                {payment.invoice_number && (
                  <div>
                    <div className="mb-2 text-sm text-gray-600">ژمارەی قەرز</div>
                    <div className="p-3 font-bold text-gray-900 rounded-lg bg-gray-50">
                      {payment.invoice_number}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* بەشی تێبینیەکان - تایبەت */}
          <Card className="border-2 border-amber-200 lg:col-span-2">
            <div className="p-6">
              <div className="flex items-center justify-between pb-3 mb-6 border-b border-amber-200">
                <h3 className="flex items-center gap-2 font-bold text-gray-900">
                  <MessageSquare className="w-5 h-5 text-amber-600" />
                  تێبینیەکان
                </h3>
                <div className="text-sm text-gray-500">
                  {payment.notes ? `${payment.notes.length} حرف` : 'بەتاڵە'}
                </div>
              </div>

              {payment.notes ? (
                <div className="space-y-4">
                  <div className="p-4 border-2 border-amber-200 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50">
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span className="text-sm font-semibold text-amber-700">تێبینی تۆمارکراو:</span>
                      </div>
                      <div className="p-3 text-gray-700 whitespace-pre-line bg-white border rounded-lg border-amber-100">
                        {payment.notes}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 text-center bg-white border rounded-lg border-amber-100">
                        <div className="text-xs text-gray-500">کاتی تۆمارکردن</div>
                        <div className="font-medium text-gray-700">{formatDateTime(payment.created_at)}</div>
                      </div>
                      <div className="p-2 text-center bg-white border rounded-lg border-amber-100">
                        <div className="text-xs text-gray-500">کاتی نوێکردنەوە</div>
                        <div className="font-medium text-gray-700">{formatDateTime(payment.updated_at)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const textToCopy = `تێبینی پارەدان: ${payment.notes}`;
                        copyToClipboard(textToCopy);
                      }}
                      className="flex items-center justify-center flex-1 gap-2 px-4 py-3 font-bold transition-colors border-2 text-amber-700 border-amber-300 rounded-xl bg-amber-50 hover:bg-amber-100"
                    >
                      <Copy className="w-4 h-4" />
                      کۆپی تێبینی
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="mb-4 text-gray-500">تێبینی تۆمارنەکراوە</p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg bg-gray-50">
                    <span className="text-gray-400">✏️</span>
                    <span>تێبینی لە چاککردنەوە زیاد دەکرێت</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* بەشی بانک و پەیوستەکان */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Bank Information */}
          {(payment.bank_name || payment.account_number || payment.transaction_id) && (
            <Card className="border-2 border-green-200">
              <div className="p-6">
                <h3 className="flex items-center gap-2 pb-3 mb-6 font-bold text-gray-900 border-b border-gray-200">
                  <Building2 className="w-5 h-5 text-green-600" />
                  زانیاری بانک
                </h3>
                <div className="space-y-4">
                  {payment.bank_name && (
                    <div>
                      <div className="text-sm text-gray-600">ناوی بانک</div>
                      <div className="font-bold text-gray-900">{payment.bank_name}</div>
                    </div>
                  )}

                  {payment.account_number && (
                    <div>
                      <div className="text-sm text-gray-600">ژمارەی هەژمار</div>
                      <div className="font-mono font-bold text-gray-900">{payment.account_number}</div>
                    </div>
                  )}

                  {payment.transaction_id && (
                    <div>
                      <div className="text-sm text-gray-600">ژمارەی مامەڵە</div>
                      <div className="font-mono font-bold text-gray-900">{payment.transaction_id}</div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Attachments */}
          <Card className={`border-2 ${payment.attachment ? 'border-blue-200' : 'border-gray-200'}`}>
            <div className="p-6">
              <h3 className="flex items-center gap-2 pb-3 mb-6 font-bold text-gray-900 border-b border-gray-200">
                {payment.attachment ? (
                  <ImageIcon className="w-5 h-5 text-blue-600" />
                ) : (
                  <FileText className="w-5 h-5 text-gray-400" />
                )}
                پەیوستەکان
              </h3>

              {payment.attachment ? (
                <div className="space-y-4">
                  <div className="p-4 border-2 border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white shadow-sm rounded-xl">
                        {payment.attachment.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                          <ImageIcon className="w-8 h-8 text-blue-600" />
                        ) : (
                          <FileText className="w-8 h-8 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 truncate">
                          {payment.attachment.split('/').pop()}
                        </div>
                        <div className="text-sm text-gray-600">وێنەی چێک یان پەڕەی بانک</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowAttachment(payment.attachment)}
                      className="flex items-center justify-center flex-1 gap-2 px-4 py-3 font-bold text-white transition-colors bg-blue-600 rounded-xl hover:bg-blue-700"
                    >
                      <Eye className="w-4 h-4" />
                      بینین
                    </button>
                    <a
                      href={`/storage/${payment.attachment}`}
                      download
                      className="flex items-center justify-center flex-1 gap-2 px-4 py-3 font-bold text-gray-700 transition-colors border-2 border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100"
                    >
                      <Download className="w-4 h-4" />
                      داگرتن
                    </a>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">فایلی پەیوست بوونی نییە</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Stats Card */}
        <Card className="border-2 border-blue-200">
          <div className="p-6">
            <h3 className="pb-3 mb-6 font-bold text-gray-900 border-b border-gray-200">ئامارەکان</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="p-4 text-center border-2 border-green-200 bg-green-50 rounded-xl">
                <div className="text-2xl font-black text-green-600">
                  {formatCurrency(payment.amount, payment.currency)}
                </div>
                <div className="mt-1 text-sm text-green-800">بڕی پارەدان</div>
              </div>

              <div className="p-4 text-center border-2 border-blue-200 bg-blue-50 rounded-xl">
                <div className="text-2xl font-black text-blue-600">
                  {formatDate(payment.payment_date)}
                </div>
                <div className="mt-1 text-sm text-blue-800">بەرواری پارەدان</div>
              </div>

              <div className="p-4 text-center border-2 border-purple-200 bg-purple-50 rounded-xl">
                <div className="text-2xl font-black text-purple-600">
                  {payment.user?.name.split(' ')[0]}
                </div>
                <div className="mt-1 text-sm text-purple-800">وەرگر</div>
              </div>

              <div className="p-4 text-center border-2 border-yellow-200 bg-yellow-50 rounded-xl">
                <div className="text-2xl font-black text-yellow-600">
                  {payment.type === 'customer' ? 'کڕیار' : 'دابینکەر'}
                </div>
                <div className="mt-1 text-sm text-yellow-800">جۆر</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
