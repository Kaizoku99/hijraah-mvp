'use client';

import GuideEditor from '@/components/admin/GuideEditor';
import { useParams } from 'next/navigation';

export default function EditGuidePage() {
    const params = useParams();
    const id = parseInt(params.id as string);

    if (isNaN(id)) {
        return <div>Invalid ID</div>;
    }

    return <GuideEditor guideId={id} />;
}
