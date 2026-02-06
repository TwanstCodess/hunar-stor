import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Printer, Download, ArrowRight } from 'lucide-react';

export default function Print({ payment, company }) {
  // Format numbers in English
  const formatNumber = (number) => {
    if (number === null || number === undefined || isNaN(number)) return '0';
    return new Intl.NumberFormat('en-US').format(number);
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '0';

    try {
      const numAmount = Number(amount);
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(numAmount);

      return payment.currency === 'IQD' ? `${formatted} دینار` : `$${formatted}`;
    } catch (error) {
      console.error('Format error:', error, amount);
      return '0';
    }
  };

const formatDate = (date) => {
    if (!date) return '---';
    const d = new Date(date);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
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

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'تەواوبوو';
      case 'pending': return 'چاوەڕوانی';
      case 'cancelled': return 'هەڵوەشاوە';
      case 'refunded': return 'گەڕاوەتەوە';
      default: return status;
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = generateReceiptHTML();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>وەسڵی دانەوە - ${payment.reference_number || payment.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@100;200;300;400;500;600;700&display=swap');

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Tajawal', sans-serif;
          }

          body {
            background: white;
            color: #333;
            line-height: 1.6;
            padding: 20px;
            max-width: 900px;
            margin: 0 auto;
            direction: rtl;
            text-align: right;
          }

          .receipt-container {
            border: 3px solid #2563eb;
            border-radius: 15px;
            padding: 40px;
            background: white;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
          }

          .receipt-header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 25px;
            border-bottom: 4px solid #2563eb;
          }

          .company-name {
            font-size: 36px;
            font-weight: 900;
            color: #1e40af;
            margin-bottom: 12px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
          }

          .company-details {
            color: #6b7280;
            font-size: 15px;
            margin-bottom: 6px;
          }

          .receipt-title {
            font-size: 32px;
            font-weight: 800;
            color: #1e3a8a;
            margin: 30px 0;
            text-align: center;
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .payment-type-badge {
            display: inline-block;
            padding: 12px 30px;
            border-radius: 50px;
            font-size: 18px;
            font-weight: 700;
            margin: 20px 0;
            text-align: center;
          }

          .customer-badge {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
          }

          .supplier-badge {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white;
          }

          .payment-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin: 40px 0;
            padding: 30px;
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-radius: 12px;
            border: 2px solid #bae6fd;
          }

          .info-section {
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          }

          .info-section h3 {
            font-size: 18px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #3b82f6;
          }

          .detail-item {
            margin-bottom: 12px;
            font-size: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .detail-label {
            font-weight: 600;
            color: #4b5563;
          }

          .detail-value {
            color: #1f2937;
            font-weight: 500;
          }

          .amount-section {
            margin: 40px 0;
            padding: 40px;
            background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
            border-radius: 15px;
            border: 3px solid #86efac;
            text-align: center;
          }

          .amount-label {
            font-size: 20px;
            font-weight: 600;
            color: #15803d;
            margin-bottom: 15px;
          }

          .amount-value {
            font-size: 48px;
            font-weight: 900;
            color: #16a34a;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
          }

          .payment-details-box {
            margin: 30px 0;
            padding: 30px;
            background: white;
            border-radius: 12px;
            border: 2px solid #e5e7eb;
          }

          .payment-details-box h3 {
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 3px solid #3b82f6;
          }

          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #f3f4f6;
          }

          .detail-row:last-child {
            border-bottom: none;
          }

          .bank-info-box {
            margin: 30px 0;
            padding: 25px;
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-radius: 12px;
            border: 2px solid #fbbf24;
          }

          .bank-info-box h3 {
            font-size: 18px;
            font-weight: 700;
            color: #92400e;
            margin-bottom: 15px;
          }

          .notes-section {
            margin-top: 30px;
            padding: 25px;
            background: #fef3c7;
            border-radius: 12px;
            border-right: 5px solid #f59e0b;
          }

          .notes-title {
            font-weight: 700;
            color: #92400e;
            margin-bottom: 12px;
            font-size: 18px;
          }

          .notes-content {
            color: #78350f;
            line-height: 1.8;
            white-space: pre-line;
          }

          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            padding-top: 40px;
            border-top: 3px dashed #94a3b8;
          }

          .signature-box {
            text-align: center;
            flex: 1;
          }

          .signature-line {
            width: 200px;
            height: 2px;
            background: #94a3b8;
            margin: 50px auto 12px;
          }

          .signature-label {
            font-weight: 700;
            color: #4b5563;
            margin-bottom: 8px;
            font-size: 16px;
          }

          .signature-name {
            font-weight: 600;
            color: #1f2937;
            font-size: 14px;
          }

          .footer {
            margin-top: 50px;
            text-align: center;
            color: #6b7280;
            font-size: 13px;
            border-top: 2px solid #e5e7eb;
            padding-top: 25px;
          }

          .status-badge {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
          }

          .status-completed {
            background: #dcfce7;
            color: #15803d;
            border: 2px solid #86efac;
          }

          .status-pending {
            background: #fef3c7;
            color: #92400e;
            border: 2px solid #fbbf24;
          }

          .status-cancelled {
            background: #fee2e2;
            color: #991b1b;
            border: 2px solid #fca5a5;
          }

          .status-refunded {
            background: #dbeafe;
            color: #1e40af;
            border: 2px solid #93c5fd;
          }

          @media print {
            body {
              padding: 0;
            }

            .receipt-container {
              border: none;
              box-shadow: none;
              padding: 20px;
            }

            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        ${printContent}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => {
              window.close();
            }, 1000);
          }
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleDownload = () => {
    handlePrint();
  };

  const generateReceiptHTML = () => {
    // چێککردن بۆ ئەوەی notes بوونی هەبێت و خاڵی نا بێت
    const notes = payment.notes || '';

    return `
      <div class="receipt-container" id="print-content">
        <!-- سەرۆک -->
        <div class="receipt-header">
          <div class="company-name">${company?.name || 'کۆمپانیا'}</div>
          ${company?.email ? `<div class="company-details">ئیمەیڵ: ${company.email}</div>` : ''}
          <div class="company-details">مۆبایل: ${company?.phone || '---'} | ${company?.address || 'ناونیشان'}</div>
        </div>

        <!-- ناونیشانی وەسڵ -->
        <div class="receipt-title">💵 وەسڵی دانەوەی پارە</div>

        <!-- جۆری دانەوە -->
        <div style="text-align: center;">
          <span class="payment-type-badge ${payment.type === 'customer' ? 'customer-badge' : 'supplier-badge'}">
            ${payment.type === 'customer' ? '👤 دانەوەی کڕیار' : '🏪 دانەوەی دابینکەر'}
          </span>
        </div>

        <!-- زانیارییەکان -->
        <div class="payment-info">
          <div class="info-section">
            <h3>${payment.type === 'customer' ? 'زانیاری کڕیار' : 'زانیاری دابینکەر'}</h3>
            <div class="detail-item">
              <span class="detail-label">ناو:</span>
              <span class="detail-value">${payment.type === 'customer' ? (payment.customer?.name || '---') : (payment.supplier?.name || '---')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">مۆبایل:</span>
              <span class="detail-value">${payment.type === 'customer' ? (payment.customer?.phone || '---') : (payment.supplier?.phone || '---')}</span>
            </div>
            ${payment.type === 'customer' && payment.customer?.address ? `
              <div class="detail-item">
                <span class="detail-label">ناونیشان:</span>
                <span class="detail-value">${payment.customer.address}</span>
              </div>
            ` : ''}
            ${payment.type === 'supplier' && payment.supplier?.address ? `
              <div class="detail-item">
                <span class="detail-label">ناونیشان:</span>
                <span class="detail-value">${payment.supplier.address}</span>
              </div>
            ` : ''}
          </div>

          <div class="info-section">
            <h3>زانیاری وەسڵ</h3>
            ${payment.reference_number ? `
              <div class="detail-item">
                <span class="detail-label">ژ. ڕەفەرانس:</span>
                <span class="detail-value">${payment.reference_number}</span>
              </div>
            ` : ''}
            ${payment.invoice_number ? `
              <div class="detail-item">
                <span class="detail-label">ژ. فاکتور:</span>
                <span class="detail-value">${payment.invoice_number}</span>
              </div>
            ` : ''}
            <div class="detail-item">
              <span class="detail-label">بەروار:</span>
              <span class="detail-value">${formatDate(payment.payment_date)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">دۆخ:</span>
              <span class="status-badge status-${payment.status}">${getStatusText(payment.status)}</span>
            </div>
            ${notes && notes.trim().length > 0 && notes.trim().length < 100 ? `
              <div class="detail-item">
                <span class="detail-label">تێبینی:</span>
                <span class="detail-value" style="color: #78350f; font-style: italic;">${notes.trim().substring(0, 100)}${notes.trim().length > 100 ? '...' : ''}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- بڕی پارە -->
        <div class="amount-section">
          <div class="amount-label">🎯 بڕی دانەوە</div>
          <div class="amount-value">${formatCurrency(payment.amount)}</div>
          <div style="margin-top: 15px; font-size: 16px; color: #15803d; font-weight: 600;">
            ${payment.currency === 'IQD' ? 'دیناری عێراقی' : 'دۆلاری ئەمریکی'}
          </div>
        </div>

        <!-- زانیاری پارەدان -->
        <div class="payment-details-box">
          <h3>🔖 زانیاری پارەدان</h3>
          <div class="detail-row">
            <span class="detail-label">شێوازی پارەدان:</span>
            <span class="detail-value" style="font-weight: 700; color: #1e40af;">${getPaymentMethodText(payment.payment_method)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">دراو:</span>
            <span class="detail-value">${payment.currency === 'IQD' ? 'دینار (IQD)' : 'دۆلار (USD)'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">وەرگر:</span>
            <span class="detail-value">${payment.user?.name || '---'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">کاتی تۆمارکردن:</span>
            <span class="detail-value">${formatDateTime(payment.created_at)}</span>
          </div>
        </div>

        <!-- زانیاری بانک -->
        ${payment.bank_name ? `
          <div class="bank-info-box">
            <h3>🏦 زانیاری بانک</h3>
            <div class="detail-row">
              <span class="detail-label">ناوی بانک:</span>
              <span class="detail-value" style="font-weight: 700;">${payment.bank_name}</span>
            </div>
            ${payment.account_number ? `
              <div class="detail-row">
                <span class="detail-label">ژمارەی هەژمار:</span>
                <span class="detail-value" style="font-family: monospace;">${payment.account_number}</span>
              </div>
            ` : ''}
            ${payment.transaction_id ? `
              <div class="detail-row">
                <span class="detail-label">ژمارەی مامەڵە:</span>
                <span class="detail-value" style="font-family: monospace;">${payment.transaction_id}</span>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <!-- پەیوەندی بە فرۆشتن/کڕین -->
        ${payment.sale_id ? `
          <div class="payment-details-box" style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-color: #3b82f6;">
            <h3 style="color: #1e40af;">📦 پەیوەندیدار بە فرۆشتن</h3>
            <div class="detail-row">
              <span class="detail-label">ژمارەی فاکتور:</span>
              <span class="detail-value" style="font-weight: 700; color: #1e40af;">${payment.sale?.invoice_number || '---'}</span>
            </div>
            ${payment.sale?.total_amount ? `
              <div class="detail-row">
                <span class="detail-label">کۆی فرۆشتن:</span>
                <span class="detail-value">${formatCurrency(payment.sale.total_amount)}</span>
              </div>
            ` : ''}
          </div>
        ` : ''}

        ${payment.purchase_id ? `
          <div class="payment-details-box" style="background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); border-color: #8b5cf6;">
            <h3 style="color: #7c3aed;">🛒 پەیوەندیدار بە کڕین</h3>
            <div class="detail-row">
              <span class="detail-label">ژمارەی فاکتور:</span>
              <span class="detail-value" style="font-weight: 700; color: #7c3aed;">${payment.purchase?.invoice_number || '---'}</span>
            </div>
            ${payment.purchase?.total_amount ? `
              <div class="detail-row">
                <span class="detail-label">کۆی کڕین:</span>
                <span class="detail-value">${formatCurrency(payment.purchase.total_amount)}</span>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <!-- تێبینی -->
        ${notes && notes.trim().length > 0 ? `
          <div class="notes-section">
            <div class="notes-title">📝 تێبینیەکان:</div>
            <div class="notes-content">${notes.trim()}</div>
          </div>
        ` : ''}

        <!-- واژوو -->
        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">واژووی ${payment.type === 'customer' ? 'کڕیار' : 'دابینکەر'}</div>
            <div class="signature-name">${payment.type === 'customer' ? (payment.customer?.name || '---') : (payment.supplier?.name || '---')}</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">واژووی وەرگر</div>
            <div class="signature-name">${payment.user?.name || '---'}</div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>ئەم وەسڵە بە سیستەمی ئەلیکترۆنی دروستکراوە و واژووی فیزیکی پێویست ناکات</p>
          <p style="margin-top: 8px; font-weight: 600;">سوپاس بۆ باوەڕتان بە ئێمە</p>
          <p style="margin-top: 15px; color: #9ca3af; font-size: 11px;">
            چاپکراو لە: ${new Date().toLocaleString('en-US')}
          </p>
        </div>
      </div>
    `;
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl p-4 mx-auto">
        {/* دەستکاریەکانی چاپ */}
        <div className="p-6 mb-6 border-2 border-blue-200 shadow-xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                چاپکردنی وەسڵی دانەوە
              </h2>
              <p className="mt-2 text-lg font-medium text-gray-700">
                {payment.type === 'customer' ? '👤 دانەوەی کڕیار' : '🏪 دانەوەی دابینکەر'} - ژمارە: {payment.reference_number || payment.id}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                بڕ: <span className="font-bold text-green-600">{formatCurrency(payment.amount)}</span>
              </p>
              {payment.notes && payment.notes.trim().length > 0 ? (
                <p className="mt-2 text-sm text-amber-800">
                  <span className="font-semibold">تێبینی:</span> {payment.notes.trim().length > 100 ? payment.notes.trim().substring(0, 100) + '...' : payment.notes.trim()}
                </p>
              ) : (
                <p className="mt-2 text-sm italic text-gray-500">
                  هیچ تێبینیەک نییە
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-3 text-white transition-all border-2 border-blue-600 shadow-lg rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:scale-105"
              >
                <Printer className="w-5 h-5" />
                چاپکردن
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 text-gray-700 transition-all border-2 border-gray-300 shadow-lg rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 hover:shadow-xl hover:scale-105"
              >
                <Download className="w-5 h-5" />
                داگرتن بە PDF
              </button>

              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 px-6 py-3 text-gray-700 transition-all border-2 border-gray-300 shadow-lg rounded-xl bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 hover:shadow-xl hover:scale-105"
              >
                <ArrowRight className="w-5 h-5" />
                گەڕانەوە
              </button>
            </div>
          </div>

          <div className="p-5 mt-6 border-2 border-blue-300 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 bg-blue-600 rounded-lg">
                <Printer className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="mb-2 text-lg font-bold text-blue-900">رێنمایی چاپکردن:</h4>
                <ul className="pr-5 space-y-2 text-sm text-blue-800 list-disc">
                  <li className="leading-relaxed">کلیک لەسەر "چاپکردن" بکە بۆ کردنەوەی وەسڵەکە لە پەنجەرەیەکی نوێ</li>
                  <li className="leading-relaxed">لە پەنجەرەی چاپکردن، "Destination" دەستکاری بکە بۆ "Save as PDF" بۆ داگرتن</li>
                  <li className="leading-relaxed">بۆ چاپکردنی ڕاستەوخۆ، پرینتەر هەڵبژێرە و کلیک لەسەر "Print" بکە</li>
                  <li className="leading-relaxed">وەسڵەکە بە شێوازی A4 چاکسازی کراوە بۆ چاپکردنی پاک و جوان</li>
                  <li className="leading-relaxed">تێبینیەکان لە دوو بەشدا پیشان دەدرێن: پێشەکی لە زانیاری وەسڵ و تەواوەتی لە بەشێکی تایبەت</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Style for preview */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print, .no-print * {
            display: none !important;
          }
          .receipt-container, .receipt-container * {
            visibility: visible;
          }
          .receipt-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            margin: 0;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </AuthenticatedLayout>
  );
}
