import LoginForm from '@/components/auth/LoginForm';
import { ThemeToggle } from '@/components/ThemeToggle';

export const metadata = {
    title: 'Login | Beverage Tracker',
    description: 'Log in to your Beverage Tracker account',
};

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 flex items-center justify-center p-4 relative">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <LoginForm />
        </div>
    );
}
