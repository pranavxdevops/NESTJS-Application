'use client';

import GridSection from '@/features/about/components/GridSection';
import TeamMemberCard from '@/features/membership/components/TeamMemberCard';


export interface TeamMember {
  name: string;
  designation: string;
  email?: string;
  phone?: string;
  imageUrl: { url: string };
}

interface Props {
  members: TeamMember[];
  isMember: boolean;
}

export default function TeamMembersTab({ members,isMember }: Props) {
  if (!members || members.length === 0) {
    return (
      <div className="text-center py-20 text-neutral-600">
         No team members available.
      </div>
    );
  }
  const TeamMemberCardWithAccess = (props: TeamMember) => (
    <TeamMemberCard {...props} isMember={isMember} />
  );
  return (
    <GridSection
      heading="Team Members"
      members={members}
      CardComponent={TeamMemberCardWithAccess}
      items={3}
      showHeading={false}
      className='!px-0'
      
    />
  );
}

