<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $report_title ?? 'ڕاپۆرت' }}</title>
    <style>
        /* پەڕەی سەرەکی */
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'DejaVu Sans', 'Tahoma', 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #333;
            padding: 20px;
        }

        /* سەرپێڕی ڕاپۆرت */
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #2c3e50;
            padding-bottom: 15px;
        }

        .header h1 {
            color: #2c3e50;
            font-size: 24px;
            margin-bottom: 10px;
        }

        .header .company-name {
            font-size: 18px;
            color: #3498db;
            font-weight: bold;
        }

        .header .report-info {
            font-size: 14px;
            color: #7f8c8d;
        }

        /* زانیاریەکان */
        .info-section {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 25px;
            border: 1px solid #e9ecef;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }

        .info-label {
            font-weight: bold;
            color: #2c3e50;
            min-width: 150px;
        }

        .info-value {
            color: #555;
        }

        /* ئامارەکان */
        .stats-section {
            margin-bottom: 30px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }

        .stat-card {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .stat-card h3 {
            color: #2c3e50;
            font-size: 14px;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #eee;
        }

        .stat-value {
            font-size: 20px;
            font-weight: bold;
            color: #27ae60;
            text-align: center;
            margin: 10px 0;
        }

        .currency-badge {
            display: inline-block;
            padding: 2px 8px;
            background: #e3f2fd;
            color: #1976d2;
            border-radius: 4px;
            font-size: 11px;
            margin-left: 5px;
        }

        /* خشتەکان */
        .table-section {
            margin-bottom: 30px;
        }

        .table-title {
            color: #2c3e50;
            font-size: 16px;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #3498db;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .data-table th {
            background: #2c3e50;
            color: white;
            padding: 12px 10px;
            text-align: right;
            font-weight: bold;
            border: 1px solid #1a252f;
        }

        .data-table td {
            padding: 10px;
            border: 1px solid #ddd;
            text-align: right;
        }

        .data-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }

        .data-table tr:hover {
            background-color: #f5f5f5;
        }

        /* پێوەری درەوشاوە */
        .highlight {
            background-color: #fffacd !important;
            font-weight: bold;
        }

        .negative {
            color: #e74c3c !important;
        }

        .positive {
            color: #27ae60 !important;
        }

        /* پەڕەشکێن */
        .page-break {
            page-break-before: always;
            margin-top: 40px;
            padding-top: 40px;
            border-top: 2px dashed #ddd;
        }

        /* پێنووسی */
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #7f8c8d;
            font-size: 11px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
        }

        .signature-section {
            margin-top: 40px;
            display: flex;
            justify-content: space-around;
        }

        .signature-box {
            text-align: center;
            width: 200px;
        }

        .signature-line {
            width: 100%;
            border-top: 1px solid #333;
            margin-top: 40px;
            margin-bottom: 10px;
        }

        /* ژمارەدان */
        .page-number {
            position: fixed;
            bottom: 20px;
            right: 20px;
            font-size: 10px;
            color: #7f8c8d;
        }

        /* بۆ چاپ */
        @media print {
            body {
                padding: 10px;
            }

            .no-print {
                display: none !important;
            }

            .data-table {
                page-break-inside: auto;
            }

            .data-table tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
        }
    </style>
</head>
<body>
    <!-- سەرپێڕی ڕاپۆرت -->
    <div class="header">
        <div class="company-name">گەڕانی بازرگانی</div>
        <h1>{{ $report_title }}</h1>
        <div class="report-info">
            <div>جۆری ڕاپۆرت: {{ $type }}</div>
            <div>بەرواری دروستکردن: {{ $report_date }}</div>
        </div>
    </div>

    <!-- زانیاریەکان -->
    @if(isset($filters) && count($filters) > 0)
    <div class="info-section">
        <div style="font-weight: bold; margin-bottom: 10px; color: #2c3e50;">فیلتەرەکان:</div>
        <div class="info-row">
            <div class="info-label">بەکارهێنەر:</div>
            <div class="info-value">{{ $generated_by }}</div>
        </div>

        @if(isset($filters['from_date']) && $filters['from_date'])
        <div class="info-row">
            <div class="info-label">لە بەروار:</div>
            <div class="info-value">{{ $filters['from_date'] }}</div>
        </div>
        @endif

        @if(isset($filters['to_date']) && $filters['to_date'])
        <div class="info-row">
            <div class="info-label">بۆ بەروار:</div>
            <div class="info-value">{{ $filters['to_date'] }}</div>
        </div>
        @endif

        @if(isset($customer))
        <div class="info-row">
            <div class="info-label">کڕیار:</div>
            <div class="info-value">{{ $customer->name }}</div>
        </div>
        @endif

        @if(isset($filters['currency']) && $filters['currency'])
        <div class="info-row">
            <div class="info-label">دراو:</div>
            <div class="info-value">{{ $filters['currency'] }}</div>
        </div>
        @endif
    </div>
    @endif

    <!-- ئامارەکان -->
    @if(isset($stats) && count($stats) > 0)
    <div class="stats-section">
        <h2 class="table-title">ئامارەکانی ڕاپۆرت</h2>
        <div class="stats-grid">
            @foreach($stats as $key => $value)
                @if(is_array($value))
                    <div class="stat-card">
                        <h3>{{ trans('reports.' . $key) ?? $key }}</h3>
                        @foreach($value as $subKey => $subValue)
                            <div style="margin: 5px 0;">
                                <span>{{ trans('reports.' . $subKey) ?? $subKey }}:</span>
                                <span class="stat-value">{{ number_format($subValue, 2) }}</span>
                                @if(in_array($subKey, ['iqd', 'IQD']))
                                    <span class="currency-badge">دینار</span>
                                @elseif(in_array($subKey, ['usd', 'USD']))
                                    <span class="currency-badge">دۆلار</span>
                                @endif
                            </div>
                        @endforeach
                    </div>
                @else
                    <div class="stat-card">
                        <h3>{{ trans('reports.' . $key) ?? $key }}</h3>
                        <div class="stat-value">{{ number_format($value, 2) }}</div>
                    </div>
                @endif
            @endforeach
        </div>
    </div>
    @endif

    <!-- ناوەڕۆکی ڕاپۆرت -->
    @yield('content')

    <!-- پێنووسی -->
    <div class="footer">
        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-line"></div>
                <div>جێگری بەڕێوەبەر</div>
            </div>
            <div class="signature-box">
                <div class="signature-line"></div>
                <div>بەڕێوەبەری مالە</div>
            </div>
            <div class="signature-box">
                <div class="signature-line"></div>
                <div>بەڕێوەبەری گشتی</div>
            </div>
        </div>
        <div style="margin-top: 30px;">
            <p>گەڕانی سیستەمی بەڕێوەبردنی بازرگانی</p>
            <p>تەلەفۆن: ٠٧٧٠ ١٢٣ ٤٥٦٧ | ئیمەیڵ: info@company.com</p>
            <p>بەرواری چاپ: {{ date('Y-m-d H:i:s') }}</p>
        </div>
    </div>

    <!-- ژمارەی پەڕە -->
    <div class="page-number">
        پەڕە <span class="page"></span>
    </div>

    <script>
        // زیادکردنی ژمارەی پەڕە
        var totalPages = Math.ceil(document.body.scrollHeight / window.innerHeight);
        document.querySelector('.page').textContent = '١ لە ' + totalPages;
    </script>
</body>
</html>
