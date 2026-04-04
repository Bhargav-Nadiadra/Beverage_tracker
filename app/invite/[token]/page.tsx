import { db } from '@/lib/db';
import { isTokenExpired } from '@/lib/tokens';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';

interface InvitePageProps {
    params: {
        token: string;
    };
}

export default async function InvitePage({ params }: InvitePageProps) {
    const { token } = params;
    const session = await auth();

    // 1. Fetch invitation details
    const inviteResult = await db.query(
        `SELECT i.*, o.name as org_name, u.name as inviter_name
     FROM invitations i
     JOIN organizations o ON i.organization_id = o.id
     JOIN users u ON i.invited_by = u.id
     WHERE i.token = $1 AND i.accepted_at IS NULL`,
        [token]
    );

    if (inviteResult.rows.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 relative">
                <div className="absolute top-4 right-4">
                    <ThemeToggle />
                </div>
                <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-transparent dark:border-gray-800 text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-500 mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invalid or Expired Invite</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">This invitation link is no longer valid. Please ask your admin for a new one.</p>
                    <Link href="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition duration-200">
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    const invitation = inviteResult.rows[0];

    // 2. Check expiry
    if (isTokenExpired(invitation.expires_at)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 relative">
                <div className="absolute top-4 right-4">
                    <ThemeToggle />
                </div>
                <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-transparent dark:border-gray-800 text-center">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-500 mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invite Expired</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">Invitations expire after 7 days for security. Please request a new invitation.</p>
                    <Link href="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition duration-200">
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    // 3. Handle logged in state
    if (session?.user) {
        if (session.user.email === invitation.email) {
            // Direct them to accept the invite via an API action or just redirect to a confirm page
            // For now, let's show an "Accept" button that hits an API
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 relative">
                    <div className="absolute top-4 right-4">
                        <ThemeToggle />
                    </div>
                    <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-transparent dark:border-gray-800 text-center">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-500 mx-auto mb-6">
                            <span className="text-2xl font-bold">🤝</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Accept Invitation</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">
                            You've been invited by <strong>{invitation.inviter_name}</strong> to join <strong>{invitation.org_name}</strong>.
                        </p>
                        <form action={async () => {
                            'use server';
                            // Need to implement the acceptance logic here or in a separate API
                            // Redirecting to an API route might be easier for complex state
                            redirect(`/api/organizations/invite/accept?token=${token}`);
                        }}>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition duration-200 shadow-sm hover:shadow-md">
                                Accept and Join Team
                            </button>
                        </form>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 relative">
                    <div className="absolute top-4 right-4">
                        <ThemeToggle />
                    </div>
                    <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-transparent dark:border-gray-800 text-center">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Mismatched Account</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">
                            This invitation was sent to <strong>{invitation.email}</strong>, but you are logged in as <strong>{session.user.email}</strong>.
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mb-8 italic">
                            Please log out and accept the invitation with the correct email.
                        </p>
                        <Link href="/api/auth/signout" className="inline-block bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3 px-8 rounded-xl transition duration-200">
                            Log Out
                        </Link>
                    </div>
                </div>
            );
        }
    }

    // 4. Not logged in - Redirect to signup with invite token
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 relative">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-transparent dark:border-gray-800 text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-500 mx-auto mb-6">
                    <span className="text-2xl">👋</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Join Your Team</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    <strong>{invitation.inviter_name}</strong> invited you to join <strong>{invitation.org_name}</strong> on Beverage Tracker.
                </p>

                <div className="space-y-4">
                    <Link
                        href={`/register?email=${encodeURIComponent(invitation.email)}&invite=${token}`}
                        className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition duration-200"
                    >
                        Create Account to Join
                    </Link>
                    <Link
                        href={`/login?email=${encodeURIComponent(invitation.email)}&invite=${token}`}
                        className="block w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200 font-semibold py-3 px-8 rounded-xl transition duration-200"
                    >
                        Log In to Join
                    </Link>
                </div>
            </div>
        </div>
    );
}
