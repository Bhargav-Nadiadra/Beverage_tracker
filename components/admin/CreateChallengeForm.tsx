'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createChallengeSchema, CreateChallengeInput } from '@/lib/validations';
import { Trophy, Send, X, Plus } from 'lucide-react';

interface CreateChallengeFormProps {
    onSuccess: (challenge: any) => void;
}

export function CreateChallengeForm({ onSuccess }: CreateChallengeFormProps) {
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateChallengeInput>({
        resolver: zodResolver(createChallengeSchema),
        defaultValues: {
            targetType: 'MOST_LOGS',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
    });

    const onSubmit = async (data: CreateChallengeInput) => {
        setLoading(true);
        try {
            const response = await fetch('/api/challenges', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const result = await response.json();
                onSuccess(result.challenge);
                reset();
                setIsOpen(false);
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to create challenge');
            }
        } catch (error) {
            console.error('Challenge creation error:', error);
            alert('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full inline-flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-gray-400 dark:text-gray-500 hover:border-green-500 hover:text-green-600 dark:hover:text-green-500 transition-all font-semibold text-sm group"
            >
                <Plus className="w-5 h-5 mr-2 group-hover:scale-125 transition-transform" />
                Create New Challenge
            </button>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 shadow-xl rounded-xl overflow-hidden border border-green-100 dark:border-green-900 animate-in fade-in zoom-in duration-300">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-green-50/30 dark:bg-green-950/20">
                <h3 className="text-sm font-black text-green-800 dark:text-green-500 uppercase tracking-widest flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    New Team Challenge
                </h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-tighter">Challenge Title</label>
                    <input
                        {...register('title')}
                        className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border ${errors.title ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-green-500 focus:border-green-500`}
                        placeholder="e.g. Weekly Tea Champ"
                    />
                    {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-tighter">Description</label>
                    <textarea
                        {...register('description')}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-green-500 focus:border-green-500"
                        rows={2}
                        placeholder="Explain the challenge..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-tighter">Start Date</label>
                        <input
                            type="date"
                            {...register('startDate')}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-tighter">End Date</label>
                        <input
                            type="date"
                            {...register('endDate')}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-tighter">Goal Type</label>
                        <select
                            {...register('targetType')}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-green-500 focus:border-green-500"
                        >
                            <option value="MOST_LOGS">Most Logs</option>
                            <option value="MOST_TEA">Most Tea</option>
                            <option value="MOST_COFFEE">Most Coffee</option>
                            <option value="LEAST_LOGS">Least Logs</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-tighter">Goal Count (Optional)</label>
                        <input
                            type="number"
                            {...register('targetValue', { valueAsNumber: true })}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-green-500 focus:border-green-500"
                            placeholder="e.g. 10"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg text-white font-bold bg-green-600 hover:bg-green-700 shadow-md ${loading ? 'opacity-50 cursor-not-allowed' : ''} transition-all active:scale-95`}
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Send className="w-4 h-4 mr-2" />
                            Start Challenge
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
