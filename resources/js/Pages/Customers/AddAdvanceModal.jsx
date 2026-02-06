// فایلی: resources/js/Pages/Customers/AddAdvanceModal.jsx
import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
export default function AddAdvanceModal({ customer, show, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        amount_iqd: '',
        amount_usd: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (show) {
            setFormData({ amount_iqd: '', amount_usd: '' });
            setErrors({});
        }
    }, [show]);

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
            const response = await fetch(`/customers/${customer.id}/add-advance`, {
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
                            زیادکردنی سەرمایە بۆ {customer.name}
                        </Dialog.Title>
                        <button onClick={onClose}>
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="p-3 mb-4 bg-gray-100 rounded">
                            <div className="text-sm text-gray-600">سەرمایەی ئێستا:</div>
                            <div className="flex justify-between mt-1">
                                <span>دینار: {customer.negative_balance_iqd || 0}</span>
                                <span>دۆلار: {customer.negative_balance_usd || 0}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block mb-1 text-sm">بڕی دینار</label>
                                <input
                                    type="number"
                                    name="amount_iqd"
                                    value={formData.amount_iqd}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm">بڕی دۆلار</label>
                                <input
                                    type="number"
                                    name="amount_usd"
                                    value={formData.amount_usd}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                        </div>

                        {(formData.amount_iqd || formData.amount_usd) && (
                            <div className="p-3 mt-4 rounded bg-blue-50">
                                <div className="text-sm text-blue-800">کاونتی نوێ:</div>
                                <div className="flex justify-between mt-1">
                                    <span>دینار: {(
                                        parseFloat(customer.negative_balance_iqd || 0) +
                                        parseFloat(formData.amount_iqd || 0)
                                    ).toFixed(2)}</span>
                                    <span>دۆلار: {(
                                        parseFloat(customer.negative_balance_usd || 0) +
                                        parseFloat(formData.amount_usd || 0)
                                    ).toFixed(2)}</span>
                                </div>
                            </div>
                        )}

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
                                disabled={loading || (!formData.amount_iqd && !formData.amount_usd)}
                                className="px-4 py-2 text-white bg-blue-600 rounded disabled:opacity-50"
                            >
                                {loading ? 'زیادکردن...' : 'زیادکردن'}
                            </button>
                        </div>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
