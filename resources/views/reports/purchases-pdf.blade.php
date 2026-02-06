@extends('reports.base-pdf')

@section('content')
    <div class="table-section">
        <h2 class="table-title">زانیاری کڕینەکان</h2>

        @if(isset($purchases) && $purchases->count() > 0)
        <table class="data-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>ژمارەی فاکتور</th>
                    <th>دابینکەر</th>
                    <th>بەروار</th>
                    <th>جۆری کڕین</th>
                    <th>دراو</th>
                    <th>کۆی گشتی</th>
                    <th>پارەی پارێزراو</th>
                    <th>ماوە</th>
                    <th>بەکارهێنەر</th>
                </tr>
            </thead>
            <tbody>
                @foreach($purchases as $index => $purchase)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $purchase->invoice_number }}</td>
                    <td>{{ $purchase->supplier->name ?? '-' }}</td>
                    <td>{{ $purchase->purchase_date }}</td>
                    <td>
                        @if($purchase->purchase_type == 'cash')
                            <span style="color: green;">نوقت</span>
                        @else
                            <span style="color: orange;">قسەت</span>
                        @endif
                    </td>
                    <td>{{ $purchase->currency }}</td>
                    <td class="{{ $purchase->currency == 'IQD' ? 'positive' : 'positive' }}">
                        {{ number_format($purchase->total_amount, 2) }}
                    </td>
                    <td class="{{ $purchase->currency == 'IQD' ? 'positive' : 'positive' }}">
                        {{ number_format($purchase->paid_amount, 2) }}
                    </td>
                    <td class="{{ $purchase->remaining_amount > 0 ? 'negative' : 'positive' }}">
                        {{ number_format($purchase->remaining_amount, 2) }}
                    </td>
                    <td>{{ $purchase->user->name ?? '-' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @else
        <div style="text-align: center; padding: 30px; color: #7f8c8d;">
            هیچ تۆمارێکی کڕین نەدۆزرایەوە
        </div>
        @endif
    </div>
@endsection
