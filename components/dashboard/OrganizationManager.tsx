'use client';

import { useState } from 'react';
import { UserPlus, Shield, ShieldAlert, ArrowUpCircle, ArrowDownCircle, Trash2, Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Member {
    user_id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'MEMBER';
    tea_total: number;
    coffee_total: number;
    total_count: number;
    last_active: string | null;
}

export function OrganizationManager({ 
    members, 
    orgId, 
    currentUserId 
}: { 
    members: Member[], 
    orgId: string, 
    currentUserId: string 
}) {
    const router = useRouter();
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [bulkEmails, setBulkEmails] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [inviteMessage, setInviteMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const handleRoleUpdate = async (userId: string, newRole: string) => {
        setIsUpdating(userId);
        try {
            const res = await fetch(`/api/organizations/${orgId}/members/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });
            if (!res.ok) throw new Error('Failed to update role');
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Failed to update role');
        } finally {
            setIsUpdating(null);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        
        setIsUpdating(userId);
        try {
            const res = await fetch(`/api/organizations/${orgId}/members/${userId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to remove member');
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Failed to remove member');
        } finally {
            setIsUpdating(null);
        }
    };

    const handleBulkInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        const emails = bulkEmails.split(/[\n,]/).map(e => e.trim()).filter(e => e.length > 0 && e.includes('@'));
        
        if (emails.length === 0) return;

        setIsInviting(true);
        setInviteMessage(null);

        try {
            const res = await fetch(`/api/organizations/${orgId}/invites/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emails }),
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send invitations');

            setInviteMessage({ text: `Successfully sent ${data.count} invitations!`, type: 'success' });
            setBulkEmails('');
            router.refresh();
        } catch (error: any) {
            setInviteMessage({ text: error.message, type: 'error' });
        } finally {
            setIsInviting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Bulk Invite Section */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                    <UserPlus className="w-32 h-32" />
                </div>
                
                <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-3 mb-2">
                    Invite New Members
                </h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Grow your organization</p>
                
                <form onSubmit={handleBulkInvite} className="space-y-4">
                    <textarea 
                        value={bulkEmails}
                        onChange={(e) => setBulkEmails(e.target.value)}
                        placeholder="Enter email addresses (separated by commas or new lines)..."
                        className="w-full h-24 px-6 py-4 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-green-500 rounded-3xl outline-none transition-all resize-none text-sm font-medium"
                    />
                    <div className="flex items-center justify-between gap-4">
                        {inviteMessage && (
                            <div className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${inviteMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                                {inviteMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                {inviteMessage.text}
                            </div>
                        )}
                        <button 
                            type="submit"
                            disabled={isInviting || !bulkEmails.trim()}
                            className="ml-auto px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                            Send Invitations
                        </button>
                    </div>
                </form>
            </div>

            {/* Members List Section */}
            <div className="bg-white dark:bg-gray-900 shadow-2xl shadow-gray-200/50 dark:shadow-none rounded-[32px] overflow-hidden border border-gray-100 dark:border-gray-800">
                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/20">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">Member Directory</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Manage roles and permissions</p>
                    </div>
                    <div className="px-4 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {members.length} Active Members
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                        <thead className="bg-white dark:bg-gray-900">
                            <tr>
                                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">User</th>
                                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Usage</th>
                                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Role</th>
                                <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                            {members.map((member) => (
                                <tr key={member.user_id} className={`group hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all ${isUpdating === member.user_id ? 'opacity-50' : ''}`}>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white ${member.role === 'ADMIN' ? 'bg-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-gray-400 shadow-lg shadow-gray-400/20'}`}>
                                                {member.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                                    {member.name}
                                                    {member.user_id === currentUserId && <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-[10px] rounded-md font-bold text-gray-500">YOU</span>}
                                                </div>
                                                <div className="text-[11px] font-medium text-gray-400">{member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <div className="text-xs font-black text-green-600 dark:text-green-500">{member.tea_total}</div>
                                                <div className="text-[8px] font-black text-gray-400 uppercase">Tea</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xs font-black text-amber-700 dark:text-amber-500">{member.coffee_total}</div>
                                                <div className="text-[8px] font-black text-gray-400 uppercase">Coffee</div>
                                            </div>
                                            <div className="h-6 w-[1px] bg-gray-100 dark:bg-gray-800 mx-2"></div>
                                            <div className="text-left">
                                                <div className="text-[10px] font-bold text-gray-500">Last seen</div>
                                                <div className="text-[10px] font-black text-gray-900 dark:text-gray-100 uppercase">
                                                    {member.last_active ? new Date(member.last_active).toLocaleDateString() : 'Inactive'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${member.role === 'ADMIN' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                            {member.role === 'ADMIN' ? <Shield className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                                            {member.role}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {member.user_id !== currentUserId && (
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleRoleUpdate(member.user_id, member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN')}
                                                    title={member.role === 'ADMIN' ? 'Demote to Member' : 'Promote to Admin'}
                                                    className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all hover:scale-110 active:scale-95"
                                                >
                                                    {member.role === 'ADMIN' ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
                                                </button>
                                                <button 
                                                    onClick={() => handleRemoveMember(member.user_id)}
                                                    title="Remove Member"
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all hover:scale-110 active:scale-95"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                        {member.user_id === currentUserId && (
                                            <div className="text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest">Fixed Role</div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
