// فایلی: resources/js/Pages/Customers/EditBalanceModal.jsx
import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
// تاقی بکەرەوە بەمە:
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function EditBalanceModal({ customer, show, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        negative_balance_iqd: '',
        negative_balance_usd: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (show && customer) {
            setFormData({
                negative_balance_iqd: customer.negative_balance_iqd || '',
                negative_balance_usd: customer.negative_balance_usd || ''
            });
            setErrors({});
        }
    }, [show, customer]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const response = await fetch(`/customers/${customer.id}/edit-balance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                onSuccess(data);
                onClose();
            } else {
                setErrors({ submit: data.message });
            }
        } catch (error) {
            setErrors({ submit: 'هەڵەیەک ڕوویدا' });
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <Dialog open={show} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-md p-6 bg-white rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                        <Dialog.Title className="text-lg font-semibold">
                            دەستکاری سەرمایەی {customer.name}
                        </Dialog.Title>
                        <button onClick={onClose}>
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-3">
                            <div>
                                <label className="block mb-1 text-sm">سەرمایەی دینار</label>
                                <input
                                    type="number"
                                    name="negative_balance_iqd"
                                    value={formData.negative_balance_iqd}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm">سەرمایەی دۆلار</label>
                                <input
                                    type="number"
                                    name="negative_balance_usd"
                                    value={formData.negative_balance_usd}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                        </div>

                        {errors.submit && (
                            <div className="mt-3 text-sm text-red-600">{errors.submit}</div>
                        )}

                        <div className="flex justify-end mt-6 space-x-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border rounded"
                                disabled={loading}
                            >
                                پاشگەزبوونەوە
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 text-white bg-blue-600 rounded disabled:opacity-50"
                            >
                                {loading ? 'دەستکاری...' : 'دەستکاری'}
                            </button>
                        </div>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
