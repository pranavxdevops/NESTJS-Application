import Hero from '@/features/about/components/Hero';
import { Phase2FormSection } from '@/features/membership/components/Phase2FormSection';

interface PageProps {
  params: Promise<{
    locale: string;
    applicationId: string;
  }>;
}

export default async function MembershipPhase2Page({ params }: PageProps) {
  const { applicationId } = await params;

  return (
    <>
      <Hero/>
      <Phase2FormSection applicationId={applicationId} />;
    </>
  )
}
