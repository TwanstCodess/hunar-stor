import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Package,
    Users,
    ShoppingCart,
    CreditCard,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    Building,
    DollarSign,
    Folder,
    TrendingDown,
    ShoppingBag,
    Truck,
    AlertCircle,
    Boxes,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';

export default function AuthenticatedLayout({ children, title }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [salesDropdownOpen, setSalesDropdownOpen] = useState(false);
    const [purchasesDropdownOpen, setPurchasesDropdownOpen] = useState(false);
    const { auth } = usePage().props;
    const user = auth?.user || null;

    if (!user) {
        window.location.href = route('login');
        return null;
    }

const formatKurdishDate = (date) => {
    const d = new Date(date);

    // ڕۆژەکانی هەفتە بە کوردی
    const weekdays = [
        'یەکشەممە',
        'دووشەممە',
        'سێشەممە',
        'چوارشەممە',
        'پێنجشەممە',
        'هەینی',
        'شەممە'
    ];

    const day = d.getDate();
    const month = d.getMonth() + 1; // +1 چونکە getMonth() لە 0 دەست پێدەکات
    const year = d.getFullYear();
    const weekday = weekdays[d.getDay()];

    return `${weekday} ${day}/${month}/${year}`;
};
    const navigation = [
        { name: 'داشبۆرد', href: route('dashboard'), icon: LayoutDashboard },
        { name: 'کاتێگۆری', href: route('categories.index'), icon: Folder },
        { name: 'یەکەکان', href: route('units.index'), icon: Boxes },
        { name: 'بەرهەمەکان', href: route('products.index'), icon: Package },

        {
            name: 'فرۆشتن',
            icon: ShoppingCart,
            isDropdown: true,
            dropdownState: salesDropdownOpen,
            setDropdownState: setSalesDropdownOpen,
            children: [
                { name: 'کڕیاران', href: route('customers.index'), icon: Users },
                { name: 'فرۆشتن', href: route('sales.index'), icon: ShoppingBag },
            ]
        },
        {
            name: 'کڕین',
            icon: Truck,
            isDropdown: true,
            dropdownState: purchasesDropdownOpen,
            setDropdownState: setPurchasesDropdownOpen,
            children: [
                { name: 'دابینکەران', href: route('suppliers.index'), icon: Building },
                { name: 'کڕین', href: route('purchases.index'), icon: ShoppingCart },
            ]
        },
        { name: 'خەرجی', href: route('expenses.index'), icon: TrendingDown },
        { name: 'لیستی قەرزەکان', href: route('debts.index'), icon: DollarSign },
        { name: 'دانەوەی پارە', href: route('payments.index'), icon: CreditCard },
    ];

    if (user?.role === 'admin') {
        navigation.push({ name: 'بەکارهێنەران', href: route('users.index'), icon: Users });
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Sidebar */}
            <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
                <div
                    className="fixed inset-0 bg-gray-600 bg-opacity-75"
                    onClick={() => setSidebarOpen(false)}
                />
                <div className="fixed inset-y-0 right-0 w-64 bg-white shadow-xl">
                    <div className="flex items-center justify-between h-16 px-4 border-b">
                        <span className="text-xl font-bold text-gray-800">نوسینگەی ئاریان</span>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 rounded-lg hover:bg-gray-100"
                        >
                            <X className="w-6 h-6 text-gray-600" />
                        </button>
                    </div>
                    <nav className="px-2 mt-4 space-y-1 print:hidden">
                        {navigation.map((item) => (
                            item.isDropdown ? (
                                <div key={item.name} className="space-y-1">
                                    <button
                                        onClick={() => item.setDropdownState(!item.dropdownState)}
                                        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
                                    >
                                        <div className="flex items-center">
                                            <item.icon className="w-5 h-5 ml-3" />
                                            {item.name}
                                        </div>
                                        {item.dropdownState ? (
                                            <ChevronUp className="w-4 h-4" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4" />
                                        )}
                                    </button>
                                    {item.dropdownState && (
                                        <div className="pr-4 space-y-1">
                                            {item.children.map((child) => (
                                                <Link
                                                    key={child.name}
                                                    href={child.href}
                                                    className="flex items-center px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900"
                                                    onClick={() => setSidebarOpen(false)}
                                                >
                                                    <child.icon className="w-4 h-4 ml-3" />
                                                    {child.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900"
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon className="w-5 h-5 ml-3" />
                                    {item.name}
                                </Link>
                            )
                        ))}
                    </nav>
                </div>
            </div>

            {/* Desktop Sidebar */}
            <div className={`hidden lg:fixed lg:inset-y-0 lg:right-0 lg:flex lg:flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
                <div className="flex flex-col flex-grow pt-5 bg-white border-l border-gray-200">
                    <div className={`flex items-center flex-shrink-0 print:hidden px-4 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                            <Building className="w-6 h-6 text-white" />
                        </div>
                        {!sidebarCollapsed && (
                            <span className="mr-3 text-xl font-bold text-gray-800">نوسینگەی ئاریان</span>
                        )}
                    </div>

                    {/* Toggle Button */}
                    <div className={`px-2 mt-4 ${sidebarCollapsed ? 'flex justify-center' : 'flex justify-end'}`}>
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900"
                            title={sidebarCollapsed ? 'فراوان کردنەوە' : 'بچووک کردنەوە'}
                        >
                            {sidebarCollapsed ? (
                                <ChevronLeft className="w-5 h-5" />
                            ) : (
                                <ChevronRight className="w-5 h-5" />
                            )}
                        </button>
                    </div>

                    <div className="flex flex-col flex-1 mt-4 overflow-y-auto">
                        <nav className="flex-1 px-2 space-y-1">
                            {navigation.map((item) => (
                                item.isDropdown ? (
                                    <div key={item.name} className="space-y-1">
                                        <button
                                            onClick={() => item.setDropdownState(!item.dropdownState)}
                                            className={`flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                                            title={sidebarCollapsed ? item.name : ''}
                                        >
                                            <div className="flex items-center">
                                                <item.icon className={`w-5 h-5 ${!sidebarCollapsed && 'ml-3'}`} />
                                                {!sidebarCollapsed && item.name}
                                            </div>
                                            {!sidebarCollapsed && (
                                                item.dropdownState ? (
                                                    <ChevronUp className="w-4 h-4" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4" />
                                                )
                                            )}
                                        </button>
                                        {item.dropdownState && !sidebarCollapsed && (
                                            <div className="pr-4 space-y-1">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.name}
                                                        href={child.href}
                                                        className="flex items-center px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900"
                                                    >
                                                        <child.icon className="w-4 h-4 ml-3" />
                                                        {child.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 ${sidebarCollapsed ? 'justify-center' : ''}`}
                                        title={sidebarCollapsed ? item.name : ''}
                                    >
                                        <item.icon className={`w-5 h-5 ${!sidebarCollapsed && 'ml-3'}`} />
                                        {!sidebarCollapsed && item.name}
                                    </Link>
                                )
                            ))}
                        </nav>

                        <div className={`flex flex-shrink-0  print:hidden p-4 border-t border-gray-200 ${sidebarCollapsed ? 'flex-col items-center' : ''}`}>
                            {!sidebarCollapsed ? (
                                <>
                                    <div className="flex items-center flex-1">
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                                            <p className="text-xs text-gray-500">{user?.email}</p>
                                            <p className="text-xs text-gray-500">
                                                {user?.role === 'admin' ? 'ئەدمین' : 'بەکارهێنەر'}
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="p-2 mr-auto text-gray-400 rounded-lg hover:text-gray-500 hover:bg-gray-100"
                                    >
                                        <LogOut className="w-5 h-5" />
                                    </Link>
                                </>
                            ) : (
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="p-2 text-gray-400 rounded-lg hover:text-gray-500 hover:bg-gray-100"
                                    title="دەرچوون"
                                >
                                    <LogOut className="w-5 h-5" />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pr-20' : 'lg:pr-64'}`}>
                <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
                    <div className="flex items-center justify-between h-16 px-4 print:hidden">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 text-gray-500 rounded-lg lg:hidden hover:text-gray-700 hover:bg-gray-100"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="flex-1">
                            {title && <h1 className="text-xl font-semibold text-gray-800">{title}</h1>}
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="hidden text-sm text-gray-600 sm:inline">
                              {formatKurdishDate(new Date())}
                            </span>
                        </div>
                    </div>
                </div>

                <main className="p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
