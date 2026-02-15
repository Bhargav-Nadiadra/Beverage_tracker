import CreateOrganizationForm from '@/components/organizations/CreateOrganizationForm';

export const metadata = {
    title: 'Create Organization | Beverage Tracker',
    description: 'Create a new organization for your team',
};

export default function CreateOrganizationPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
            <CreateOrganizationForm />
        </div>
    );
}
