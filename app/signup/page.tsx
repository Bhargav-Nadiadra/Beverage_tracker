import SignUpForm from '@/components/auth/SignUpForm';
import { ThemeToggle } from '@/components/ThemeToggle';

export const metadata = {
    title: 'Sign Up | Beverage Tracker',
    description: 'Create an account to start tracking your tea and coffee consumption',
};

export default function SignUpPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 flex items-center justify-center p-4 relative">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <SignUpForm />
        </div>
    );
}
