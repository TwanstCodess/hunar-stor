@extends('reports.base-pdf')

@section('content')
    <div class="table-section">
        <h2 class="table-title">زانیاری کۆگا</h2>

        @if(isset($products) && $products->count() > 0)
        <table class="data-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>کۆد</th>
                    <th>ناوی کاڵا</th>
                    <th>جۆر</th>
                    <th>یەکە</th>
                    <th>بەکارهێنانی کۆگا</th>
                    <th>دانە</th>
                    <th>ئاستی کەمترین</th>
                    <th>ئاستی زۆرترین</th>
                    <th>نرخی کڕین (دینار)</th>
                    <th>نرخی کڕین (دۆلار)</th>
                    <th>نرخی فرۆشتن (دینار)</th>
                    <th>نرخی فرۆشتن (دۆلار)</th>
                    <th>نرخ (دینار)</th>
                    <th>نرخ (دۆلار)</th>
                    <th>دۆخ</th>
                </tr>
            </thead>
            <tbody>
                @foreach($products as $index => $product)
                @php
                    $valueIQD = $product->quantity * $product->purchase_price_iqd;
                    $valueUSD = $product->quantity * $product->purchase_price_usd;

                    if($product->quantity == 0) {
                        $status = 'out_of_stock';
                        $statusText = 'بەتاڵە';
                        $statusColor = '#ff4444';
                    } elseif($product->quantity <= $product->min_stock_level) {
                        $status = 'low_stock';
                        $statusText = 'کەمە';
                        $statusColor = '#ff9800';
                    } else {
                        $status = 'in_stock';
                        $statusText = 'موجودە';
                        $statusColor = '#4caf50';
                    }
                @endphp
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $product->code ?? '-' }}</td>
                    <td>{{ $product->name }}</td>
                    <td>{{ $product->category->name ?? '-' }}</td>
                    <td>{{ $product->baseUnit->name ?? '-' }}</td>
                    <td>{{ $product->track_stock ? 'بەڵێ' : 'نەخێر' }}</td>
                    <td style="font-weight: bold; color: {{ $statusColor }};">
                        {{ number_format($product->quantity, 2) }}
                    </td>
                    <td>{{ number_format($product->min_stock_level, 2) }}</td>
                    <td>{{ number_format($product->max_stock_level, 2) }}</td>
                    <td>{{ number_format($product->purchase_price_iqd, 2) }}</td>
                    <td>{{ number_format($product->purchase_price_usd, 2) }}</td>
                    <td>{{ number_format($product->sale_price_iqd, 2) }}</td>
                    <td>{{ number_format($product->sale_price_usd, 2) }}</td>
                    <td class="positive">{{ number_format($valueIQD, 2) }}</td>
                    <td class="positive">{{ number_format($valueUSD, 2) }}</td>
                    <td style="color: {{ $statusColor }}; font-weight: bold;">
                        {{ $statusText }}
                    </td>
                </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr style="background-color: #2c3e50; color: white; font-weight: bold;">
                    <td colspan="13" style="text-align: left;">کۆی گشتی:</td>
                    <td class="positive">{{ number_format($stats['total_value_iqd'], 2) }}</td>
                    <td class="positive">{{ number_format($stats['total_value_usd'], 2) }}</td>
                    <td>
                        {{ number_format($stats['total_value_iqd'] + $stats['total_value_usd'], 2) }}
                    </td>
                </tr>
            </tfoot>
        </table>

        <!-- دابەشبوونی کاڵاکان بەپێی دۆخ -->
        <div style="margin-top: 40px;">
            <h3 class="table-title">دابەشبوونی کاڵاکان بەپێی دۆخی کۆگا</h3>

            @php
                $outOfStock = $products->where('quantity', 0);
                $lowStock = $products->where('quantity', '>', 0)
                                    ->where('quantity', '<=', \Illuminate\Support\Facades\DB::raw('min_stock_level'));
                $inStock = $products->where('quantity', '>', \Illuminate\Support\Facades\DB::raw('min_stock_level'));
            @endphp

            <div class="stats-grid">
                <div class="stat-card" style="border-left: 5px solid #4caf50;">
                    <h3>کاڵای بوونی هەیە</h3>
                    <div class="stat-value positive">{{ $inStock->count() }}</div>
                    <div style="text-align: center;">
                        {{ number_format(($inStock->count() / $products->count()) * 100, 1) }}%
                    </div>
                    <div style="font-size: 11px; color: #666; margin-top: 10px;">
                        نرخ: {{ number_format(
                            $inStock->sum(function($p) { return $p->quantity * $p->purchase_price_iqd; }), 2
                        ) }} دینار
                    </div>
                </div>

                <div class="stat-card" style="border-left: 5px solid #ff9800;">
                    <h3>کاڵای کەم</h3>
                    <div class="stat-value" style="color: #ff9800;">{{ $lowStock->count() }}</div>
                    <div style="text-align: center;">
                        {{ number_format(($lowStock->count() / $products->count()) * 100, 1) }}%
                    </div>
                    <div style="font-size: 11px; color: #666; margin-top: 10px;">
                        نرخ: {{ number_format(
                            $lowStock->sum(function($p) { return $p->quantity * $p->purchase_price_iqd; }), 2
                        ) }} دینار
                    </div>
                </div>

                <div class="stat-card" style="border-left: 5px solid #ff4444;">
                    <h3>کاڵای بەتاڵ</h3>
                    <div class="stat-value negative">{{ $outOfStock->count() }}</div>
                    <div style="text-align: center;">
                        {{ number_format(($outOfStock->count() / $products->count()) * 100, 1) }}%
                    </div>
                    <div style="font-size: 11px; color: #666; margin-top: 10px;">
                        داوای کڕین: {{ number_format(
                            $outOfStock->sum(function($p) { return $p->min_stock_level * $p->purchase_price_iqd; }), 2
                        ) }} دینار
                    </div>
                </div>

                <div class="stat-card" style="border-left: 5px solid #2196f3;">
                    <h3>کۆی کاڵاکان</h3>
                    <div class="stat-value">{{ $products->count() }}</div>
                    <div style="text-align: center;">100%</div>
                    <div style="font-size: 11px; color: #666; margin-top: 10px;">
                        نرخ: {{ number_format($stats['total_value_iqd'], 2) }} دینار
                    </div>
                </div>
            </div>
        </div>

        <!-- کاڵاکانی پێویست بە کڕین -->
        @if($lowStock->count() > 0 || $outOfStock->count() > 0)
        <div style="margin-top: 40px; page-break-before: always;">
            <h3 class="table-title">پێشنیازی کڕین</h3>

            <table class="data-table">
                <thead>
                    <tr>
                        <th>کاڵا</th>
                        <th>دانەی ئێستا</th>
                        <th>کەمترین</th>
                        <th>پێویست</th>
                        <th>نرخی کڕین (دینار)</th>
                        <th>نرخی کڕین (دۆلار)</th>
                        <th>نرخی گشتی (دینار)</th>
                    </tr>
                </thead>
                <tbody>
                    @php $totalPurchaseNeeded = 0; @endphp
                    @foreach($products as $product)
                        @if($product->quantity < $product->min_stock_level)
                        @php
                            $needed = $product->min_stock_level - $product->quantity;
                            $totalForProduct = $needed * $product->purchase_price_iqd;
                            $totalPurchaseNeeded += $totalForProduct;
                        @endphp
                        <tr>
                            <td>{{ $product->name }}</td>
                            <td style="color: #ff9800;">{{ number_format($product->quantity, 2) }}</td>
                            <td>{{ number_format($product->min_stock_level, 2) }}</td>
                            <td style="color: #2196f3; font-weight: bold;">{{ number_format($needed, 2) }}</td>
                            <td>{{ number_format($product->purchase_price_iqd, 2) }}</td>
                            <td>{{ number_format($product->purchase_price_usd, 2) }}</td>
                            <td class="positive">{{ number_format($totalForProduct, 2) }}</td>
                        </tr>
                        @endif
                    @endforeach
                </tbody>
                <tfoot>
                    <tr style="background-color: #f8f9fa; font-weight: bold;">
                        <td colspan="6" style="text-align: left;">کۆی گشتی پێویست بە کڕین:</td>
                        <td class="positive">{{ number_format($totalPurchaseNeeded, 2) }} دینار</td>
                    </tr>
                </tfoot>
            </table>
        </div>
        @endif
        @else
        <div style="text-align: center; padding: 30px; color: #7f8c8d;">
            هیچ تۆمارێکی کۆگا نەدۆزرایەوە
        </div>
        @endif
    </div>
@endsection
