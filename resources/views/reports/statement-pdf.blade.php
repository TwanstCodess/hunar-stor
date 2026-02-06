@extends('reports.base-pdf')

@section('content')
    <div class="info-section" style="background: #e3f2fd;">
        <div style="font-weight: bold; margin-bottom: 10px; color: #1565c0;">زانیاری کڕیار:</div>
        <div class="info-row">
            <div class="info-label">ناوی تەواو:</div>
            <div class="info-value">{{ $customer->name }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">ژمارەی موبایل:</div>
            <div class="info-value">{{ $customer->phone ?? '-' }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">ناونیشان:</div>
            <div class="info-value">{{ $customer->address ?? '-' }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">ماوەی سەرەتایی:</div>
            <div class="info-value">
                دینار: {{ number_format($summary['opening_balance']['iqd'], 2) }} |
                دۆلار: {{ number_format($summary['opening_balance']['usd'], 2) }}
            </div>
        </div>
    </div>

    <div class="table-section">
        <h2 class="table-title">کەشفی حساب</h2>

        @if(isset($transactions) && $transactions->count() > 0)
        <table class="data-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>بەروار</th>
                    <th>جۆر</th>
                    <th>پێناسە</th>
                    <th>دینار (بەرەکە)</th>
                    <th>دۆلار (بەرەکە)</th>
                    <th>دینار (قەرز)</th>
                    <th>دۆلار (قەرز)</th>
                    <th>ماوەی دینار</th>
                    <th>ماوەی دۆلار</th>
                </tr>
            </thead>
            <tbody>
                <!-- سەرەتا -->
                <tr style="background-color: #f5f5f5;">
                    <td colspan="4" style="text-align: center; font-weight: bold;">سەرەتا</td>
                    <td colspan="2" style="text-align: center; color: #2e7d32;">
                        {{ number_format($summary['opening_balance']['iqd'], 2) }}
                    </td>
                    <td colspan="2" style="text-align: center; color: #2e7d32;">
                        {{ number_format($summary['opening_balance']['usd'], 2) }}
                    </td>
                    <td style="font-weight: bold; color: #2e7d32;">
                        {{ number_format($summary['opening_balance']['iqd'], 2) }}
                    </td>
                    <td style="font-weight: bold; color: #2e7d32;">
                        {{ number_format($summary['opening_balance']['usd'], 2) }}
                    </td>
                </tr>

                <!-- ترانزەکشنەکان -->
                @foreach($transactions as $index => $transaction)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $transaction['date'] }}</td>
                    <td>
                        @if($transaction['type'] == 'sale')
                            <span style="color: #d32f2f; font-weight: bold;">فرۆشتن</span>
                        @else
                            <span style="color: #388e3c; font-weight: bold;">پارەدان</span>
                        @endif
                    </td>
                    <td>{{ $transaction['description'] }}</td>
                    <td class="{{ $transaction['debit_iqd'] > 0 ? 'negative' : '' }}">
                        @if($transaction['debit_iqd'] > 0)
                            {{ number_format($transaction['debit_iqd'], 2) }}
                        @else
                            -
                        @endif
                    </td>
                    <td class="{{ $transaction['debit_usd'] > 0 ? 'negative' : '' }}">
                        @if($transaction['debit_usd'] > 0)
                            {{ number_format($transaction['debit_usd'], 2) }}
                        @else
                            -
                        @endif
                    </td>
                    <td class="{{ $transaction['credit_iqd'] > 0 ? 'positive' : '' }}">
                        @if($transaction['credit_iqd'] > 0)
                            {{ number_format($transaction['credit_iqd'], 2) }}
                        @else
                            -
                        @endif
                    </td>
                    <td class="{{ $transaction['credit_usd'] > 0 ? 'positive' : '' }}">
                        @if($transaction['credit_usd'] > 0)
                            {{ number_format($transaction['credit_usd'], 2) }}
                        @else
                            -
                        @endif
                    </td>
                    <td style="font-weight: bold; {{ $transaction['balance_iqd'] < 0 ? 'color: #d32f2f;' : 'color: #388e3c;' }}">
                        {{ number_format($transaction['balance_iqd'], 2) }}
                    </td>
                    <td style="font-weight: bold; {{ $transaction['balance_usd'] < 0 ? 'color: #d32f2f;' : 'color: #388e3c;' }}">
                        {{ number_format($transaction['balance_usd'], 2) }}
                    </td>
                </tr>
                @endforeach

                <!-- کۆتایی -->
                <tr style="background-color: #e8f5e9; font-weight: bold;">
                    <td colspan="4" style="text-align: center;">کۆتایی</td>
                    <td colspan="2" style="text-align: center; color: #d32f2f;">
                        {{ number_format($summary['total_sales_iqd'] + $summary['total_sales_usd'], 2) }}
                    </td>
                    <td colspan="2" style="text-align: center; color: #388e3c;">
                        {{ number_format($summary['total_payments_iqd'] + $summary['total_payments_usd'], 2) }}
                    </td>
                    <td style="{{ $summary['closing_balance_iqd'] < 0 ? 'color: #d32f2f;' : 'color: #388e3c;' }}">
                        {{ number_format($summary['closing_balance_iqd'], 2) }}
                    </td>
                    <td style="{{ $summary['closing_balance_usd'] < 0 ? 'color: #d32f2f;' : 'color: #388e3c;' }}">
                        {{ number_format($summary['closing_balance_usd'], 2) }}
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- کورتە زانیاری -->
        <div style="margin-top: 40px;">
            <h3 class="table-title">کورتە زانیاری</h3>

            <div class="stats-grid">
                <div class="stat-card" style="border-left: 5px solid #d32f2f;">
                    <h3>کۆی فرۆشتن</h3>
                    <div class="stat-value negative">
                        {{ number_format($summary['total_sales_iqd'] + $summary['total_sales_usd'], 2) }}
                    </div>
                    <div style="text-align: center; font-size: 12px;">
                        دینار: {{ number_format($summary['total_sales_iqd'], 2) }}<br>
                        دۆلار: {{ number_format($summary['total_sales_usd'], 2) }}
                    </div>
                </div>

                <div class="stat-card" style="border-left: 5px solid #388e3c;">
                    <h3>کۆی پارەدانەکان</h3>
                    <div class="stat-value positive">
                        {{ number_format($summary['total_payments_iqd'] + $summary['total_payments_usd'], 2) }}
                    </div>
                    <div style="text-align: center; font-size: 12px;">
                        دینار: {{ number_format($summary['total_payments_iqd'], 2) }}<br>
                        دۆلار: {{ number_format($summary['total_payments_usd'], 2) }}
                    </div>
                </div>

                <div class="stat-card" style="border-left: 5px solid #1976d2;">
                    <h3>ماوەی سەرەتا</h3>
                    <div class="stat-value {{ ($summary['opening_balance']['iqd'] + $summary['opening_balance']['usd']) >= 0 ? 'positive' : 'negative' }}">
                        {{ number_format($summary['opening_balance']['iqd'] + $summary['opening_balance']['usd'], 2) }}
                    </div>
                    <div style="text-align: center; font-size: 12px;">
                        دینار: {{ number_format($summary['opening_balance']['iqd'], 2) }}<br>
                        دۆلار: {{ number_format($summary['opening_balance']['usd'], 2) }}
                    </div>
                </div>

                <div class="stat-card" style="border-left: 5px solid #7b1fa2;">
                    <h3>ماوەی کۆتایی</h3>
                    @php
                        $totalClosing = $summary['closing_balance_iqd'] + $summary['closing_balance_usd'];
                    @endphp
                    <div class="stat-value {{ $totalClosing >= 0 ? 'positive' : 'negative' }}">
                        {{ number_format($totalClosing, 2) }}
                    </div>
                    <div style="text-align: center; font-size: 12px;">
                        دینار: {{ number_format($summary['closing_balance_iqd'], 2) }}<br>
                        دۆلار: {{ number_format($summary['closing_balance_usd'], 2) }}
                    </div>
                </div>
            </div>

            <!-- بارەگەلێک -->
            <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 5px solid #ff9800;">
                <div style="font-weight: bold; color: #ff9800; margin-bottom: 10px;">تێبینی:</div>
                <div>
                    @if($totalClosing > 0)
                        <span style="color: #d32f2f; font-weight: bold;">کڕیار قەرزی ماوە بۆ کۆمپانیا:</span>
                        {{ number_format(abs($totalClosing), 2) }}
                    @elseif($totalClosing < 0)
                        <span style="color: #388e3c; font-weight: bold;">کۆمپانیا قەرزی ماوە بۆ کڕیار:</span>
                        {{ number_format(abs($totalClosing), 2) }}
                    @else
                        <span style="color: #1976d2; font-weight: bold;">هیچ قەرزێک نیە</span>
                    @endif
                </div>
            </div>
        </div>
        @else
        <div style="text-align: center; padding: 30px; color: #7f8c8d;">
            هیچ ترانزەکشنێک نەدۆزرایەوە بۆ ئەم ماوەیە
        </div>
        @endif
    </div>
@endsection
