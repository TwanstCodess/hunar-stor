// resources/js/Pages/Sales/Show.jsx
import { Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import {
    ArrowRight, Printer, Edit, Trash2, Plus,
    User, Calendar, DollarSign, Package, CreditCard, CheckCircle, AlertCircle, Clock
} from 'lucide-react';

export default function Show({ sale }) {
    const formatCurrency = (amount, currency) => {
        return new Intl.NumberFormat('ar-IQ').format(amount) + ' ' + currency;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('ar-IQ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // فەنکشن بۆ وێنەی بەرهەم
    const getProductImage = (product) => {
        if (!product) return null;

        if (product.image_url) {
            return product.image_url;
        }

        if (product.image) {
            // چێککردن ئەگەر پاتەکە URLـێکی تەواوە
            if (typeof product.image === 'string') {
                if (product.image.startsWith('http')) {
                    return product.image;
                }
                if (product.image.startsWith('/storage/')) {
                    return product.image;
                }
                if (product.image.startsWith('storage/')) {
                    return '/' + product.image;
                }
                if (product.image.includes('products/')) {
                    return '/storage/' + product.image;
                }
                return '/storage/products/' + product.image;
            }
        }

        return null;
    };

    // دروستکردنی وێنەی لەناوچوو بەکارهێنانی UI Avatars
    const getFallbackImage = (productName) => {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(productName || 'Product')}&background=4F46E5&color=fff`;
    };

    const getStatusBadge = () => {
        if (sale.remaining_amount <= 0) {
            return (
                <span className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-full">
                    <CheckCircle className="w-4 h-4" />
                    پارەدراو
                </span>
            );
        } else if (sale.paid_amount > 0) {
            return (
                <span className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-full">
                    <AlertCircle className="w-4 h-4" />
                    پێشەکی
                </span>
            );
        } else {
            return (
                <span className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-full">
                    <Clock className="w-4 h-4" />
                    پارەنەدراو
                </span>
            );
        }
    };

    const getTypeBadge = () => {
        return sale.sale_type === 'cash' ? (
            <span className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
                ڕاستەوخۆ
            </span>
        ) : (
            <span className="px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-100 rounded-full">
                قەرز
            </span>
        );
    };

    const handleDelete = () => {
        if (confirm(`دڵنیایت لە سڕینەوەی فرۆشتنی ${sale.invoice_number}؟`)) {
            router.delete(`/sales/${sale.id}`);
        }
    };

    const handleAddPayment = () => {
        const amount = prompt('بڕی پارەی دراو:');
        if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
            if (parseFloat(amount) > sale.remaining_amount) {
                alert('بڕی پارەی دراو نابێت زیاتر بێت لە ماوە');
                return;
            }

            const paymentMethod = prompt('شێوازی پارەدان (cash, pos, transfer):');
            if (paymentMethod && ['cash', 'pos', 'transfer'].includes(paymentMethod)) {
                router.post(`/sales/${sale.id}/add-payment`, {
                    amount: parseFloat(amount),
                    payment_method: paymentMethod,
                    notes: 'پارەدان لەلایەن بەڕێوەبەر'
                });
            }
        }
    };

    return (
        <AuthenticatedLayout>
            <PageHeader
                title={`وەسڵی فرۆشتن: ${sale.invoice_number}`}
                subtitle={formatDate(sale.sale_date)}
            />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Action Buttons */}
                <div className="flex gap-3">

                            <Link
                                href={`/sales/${sale.id}/edit`}
                                className="flex items-center gap-2 btn btn-primary"
                            >
                                <Edit className="w-4 h-4" />
                                دەستکاری
                            </Link>
                              {sale.paid_amount === 0 && (
                        <>
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 btn btn-danger"
                            >
                                <Trash2 className="w-4 h-4" />
                                سڕینەوە
                            </button>
                        </>
                    )}

                    <Link
                        href={`/sales/${sale.id}/print`}
                        className="flex items-center gap-2 btn btn-secondary"
                        target="_blank"
                    >
                        <Printer className="w-4 h-4" />
                        چاپکردن
                    </Link>
                    <Link
                        href="/sales"
                        className="flex items-center gap-2 btn btn-gray"
                    >
                        <ArrowRight className="w-4 h-4" />
                        گەڕانەوە
                    </Link>
                </div>

                {/* Sale Details */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Card>
                        <div className="space-y-4">
                            <div>
                                <h3 className="mb-2 text-sm font-medium text-gray-600">کڕیار</h3>
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-lg font-semibold">{sale.customer?.name || 'کڕیاری ناناسراو'}</p>
                                        {sale.customer?.phone && (
                                            <p className="text-sm text-gray-600">{sale.customer.phone}</p>
                                        )}
                                        {sale.customer?.address && (
                                            <p className="text-sm text-gray-500">{sale.customer.address}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-2 text-sm font-medium text-gray-600">فرۆشیار</h3>
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-lg font-semibold">{sale.user?.name}</p>
                                        <p className="text-sm text-gray-600">{sale.user?.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h3 className="mb-2 text-sm font-medium text-gray-600">جۆری فرۆشتن</h3>
                                <div className="flex items-center gap-2">
                                    {getTypeBadge()}
                                    {getStatusBadge()}
                                </div>
                            </div>
                            <div>
                                <h3 className="mb-2 text-sm font-medium text-gray-600">دراو</h3>
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-gray-400" />
                                    <p className="text-lg font-semibold">{sale.currency}</p>
                                </div>
                            </div>
                            {sale.payment_method && (
                                <div>
                                    <h3 className="mb-2 text-sm font-medium text-gray-600">شێوازی پارەدان</h3>
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-gray-400" />
                                        <p className="text-lg font-semibold">
                                            {sale.payment_method === 'cash' ? 'ڕاستەوخۆ' :
                                             sale.payment_method === 'pos' ? 'پۆس' : 'گواستنەوە'}
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div>
                                <h3 className="mb-2 text-sm font-medium text-gray-600">بەروار</h3>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-gray-400" />
                                    <p className="text-lg font-semibold">{formatDate(sale.sale_date)}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Items Table */}
                <Card title="بەرهەمەکان">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-sm font-semibold text-right">#</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-right">بەرهەم</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-right">بڕ</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-right">یەکە</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-right">نرخی یەکە</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-right">کۆی گشتی</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sale.items?.map((item, index) => {
                                    const productImage = getProductImage(item.product);

                                    return (
                                        <tr key={item.id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3">{index + 1}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {productImage ? (
                                                        <img
                                                            src={productImage}
                                                            alt={item.product?.name}
                                                            className="object-cover w-10 h-10 rounded-lg"
                                                            onError={(e) => {
                                                                e.target.src = getFallbackImage(item.product?.name);
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                                                            <Package className="w-6 h-6 text-blue-600" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium">{item.product?.name}</div>
                                                        <div className="text-sm text-gray-600">
                                                            {item.product?.code || '---'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{item.quantity}</td>
                                            <td className="px-4 py-3">
                                                {item.product?.sale_unit?.name || item.product?.base_unit?.name || 'دانە'}
                                            </td>
                                            <td className="px-4 py-3">{formatCurrency(item.unit_price, sale.currency)}</td>
                                            <td className="px-4 py-3 font-semibold">
                                                {formatCurrency(item.total_price, sale.currency)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Totals and Payments */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Card title="کۆی گشتی">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2">
                                <span className="text-gray-600">کۆی گشتی</span>
                                <span className="text-2xl font-bold text-blue-600">
                                    {formatCurrency(sale.total_amount, sale.currency)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-t">
                                <span className="text-gray-600">پارەی دراو</span>
                                <span className="text-xl font-semibold text-green-600">
                                    {formatCurrency(sale.paid_amount, sale.currency)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-t">
                                <span className="text-gray-600">ماوە</span>
                                <span className={`text-xl font-semibold ${
                                    sale.remaining_amount > 0 ? 'text-red-600' : 'text-gray-400'
                                }`}>
                                    {formatCurrency(sale.remaining_amount, sale.currency)}
                                </span>
                            </div>
                        </div>
                    </Card>

                    <Card title="پارەدانەکان">
                        <div className="space-y-3">
                            {sale.payments && sale.payments.length > 0 ? (
                                sale.payments.map((payment) => (
                                    <div key={payment.id} className="p-3 border border-gray-200 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">
                                                    {payment.reference_number || 'پارەدان'}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {new Date(payment.payment_date).toLocaleDateString('ar-IQ')}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-green-600">
                                                    {formatCurrency(payment.amount, payment.currency)}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {payment.payment_method === 'cash' ? 'ڕاستەوخۆ' :
                                                     payment.payment_method === 'pos' ? 'پۆس' : 'گواستنەوە'}
                                                </div>
                                            </div>
                                        </div>
                                        {payment.notes && (
                                            <div className="mt-2 text-sm text-gray-500">{payment.notes}</div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="py-4 text-center text-gray-500">
                                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    هیچ پارەدانێک تۆمار نەکراوە
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Notes */}
                {sale.notes && (
                    <Card title="تێبینی">
                        <p className="text-gray-900">{sale.notes}</p>
                    </Card>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
