'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const inviteSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface InviteMemberFormProps {
    organizationId: string;
}

export default function InviteMemberForm({ organizationId }: InviteMemberFormProps) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<InviteFormValues>({
        resolver: zodResolver(inviteSchema),
    });

    const onSubmit = async (data: InviteFormValues) => {
        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch('/api/organizations/invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: data.email,
                    organizationId,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Invitation sent successfully!' });
                reset();
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to send invitation' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Invite Team Members</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Grow your team and track consumption together.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email Address
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-grow">
                            <input
                                id="email"
                                type="email"
                                {...register('email')}
                                placeholder="colleague@example.com"
                                className={`block w-full px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg border ${errors.email ? 'border-red-500 dark:border-red-600 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500'
                                    } focus:outline-none focus:ring-2 transition duration-200`}
                                disabled={loading}
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.email.message}</p>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition duration-200 disabled:opacity-50 flex-shrink-0"
                        >
                            {loading ? 'Sending...' : 'Invite'}
                        </button>
                    </div>
                </div>

                {message && (
                    <div
                        className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800'
                            }`}
                    >
                        {message.text}
                    </div>
                )}
            </form>
        </div>
    );
}
