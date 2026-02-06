import React from 'react';
import { Link } from '@inertiajs/react';

export default function PageHeader({ title, subtitle, action }) {
    return (
        <div className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
                </div>
                {action && (
                    <div className="flex items-center gap-3">
                        <Link
                            href={action.href}
                            className="flex items-center gap-2 btn btn-primary"
                        >
                            {action.icon && <action.icon className="w-4 h-4" />}
                            {action.label}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
