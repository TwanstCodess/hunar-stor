@extends('reports.base-pdf')

@section('content')
    <div class="table-section">
        <h2 class="table-title">تەفصیلی قازانج و زیان</h2>

        <!-- خشتەی سەرەکی -->
        <table class="data-table" style="margin-bottom: 40px;">
            <thead>
                <tr>
                    <th>بابەت</th>
                    <th>دینار (IQD)</th>
                    <th>دۆلار (USD)</th>
                    <th>کۆی گشتی</th>
                </tr>
            </thead>
            <tbody>
                <!-- فرۆشتن -->
                <tr style="background-color: #e8f5e9;">
                    <td colspan="4" style="font-weight: bold; color: #2e7d32;">داھات (فرۆشتن)</td>
                </tr>
                <tr>
                    <td style="padding-left: 30px;">کۆی فرۆشتن</td>
                    <td class="positive">{{ number_format($stats['sales']['iqd'], 2) }}</td>
                    <td class="positive">{{ number_format($stats['sales']['usd'], 2) }}</td>
                    <td class="positive">
                        {{ number_format($stats['sales']['iqd'] + $stats['sales']['usd'], 2) }}
                    </td>
                </tr>

                <!-- نرخی کڕین -->
                <tr style="background-color: #fff3e0;">
                    <td colspan="4" style="font-weight: bold; color: #ef6c00;">نرخی کڕین</td>
                </tr>
                <tr>
                    <td style="padding-left: 30px;">کۆی کڕین</td>
                    <td class="negative">{{ number_format($stats['purchases']['iqd'], 2) }}</td>
                    <td class="negative">{{ number_format($stats['purchases']['usd'], 2) }}</td>
                    <td class="negative">
                        {{ number_format($stats['purchases']['iqd'] + $stats['purchases']['usd'], 2) }}
                    </td>
                </tr>

                <!-- قازانجی ڕوو (قبل از المصاريف) -->
                <tr style="background-color: #e3f2fd;">
                    <td colspan="4" style="font-weight: bold; color: #1565c0;">قازانجی ڕوو</td>
                </tr>
                @php
                    $grossProfitIQD = $stats['sales']['iqd'] - $stats['purchases']['iqd'];
                    $grossProfitUSD = $stats['sales']['usd'] - $stats['purchases']['usd'];
                @endphp
                <tr>
                    <td style="padding-left: 30px;">قازانجی ڕوو</td>
                    <td class="{{ $grossProfitIQD >= 0 ? 'positive' : 'negative' }}">
                        {{ number_format($grossProfitIQD, 2) }}
                    </td>
                    <td class="{{ $grossProfitUSD >= 0 ? 'positive' : 'negative' }}">
                        {{ number_format($grossProfitUSD, 2) }}
                    </td>
                    <td class="{{ ($grossProfitIQD + $grossProfitUSD) >= 0 ? 'positive' : 'negative' }}">
                        {{ number_format($grossProfitIQD + $grossProfitUSD, 2) }}
                    </td>
                </tr>

                <!-- خەرجی -->
                <tr style="background-color: #fce4ec;">
                    <td colspan="4" style="font-weight: bold; color: #ad1457;">خەرجی</td>
                </tr>
                <tr>
                    <td style="padding-left: 30px;">کۆی خەرجی</td>
                    <td class="negative">{{ number_format($stats['expenses']['iqd'], 2) }}</td>
                    <td class="negative">{{ number_format($stats['expenses']['usd'], 2) }}</td>
                    <td class="negative">
                        {{ number_format($stats['expenses']['iqd'] + $stats['expenses']['usd'], 2) }}
                    </td>
                </tr>

                <!-- قازانجی خاو -->
                <tr style="background-color: #f1f8e9;">
                    <td colspan="4" style="font-weight: bold; color: #33691e;">قازانجی خاو (واقعی)</td>
                </tr>
                <tr>
                    <td style="padding-left: 30px;">قازانجی خاو</td>
                    <td class="{{ $stats['actual_profit']['iqd'] >= 0 ? 'positive' : 'negative' }}">
                        {{ number_format($stats['actual_profit']['iqd'], 2) }}
                    </td>
                    <td class="{{ $stats['actual_profit']['usd'] >= 0 ? 'positive' : 'negative' }}">
                        {{ number_format($stats['actual_profit']['usd'], 2) }}
                    </td>
                    <td class="{{ ($stats['actual_profit']['iqd'] + $stats['actual_profit']['usd']) >= 0 ? 'positive' : 'negative' }}">
                        {{ number_format($stats['actual_profit']['iqd'] + $stats['actual_profit']['usd'], 2) }}
                    </td>
                </tr>

                <!-- قازانجی چاوەڕوانکراو -->
                <tr style="background-color: #fffde7;">
                    <td colspan="4" style="font-weight: bold; color: #f57f17;">قازانجی چاوەڕوانکراو</td>
                </tr>
                <tr>
                    <td style="padding-left: 30px;">قازانجی چاوەڕوانکراو</td>
                    <td class="{{ $stats['expected_profit']['iqd'] >= 0 ? 'positive' : 'negative' }}">
                        {{ number_format($stats['expected_profit']['iqd'], 2) }}
                    </td>
                    <td class="{{ $stats['expected_profit']['usd'] >= 0 ? 'positive' : 'negative' }}">
                        {{ number_format($stats['expected_profit']['usd'], 2) }}
                    </td>
                    <td class="{{ ($stats['expected_profit']['iqd'] + $stats['expected_profit']['usd']) >= 0 ? 'positive' : 'negative' }}">
                        {{ number_format($stats['expected_profit']['iqd'] + $stats['expected_profit']['usd'], 2) }}
                    </td>
                </tr>

                <!-- جیاوازی -->
                <tr style="background-color: #e0f2f1;">
                    <td colspan="4" style="font-weight: bold; color: #00695c;">جیاوازی</td>
                </tr>
                <tr>
                    <td style="padding-left: 30px;">جیاوازی (واقعی - چاوەڕوانکراو)</td>
                    <td class="{{ $stats['profit_difference']['iqd'] >= 0 ? 'positive' : 'negative' }}">
                        {{ number_format($stats['profit_difference']['iqd'], 2) }}
                    </td>
                    <td class="{{ $stats['profit_difference']['usd'] >= 0 ? 'positive' : 'negative' }}">
                        {{ number_format($stats['profit_difference']['usd'], 2) }}
                    </td>
                    <td class="{{ ($stats['profit_difference']['iqd'] + $stats['profit_difference']['usd']) >= 0 ? 'positive' : 'negative' }}">
                        {{ number_format($stats['profit_difference']['iqd'] + $stats['profit_difference']['usd'], 2) }}
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- ڕێژەکان -->
        <div style="margin-top: 40px;">
            <h3 class="table-title">ڕێژە و ڕیژەکان</h3>
            <div class="stats-grid">
                @php
                    $totalSales = $stats['sales']['iqd'] + $stats['sales']['usd'];
                    $totalPurchases = $stats['purchases']['iqd'] + $stats['purchases']['usd'];
                    $totalExpenses = $stats['expenses']['iqd'] + $stats['expenses']['usd'];
                    $totalActualProfit = $stats['actual_profit']['iqd'] + $stats['actual_profit']['usd'];

                    $grossMargin = $totalSales > 0 ? ($totalSales - $totalPurchases) / $totalSales * 100 : 0;
                    $netMargin = $totalSales > 0 ? $totalActualProfit / $totalSales * 100 : 0;
                    $expenseRatio = $totalSales > 0 ? $totalExpenses / $totalSales * 100 : 0;
                @endphp

                <div class="stat-card">
                    <h3>ڕێژی قازانجی ڕوو</h3>
                    <div class="stat-value {{ $grossMargin >= 0 ? 'positive' : 'negative' }}">
                        {{ number_format($grossMargin, 2) }}%
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #666;">
                        (فرۆشتن - کڕین) / فرۆشتن
                    </div>
                </div>

                <div class="stat-card">
                    <h3>ڕێژی قازانجی خاو</h3>
                    <div class="stat-value {{ $netMargin >= 0 ? 'positive' : 'negative' }}">
                        {{ number_format($netMargin, 2) }}%
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #666;">
                        قازانجی خاو / فرۆشتن
                    </div>
                </div>

                <div class="stat-card">
                    <h3>ڕێژی خەرجی</h3>
                    <div class="stat-value {{ $expenseRatio <= 30 ? 'positive' : 'negative' }}">
                        {{ number_format($expenseRatio, 2) }}%
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #666;">
                        خەرجی / فرۆشتن
                    </div>
                </div>

                <div class="stat-card">
                    <h3>ڕێژی گونجاندن</h3>
                    @php
                        $achievementRate = $totalSales > 0 ?
                            ($totalActualProfit / ($stats['expected_profit']['iqd'] + $stats['expected_profit']['usd']) * 100) : 0;
                    @endphp
                    <div class="stat-value {{ $achievementRate >= 80 ? 'positive' : 'negative' }}">
                        {{ number_format($achievementRate, 2) }}%
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #666;">
                        قازانجی واقعی / چاوەڕوانکراو
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
