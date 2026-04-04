'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Bell, BellOff, Coffee, Check, Save, Shield, Trash2, Eye, EyeOff, Globe, Lock } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface Profile {
    name: string;
    daily_goal: number | null;
    avatar_url: string | null;
    default_beverage: 'TEA' | 'COFFEE';
    notifications_enabled: boolean;
    privacy_visible: boolean;
    timezone: string;
}

export default function ProfileSettingsForm({ profile }: { profile: Profile }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    // Password state
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
    const [passwordError, setPasswordError] = useState<string | null>(null);
    
    const [formData, setFormData] = useState({
        name: profile.name,
        dailyGoal: profile.daily_goal !== null ? profile.daily_goal.toString() : '',
        defaultBeverage: profile.default_beverage,
        notificationsEnabled: profile.notifications_enabled,
        avatarUrl: profile.avatar_url || '',
        privacyVisible: profile.privacy_visible,
        timezone: profile.timezone
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
                    avatarUrl: formData.avatarUrl,
                    privacyVisible: formData.privacyVisible,
                    timezone: formData.timezone
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

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(passwordData),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to change password');

            setShowPasswordModal(false);
            setPasswordData({ currentPassword: '', newPassword: '' });
            setMessage({ text: 'Password updated successfully!', type: 'success' });
        } catch (error: any) {
            setPasswordError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/users/me/delete', { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete account');
            
            // Log out and redirect
            await signOut({ callbackUrl: '/login' });
        } catch (error: any) {
            alert(error.message);
            setIsSubmitting(false);
        }
    };

    const avatarPresets = [
        'bg-green-500', 'bg-blue-500', 'bg-purple-500', 
        'bg-yellow-500', 'bg-red-500', 'bg-emerald-500'
    ];

    const timezones = [
        'UTC', 'GMT', 'Europe/London', 'Europe/Paris', 
        'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo', 
        'Asia/Kolkata', 'Australia/Sydney'
    ];

    return (
        <div className="space-y-12">
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

                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                Timezone
                            </label>
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <select
                                    value={formData.timezone}
                                    onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-green-500 transition-all outline-none appearance-none font-medium"
                                >
                                    {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                                </select>
                            </div>
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

                {/* Tracking & Privacy Section */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">
                        <Coffee className="w-4 h-4" />
                        Usage & Visibility
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
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-gray-50/50 dark:bg-gray-800/30 rounded-3xl border border-gray-100 dark:border-gray-800">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Public Profile Visibility</span>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">If disabled, you won't appear on the team leaderboard.</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData({...formData, privacyVisible: !formData.privacyVisible})}
                            className={`p-2 rounded-2xl transition-all ${formData.privacyVisible ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}
                        >
                            {formData.privacyVisible ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
                        </button>
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
                    {isSubmitting ? <div className="w-5 h-5 border-4 border-gray-400 border-t-white rounded-full animate-spin" /> : <><Save className="w-5 h-5" />Apply Changes</>}
                </button>
            </form>

            <hr className="border-gray-100 dark:border-gray-800" />

            {/* Security & Support Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">
                    <Shield className="w-4 h-4" />
                    Security & Account
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => setShowPasswordModal(true)}
                        className="flex items-center justify-between p-6 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 hover:border-green-500 dark:hover:border-green-500 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl group-hover:bg-green-50 dark:group-hover:bg-green-900/20 transition-colors">
                                <Lock className="w-5 h-5 text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-500" />
                            </div>
                            <div className="text-left">
                                <span className="block text-sm font-bold text-gray-900 dark:text-gray-100">Update Password</span>
                                <span className="text-[10px] text-gray-500 uppercase font-bold">Secure your account</span>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center justify-between p-6 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 hover:border-red-500 dark:hover:border-red-500 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors">
                                <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-500" />
                            </div>
                            <div className="text-left">
                                <span className="block text-sm font-bold text-gray-900 dark:text-gray-100">Delete Account</span>
                                <span className="text-[10px] text-gray-500 uppercase font-bold text-red-400">Danger Zone</span>
                            </div>
                        </div>
                    </button>
                </div>
            </section>

            {/* Modals */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-6">Update Password</h3>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-400">Current Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 outline-none"
                                    value={passwordData.currentPassword}
                                    onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-400">New Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 outline-none"
                                    value={passwordData.newPassword}
                                    onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                                />
                            </div>
                            {passwordError && <p className="text-xs font-bold text-red-500">{passwordError}</p>}
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 py-4 font-black uppercase text-xs text-gray-500">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase text-xs shadow-lg">
                                    {isSubmitting ? '...' : 'Update'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                            <Trash2 className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-2">Delete Account?</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                            This action is permanent. All your logs, stats, and organization data will be cleared and cannot be recovered.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button onClick={handleDeleteAccount} disabled={isSubmitting} className="w-full py-5 bg-red-500 text-white rounded-3xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all">
                                {isSubmitting ? 'Deleting...' : 'Permanently Delete'}
                            </button>
                            <button onClick={() => setShowDeleteModal(false)} className="w-full py-4 text-gray-500 font-bold uppercase text-xs">I've changed my mind</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
