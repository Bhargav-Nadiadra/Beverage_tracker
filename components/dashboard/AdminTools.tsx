'use client';

import InviteMemberForm from '@/components/organizations/InviteMemberForm';
import { CreateChallengeForm } from '@/components/admin/CreateChallengeForm';
import { useRouter } from 'next/navigation';

interface AdminToolsProps {
    organizationId: string;
}

export function AdminTools({ organizationId }: AdminToolsProps) {
    const router = useRouter();

    const handleSuccess = () => {
        router.refresh();
    };

    return (
        <div className="space-y-8">
            <InviteMemberForm organizationId={organizationId} />
            <CreateChallengeForm onSuccess={handleSuccess} />
        </div>
    );
}
