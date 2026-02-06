import { useState, useEffect, useMemo, useRef } from 'react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import {
    Plus, Minus, X, Search, Save, ArrowRight,
    Package, ShoppingCart, DollarSign, User,
    AlertTriangle, Calendar, ChevronDown, Upload, AlertCircle,
    FileText, Wallet, CreditCard
} from 'lucide-react';

export default function Create({ customers, products, invoiceNumber, categories, units }) {
    console.log('Create Component Loaded');
    console.log('Customers:', customers?.length);
    console.log('Products:', products?.length);
    console.log('Categories:', categories?.length);
    console.log('Units:', units?.length);

    const [data, setData] = useState({
        customer_id: '',
        sale_type: 'credit',
        currency: 'IQD',
        payment_method: 'cash',
        paid_amount: '0',
        sale_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: [],
        use_advance: false, // ئەگەر بەکارهێنانی زیادە
    });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const customerDropdownRef = useRef(null);

    // State بۆ مۆدالی زیادکردنی بەرهەم
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [newProductData, setNewProductData] = useState({
        category_id: categories.length > 0 ? categories[0].id : '',
        name: '',
        code: '',
        barcode: '',
        base_unit_id: units.length > 0 ? units[0].id : '',
        purchase_unit_id: units.length > 0 ? units[0].id : '',
        sale_unit_id: units.length > 0 ? units[0].id : '',
        purchase_to_base_factor: 1,
        sale_to_base_factor: 1,
        purchase_price_iqd: 0,
        purchase_price_usd: 0,
        selling_price_iqd: 0,
        selling_price_usd: 0,
        quantity: 0,
        min_stock_level: 20,
        track_stock: true,
        description: '',
        image: null,
    });
    const [productErrors, setProductErrors] = useState({});
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    // کاتێک جۆری فرۆشتن دەگۆڕدرێت
    useEffect(() => {
        if (data.sale_type === 'credit') {
            setData(prev => ({ ...prev, payment_method: '', paid_amount: '0' }));
        } else {
            setData(prev => ({ ...prev, payment_method: 'cash' }));
        }
    }, [data.sale_type]);

    // داخستنی لیستی کڕیار کاتێک لە دەرەوە کلیک دەکرێت
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
                setShowCustomerDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // کاتێک کڕیار دەگۆڕدرێت، زیادەی ئەو کڕیارە دەهێنینەوە
    useEffect(() => {
        if (data.customer_id) {
            const selectedCustomer = customers.find(c => c.id === data.customer_id);
            if (selectedCustomer) {
                const advance = data.currency === 'IQD'
                    ? selectedCustomer.negative_balance_iqd
                    : selectedCustomer.negative_balance_usd;

                console.log('کڕیاری هەڵبژێردراو:', selectedCustomer.name);
                console.log('زیادەی ئەم کڕیارە:', advance, data.currency);
            }
        }
    }, [data.customer_id, data.currency, customers]);

    // کاتێگۆریەکان بۆ فلتەر
    const availableCategories = useMemo(() => {
        const cats = products.reduce((acc, product) => {
            if (product.category_name && !acc.includes(product.category_name)) {
                acc.push(product.category_name);
            }
            return acc;
        }, []);
        return ['all', ...cats];
    }, [products]);

    // کڕیارە فلتەرکراوەکان
    const filteredCustomers = useMemo(() => {
        if (!customerSearch.trim()) {
            return customers;
        }

        const searchLower = customerSearch.toLowerCase();
        return customers.filter(customer =>
            customer.name?.toLowerCase().includes(searchLower) ||
            customer.phone?.includes(customerSearch) ||
            customer.email?.toLowerCase().includes(searchLower)
        );
    }, [customers, customerSearch]);

    // بەرهەمە فلتەرکراوەکان
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (product.barcode && product.barcode.includes(searchTerm)) ||
                (product.code && product.code.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesCategory = selectedCategory === 'all' || product.category_name === selectedCategory;
            return matchesSearch && matchesCategory && product.track_stock;
        });
    }, [products, searchTerm, selectedCategory]);

    // زیادەی کڕیاری هەڵبژێردراو
    const selectedCustomerAdvance = useMemo(() => {
        if (!data.customer_id) return 0;
        const customer = customers.find(c => c.id === data.customer_id);
        if (!customer) return 0;

        return data.currency === 'IQD'
            ? parseFloat(customer.negative_balance_iqd || 0)
            : parseFloat(customer.negative_balance_usd || 0);
    }, [data.customer_id, data.currency, customers]);

    // قەرزی کڕیاری هەڵبژێردراو
    const selectedCustomerBalance = useMemo(() => {
        if (!data.customer_id) return 0;
        const customer = customers.find(c => c.id === data.customer_id);
        if (!customer) return 0;

        return data.currency === 'IQD'
            ? parseFloat(customer.balance_iqd || 0)
            : parseFloat(customer.balance_usd || 0);
    }, [data.customer_id, data.currency, customers]);

    const addProductToCart = (product) => {
        const existingIndex = data.items.findIndex(item => item.product_id === product.id);

        if (existingIndex >= 0) {
            const newItems = [...data.items];
            newItems[existingIndex].quantity += 1;
            setData({ ...data, items: newItems });
        } else {
            const price = data.currency === 'IQD'
                ? product.selling_price_iqd
                : product.selling_price_usd;

            const availableQuantity = product.available_quantity || product.quantity || 0;

            setData({
                ...data,
                items: [...data.items, {
                    product_id: product.id,
                    product_name: product.name,
                    product_code: product.code,
                    product_image: product.image_url,
                    quantity: 1,
                    unit_price: price,
                    unit_label: product.unit_label || 'دانە',
                    available_quantity: availableQuantity,
                    min_price: data.currency === 'IQD' ? product.purchase_price_iqd : product.purchase_price_usd,
                    note: ''
                }]
            });
        }
    };

    // فەنکشنەکان بۆ زیادکردنی بەرهەمی نوێ
    const openAddProductModal = () => {
        setShowAddProductModal(true);
        setNewProductData({
            category_id: categories.length > 0 ? categories[0].id : '',
            name: '',
            code: '',
            barcode: '',
            base_unit_id: units.length > 0 ? units[0].id : '',
            purchase_unit_id: units.length > 0 ? units[0].id : '',
            sale_unit_id: units.length > 0 ? units[0].id : '',
            purchase_to_base_factor: 1,
            sale_to_base_factor: 1,
            purchase_price_iqd: 0,
            purchase_price_usd: 0,
            selling_price_iqd: 0,
            selling_price_usd: 0,
            quantity: 0,
            min_stock_level: 20,
            track_stock: true,
            description: '',
            image: null,
        });
        setProductErrors({});
        setPreviewImage(null);
    };

    const closeAddProductModal = () => {
        setShowAddProductModal(false);
        setProductErrors({});
        setPreviewImage(null);
    };

    const handleNewProductInputChange = (field, value) => {
        setNewProductData(prev => ({
            ...prev,
            [field]: value
        }));

        if (productErrors[field]) {
            setProductErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }

        if (field === 'base_unit_id') {
            setNewProductData(prev => ({
                ...prev,
                purchase_unit_id: value,
                sale_unit_id: value,
                purchase_to_base_factor: 1,
                sale_to_base_factor: 1
            }));
        }
    };

    const generateProductCode = () => {
        const code = 'PRD-' + Date.now().toString().slice(-6);
        handleNewProductInputChange('code', code);
    };

    const generateBarcode = () => {
        const barcode = 'BRC-' + Date.now().toString().slice(-8);
        handleNewProductInputChange('barcode', barcode);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleNewProductInputChange('image', file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        handleNewProductInputChange('image', null);
        setPreviewImage(null);
    };

    // فەنکشن بۆ گۆڕینی تێبینی بەرهەم
    const handleNoteChange = (index, value) => {
        const newItems = [...data.items];
        newItems[index].note = value;
        setData({ ...data, items: newItems });
    };

    // فەنکشن بۆ هەڵبژاردنی بەکارهێنانی زیادە
    const handleUseAdvanceChange = (value) => {
        setData(prev => ({ ...prev, use_advance: value }));

        // ئەگەر زیادە هەڵبژێردرا، بەکاربهێنە
        if (value && selectedCustomerAdvance > 0) {
            const total = calculateTotal();
            const advanceToUse = Math.min(selectedCustomerAdvance, total);
            setData(prev => ({
                ...prev,
                paid_amount: advanceToUse.toString(),
                use_advance: value
            }));
        } else {
            setData(prev => ({
                ...prev,
                paid_amount: '0',
                use_advance: value
            }));
        }
    };

    const handleAddProduct = async () => {
        setIsAddingProduct(true);
        setProductErrors({});

        try {
            const formData = new FormData();

            formData.append('category_id', newProductData.category_id || '');
            formData.append('name', newProductData.name || '');
            formData.append('code', newProductData.code || '');
            formData.append('barcode', newProductData.barcode || '');
            formData.append('base_unit_id', newProductData.base_unit_id || '');
            formData.append('purchase_unit_id', newProductData.purchase_unit_id || newProductData.base_unit_id || '');
            formData.append('sale_unit_id', newProductData.sale_unit_id || newProductData.base_unit_id || '');
            formData.append('purchase_to_base_factor', newProductData.purchase_to_base_factor || 1);
            formData.append('sale_to_base_factor', newProductData.sale_to_base_factor || 1);
            formData.append('purchase_price_iqd', newProductData.purchase_price_iqd || 0);
            formData.append('purchase_price_usd', newProductData.purchase_price_usd || 0);
            formData.append('selling_price_iqd', newProductData.selling_price_iqd || 0);
            formData.append('selling_price_usd', newProductData.selling_price_usd || 0);
            formData.append('quantity', newProductData.quantity || 0);
            formData.append('min_stock_level', newProductData.min_stock_level || 20);
            formData.append('track_stock', newProductData.track_stock ? '1' : '0');
            formData.append('description', newProductData.description || '');

            if (newProductData.image instanceof File) {
                formData.append('image', newProductData.image);
            }

            const response = await fetch('/sales/add-product', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Accept': 'application/json',
                },
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                if (result.errors) {
                    setProductErrors(result.errors);
                } else {
                    alert(result.message || 'هەڵەیەک ڕوویدا');
                }
                setIsAddingProduct(false);
                return;
            }

            alert('بەرهەم بە سەرکەوتوویی زیادکرا!');
            const newProduct = result.product;

            router.reload({
                only: ['products'],
                onSuccess: () => {
                    addProductToCart(newProduct);
                }
            });

            closeAddProductModal();

        } catch (error) {
            console.error('هەڵە:', error);
            alert('هەڵەیەک ڕوویدا لە کاتی زیادکردنی بەرهەم');
        } finally {
            setIsAddingProduct(false);
        }
    };

    // حیسابی کۆی گشتی
    const calculateTotal = () => {
        return data.items.reduce((sum, item) => {
            return sum + (parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0));
        }, 0);
    };

    // فەنکشن بۆ کەمکردنەوەی پارە لە زیادە
    const calculatePaymentFromAdvance = () => {
        const total = calculateTotal();
        const paid = parseFloat(data.paid_amount || 0);
        const advance = selectedCustomerAdvance;

        let advanceUsed = 0;
        let cashPayment = 0;
        let excessAmount = 0;

        if (data.use_advance && advance > 0) {
            // ١. یەکەم لە زیادە بەکاربهێنە
            advanceUsed = Math.min(advance, total);

            // ٢. ئەگەر زیادە بەس نەبوو، پاشان پارەی ڕاستەوخۆ
            if (paid > advanceUsed) {
                cashPayment = paid - advanceUsed;
            }

            // ٣. پشکنین بۆ پارەی زیادە
            if (paid > total) {
                excessAmount = paid - total;
            }
        } else {
            // تەنها پارەی ڕاستەوخۆ
            cashPayment = paid;

            if (paid > total) {
                excessAmount = paid - total;
            }
        }

        return { advanceUsed, cashPayment, excessAmount };
    };

    // ناردنی فۆرم
    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        if (data.items.length === 0) {
            setErrors({ items: 'کەمێک بەرهەم زیاد بکە' });
            setProcessing(false);
            alert('کەمێک بەرهەم زیاد بکە');
            return;
        }

        const total = calculateTotal();
        const paid = parseFloat(data.paid_amount || 0);
        const advance = selectedCustomerAdvance;

        // حیسابکردنی پارەدانەکان
        const paymentDetails = calculatePaymentFromAdvance();
        const { advanceUsed, cashPayment, excessAmount } = paymentDetails;

        // پشکنینی بەکارهێنانی زیادە
        if (data.use_advance && advanceUsed > 0) {
            if (advanceUsed > advance) {
                setErrors({ paid_amount: 'ناتوانیت زیاتر لە زیادەی کڕیار بەکاربهێنیت' });
                setProcessing(false);
                alert('ناتوانیت زیاتر لە زیادەی کڕیار بەکاربهێنیت');
                return;
            }

            if (advanceUsed > total) {
                setErrors({ paid_amount: 'ناتوانیت زیاتر لە کۆی گشت لە زیادە بەکاربهێنیت' });
                setProcessing(false);
                alert('ناتوانیت زیاتر لە کۆی گشت لە زیادە بەکاربهێنیت');
                return;
            }
        }

        // پشکنینی پارەی زیادە
        if (excessAmount > 0 && !data.use_advance) {
            if (data.sale_type === 'cash' && data.customer_id) {
                if (!confirm(`پارەی دراو (${new Intl.NumberFormat('ar-IQ').format(paid)} ${data.currency}) زیاترە لە کۆی گشت (${new Intl.NumberFormat('ar-IQ').format(total)} ${data.currency}).\nزیادە (${new Intl.NumberFormat('ar-IQ').format(excessAmount)} ${data.currency}) دەچێتە ناو هەژماری کڕیار.\nدڵنیایت؟`)) {
                    setProcessing(false);
                    return;
                }
            } else {
                setErrors({ paid_amount: 'بڕی دراو نابێت زیاتر بێت لە کۆی گشتی' });
                setProcessing(false);
                alert('بڕی دراو نابێت زیاتر بێت لە کۆی گشتی');
                return;
            }
        }

        // پشکنینی پارەی ڕاستەوخۆ
        if (data.sale_type === 'cash') {
            if (cashPayment <= 0 && advanceUsed <= 0) {
                setErrors({ paid_amount: 'بۆ فرۆشتنی ڕاستەوخۆ، بڕێکی دراو پێویستە' });
                setProcessing(false);
                alert('بۆ فرۆشتنی ڕاستەوخۆ، بڕێکی دراو پێویستە');
                return;
            }
            if (cashPayment > 0 && !data.payment_method) {
                setErrors({ payment_method: 'شێوازی پارەدان بۆ فرۆشتنی ڕاستەوخۆ پێویستە' });
                setProcessing(false);
                alert('شێوازی پارەدان بۆ فرۆشتنی ڕاستەوخۆ پێویستە');
                return;
            }
        }

        // پشکنینی قەرزی بێ کڕیار
        if (data.sale_type === 'credit' && !data.customer_id) {
            if (!confirm('فرۆشتنەکەت وەک قەرزە بێ کڕیار! دڵنیایت لە تۆمارکردن؟')) {
                setProcessing(false);
                return;
            }
        }

        // پشکنینی کەمتر لە کۆی گشت بۆ فرۆشتنی کاش
        if (data.sale_type === 'cash' && paid < total && !data.use_advance) {
            if (!confirm(`پارەی دراو (${new Intl.NumberFormat('ar-IQ').format(paid)} ${data.currency}) کەمترە لە کۆی گشت (${new Intl.NumberFormat('ar-IQ').format(total)} ${data.currency}).\nئەم فرۆشتنە وەک فرۆشتنی قەرز تۆمار دەکرێت.\nدڵنیایت؟`)) {
                setProcessing(false);
                return;
            }
            // گۆڕینی جۆری فرۆشتن بۆ قەرز
            data.sale_type = 'credit';
            data.payment_method = '';
        }

        // ئاگاداری کڕیار کاتێک زیادە بەکاردەهێنێت
        if (data.use_advance && advanceUsed > 0 && data.customer_id) {
            const remainingAdvance = advance - advanceUsed;
            if (!confirm(`کڕیار زیادەی ${new Intl.NumberFormat('ar-IQ').format(advance)} ${data.currency} هەیە.\nبەکارهێنانی ${new Intl.NumberFormat('ar-IQ').format(advanceUsed)} ${data.currency} لە زیادە.\nزیادەی ماوە: ${new Intl.NumberFormat('ar-IQ').format(remainingAdvance)} ${data.currency}\nدڵنیایت؟`)) {
                setProcessing(false);
                return;
            }
        }

        // پاککردنەوەی فیلدەکانی زێدەر بۆ ناردن
        const submitData = {
            ...data,
            items: data.items.map(item => ({
                product_id: item.product_id,
                quantity: parseFloat(item.quantity) || 0,
                unit_price: parseFloat(item.unit_price) || 0,
                note: item.note || ''
            })),
            paid_amount: parseFloat(data.paid_amount) || 0,
            use_advance: data.use_advance,
            // حیسابی زیادە و پارەی ڕاستەوخۆ
            advance_used: advanceUsed,
            cash_payment: cashPayment,
            excess_amount: excessAmount
        };

        router.post('/sales', submitData, {
            onError: (errors) => {
                setErrors(errors);
                setProcessing(false);
            },
            onSuccess: () => {
                setProcessing(false);
            }
        });
    };

    const total = calculateTotal();
    const paidAmount = parseFloat(data.paid_amount || 0);
    const remaining = total - paidAmount;

    // حیسابکردنی بەکارهێنانی زیادە بۆ پیشاندان
    const paymentDetails = calculatePaymentFromAdvance();
    const { advanceUsed, cashPayment, excessAmount } = paymentDetails;

    // بڕەکانی خێرای پارەدان
    const quickPayAmounts = data.currency === 'IQD' ?
        [10000, 25000, 50000, 100000, 250000] :
        [10, 25, 50, 100, 250];

    // یەکەی هەڵبژێردراو
    const selectedBaseUnit = units.find(u => u.id == newProductData.base_unit_id);
    const selectedPurchaseUnit = units.find(u => u.id == newProductData.purchase_unit_id);
    const selectedSaleUnit = units.find(u => u.id == newProductData.sale_unit_id);

    return (
        <AuthenticatedLayout>
            <PageHeader
                title="فرۆشتنی نوێ"
                subtitle={`وەسڵ: ${invoiceNumber}`}
            />

            {/* مۆدالی زیادکردنی بەرهەمی نوێ */}
            {showAddProductModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={closeAddProductModal}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                        <div className="inline-block w-full max-w-6xl my-8 text-right align-middle transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:w-full">
                            {/* ... هەمان کۆدی پێشوو بۆ مۆدالی بەرهەم ... */}
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* لای چەپ - بەرهەمەکان */}
                    <div className="space-y-4 lg:col-span-2">
                        {/* گەڕان */}
                        <Card>
                            <div className="space-y-4">
                                {/* گەڕان بۆ بەرهەم */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="relative">
                                        <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 right-3 top-1/2" />
                                        <input
                                            type="text"
                                            placeholder="گەڕان بە ناو، بارکۆد یان کۆد..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pr-10 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="all">هەموو کاتێگۆریەکان</option>
                                        {availableCategories.filter(c => c !== 'all').map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* دەرچوونی بۆ زیادکردنی بەرهەم */}
                                <div className="flex items-center justify-between p-4 border border-blue-200 rounded-lg bg-blue-50">
                                    <div className="flex items-center gap-2">
                                        <Package className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-700">
                                            بەرهەمێک بوونی نییە یان گەڕانت نەدۆزرایەوە؟
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={openAddProductModal}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                                    >
                                        <Plus className="w-4 h-4" />
                                        زیادکردنی بەرهەم
                                    </button>
                                </div>
                            </div>
                        </Card>

                        {/* لیستی بەرهەمەکان */}
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                            {filteredProducts.map(product => {
                                const available = product.available_quantity !== undefined ?
                                    product.available_quantity :
                                    product.quantity;
                                const isLowStock = available <= (product.min_stock_level || 0);
                                const isOutOfStock = available <= 0;

                                return (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => !isOutOfStock && addProductToCart(product)}
                                        disabled={isOutOfStock}
                                        className={`p-3 text-right transition-all rounded-lg border-2 ${
                                            isOutOfStock
                                                ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50'
                                                : 'bg-white border-gray-200 hover:border-blue-500 hover:shadow-md cursor-pointer'
                                        }`}
                                    >
                                        {/* وێنەی بەرهەم */}
                                        <div className="flex items-start justify-between mb-2">
                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="object-cover w-10 h-10 rounded-lg"
                                                    onError={(e) => {
                                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=4F46E5&color=fff`;
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                                                    <Package className="w-6 h-6 text-blue-600" />
                                                </div>
                                            )}

                                            <div className="flex flex-col items-end">
                                                {isLowStock && !isOutOfStock && (
                                                    <span className="px-1.5 py-0.5 mb-1 text-xs font-medium text-orange-700 bg-orange-100 rounded">
                                                        کەم
                                                    </span>
                                                )}
                                                {isOutOfStock && (
                                                    <span className="px-1.5 py-0.5 text-xs font-medium text-red-700 bg-red-100 rounded">
                                                        تەواو
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="mb-1 text-sm font-medium text-gray-900 line-clamp-2">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-gray-500">
                                               {available.toFixed(3)} {product.unit_label}
                                            </span>
                                            <span className="text-xs font-medium text-blue-600">
                                                {new Intl.NumberFormat('ar-IQ').format(
                                                    data.currency === 'IQD' ? product.selling_price_iqd : product.selling_price_usd
                                                )}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {filteredProducts.length === 0 && (
                            <div className="py-12 text-center">
                                <Package className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                                <p className="text-gray-500">هیچ بەرهەمێک نەدۆزرایەوە</p>
                                <button
                                    type="button"
                                    onClick={openAddProductModal}
                                    className="px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                >
                                    زیادکردنی بەرهەمی نوێ
                                </button>
                            </div>
                        )}
                    </div>

                    {/* لای ڕاست - ڕێکخستنەکان */}
                    <div className="space-y-4">
                        {/* ڕێکخستنەکان */}
                        <Card>
                            <div className="space-y-4">
                                {/* کڕیار - سیستەمی گەڕان */}
                                <div ref={customerDropdownRef} className="relative">
                                    <label className="flex items-center justify-between mb-2 text-sm font-medium text-gray-700">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            کڕیار
                                        </div>
                                        {data.customer_id && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData({ ...data, customer_id: '', use_advance: false, paid_amount: '0' });
                                                    setCustomerSearch('');
                                                }}
                                                className="text-xs text-red-600 hover:text-red-700"
                                            >
                                                سڕینەوە
                                            </button>
                                        )}
                                    </label>

                                    <div className="relative">
                                        <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 right-3 top-1/2" />
                                        <input
                                            type="text"
                                            value={customerSearch}
                                            onChange={(e) => {
                                                setCustomerSearch(e.target.value);
                                                if (!showCustomerDropdown) setShowCustomerDropdown(true);
                                            }}
                                            onFocus={() => setShowCustomerDropdown(true)}
                                            placeholder="گەڕان بە ناو، ژمارەی مۆبایل..."
                                            className="w-full pr-10 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                                            className="absolute transform -translate-y-1/2 left-3 top-1/2"
                                        >
                                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showCustomerDropdown ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>

                                    {/* لیستی کڕیارەکان */}
                                    {showCustomerDropdown && (
                                        <div className="absolute z-10 w-full mt-1 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg max-h-64">
                                            {filteredCustomers.length > 0 ? (
                                                filteredCustomers.map(customer => (
                                                    <button
                                                        key={customer.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setData({
                                                                ...data,
                                                                customer_id: customer.id,
                                                                use_advance: false,
                                                                paid_amount: '0'
                                                            });
                                                            setCustomerSearch(customer.name || '');
                                                            setShowCustomerDropdown(false);
                                                        }}
                                                        className={`w-full px-4 py-3 text-right transition-colors hover:bg-gray-50 ${
                                                            data.customer_id === customer.id ? 'bg-blue-50' : ''
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="text-left">
                                                                {/* نیشاندانی قەرز و زیادە */}
                                                                <div className="space-y-1">
                                                                    {customer.balance_iqd > 0 && data.currency === 'IQD' && (
                                                                        <span className="inline-block px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded">
                                                                            قەرز: {new Intl.NumberFormat('ar-IQ').format(customer.balance_iqd)} IQD
                                                                        </span>
                                                                    )}
                                                                    {customer.balance_usd > 0 && data.currency === 'USD' && (
                                                                        <span className="inline-block px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded">
                                                                            قەرز: {new Intl.NumberFormat('en-US').format(customer.balance_usd)} USD
                                                                        </span>
                                                                    )}
                                                                    {customer.negative_balance_iqd > 0 && data.currency === 'IQD' && (
                                                                        <span className="inline-block px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">
                                                                            زیادە: {new Intl.NumberFormat('ar-IQ').format(customer.negative_balance_iqd)} IQD
                                                                        </span>
                                                                    )}
                                                                    {customer.negative_balance_usd > 0 && data.currency === 'USD' && (
                                                                        <span className="inline-block px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">
                                                                            زیادە: {new Intl.NumberFormat('en-US').format(customer.negative_balance_usd)} USD
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900">{customer.name}</div>
                                                                {customer.phone && (
                                                                    <div className="text-sm text-gray-500">{customer.phone}</div>
                                                                )}
                                                                {customer.email && (
                                                                    <div className="text-sm text-gray-500">{customer.email}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-4 py-3 text-center text-gray-500">
                                                    کڕیارێک نەدۆزرایەوە
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* کڕیاری هەڵبژێردراو نمایش دەکرێت */}
                                    {data.customer_id && !showCustomerDropdown && (
                                        <div className="p-3 mt-2 border border-green-200 rounded-lg bg-green-50">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-green-900">
                                                        {customers.find(c => c.id === data.customer_id)?.name}
                                                    </div>
                                                    {customers.find(c => c.id === data.customer_id)?.phone && (
                                                        <div className="text-sm text-green-700">
                                                            {customers.find(c => c.id === data.customer_id)?.phone}
                                                        </div>
                                                    )}
                                                    {/* نیشاندانی زیادە و قەرز */}
                                                    <div className="mt-2 space-y-1">
                                                        {selectedCustomerBalance > 0 && (
                                                            <div className="text-xs font-medium text-orange-700">
                                                                قەرز: {new Intl.NumberFormat('ar-IQ').format(selectedCustomerBalance)} {data.currency}
                                                            </div>
                                                        )}
                                                        {selectedCustomerAdvance > 0 && (
                                                            <div className="text-xs font-medium text-green-700">
                                                                زیادە: {new Intl.NumberFormat('ar-IQ').format(selectedCustomerAdvance)} {data.currency}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setData({ ...data, customer_id: '', use_advance: false, paid_amount: '0' });
                                                        setCustomerSearch('');
                                                    }}
                                                    className="p-1 text-red-600 hover:text-red-700"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {errors.customer_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.customer_id}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-700">
                                            جۆری فرۆشتن
                                        </label>
                                        <select
                                            value={data.sale_type}
                                            onChange={(e) => setData({ ...data, sale_type: e.target.value, use_advance: false, paid_amount: '0' })}
                                            className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                                        >
                                            <option value="cash">ڕاستەوخۆ</option>
                                            <option value="credit">قەرز</option>
                                        </select>
                                        {errors.sale_type && (
                                            <p className="mt-1 text-sm text-red-600">{errors.sale_type}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                                            <DollarSign className="w-4 h-4" />
                                            دراو
                                        </label>
                                        <select
                                            value={data.currency}
                                            onChange={(e) => {
                                                const newItems = data.items.map(item => {
                                                    const product = products.find(p => p.id === item.product_id);
                                                    if (!product) return item;

                                                    return {
                                                        ...item,
                                                        unit_price: e.target.value === 'IQD'
                                                            ? product.selling_price_iqd
                                                            : product.selling_price_usd,
                                                        min_price: e.target.value === 'IQD'
                                                            ? product.purchase_price_iqd
                                                            : product.purchase_price_usd
                                                    };
                                                });

                                                setData({
                                                    ...data,
                                                    currency: e.target.value,
                                                    items: newItems,
                                                    paid_amount: '0',
                                                    use_advance: false
                                                });
                                            }}
                                            className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                                        >
                                            <option value="IQD">دینار</option>
                                            <option value="USD">دۆلار</option>
                                        </select>
                                        {errors.currency && (
                                            <p className="mt-1 text-sm text-red-600">{errors.currency}</p>
                                        )}
                                    </div>
                                </div>

                                {/* بەکارهێنانی زیادە - بۆ هەردوو جۆری فرۆشتن */}
                                {data.customer_id && selectedCustomerAdvance > 0 && (
                                    <div className={`p-4 border rounded-lg ${
                                        data.use_advance ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                                    }`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Wallet className={`w-4 h-4 ${data.use_advance ? 'text-green-600' : 'text-gray-600'}`} />
                                                <label className={`text-sm font-medium ${data.use_advance ? 'text-green-700' : 'text-gray-700'}`}>
                                                    بەکارهێنانی زیادە
                                                </label>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={data.use_advance}
                                                onChange={(e) => handleUseAdvanceChange(e.target.checked)}
                                                className={`w-4 h-4 rounded focus:ring-2 ${
                                                    data.use_advance
                                                        ? 'text-green-600 border-green-300 focus:ring-green-500'
                                                        : 'text-gray-600 border-gray-300 focus:ring-gray-500'
                                                }`}
                                            />
                                        </div>
                                        <p className={`text-sm ${data.use_advance ? 'text-green-600' : 'text-gray-600'}`}>
                                            کڕیار زیادەی {new Intl.NumberFormat('ar-IQ').format(selectedCustomerAdvance)} {data.currency} هەیە.
                                            {data.use_advance && (
                                                <span className="block mt-1 font-medium">
                                                    بەکارهێنانی: {new Intl.NumberFormat('ar-IQ').format(Math.min(paidAmount, selectedCustomerAdvance))} {data.currency}
                                                </span>
                                            )}
                                        </p>
                                        {data.use_advance && data.sale_type === 'cash' && (
                                            <p className="mt-2 text-xs text-blue-600">
                                                لە زیادە بڕی {new Intl.NumberFormat('ar-IQ').format(advanceUsed)} {data.currency} کەم دەکرێتەوە.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* شێوازی پارەدان تەنها بۆ ڕاستەوخۆ */}
                                {data.sale_type === 'cash' && (
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-700">
                                            شێوازی پارەدان
                                        </label>
                                        <select
                                            value={data.payment_method}
                                            onChange={(e) => setData({ ...data, payment_method: e.target.value })}
                                            className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                                            disabled={data.use_advance && cashPayment <= 0}
                                        >
                                            <option value="cash">ڕاستەوخۆ</option>
                                            <option value="pos">پۆس</option>
                                            <option value="transfer">گواستنەوە</option>
                                        </select>
                                        {data.use_advance && cashPayment <= 0 && (
                                            <p className="mt-1 text-xs text-gray-500">
                                                پارەی ڕاستەوخۆ نییە - تەنها زیادە بەکاردەهێنرێت
                                            </p>
                                        )}
                                        {errors.payment_method && (
                                            <p className="mt-1 text-sm text-red-600">{errors.payment_method}</p>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                                        <Calendar className="w-4 h-4" />
                                        بەرواری فرۆشتن
                                    </label>
                                    <input
                                        type="date"
                                        value={data.sale_date}
                                        onChange={(e) => setData({ ...data, sale_date: e.target.value })}
                                        className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                                    />
                                    {errors.sale_date && (
                                        <p className="mt-1 text-sm text-red-600">{errors.sale_date}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700">
                                        تێبینی
                                    </label>
                                    <textarea
                                        value={data.notes}
                                        onChange={(e) => setData({ ...data, notes: e.target.value })}
                                        rows="2"
                                        className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="تێبینیەکان..."
                                    />
                                    {errors.notes && (
                                        <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* سەبەتە */}
                        <Card title={
                            <div className="flex items-center justify-between">
                                <span>سەبەتە ({data.items.length})</span>
                                {errors.items && (
                                    <span className="text-sm text-red-600">{errors.items}</span>
                                )}
                            </div>
                        }>
                            <div className="space-y-2 max-h-[1000px] overflow-y-auto">
                                {data.items.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p className="text-gray-500">سەبەتە بەتاڵە</p>
                                    </div>
                                ) : (
                                    data.items.map((item, index) => (
                                        <div key={index} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                                            <div className="flex items-start gap-3 mb-2">
                                                {/* وێنەی بەرهەم */}
                                                {item.product_image ? (
                                                    <img
                                                        src={item.product_image}
                                                        alt={item.product_name}
                                                        className="object-cover w-12 h-12 rounded-lg"
                                                        onError={(e) => {
                                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.product_name)}&background=4F46E5&color=fff&size=48`;
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                                                        <Package className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                )}

                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h4 className="font-medium text-gray-900">
                                                                {item.product_name}
                                                            </h4>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newItems = data.items.filter((_, i) => i !== index);
                                                                setData({ ...data, items: newItems });
                                                            }}
                                                            className="p-1 text-red-600 hover:text-red-700"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center gap-2 mt-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newItems = [...data.items];
                                                                const newQuantity = parseFloat(newItems[index].quantity || 0) - 1;
                                                                if (newQuantity > 0) {
                                                                    newItems[index].quantity = newQuantity;
                                                                    setData({ ...data, items: newItems });
                                                                } else {
                                                                    const newItemsFiltered = data.items.filter((_, i) => i !== index);
                                                                    setData({ ...data, items: newItemsFiltered });
                                                                }
                                                            }}
                                                            className="p-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            step="0.001"
                                                            min="0.001"
                                                            max={item.available_quantity}
                                                            value={item.quantity}
                                                            onChange={(e) => {
                                                                const newItems = [...data.items];
                                                                newItems[index].quantity = e.target.value;
                                                                setData({ ...data, items: newItems });
                                                            }}
                                                            className="w-20 px-2 py-1 text-center border border-gray-300 rounded"
                                                        />
                                                        <span className="font-medium">
                                                            {item.unit_label}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newItems = [...data.items];
                                                                const newQuantity = parseFloat(newItems[index].quantity || 0) + 1;
                                                                if (newQuantity <= item.available_quantity) {
                                                                    newItems[index].quantity = newQuantity;
                                                                    setData({ ...data, items: newItems });
                                                                }
                                                            }}
                                                            disabled={item.quantity >= item.available_quantity}
                                                            className="p-1 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min={item.min_price || 0}
                                                            value={item.unit_price}
                                                            onChange={(e) => {
                                                                const newItems = [...data.items];
                                                                const price = parseFloat(e.target.value) || 0;
                                                                const minPrice = item.min_price || 0;

                                                                if (price < minPrice) {
                                                                    if (!confirm(`نرخی فرۆشتن کەمترە لە نرخی کڕین (${minPrice}). دڵنیایت؟`)) {
                                                                        return;
                                                                    }
                                                                }

                                                                newItems[index].unit_price = e.target.value;
                                                                setData({ ...data, items: newItems });
                                                            }}
                                                            className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500"
                                                            placeholder="نرخ"
                                                        />
                                                    </div>

                                                    {/* فیڵدی تێبینی */}
                                                    <div className="mt-3">
                                                        <div className="flex items-center gap-1 mb-1">
                                                            <FileText className="w-4 h-4 text-gray-500" />
                                                            <label className="text-xs font-medium text-gray-700">
                                                                تێبینی
                                                            </label>
                                                        </div>
                                                        <textarea
                                                            value={item.note || ''}
                                                            onChange={(e) => handleNoteChange(index, e.target.value)}
                                                            rows="2"
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                                                            placeholder="تێبینی بۆ ئەم بەرهەمە..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>

                        {/* پارەدان */}
                        {data.items.length > 0 && (
                            <Card>
                                <div className="space-y-4">
                                    <div className="p-4 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                                        <div className="mb-1 text-sm text-gray-600">کۆی گشتی</div>
                                        <div className="text-3xl font-bold text-blue-600">
                                            {new Intl.NumberFormat('ar-IQ').format(total)} {data.currency}
                                        </div>
                                        <div className="mt-2 text-sm text-gray-600">
                                            {data.items.length} بەرهەم
                                        </div>
                                    </div>

                                    {/* ئاگاداری بۆ قەرز */}
                                    {data.sale_type === 'credit' && (
                                        <div className="p-4 border border-orange-200 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 mt-0.5 text-orange-600" />
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-orange-900">فرۆشتنی قەرز</h4>
                                                    <p className="mt-1 text-sm text-orange-700">
                                                        بۆ فرۆشتنی قەرز، دەتوانیت بڕێکی دراو بنووسیت یان بە سفر بمێنێتەوە.
                                                    </p>
                                                    {!data.customer_id && (
                                                        <p className="mt-2 text-sm font-medium text-orange-800">
                                                            ⚠️ ئەم فرۆشتنە بێ کڕیارە!
                                                        </p>
                                                    )}
                                                    {data.customer_id && selectedCustomerAdvance > 0 && (
                                                        <p className="mt-2 text-sm font-medium text-green-800">
                                                            💰 کڕیار زیادەی {new Intl.NumberFormat('ar-IQ').format(selectedCustomerAdvance)} {data.currency} هەیە
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* پارەدانی خێرا تەنها بۆ ڕاستەوخۆ */}
                                    {data.sale_type === 'cash' && (
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-700">
                                                پارەدانی خێرا
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {quickPayAmounts.map(amount => (
                                                    <button
                                                        key={amount}
                                                        type="button"
                                                        onClick={() => setData({ ...data, paid_amount: amount.toString() })}
                                                        className="px-3 py-2 text-sm font-medium text-green-700 transition-colors bg-green-100 rounded hover:bg-green-200"
                                                    >
                                                        {new Intl.NumberFormat('ar-IQ').format(amount)}
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => setData({ ...data, paid_amount: total.toString() })}
                                                    className="col-span-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                                                >
                                                    تەواو
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* پارەی دراو */}
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-700">
                                            پارەی دراو {data.sale_type === 'credit' && '(ئارەزوومەندانە)'}
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max={data.use_advance ? Math.max(total, selectedCustomerAdvance) : total * 2}
                                            value={data.paid_amount}
                                            onChange={(e) => setData({ ...data, paid_amount: e.target.value })}
                                            className={`w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 ${
                                                errors.paid_amount ? 'border-red-500' : ''
                                            }`}
                                            placeholder={data.sale_type === 'cash' ? 'بڕی پارەی دراو' : 'بڕی دراو (ئارەزوومەندانە)'}
                                        />
                                        {errors.paid_amount && (
                                            <p className="mt-1 text-sm text-red-600">{errors.paid_amount}</p>
                                        )}
                                        {data.sale_type === 'credit' && !errors.paid_amount && (
                                            <p className="mt-1 text-xs text-gray-500">
                                                بۆ فرۆشتنی قەرز، بڕی دراو کەمکردنەوەی قەرزی کڕیارە.
                                            </p>
                                        )}
                                        {data.sale_type === 'cash' && data.customer_id && !data.use_advance && (
                                            <p className="mt-1 text-xs text-gray-500">
                                                ئەگەر پارەی دراو زیاتر بێت لە کۆی گشت، زیادەکە دەچێتە ناو هەژماری کڕیار.
                                            </p>
                                        )}
                                        {data.use_advance && (
                                            <p className="mt-1 text-xs font-medium text-green-600">
                                                بەکارهێنانی زیادە: تا {new Intl.NumberFormat('ar-IQ').format(selectedCustomerAdvance)} {data.currency}
                                            </p>
                                        )}
                                    </div>

                                    {/* پێشبینی پارەدانەکان */}
                                    {(data.use_advance || cashPayment > 0 || excessAmount > 0) && (
                                        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                                            <h4 className="mb-3 text-sm font-medium text-blue-700">پێشبینی پارەدان</h4>
                                            <div className="space-y-2 text-sm">
                                                {data.use_advance && advanceUsed > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">لە زیادە:</span>
                                                        <span className="font-medium text-green-600">
                                                            -{new Intl.NumberFormat('ar-IQ').format(advanceUsed)} {data.currency}
                                                        </span>
                                                    </div>
                                                )}
                                                {cashPayment > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">پارەی ڕاستەوخۆ:</span>
                                                        <span className="font-medium text-blue-600">
                                                            +{new Intl.NumberFormat('ar-IQ').format(cashPayment)} {data.currency}
                                                        </span>
                                                    </div>
                                                )}
                                                {excessAmount > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">پارەی زیادە:</span>
                                                        <span className="font-medium text-green-600">
                                                            +{new Intl.NumberFormat('ar-IQ').format(excessAmount)} {data.currency}
                                                        </span>
                                                    </div>
                                                )}
                                                {data.use_advance && advanceUsed > 0 && (
                                                    <div className="pt-2 mt-2 border-t border-blue-200">
                                                        <div className="flex justify-between font-medium">
                                                            <span className="text-green-700">زیادەی ماوە:</span>
                                                            <span className="text-green-700">
                                                                {new Intl.NumberFormat('ar-IQ').format(selectedCustomerAdvance - advanceUsed)} {data.currency}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* پێشبینی ماوە */}
                                    <div className={`p-4 rounded-lg ${
                                        data.sale_type === 'credit'
                                            ? paidAmount > 0
                                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
                                                : 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200'
                                            : remaining > 0
                                            ? 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200'
                                            : remaining < 0
                                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
                                            : 'bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200'
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="mb-1 text-sm font-medium text-gray-700">
                                                    {data.sale_type === 'credit'
                                                        ? paidAmount > 0 ? 'بڕی دراو' : 'کۆی قەرز'
                                                        : remaining > 0 ? 'ماوە'
                                                        : remaining < 0 ? 'پارەی زیادە'
                                                        : 'تەواو'
                                                    }
                                                </div>
                                                <div className={`text-2xl font-bold ${
                                                    data.sale_type === 'credit'
                                                        ? paidAmount > 0 ? 'text-green-600' : 'text-blue-600'
                                                        : remaining > 0 ? 'text-orange-600'
                                                        : remaining < 0 ? 'text-green-600'
                                                        : 'text-gray-600'
                                                }`}>
                                                    {new Intl.NumberFormat('ar-IQ').format(
                                                        Math.abs(remaining)
                                                    )} {data.currency}
                                                </div>
                                            </div>

                                            {/* ئاگاداری پارەی زیادە */}
                                            {data.sale_type === 'cash' && remaining < 0 && data.customer_id && (
                                                <div className="text-right">
                                                    <div className="text-xs font-medium text-green-600">
                                                        پارەی زیادە
                                                    </div>
                                                    <div className="text-sm text-green-700">
                                                        دەچێتە ناو هەژماری کڕیار
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* زانیاری زیادە */}
                                        {data.sale_type === 'cash' && remaining < 0 && data.customer_id && (
                                            <div className="pt-3 mt-3 border-t border-green-200">
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">کۆی گشتی:</span>
                                                        <span className="font-medium">{new Intl.NumberFormat('ar-IQ').format(total)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">پارەی دراو:</span>
                                                        <span className="font-medium text-green-600">+{new Intl.NumberFormat('ar-IQ').format(paidAmount)}</span>
                                                    </div>
                                                    <div className="flex justify-between font-medium">
                                                        <span className="text-green-700">پارەی زیادە:</span>
                                                        <span className="text-green-700">{new Intl.NumberFormat('ar-IQ').format(Math.abs(remaining))}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="submit"
                                            disabled={processing || data.items.length === 0}
                                            className="flex items-center justify-center gap-2 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Save className="w-5 h-5" />
                                            {processing ? 'چاوەڕێ بکە...' : 'تۆمارکردنی فرۆشتن'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => router.get('/sales')}
                                            className="flex items-center justify-center gap-2 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                                        >
                                            <ArrowRight className="w-5 h-5" />
                                            گەڕانەوە
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
