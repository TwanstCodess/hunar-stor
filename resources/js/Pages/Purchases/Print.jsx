import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Printer, Download, ArrowRight } from 'lucide-react';

export default function Print({ purchase, company }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-IQ').format(amount) + ' ' + purchase.currency;
  };

const formatDate = (date) => {
    if (!date) return '---';

    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
};

  const handlePrint = () => {
    // دروستکردنی PDF بە شێوازی نوێ
    const printWindow = window.open('', '_blank');
    const printContent = generateInvoiceHTML();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>وەسڵی کڕین - ${purchase.invoice_number}</title>
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
            max-width: 1000px;
            margin: 0 auto;
            direction: rtl;
            text-align: right;
          }

          .invoice-container {
            border: 2px solid #2563eb;
            border-radius: 12px;
            padding: 30px;
            background: white;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          }

          .invoice-header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2563eb;
          }

          .company-name {
            font-size: 32px;
            font-weight: 800;
            color: #1e40af;
            margin-bottom: 10px;
          }

          .company-details {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 5px;
          }

          .invoice-title {
            font-size: 28px;
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 20px;
            text-align: center;
          }

          .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }

          .invoice-details {
            flex: 1;
          }

          .detail-item {
            margin-bottom: 8px;
            font-size: 15px;
          }

          .detail-label {
            font-weight: 600;
            color: #4b5563;
            display: inline-block;
            width: 120px;
          }

          .detail-value {
            color: #1f2937;
          }

          .table-container {
            margin: 30px 0;
            overflow-x: auto;
          }

          .invoice-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
          }

          .invoice-table thead {
            background: #1e40af;
            color: white;
          }

          .invoice-table th {
            padding: 15px 12px;
            font-weight: 600;
            text-align: center;
            border: 1px solid #e2e8f0;
          }

          .invoice-table td {
            padding: 12px;
            border: 1px solid #e2e8f0;
            text-align: center;
          }

          .invoice-table tbody tr:nth-child(even) {
            background: #f8fafc;
          }

          .invoice-table tbody tr:hover {
            background: #f1f5f9;
          }

          .product-name {
            font-weight: 500;
            color: #1f2937;
          }

          .product-code {
            font-size: 12px;
            color: #6b7280;
            margin-top: 4px;
          }

          .amount-positive {
            color: #059669;
            font-weight: 600;
          }

          .amount-negative {
            color: #dc2626;
            font-weight: 600;
          }

          .summary-container {
            margin-top: 40px;
            padding: 25px;
            background: #f0f9ff;
            border-radius: 10px;
            border: 1px solid #bae6fd;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
            font-size: 16px;
          }

          .summary-row:last-child {
            border-bottom: none;
            font-weight: 700;
            font-size: 18px;
            color: #1e40af;
          }

          .summary-label {
            color: #4b5563;
            font-weight: 500;
          }

          .summary-value {
            font-weight: 600;
          }

          .notes-section {
            margin-top: 30px;
            padding: 20px;
            background: #fef3c7;
            border-radius: 8px;
            border-right: 4px solid #f59e0b;
          }

          .notes-title {
            font-weight: 600;
            color: #92400e;
            margin-bottom: 10px;
          }

          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            padding-top: 30px;
            border-top: 2px dashed #94a3b8;
          }

          .signature-box {
            text-align: center;
            flex: 1;
          }

          .signature-line {
            width: 200px;
            height: 1px;
            background: #94a3b8;
            margin: 40px auto 10px;
          }

          .signature-label {
            font-weight: 600;
            color: #4b5563;
            margin-bottom: 5px;
          }

          .signature-name {
            font-weight: 500;
            color: #1f2937;
          }

          .footer {
            margin-top: 40px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
          }

          @media print {
            body {
              padding: 0;
            }

            .invoice-container {
              border: none;
              box-shadow: none;
              padding: 0;
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
    // هەمان شێوازی چاپ بۆ داگرتن
    handlePrint();
  };

  const generateInvoiceHTML = () => {
    return `
      <div class="invoice-container" id="print-content">
        <!-- سەرۆک -->
        <div class="invoice-header">
          <div class="company-name">نوسینگەی ئاریان</div>

          <div class="company-details">مۆبایل: ${company?.phone || '---'} | ${company?.address || 'ناونیشان'}</div>
        </div>

        <!-- ناونیشانی وەسڵ -->
        <div class="invoice-title">🧾 وەسڵی کڕین</div>

        <!-- زانیارییەکان -->
        <div class="invoice-info">
          <div class="invoice-details">
            <div class="detail-item">
              <span class="detail-label">بەروار:</span>
              <span class="detail-value">${formatDate(purchase.purchase_date)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">جۆری کڕین:</span>
              <span class="detail-value">${purchase.purchase_type === 'cash' ? 'کاش' : 'قەرز'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">دراو:</span>
              <span class="detail-value">${purchase.currency}</span>
            </div>
          </div>

          <div class="invoice-details">
            <div class="detail-item">
              <span class="detail-label">دابینکەر:</span>
              <span class="detail-value">${purchase.supplier?.name || 'بێ دابینکەر'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">مۆبایل:</span>
              <span class="detail-value">${purchase.supplier?.phone || '---'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">تۆمارکراو لەلایەن:</span>
              <span class="detail-value">${purchase.user?.name || '---'}</span>
            </div>
          </div>
        </div>

        <!-- خشتەی بەرهەمەکان -->
        <div class="table-container">
          <table class="invoice-table">
            <thead>
              <tr>
                <th width="5%">#</th>
                <th width="30%">بەرهەم</th>
                <th width="15%">بڕ</th>
                <th width="15%">نرخی تاک</th>
                <th width="20%">کۆ</th>
              </tr>
            </thead>
            <tbody>
              ${purchase.items.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>
                    <div class="product-name">${item.product.name}</div>
                  </td>
                  <td>${item.quantity} ${item.product.unit_label || 'دانە'}</td>
                  <td class="amount-positive">${formatCurrency(item.unit_price)}</td>
                  <td class="amount-positive" style="font-weight: 700;">${formatCurrency(item.total_price)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- پوختە -->
        <div class="summary-container">
          <div class="summary-row">
            <span class="summary-label">کۆی گشتی:</span>
            <span class="summary-value" style="color: #1e40af;">${formatCurrency(purchase.total_amount)}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">پارەدراو:</span>
            <span class="summary-value" style="color: #059669;">${formatCurrency(purchase.paid_amount)}</span>
          </div>
          ${purchase.remaining_amount > 0 ? `
            <div class="summary-row">
              <span class="summary-label">قەرز:</span>
              <span class="summary-value" style="color: #dc2626;">${formatCurrency(purchase.remaining_amount)}</span>
            </div>
          ` : ''}
        </div>

        <!-- تێبینی -->
        ${purchase.notes ? `
          <div class="notes-section">
            <div class="notes-title">📝 تێبینی:</div>
            <div>${purchase.notes}</div>
          </div>
        ` : ''}
      </div>
    `;
  };

  // نیشاندانی پێشوەختەی وەسڵ
  const previewContent = `
    <div class="invoice-preview">
      ${generateInvoiceHTML().replace('invoice-container', 'invoice-container preview-mode')}
    </div>
  `;

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl p-4 mx-auto">
        {/* دەستکاریەکانی چاپ */}
        <div className="p-6 mb-6 border border-blue-200 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">چاپکردنی وەسڵ</h2>
              <p className="mt-1 text-gray-600">وەسڵی کڕین: #{purchase.invoice_number}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-3 text-white transition-all rounded-lg shadow-md bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
              >
                <Printer className="w-5 h-5" />
                چاپکردن
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 text-gray-700 transition-all border border-gray-300 rounded-lg shadow-md bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 hover:shadow-lg"
              >
                <Download className="w-5 h-5" />
                داگرتن بە شێوەی PDF
              </button>

              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 px-6 py-3 text-gray-700 transition-all border border-gray-300 rounded-lg shadow-md bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 hover:shadow-lg"
              >
                <ArrowRight className="w-5 h-5" />
                گەڕانەوە
              </button>
            </div>
          </div>

          <div className="p-4 mt-6 bg-blue-100 border border-blue-300 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h4 className="mb-2 font-semibold text-blue-900">رێنمایی چاپکردن:</h4>
                <ul className="pr-4 space-y-1 text-sm text-blue-800 list-disc">
                  <li>کلیک لەسەر "چاپکردن" بکە بۆ کردنەوەی وەسڵەکە لە پەنجەرەیەکی نوێ</li>
                  <li>لە پەنجەرەی چاپکردن، "Destination" دەستکاری بکە بۆ "Save as PDF" بۆ داگرتن</li>
                  <li>بۆ چاپکردنی ڕاستەوخۆ، پرینتەر هەڵبژێرە و کلیک لەسەر "Print" بکە</li>
                  <li>وەسڵەکە بە شێوازی A4 چاکسازی کراوە بۆ چاپکردنی پاک</li>
                </ul>
              </div>
            </div>
          </div>
        </div>


      </div>

      {/* Style for preview */}
      <style jsx global>{`
        .invoice-container.preview-mode {
          transform: scale(0.9);
          transform-origin: top center;
        }

        @media print {
          body * {
            visibility: hidden;
          }
          .no-print, .no-print * {
            display: none !important;
          }
          .invoice-container, .invoice-container * {
            visibility: visible;
          }
          .invoice-container {
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
