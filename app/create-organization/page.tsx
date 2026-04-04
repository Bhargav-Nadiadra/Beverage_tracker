import CreateOrganizationForm from '@/components/organizations/CreateOrganizationForm';
import { ThemeToggle } from '@/components/ThemeToggle';

export const metadata = {
    title: 'Create Organization | Beverage Tracker',
    description: 'Create a new organization for your team',
};

export default function CreateOrganizationPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 flex items-center justify-center p-4 relative">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <CreateOrganizationForm />
        </div>
    );
}
