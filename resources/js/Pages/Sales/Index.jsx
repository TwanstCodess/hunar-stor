// resources/js/Pages/Sales/Index.jsx
import { useState, useCallback, useRef, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import {
    Plus, Eye, Edit, Trash2, Search,
    ShoppingCart, Calendar, User, DollarSign,
    Filter, Printer, Download, RefreshCw,
    CheckCircle, AlertCircle, Clock, ChevronDown,
    CreditCard, TrendingUp, Percent, FileText,
    MoreVertical, ExternalLink, Copy, QrCode,
    Receipt, Package, Users, BarChart3
} from 'lucide-react';

function useDebounce(callback, delay) {
    const timeoutRef = useRef(null);
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args);
        }, delay);
    };
}

// Format numbers in English
const formatNumber = (number) => {
    if (number === null || number === undefined || isNaN(number)) return '0';
    return new Intl.NumberFormat('en-US').format(number);
};

// Format currency - ONLY NUMBERS in English
const formatCurrency = (amount, currency) => {
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

// Format date in English format
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export default function Index({ sales, customers, stats, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [customerId, setCustomerId] = useState(filters.customer_id || '');
    const [saleType, setSaleType] = useState(filters.sale_type || '');
    const [currency, setCurrency] = useState(filters.currency || '');
    const [status, setStatus] = useState(filters.status || '');
    const [fromDate, setFromDate] = useState(filters.from_date || '');
    const [toDate, setToDate] = useState(filters.to_date || '');
    const [perPage, setPerPage] = useState(filters.per_page || 15);
    const [selectedSales, setSelectedSales] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [saleToDelete, setSaleToDelete] = useState(null);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(null);

    const applyFilters = useCallback((newFilters = {}) => {
        const params = {
            search: newFilters.search ?? search,
            customer_id: customerId,
            sale_type: saleType,
            currency: currency,
            status: status,
            from_date: fromDate,
            to_date: toDate,
            per_page: perPage,
            ...newFilters
        };

        router.get('/sales', params, {
            preserveState: true,
            replace: true,
        });
    }, [search, customerId, saleType, currency, status, fromDate, toDate, perPage]);

    const debouncedApplyFilters = useDebounce(applyFilters, 500);

    const handleSearchChange = (value) => {
        setSearch(value);
        debouncedApplyFilters({ search: value });
    };

    const handleClearFilters = () => {
        setSearch('');
        setCustomerId('');
        setSaleType('');
        setCurrency('');
        setStatus('');
        setFromDate('');
        setToDate('');
        setSelectedSales([]);
        router.get('/sales');
    };

    const handleSelectAll = () => {
        if (selectedSales.length === sales.data.length) {
            setSelectedSales([]);
        } else {
            setSelectedSales(sales.data.map(sale => sale.id));
        }
    };

    const handleSelectSale = (saleId) => {
        if (selectedSales.includes(saleId)) {
            setSelectedSales(selectedSales.filter(id => id !== saleId));
        } else {
            setSelectedSales([...selectedSales, saleId]);
        }
    };

    // سڕینەوەی تاک
    const handleDelete = (sale) => {
        if (!sale) return;

        if (confirm(`دڵنیایت لە سڕینەوەی فرۆشتنی ${sale.invoice_number}؟\n\nئەم کارە گەڕانەوەی بڕی بەرهەمەکان بۆ ستۆک و کەمکردنەوەی قەرزی کڕیار دەکات.`)) {
            router.delete(`/sales/${sale.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedSales(selectedSales.filter(id => id !== sale.id));
                }
            });
        }
    };

    // سڕینەوەی بە کۆمەڵ
    const handleBulkDelete = () => {
        if (selectedSales.length === 0) {
            alert('هیچ فرۆشتنێک هەڵنەبژاردووە');
            return;
        }

        if (confirm(`دڵنیایت لە سڕینەوەی ${selectedSales.length} فرۆشتن؟\n\nئەم کارە گەڕانەوەی بڕی هەموو بەرهەمەکان بۆ ستۆک دەکات.`)) {
            router.post('/sales/bulk-delete', {
                ids: selectedSales
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedSales([]);
                    setShowBulkDeleteModal(false);
                }
            });
        }
    };

    const getStatusBadge = (sale) => {
        if (sale.remaining_amount <= 0) {
            return (
                <span className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    پارەدراو
                </span>
            );
        } else if (sale.paid_amount > 0) {
            return (
                <span className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">
                    <AlertCircle className="w-3 h-3" />
                    پێشەکی
                </span>
            );
        } else {
            return (
                <span className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                    <Clock className="w-3 h-3" />
                    پارەنەدراو
                </span>
            );
        }
    };

    const getTypeBadge = (type) => {
        return type === 'cash' ? (
            <span className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                ڕاستەوخۆ
            </span>
        ) : (
            <span className="px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full">
                قەرز
            </span>
        );
    };

    // ڕێژەی پارەی دراو
    const getPaidPercentage = (sale) => {
        if (sale.total_amount === 0) return 0;
        return Math.round((sale.paid_amount / sale.total_amount) * 100);
    };

    // دروستکردنی PDF
    const handleExportPDF = () => {
        router.get('/sales/export-pdf', {
            search,
            customer_id: customerId,
            sale_type: saleType,
            currency: currency,
            status: status,
            from_date: fromDate,
            to_date: toDate
        });
    };

    // دروستکردنی Excel
    const handleExportExcel = () => {
        router.get('/sales/export-excel', {
            search,
            customer_id: customerId,
            sale_type: saleType,
            currency: currency,
            status: status,
            from_date: fromDate,
            to_date: toDate
        });
    };

    return (
        <AuthenticatedLayout>
            <PageHeader
                title="فرۆشتنەکان"
                subtitle="بەڕێوەبردنی هەموو فرۆشتنەکان"
                action={{
                    href: '/sales/create',
                    label: 'فرۆشتنی نوێ',
                    icon: Plus,
                }}
            />

            {/* ئامارەکان */}
            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-6">
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-600">کۆی فرۆشتنەکان</p>
                            <p className="mt-2 text-2xl font-bold text-blue-900">{formatNumber(stats.total_sales)}</p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-blue-700">
                                <TrendingUp className="w-3 h-3" />
                                <span>{formatNumber(stats.today_count)} ئەمڕۆ</span>
                            </div>
                        </div>
                        <div className="p-3 bg-white rounded-full shadow-sm">
                            <ShoppingCart className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </Card>

                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600">کۆی گشتی</p>
                            <p className="mt-2 text-2xl font-bold text-green-900">
                                {formatNumber(stats.total_amount)}
                            </p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-green-700">
                                <span>هەموو فرۆشتنەکان</span>
                            </div>
                        </div>

                    </div>
                </Card>

                <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-emerald-600">کۆی پارەی دراو</p>
                            <p className="mt-2 text-2xl font-bold text-emerald-900">
                                {formatNumber(stats.total_paid)}
                            </p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-700">
                                <Percent className="w-3 h-3" />
                                <span>{(stats.total_amount > 0 ? Math.round((stats.total_paid / stats.total_amount) * 100) : 0)}%</span>
                            </div>
                        </div>
                        <div className="p-3 bg-white rounded-full shadow-sm">
                            <CreditCard className="w-6 h-6 text-emerald-600" />
                        </div>
                    </div>
                </Card>

                <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-orange-600">کۆی پارەی ماوە</p>
                            <p className="mt-2 text-2xl font-bold text-orange-900">
                                {formatNumber(stats.total_remaining)}
                            </p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-orange-700">
                                <span>{(stats.total_amount > 0 ? Math.round((stats.total_remaining / stats.total_amount) * 100) : 0)}%</span>
                            </div>
                        </div>
                        {/* <div className="p-3 bg-white rounded-full shadow-sm">
                            <Receipt className="w-6 h-6 text-orange-600" />
                        </div> */}
                    </div>
                </Card>

                <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-600">فرۆشتنەکانی ئەمڕۆ</p>
                            <p className="mt-2 text-2xl font-bold text-purple-900">
                                {formatNumber(stats.today_count)}
                            </p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-purple-700">
                                <Calendar className="w-3 h-3" />
                                <span>{formatNumber(stats.today_sales)}</span>
                            </div>
                        </div>
                        <div className="p-3 bg-white rounded-full shadow-sm">
                            <Package className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </Card>

                <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-cyan-600">کڕیارەکان</p>
                            <p className="mt-2 text-2xl font-bold text-cyan-900">
                                {formatNumber(customers.length)}
                            </p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-cyan-700">
                                <Users className="w-3 h-3" />
                                <span>کۆی کڕیارەکان</span>
                            </div>
                        </div>
                        <div className="p-3 bg-white rounded-full shadow-sm">
                            <User className="w-6 h-6 text-cyan-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* کردارەکانی سەرەوە */}
            {selectedSales.length > 0 && (
                <Card className="mb-4 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                                <ShoppingCart className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-medium text-blue-900">
                                    {formatNumber(selectedSales.length)} فرۆشتن هەڵبژێردراوە
                                </h3>
                                <p className="text-sm text-blue-700">
                                    دەتوانیت کردارەکان لەسەر هەموویان جێبەجێ بکەیت
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowBulkDeleteModal(true)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                            >
                                <Trash2 className="w-4 h-4" />
                                سڕینەوەی کۆمەڵ
                            </button>
                            <button
                                onClick={() => setSelectedSales([])}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                هەڵوەشاندنەوە
                            </button>
                        </div>
                    </div>
                </Card>
            )}

            {/* فلتەرەکان */}
            <Card className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-500" />
                        <h3 className="font-medium text-gray-700">فلتەرەکان</h3>
                        <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">
                            {formatNumber(sales.total)} فرۆشتن
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleClearFilters}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            <RefreshCw className="w-4 h-4" />
                            پاککردنەوە
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="relative">
                        <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 right-3 top-1/2" />
                        <input
                            type="text"
                            placeholder="گەڕان بە ژمارەی وەسڵ یان ناوی کڕیار..."
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full pr-10 border-gray-300 rounded rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <select
                        value={customerId}
                        onChange={(e) => {
                            setCustomerId(e.target.value);
                            applyFilters({ customer_id: e.target.value });
                        }}
                        className="border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="">هەموو کڕیارەکان</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.phone || 'بێ ژمارە'})</option>
                        ))}
                    </select>

                    <select
                        value={saleType}
                        onChange={(e) => {
                            setSaleType(e.target.value);
                            applyFilters({ sale_type: e.target.value });
                        }}
                        className="border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="">هەموو جۆرەکان</option>
                        <option value="cash">ڕاستەوخۆ</option>
                        <option value="credit">قەرز</option>
                    </select>

                    <select
                        value={currency}
                        onChange={(e) => {
                            setCurrency(e.target.value);
                            applyFilters({ currency: e.target.value });
                        }}
                        className="border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="">هەموو دراوەکان</option>
                        <option value="IQD">دینار (IQD)</option>
                        <option value="USD">دۆلار (USD)</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-3">
                    <div className="flex gap-2">
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                applyFilters({ status: e.target.value });
                            }}
                            className="flex-1 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="">هەموو دۆخەکان</option>
                            <option value="paid">پارەدراو</option>
                            <option value="unpaid">پارەنەدراو</option>
                            <option value="partial">پێشەکی</option>
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => {
                                setFromDate(e.target.value);
                                applyFilters({ from_date: e.target.value });
                            }}
                            className="flex-1 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                            placeholder="لە"
                        />
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => {
                                setToDate(e.target.value);
                                applyFilters({ to_date: e.target.value });
                            }}
                            className="flex-1 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                            placeholder="بۆ"
                        />
                    </div>

                    <div className="flex gap-2">
                        <select
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(e.target.value);
                                applyFilters({ per_page: e.target.value });
                            }}
                            className="flex-1 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="10">10 لە هەر پەڕەیەک</option>
                            <option value="15">15 لە هەر پەڕەیەک</option>
                            <option value="25">25 لە هەر پەڕەیەک</option>
                            <option value="50">50 لە هەر پەڕەیەک</option>
                            <option value="100">100 لە هەر پەڕەیەک</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* خشتە */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="w-10 px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedSales.length === sales.data.length && sales.data.length > 0}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                                    وەسڵ
                                </th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                                    کڕیار
                                </th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                                    بەروار
                                </th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                                    بڕی گشتی
                                </th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                                    پارەی دراو
                                </th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                                    پارەی ماوە
                                </th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                                    جۆر
                                </th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                                    دۆخ
                                </th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                                    کردارەکان
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sales.data.length > 0 ? (
                                sales.data.map((sale) => (
                                    <tr
                                        key={sale.id}
                                        className={`hover:bg-gray-50 ${selectedSales.includes(sale.id) ? 'bg-blue-50' : ''}`}
                                    >
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedSales.includes(sale.id)}
                                                onChange={() => handleSelectSale(sale.id)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/sales/${sale.id}`}
                                                        className="font-mono font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                                    >
                                                        #{sale.invoice_number}
                                                    </Link>
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(sale.invoice_number)}
                                                        className="p-1 text-gray-400 hover:text-gray-600"
                                                        title="لەبەرگرتنەوە"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-end gap-1 mt-1 text-xs text-gray-500">
                                                    <Package className="w-3 h-3" />
                                                    <span>{formatNumber(sale.items_count)} بەرهەم</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-right">
                                                <div className="font-medium text-gray-900">
                                                    {sale.customer?.name || 'کڕیاری ناناسراو'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {sale.user?.name}
                                                </div>
                                                {sale.customer?.phone && (
                                                    <div className="text-xs text-gray-400">
                                                        {sale.customer.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                {formatDate(sale.sale_date)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-right">
                                                <div className="font-semibold text-gray-900">
                                                    {formatCurrency(sale.total_amount, sale.currency)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-right">
                                                <div className="font-medium text-green-600">
                                                    {formatCurrency(sale.paid_amount, sale.currency)}
                                                </div>
                                                <div className="mt-1">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-green-500 rounded-full"
                                                                style={{ width: `${getPaidPercentage(sale)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-green-600">
                                                            {formatNumber(getPaidPercentage(sale))}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-right">
                                                <div className={`font-medium ${sale.remaining_amount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                                    {formatCurrency(sale.remaining_amount, sale.currency)}
                                                </div>
                                                {sale.remaining_amount > 0 && (
                                                    <div className="text-xs text-red-500">
                                                        {sale.sale_type === 'credit' ? 'قەرز' : 'ماوە'}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getTypeBadge(sale.sale_type)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(sale)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setShowActionsMenu(showActionsMenu === sale.id ? null : sale.id)}
                                                        className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-600"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>

                                                    {showActionsMenu === sale.id && (
                                                        <div className="absolute right-0 z-10 w-48 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                                                            <div className="py-1">
                                                                <Link
                                                                    href={`/sales/${sale.id}`}
                                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                    بینین
                                                                </Link>
                                                                {sale.paid_amount === 0 && (
                                                                    <Link
                                                                        href={`/sales/${sale.id}/edit`}
                                                                        className="flex items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                        دەستکاری
                                                                    </Link>
                                                                )}
                                                                <Link
                                                                    href={`/sales/${sale.id}/print`}
                                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-purple-700 hover:bg-purple-50"
                                                                    target="_blank"
                                                                >
                                                                    <Printer className="w-4 h-4" />
                                                                    چاپکردن
                                                                </Link>
                                                                <Link
                                                                    href={`/sales/${sale.id}/edit`}
                                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                   دەسکاری
                                                                </Link>
                                                                <hr className="my-1" />
                                                                {sale.paid_amount === 0 && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setShowActionsMenu(null);
                                                                            handleDelete(sale);
                                                                        }}
                                                                        className="flex items-center w-full gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                        سڕینەوە
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="10" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <ShoppingCart className="w-16 h-16 mb-4 text-gray-300" />
                                            <h3 className="text-lg font-medium text-gray-900">فرۆشتن نەدۆزرایەوە</h3>
                                            <p className="mt-2 text-gray-600">
                                                {search || customerId || saleType || currency || status || fromDate || toDate
                                                    ? 'فرۆشتنێک بەم فلتەرە نەدۆزرایەوە'
                                                    : 'هیچ فرۆشتنێک تۆمار نەکراوە'}
                                            </p>
                                            {!search && !customerId && !saleType && !currency && !status && !fromDate && !toDate && (
                                                <Link
                                                    href="/sales/create"
                                                    className="inline-flex items-center gap-2 px-4 py-2 mt-4 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    زیادکردنی فرۆشتنی نوێ
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {sales.data.length > 0 && sales.links && sales.links.length > 3 && (
                    <div className="px-6 py-4 border-t border-gray-200">
                        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                            <div className="text-sm text-gray-700">
                                نیشاندان <span className="font-medium">{formatNumber(sales.from)}</span> بۆ{' '}
                                <span className="font-medium">{formatNumber(sales.to)}</span> لە{' '}
                                <span className="font-medium">{formatNumber(sales.total)}</span> فرۆشتن
                            </div>
                            <div className="flex gap-1">
                                {sales.links.map((link, index) => (
                                    <button
                                        key={index}
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url || link.active}
                                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                            link.active
                                                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-blue-600'
                                                : link.url
                                                ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                                                : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* مۆدالی سڕینەوەی کۆمەڵ */}
            {showBulkDeleteModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" />
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" />
                        <div className="inline-block px-4 pt-5 pb-4 overflow-hidden text-right align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <div className="sm:flex sm:items-start">
                                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-red-100 rounded-full sm:mx-0 sm:h-10 sm:w-10">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:mr-4 sm:text-right">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                                        سڕینەوەی کۆمەڵ
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            دڵنیایت لە سڕینەوەی {formatNumber(selectedSales.length)} فرۆشتن؟
                                        </p>
                                        <p className="mt-1 text-xs text-gray-400">
                                            ئەم کارە گەڕانەوەی بڕی هەموو بەرهەمەکان بۆ ستۆک و کەمکردنەوەی قەرزی کڕیار دەکات.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    onClick={handleBulkDelete}
                                    className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    سڕینەوە
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowBulkDeleteModal(false)}
                                    className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                                >
                                    پاشگەزبوونەوە
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
