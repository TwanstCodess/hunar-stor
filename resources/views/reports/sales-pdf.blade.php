@extends('reports.base-pdf')

@section('content')
    <div class="table-section">
        <h2 class="table-title">زانیاری فرۆشتنەکان</h2>

        @if(isset($sales) && $sales->count() > 0)
        <table class="data-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>ژمارەی فاکتور</th>
                    <th>کڕیار</th>
                    <th>بەروار</th>
                    <th>جۆری فرۆشتن</th>
                    <th>دراو</th>
                    <th>کۆی گشتی</th>
                    <th>پارەی پارێزراو</th>
                    <th>ماوە</th>
                    <th>بەکارهێنەر</th>
                </tr>
            </thead>
            <tbody>
                @foreach($sales as $index => $sale)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $sale->invoice_number }}</td>
                    <td>{{ $sale->customer->name ?? '-' }}</td>
                    <td>{{ $sale->sale_date }}</td>
                    <td>
                        @if($sale->sale_type == 'cash')
                            <span style="color: green;">نوقت</span>
                        @else
                            <span style="color: orange;">قسەت</span>
                        @endif
                    </td>
                    <td>{{ $sale->currency }}</td>
                    <td class="{{ $sale->currency == 'IQD' ? 'positive' : 'positive' }}">
                        {{ number_format($sale->total_amount, 2) }}
                    </td>
                    <td class="{{ $sale->currency == 'IQD' ? 'positive' : 'positive' }}">
                        {{ number_format($sale->paid_amount, 2) }}
                    </td>
                    <td class="{{ $sale->remaining_amount > 0 ? 'negative' : 'positive' }}">
                        {{ number_format($sale->remaining_amount, 2) }}
                    </td>
                    <td>{{ $sale->user->name ?? '-' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @else
        <div style="text-align: center; padding: 30px; color: #7f8c8d;">
            هیچ تۆمارێکی فرۆشتن نەدۆزرایەوە
        </div>
        @endif
    </div>
@endsection
