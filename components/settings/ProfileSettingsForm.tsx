'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Bell, BellOff, Coffee, Apple, Check, Save } from 'lucide-react';

interface Profile {
    name: string;
    daily_goal: number | null;
    avatar_url: string | null;
    default_beverage: 'TEA' | 'COFFEE';
    notifications_enabled: boolean;
}

export default function ProfileSettingsForm({ profile }: { profile: Profile }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    
    const [formData, setFormData] = useState({
        name: profile.name,
        dailyGoal: profile.daily_goal !== null ? profile.daily_goal.toString() : '',
        defaultBeverage: profile.default_beverage,
        notificationsEnabled: profile.notifications_enabled,
        avatarUrl: profile.avatar_url || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            const parsedGoal = formData.dailyGoal.trim() === '' ? null : parseInt(formData.dailyGoal, 10);
            
            const res = await fetch('/api/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: formData.name,
                    dailyGoal: parsedGoal,
                    defaultBeverage: formData.defaultBeverage,
                    notificationsEnabled: formData.notificationsEnabled,
                    avatarUrl: formData.avatarUrl
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to update profile');
            }

            setMessage({ text: 'Profile updated successfully!', type: 'success' });
            router.refresh();
        } catch (error: any) {
            setMessage({ text: error.message || 'An error occurred', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const avatarPresets = [
        'bg-green-500', 'bg-blue-500', 'bg-purple-500', 
        'bg-yellow-500', 'bg-red-500', 'bg-emerald-500'
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-10">
            {/* Profile Info Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">
                    <User className="w-4 h-4" />
                    Identity
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-green-500 transition-all outline-none"
                            placeholder="Your Name"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        Profile Color (Avatar)
                    </label>
                    <div className="flex flex-wrap gap-4">
                        {avatarPresets.map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setFormData({...formData, avatarUrl: color})}
                                className={`w-12 h-12 rounded-2xl transition-all relative flex items-center justify-center ${color} ${formData.avatarUrl === color ? 'ring-4 ring-green-100 dark:ring-green-900/50 scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                            >
                                {formData.avatarUrl === color && <Check className="w-6 h-6 text-white" />}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <hr className="border-gray-100 dark:border-gray-800" />

            {/* Tracking Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">
                    <Coffee className="w-4 h-4" />
                    Consumption Tracking
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                            Daily Limit (Target)
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={formData.dailyGoal}
                            onChange={(e) => setFormData({...formData, dailyGoal: e.target.value})}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-green-500 transition-all outline-none"
                            placeholder="e.g. 5"
                        />
                        <p className="text-[10px] uppercase font-bold text-gray-400">Target for today's consumption. Leave blank for no limit.</p>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                            Default Beverage
                        </label>
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, defaultBeverage: 'COFFEE'})}
                                className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${formData.defaultBeverage === 'COFFEE' ? 'bg-white dark:bg-gray-700 shadow-sm text-green-600 dark:text-green-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                Coffee
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, defaultBeverage: 'TEA'})}
                                className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${formData.defaultBeverage === 'TEA' ? 'bg-white dark:bg-gray-700 shadow-sm text-green-600 dark:text-green-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                Tea
                            </button>
                        </div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Chosen as primary option in quick log section.</p>
                    </div>
                </div>
            </section>

            <hr className="border-gray-100 dark:border-gray-800" />

            {/* Notifications Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">
                    <Bell className="w-4 h-4" />
                    App Preferences
                </div>

                <div className="flex items-center justify-between p-6 bg-gray-50/50 dark:bg-gray-800/30 rounded-3xl border border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Daily Goal Alerts</span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">Visual warnings in the dashboard when limit is reached.</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFormData({...formData, notificationsEnabled: !formData.notificationsEnabled})}
                        className={`p-2 rounded-2xl transition-all ${formData.notificationsEnabled ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}
                    >
                        {formData.notificationsEnabled ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
                    </button>
                </div>
            </section>

            {/* Submit Section */}
            {message && (
                <div className={`p-4 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-500 border border-green-100 dark:border-green-800/50' : 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-500 border border-red-100 dark:border-red-800/50'}`}>
                    <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                    {message.text}
                </div>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-black dark:bg-white text-white dark:text-black rounded-3xl font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl"
            >
                {isSubmitting ? (
                    <div className="w-5 h-5 border-4 border-gray-400 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        <Save className="w-5 h-5" />
                        Apply Changes
                    </>
                )}
            </button>
        </form>
    );
}
