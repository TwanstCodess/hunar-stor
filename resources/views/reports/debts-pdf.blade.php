@extends('reports.base-pdf')

@section('content')
    <!-- قەرزی کڕیاران -->
    @if(isset($customers) && $customers->count() > 0)
    <div class="table-section">
        <h2 class="table-title">قەرزی کڕیاران</h2>

        <table class="data-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>ناوی کڕیار</th>
                    <th>ژمارەی موبایل</th>
                    <th>قەرزی دینار</th>
                    <th>قەرزی دۆلار</th>
                    <th>کۆی گشتی</th>
                    <th>ژمارەی فاکتورەکان</th>
                </tr>
            </thead>
            <tbody>
                @foreach($customers as $index => $customer)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $customer->name }}</td>
                    <td>{{ $customer->phone ?? '-' }}</td>
                    <td class="{{ $customer->balance_iqd > 0 ? 'negative' : 'positive' }}">
                        {{ number_format($customer->balance_iqd, 2) }}
                    </td>
                    <td class="{{ $customer->balance_usd > 0 ? 'negative' : 'positive' }}">
                        {{ number_format($customer->balance_usd, 2) }}
                    </td>
                    <td class="negative">
                        {{ number_format($customer->balance_iqd + $customer->balance_usd, 2) }}
                    </td>
                    <td>{{ $customer->sales->count() ?? 0 }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    <!-- قەرزی دابینکەران -->
    @if(isset($suppliers) && $suppliers->count() > 0)
    <div class="page-break"></div>

    <div class="table-section">
        <h2 class="table-title">قەرزی دابینکەران</h2>

        <table class="data-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>ناوی دابینکەر</th>
                    <th>ژمارەی موبایل</th>
                    <th>قەرزی دینار</th>
                    <th>قەرزی دۆلار</th>
                    <th>کۆی گشتی</th>
                    <th>ژمارەی فاکتورەکان</th>
                </tr>
            </thead>
            <tbody>
                @foreach($suppliers as $index => $supplier)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $supplier->name }}</td>
                    <td>{{ $supplier->phone ?? '-' }}</td>
                    <td class="{{ $supplier->balance_iqd > 0 ? 'negative' : 'positive' }}">
                        {{ number_format($supplier->balance_iqd, 2) }}
                    </td>
                    <td class="{{ $supplier->balance_usd > 0 ? 'negative' : 'positive' }}">
                        {{ number_format($supplier->balance_usd, 2) }}
                    </td>
                    <td class="negative">
                        {{ number_format($supplier->balance_iqd + $supplier->balance_usd, 2) }}
                    </td>
                    <td>{{ $supplier->purchases->count() ?? 0 }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif
@endsection
