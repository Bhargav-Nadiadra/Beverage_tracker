'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DailyGoalForm({ currentGoal }: { currentGoal: number | null }) {
    const router = useRouter();
    const [goal, setGoal] = useState<string>(currentGoal ? currentGoal.toString() : '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            const parsed = goal.trim() === '' ? null : parseInt(goal, 10);
            
            if (parsed !== null && (isNaN(parsed) || parsed < 1)) {
                throw new Error('Please enter a valid positive number');
            }

            const res = await fetch('/api/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dailyGoal: parsed }),
            });

            if (!res.ok) {
                throw new Error('Failed to update goal');
            }

            setMessage({ text: 'Goal updated successfully!', type: 'success' });
            router.refresh();
        } catch (error: any) {
            setMessage({ text: error.message || 'An error occurred', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-md">
            <div className="mb-4">
                <label htmlFor="dailyGoal" className="block text-sm font-medium text-gray-700 mb-1">
                    Target Daily Beverages
                </label>
                <div className="flex gap-4 items-start">
                    <div className="flex-grow">
                        <input
                            type="number"
                            id="dailyGoal"
                            name="dailyGoal"
                            min="1"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder="e.g. 5 (Leave blank to disable)"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            We'll help you track your progress without exceeding your limit.
                        </p>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`p-3 rounded mb-4 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
                {isSubmitting ? 'Saving...' : 'Save Preferences'}
            </button>
        </form>
    );
}
