'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createConversation } from '@/services/createConversation';

const NewProjectConversation = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  useEffect(() => {
    createConversation(projectId)
      .then((id) => router.replace(`/${id}`))
      .catch(() => router.replace(`/projects/${projectId}`));
  }, [projectId, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-[#4e677e] text-sm">Starting conversation...</p>
    </div>
  );
};

export default NewProjectConversation;
