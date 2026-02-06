@extends('reports.base-pdf')

@section('content')
    <div class="table-section">
        <h2 class="table-title">زانیاری خەرجیەکان</h2>

        @if(isset($expenses) && $expenses->count() > 0)
        <table class="data-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>بەروار</th>
                    <th>بەڵگەنامە</th>
                    <th>جۆری خەرجی</th>
                    <th>تێبینی</th>
                    <th>دراو</th>
                    <th>بڕ</th>
                    <th>بەکارهێنەر</th>
                </tr>
            </thead>
            <tbody>
                @foreach($expenses as $index => $expense)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $expense->expense_date }}</td>
                    <td>{{ $expense->document_number ?? '-' }}</td>
                    <td>{{ $expense->expense_type }}</td>
                    <td>{{ \Illuminate\Support\Str::limit($expense->description, 30) }}</td>
                    <td>{{ $expense->currency }}</td>
                    <td class="{{ $expense->currency == 'IQD' ? 'negative' : 'negative' }}">
                        {{ number_format($expense->amount, 2) }}
                    </td>
                    <td>{{ $expense->user->name ?? '-' }}</td>
                </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr style="background-color: #f8f9fa; font-weight: bold;">
                    <td colspan="6" style="text-align: left;">کۆی گشتی:</td>
                    <td colspan="2" style="text-align: right;">
                        @php
                            $total_iqd = $expenses->where('currency', 'IQD')->sum('amount');
                            $total_usd = $expenses->where('currency', 'USD')->sum('amount');
                        @endphp
                        <div>دینار: {{ number_format($total_iqd, 2) }}</div>
                        <div>دۆلار: {{ number_format($total_usd, 2) }}</div>
                    </td>
                </tr>
            </tfoot>
        </table>

        <!-- وێنەی خەرجیەکان بەپێی جۆر -->
        <div style="margin-top: 40px;">
            <h3 class="table-title">دابەشبوونی خەرجیەکان بەپێی جۆر</h3>
            @php
                $expensesByType = $expenses->groupBy('expense_type');
            @endphp
            <table class="data-table">
                <thead>
                    <tr>
                        <th>جۆری خەرجی</th>
                        <th>ژمارەی تۆمار</th>
                        <th>کۆی دینار</th>
                        <th>کۆی دۆلار</th>
                        <th>کۆی گشتی</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($expensesByType as $type => $typeExpenses)
                    <tr>
                        <td>{{ $type }}</td>
                        <td>{{ $typeExpenses->count() }}</td>
                        <td>{{ number_format($typeExpenses->where('currency', 'IQD')->sum('amount'), 2) }}</td>
                        <td>{{ number_format($typeExpenses->where('currency', 'USD')->sum('amount'), 2) }}</td>
                        <td>
                            {{ number_format(
                                $typeExpenses->where('currency', 'IQD')->sum('amount') +
                                $typeExpenses->where('currency', 'USD')->sum('amount'),
                                2
                            ) }}
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @else
        <div style="text-align: center; padding: 30px; color: #7f8c8d;">
            هیچ تۆمارێکی خەرجی نەدۆزرایەوە
        </div>
        @endif
    </div>
@endsection
