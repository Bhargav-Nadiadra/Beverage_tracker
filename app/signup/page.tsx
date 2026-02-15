import SignUpForm from '@/components/auth/SignUpForm';

export const metadata = {
    title: 'Sign Up | Beverage Tracker',
    description: 'Create an account to start tracking your tea and coffee consumption',
};

export default function SignUpPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
            <SignUpForm />
        </div>
    );
}
