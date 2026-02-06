// resources/js/Pages/Dashboard/Index.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import StatCard from '@/Components/StatCard';
import Card from '@/Components/Card';
import {
    DollarSign,
    TrendingUp,
    Users,
    Package,
    ShoppingCart,
    AlertTriangle,
    Clock,
    Calendar,
    CreditCard,
    TrendingDown,
    Trophy,
    Star,
    TrendingUp as TrendingUpIcon,
    Loader2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard({
    stats = {},
    salesChart = [],
    recentSales = [],
    lowStockProducts = [],
    topDebtors = [],
    topProducts = [],
    topCustomers = [],
    initialFilters = {}
}) {
    const { data, setData, get, processing } = useForm({
        currency: initialFilters.currency || 'all',
        date_range: initialFilters.date_range || '7days',
    });

    // Automatic filter submission with debounce
    useEffect(() => {
        const handler = setTimeout(() => {
            get(route('dashboard'), {
                preserveState: true,
                preserveScroll: true,
                only: ['stats', 'salesChart', 'recentSales', 'lowStockProducts', 'topDebtors', 'topProducts', 'topCustomers'],
            });
        }, 500);

        return () => clearTimeout(handler);
    }, [data.currency, data.date_range]);

    // Safe stats with defaults
    const safeStats = useMemo(() => ({
        sales: stats?.sales || { iqd: 0, usd: 0 },
        debt: stats?.debt || { iqd: 0, usd: 0 },
        expenses: stats?.expenses || { iqd: 0, usd: 0 },
        payments: stats?.payments || { iqd: 0, usd: 0 },
        today_sales: stats?.today_sales || { iqd: 0, usd: 0 },
        monthly_sales: stats?.monthly_sales || { iqd: 0, usd: 0 },
        customers: stats?.customers || 0,
        products: stats?.products || 0
    }), [stats]);

    // Format currency helper - ONLY NUMBERS in English
    const formatCurrency = (amount, currency = 'IQD') => {
        if (amount === null || amount === undefined || isNaN(amount)) return '0';

        try {
            const numAmount = Number(amount);
            const formatted = new Intl.NumberFormat('en-US', {
                style: 'decimal',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }).format(numAmount);

            return currency === 'IQD' ? `${formatted} دینار` : `$${formatted}`;
        } catch (error) {
            console.error('Format error:', error, amount);
            return '0';
        }
    };

    // Format numbers in English
    const formatNumber = (number) => {
        if (number === null || number === undefined || isNaN(number)) return '0';
        return new Intl.NumberFormat('en-US').format(Number(number));
    };

    // Format date in English format
    const formatDate = (dateString) => {
        if (!dateString) return 'No date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get labels in Kurdish
    const getCurrencyLabel = () => {
        switch(data.currency) {
            case 'iqd': return 'دینار';
            case 'usd': return 'دۆلار';
            default: return 'هەموو دراوەکان';
        }
    };

    const getDateRangeLabel = () => {
        switch(data.date_range) {
            case 'today': return 'ئەمڕۆ';
            case 'yesterday': return 'دوێنێ';
            case '7days': return '٧ ڕۆژی ڕابردوو';
            case '30days': return '٣٠ ڕۆژی ڕابردوو';
            case 'month': return 'ئەم مانگە';
            case 'last_month': return 'مانگی ڕابردوو';
            case 'all': return 'هەموو کاتەکان';
            default: return '٧ ڕۆژی ڕابردوو';
        }
    };

    // Chart data with proper error handling
    const chartData = useMemo(() => {
        if (!salesChart || !Array.isArray(salesChart) || salesChart.length === 0) {
            return [];
        }

        try {
            return salesChart.map(item => {
                const date = new Date(item.date);
                let formattedDate;

                if (data.date_range === 'today' || data.date_range === 'yesterday') {
                    formattedDate = date.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });
                } else {
                    formattedDate = date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                    });
                }

                const chartItem = { date: formattedDate };

                if (data.currency === 'all' || data.currency === 'iqd') {
                    chartItem.دینار = Number(item.iqd) || 0;
                }
                if (data.currency === 'all' || data.currency === 'usd') {
                    chartItem.دۆلار = Number(item.usd) || 0;
                }

                return chartItem;
            });
        } catch (error) {
            console.error('Chart data error:', error);
            return [];
        }
    }, [salesChart, data.currency, data.date_range]);

    return (
        <AuthenticatedLayout>
            <Head title="داشبۆرد" />

            <PageHeader
                title="داشبۆرد"
                subtitle="پێشاندانی گشتی سیستەمەکە"
            />

            {/* Filters Section */}
            <Card title="فلتەرەکان" className="mb-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Currency Filter */}
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">
                            جۆری دراو
                        </label>
                        <select
                            value={data.currency}
                            onChange={(e) => setData('currency', e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            disabled={processing}
                        >
                            <option value="all">هەموو دراوەکان</option>
                            <option value="iqd">دینار (IQD)</option>
                            <option value="usd">دۆلار (USD)</option>
                        </select>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">
                            ماوەی کات
                        </label>
                        <select
                            value={data.date_range}
                            onChange={(e) => setData('date_range', e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            disabled={processing}
                        >
                            <option value="today">ئەمڕۆ</option>
                            <option value="yesterday">دوێنێ</option>
                            <option value="7days">٧ ڕۆژی ڕابردوو</option>
                            <option value="30days">٣٠ ڕۆژی ڕابردوو</option>
                            <option value="month">ئەم مانگە</option>
                            <option value="last_month">مانگی ڕابردوو</option>
                            <option value="all">هەموو کاتەکان</option>
                        </select>
                    </div>
                </div>

                {/* Loading Indicator */}
                {processing && (
                    <div className="flex items-center gap-2 mt-3 text-blue-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">چاوەڕوانبە...</span>
                    </div>
                )}
            </Card>

            {/* Active Filters Display */}
            <div className="flex flex-wrap gap-2 mb-6">
                <span className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full">
                    <DollarSign className="w-4 h-4" />
                    دراو: {getCurrencyLabel()}
                </span>
                <span className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full">
                    <Calendar className="w-4 h-4" />
                    ماوە: {getDateRangeLabel()}
                </span>
            </div>

            {/* Stats Grid - Sales & Debt */}
            <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2 lg:grid-cols-4">
                {(data.currency === 'all' || data.currency === 'iqd') && (
                    <StatCard
                        title="کۆی فرۆشتن (دینار)"
                        value={formatCurrency(safeStats.sales.iqd, 'IQD')}
                        subtitle={`ئەمڕۆ: ${formatCurrency(safeStats.today_sales.iqd, 'IQD')}`}
                        icon={DollarSign}
                        color="blue"
                    />
                )}

                {(data.currency === 'all' || data.currency === 'usd') && (
                    <StatCard
                        title="کۆی فرۆشتن (دۆلار)"
                        value={formatCurrency(safeStats.sales.usd, 'USD')}
                        subtitle={`ئەمڕۆ: ${formatCurrency(safeStats.today_sales.usd, 'USD')}`}
                        icon={TrendingUp}
                        color="green"
                    />
                )}

                {(data.currency === 'all' || data.currency === 'iqd') && (
                    <StatCard
                        title="کۆی قەرز (دینار)"
                        value={formatCurrency(safeStats.debt.iqd, 'IQD')}
                        subtitle="قەرزی گشتی"
                        icon={Clock}
                        color="orange"
                    />
                )}

                {(data.currency === 'all' || data.currency === 'usd') && (
                    <StatCard
                        title="کۆی قەرز (دۆلار)"
                        value={formatCurrency(safeStats.debt.usd, 'USD')}
                        subtitle="قەرزی گشتی"
                        icon={Clock}
                        color="red"
                    />
                )}
            </div>

            {/* Stats Grid - Monthly Sales & Others */}
            <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2 lg:grid-cols-4">
                {(data.currency === 'all' || data.currency === 'iqd') && (
                    <>
                        <StatCard
                            title="فرۆشتی مانگ (دینار)"
                            value={formatCurrency(safeStats.monthly_sales.iqd, 'IQD')}
                            subtitle="ئەم مانگە"
                            icon={Calendar}
                            color="purple"
                        />
                        <StatCard
                            title="پارەدان (دینار)"
                            value={formatCurrency(safeStats.payments.iqd, 'IQD')}
                            subtitle="دانەوەی قەرز"
                            icon={CreditCard}
                            color="green"
                        />
                        <StatCard
                            title="خەرجی (دینار)"
                            value={formatCurrency(safeStats.expenses.iqd, 'IQD')}
                            subtitle="کۆی خەرجییەکان"
                            icon={TrendingDown}
                            color="red"
                        />
                    </>
                )}

                {(data.currency === 'all' || data.currency === 'usd') && (
                    <>
                        <StatCard
                            title="فرۆشتی مانگ (دۆلار)"
                            value={formatCurrency(safeStats.monthly_sales.usd, 'USD')}
                            subtitle="ئەم مانگە"
                            icon={Calendar}
                            color="blue"
                        />
                        <StatCard
                            title="پارەدان (دۆلار)"
                            value={formatCurrency(safeStats.payments.usd, 'USD')}
                            subtitle="دانەوەی قەرز"
                            icon={CreditCard}
                            color="green"
                        />
                        <StatCard
                            title="خەرجی (دۆلار)"
                            value={formatCurrency(safeStats.expenses.usd, 'USD')}
                            subtitle="کۆی خەرجییەکان"
                            icon={TrendingDown}
                            color="red"
                        />
                    </>
                )}
            </div>

            {/* General Stats */}
            <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
                <StatCard
                    title="ژمارەی کڕیاران"
                    value={formatNumber(safeStats.customers)}
                    subtitle="کڕیاری تۆمارکراو"
                    icon={Users}
                    color="purple"
                />
                <StatCard
                    title="ژمارەی بەرهەمەکان"
                    value={formatNumber(safeStats.products)}
                    subtitle="بەرهەمی تۆمارکراو"
                    icon={Package}
                    color="blue"
                />
            </div>

            {/* Sales Chart */}
            <Card title={`چارتی فرۆشتنی ${getDateRangeLabel()}`} className="mb-6">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                stroke="#9ca3af"
                            />
                            <YAxis
                                tickFormatter={(value) => formatNumber(value)}
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                stroke="#9ca3af"
                            />
                            <Tooltip
                                formatter={(value, name) => [formatNumber(value), name]}
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.5rem',
                                    padding: '0.5rem'
                                }}
                            />
                            <Legend />
                            {(data.currency === 'all' || data.currency === 'iqd') && (
                                <Line
                                    type="monotone"
                                    dataKey="دینار"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ stroke: '#3b82f6', strokeWidth: 2, r: 5, fill: '#fff' }}
                                    activeDot={{ r: 7 }}
                                />
                            )}
                            {(data.currency === 'all' || data.currency === 'usd') && (
                                <Line
                                    type="monotone"
                                    dataKey="دۆلار"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={{ stroke: '#10b981', strokeWidth: 2, r: 5, fill: '#fff' }}
                                    activeDot={{ r: 7 }}
                                />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="py-12 text-center">
                        <TrendingUp className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg text-gray-500">هیچ داتایەک نییە بۆ پیشاندان</p>
                    </div>
                )}
            </Card>

            {/* Three Column Section */}
            <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-3">
                {/* Recent Sales */}
                <Card title="دوایین فرۆشتنەکان">
                    <div className="space-y-2">
                        {recentSales && recentSales.length > 0 ? (
                            recentSales.map((sale) => (
                                <Link
                                    key={sale.id}
                                    href={route('sales.show', sale.id)}
                                    className="flex items-center justify-between p-3 transition-all border border-gray-100 rounded-lg hover:bg-gray-50 hover:border-blue-200 hover:shadow-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <ShoppingCart className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {sale.invoice_number || `INV-${sale.id}`}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {sale.customer?.name || 'کڕیاری ناناسراو'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-900">
                                            {formatCurrency(sale.total_amount, sale.currency)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatDate(sale.sale_date)}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="py-8 text-center">
                                <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-gray-500">هیچ فرۆشتنێک نییە</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Top Products */}
                <Card title="پڕفرۆشترینی ئەم هەفتە">
                    <div className="space-y-2">
                        {topProducts && topProducts.length > 0 ? (
                            topProducts.map((product, index) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between p-3 transition-colors border border-gray-100 rounded-lg hover:bg-gray-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${
                                            index === 0 ? 'bg-yellow-100' :
                                            index === 1 ? 'bg-gray-100' :
                                            index === 2 ? 'bg-orange-100' : 'bg-blue-100'
                                        }`}>
                                            {index === 0 ? (
                                                <Trophy className="w-5 h-5 text-yellow-600" />
                                            ) : (
                                                <Package className="w-5 h-5 text-blue-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{product.name}</p>
                                            <p className="text-sm text-gray-600">
                                                {product.category_name || 'بێ کاتێگۆری'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-green-600">
                                            {formatNumber(product.total_quantity || 0)} {product.unit_name || 'دانە'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatNumber(product.sales_count || 0)} فرۆشتن
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center">
                                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-gray-500">هیچ فرۆشتنێک نییە</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Top Customers */}
                <Card title="باشترین کڕیارانی ئەم مانگە">
                    <div className="space-y-2">
                        {topCustomers && topCustomers.length > 0 ? (
                            topCustomers.map((customer, index) => (
                                <Link
                                    key={customer.id}
                                    href={route('customers.show', customer.id)}
                                    className="flex items-center justify-between p-3 transition-all border border-gray-100 rounded-lg hover:bg-gray-50 hover:border-blue-200 hover:shadow-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${
                                            index === 0 ? 'bg-yellow-100' :
                                            index === 1 ? 'bg-gray-100' :
                                            index === 2 ? 'bg-orange-100' : 'bg-blue-100'
                                        }`}>
                                            {index === 0 ? (
                                                <Star className="w-5 h-5 text-yellow-600" />
                                            ) : (
                                                <Users className="w-5 h-5 text-blue-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{customer.name}</p>
                                            <p className="text-sm text-gray-600">{customer.phone || 'ژمارە نییە'}</p>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-green-600">
                                            {formatCurrency(customer.total_spent, 'IQD')}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatNumber(customer.purchase_count || 0)} فرۆشتن
                                        </p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="py-8 text-center">
                                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-gray-500">هیچ کڕیارێک نییە</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Bottom Section - Low Stock & Top Debtors */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Low Stock Products */}
                <Card title="بەرهەمە کەمەکان">
                    <div className="space-y-2">
                        {lowStockProducts && lowStockProducts.length > 0 ? (
                            lowStockProducts.map((product) => (
                                <Link
                                    key={product.id}
                                    href={route('products.edit', product.id)}
                                    className="flex items-center justify-between p-3 transition-all border border-orange-200 rounded-lg bg-orange-50 hover:bg-orange-100 hover:shadow-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-100 rounded-lg">
                                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{product.name}</p>
                                            <p className="text-sm text-gray-600">
                                                {product.category_name || 'بێ کاتێگۆری'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-orange-600">
                                            {formatNumber(product.quantity || 0)} {product.unit_name || 'دانە'}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="py-8 text-center">
                                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-gray-500">هەموو بەرهەمەکان بەردەستن</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Top Debtors */}
                <Card title="کڕیارانی زۆرترین قەرز">
                    <div className="space-y-2">
                        {topDebtors && topDebtors.length > 0 ? (
                            topDebtors.map((customer) => (
                                <Link
                                    key={customer.id}
                                    href={route('customers.show', customer.id)}
                                    className="flex items-center justify-between p-3 transition-all border border-gray-100 rounded-lg hover:bg-gray-50 hover:border-red-200 hover:shadow-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-100 rounded-lg">
                                            <Users className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{customer.name}</p>
                                            <p className="text-sm text-gray-600">{customer.phone || 'ژمارە نییە'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-left">
                                        {customer.balance_iqd > 0 && (
                                            <p className="text-sm font-semibold text-red-600">
                                                {formatCurrency(customer.balance_iqd, 'IQD')}
                                            </p>
                                        )}
                                        {customer.balance_usd > 0 && (
                                            <p className="text-sm font-semibold text-red-600">
                                                {formatCurrency(customer.balance_usd, 'USD')}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="py-8 text-center">
                                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-gray-500">هیچ قەرزێک نییە</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
