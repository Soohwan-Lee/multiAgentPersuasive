'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PostOpenSurveyPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the appropriate survey based on session progress
    // This is a fallback for old links
    router.push('/survey/post-open-1');
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center">
        <p>Redirecting to survey...</p>
      </div>
    </div>
  );
}
