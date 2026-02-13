import HeroAuth from '@/features/events/dashboard/component/HeroAuth';
import { Phase3FormSection } from '@/features/membership/components/Phase3FormSection';
import { Breadcrumb, BreadcrumbItem } from '@/shared/components/Breadcrumb';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';


interface PageProps {
  params: Promise<{
    locale: string;
    applicationId: string;
  }>;
}

export default async function MembershipPhase3Page({ params }: PageProps) {
  const { applicationId } = await params;
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Manage Profile", href: "/profile"},
    { label: 'Complete Profile Information', isCurrent: true }
  ];

  return (
    <div className="bg-wfzo-gold-25 min-h-screen">
      <HeroAuth backgroundImage="https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=2880"/>
       <div className="px-5 md:px-30 py-10">
        <Link 
          href="/profile"
          className="flex items-center gap-1 mb-6 text-wfzo-grey-900 hover:text-wfzo-gold-600 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-wfzo-gold-600" />
          <span className="font-source text-base font-semibold">Back</span>
        </Link>

        {/* BREADCRUMB */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>
        <Phase3FormSection applicationId={applicationId} />
       </div>
      
    </div>
  );
}




  // return (
  //   <div className="bg-wfzo-gold-25 min-h-screen">
  //     <HeroAuth backgroundImage="https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=2880"/>

  //     {/* MAIN CONTENT CONTAINER */}
  //     <div className="px-5 md:px-30 py-10">
  //       {/* BACK BUTTON */}
  //       <Link 
  //         href="/events/all-events"
  //         className="flex items-center gap-1 mb-6 text-wfzo-grey-900 hover:text-wfzo-gold-600 transition-colors"
  //       >
  //         <ArrowLeft className="w-6 h-6 text-wfzo-gold-600" />
  //         <span className="font-source text-base font-semibold">Back</span>
  //       </Link>

  //       {/* BREADCRUMB */}
  //       <div className="mb-6">
  //         <Breadcrumb items={breadcrumbItems} />
  //       </div>