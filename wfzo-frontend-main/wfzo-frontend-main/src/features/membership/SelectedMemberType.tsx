
"use client"
import { useCallback, useRef, useState } from 'react';
import JoinFormSection from './components/JoinFormSection';
import MemberShipDetailsSection from './components/VotingMemberDetails';

interface MemberType {
  benefits: any[]; // Replace 'any' with the actual type if known
  title: string;
}

interface SectionsProps {
  memberTypes?: MemberType[];
}

export default function SelectedMembershipType({ sections }: { sections: SectionsProps }) {
  const [selectedMembership, setSelectedMembership] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSelectMembership = useCallback((membershipType: string) => {
    setSelectedMembership(membershipType);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <>
      <MemberShipDetailsSection
        memberTypes={sections.memberTypes?.[0]?.benefits || []}
        title={sections.memberTypes?.[0]?.title}
        onSelectMembership={handleSelectMembership}
      />

      <JoinFormSection selectedMembership={selectedMembership} reference={formRef} />
    </>
  );
}
