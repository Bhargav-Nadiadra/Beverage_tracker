import LoginForm from '@/components/auth/LoginForm';

export const metadata = {
    title: 'Login | Beverage Tracker',
    description: 'Log in to your Beverage Tracker account',
};

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
            <LoginForm />
        </div>
    );
}
