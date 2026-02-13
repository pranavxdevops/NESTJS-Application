'use client';

import { useAuth } from '@/lib/auth/useAuth';
import { useRouter, useParams } from 'next/navigation';
import ProfileHeader from '../../../../features/profile/components/ProfileHeader';
import TeamMemberProfileHeader from '../../../../features/profile/components/TeamMemberProfileHeader';
import YourProfileSection from '../../../../features/profile/components/YourProfileSection';
import ManageTeamSection from '../../../../features/profile/components/ManageTeamSection';
import YourEventsSection from '../../../../features/profile/components/YourEventsSection';
import YourPublicationsSection from '../../../../features/profile/components/YourPublicationsSection';
import FeaturedMemberCard from '../../../../features/profile/components/FeaturedMemberCard';
import UpcomingEventsCard from '../../../../features/profile/components/UpcomingEventsCard';
import SuggestedEventsCard from '../../../../features/profile/components/SuggestedEventsCard';
import SuggestedMembersCard from '../../../../features/profile/components/SuggestedMembersCard';
import ProfileImageUploadModal from '../../../../features/profile/components/ProfileImageUploadModal';
import { useEffect, useState } from 'react';
import { refreshMemberData } from '../../../../features/profile/services/profileService';
import SuggestedMembersSection from '@/features/network/components/SuggestedMembersSection';
import { networkService } from '@/features/network/services/networkService';
import type { SuggestedMember } from '@/features/network/types';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import { strapi } from '@/lib/strapi';
import { YourEvent } from '@/features/events/dashboard/component/YourEventsTabs';
import DraftSavedBanner from '@/features/events/dashboard/component/DraftSavedBanner';

function formatEventDate(start?: string | null, end?: string | null) {
  if (!start) return '';
  try {
    const s = new Date(start);
    if (end) {
      const e = new Date(end);
      if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
        const dayStart = s.getDate();
        const dayEnd = e.getDate();
        const month = s.toLocaleString(undefined, { month: 'short' });
        return `${dayStart}-${dayEnd} ${month}, ${s.getFullYear()}`;
      }
      return s.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return s.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function ManageProfilePage() {
  const { user, member, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localMember, setLocalMember] = useState(member);
  const [refreshKey, setRefreshKey] = useState(0);
  const [suggestedMembers, setSuggestedMembers] = useState<SuggestedMember[]>([]);
  const [organisationName, setOrganisationName] = useState<string>('');
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [filteredEvent, setFilteredEvent] = useState<any>(null);
  const [registeredEvent, setRegisteredEvent] = useState<any>(null);
  const[yourEvents,setYourEvents]=useState<any[]>([]);
  const [showDraftSavedBanner, setShowDraftSavedBanner] = useState(false);
     const userSnapshot = localMember?.userSnapshots?.find(
      (snapshot: { email: string | null; }) => snapshot?.email === user?.email
    );
  const isPrimary = userSnapshot?.userType === 'Primary';
  const isFeatured = member?.featuredMember || false;
  // Update local member when auth member changes
  useEffect(() => {
    setLocalMember(member); 
  }, [member]);

  useEffect(() => {
    const RegisteredEvent = upcomingEvents.filter(event => event.organizer === member?.organisationInfo?.companyName);
     
      if (RegisteredEvent.length > 0) {
        setRegisteredEvent(RegisteredEvent[0]);
      } else {
        setRegisteredEvent(null);
      }
  }, [upcomingEvents, member]);

  useEffect(() => {
    if(isPrimary){
    fetchSuggestedMembers();
    }
  }, [isPrimary]);

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  useEffect(() => {
    if (organisationName && upcomingEvents.length > 0) {
      console.log(upcomingEvents,'Organisation Name:', organisationName,member?.organisationInfo?.companyName);
      const filtered = upcomingEvents.filter(event => event.organizer === organisationName);
      if (filtered.length > 0) {
        setFilteredEvent(filtered[0]);
      } else {
        setFilteredEvent(null);
      }
       console.log('RegisteredEvent:', member?.organisationInfo?.companyName);
     
    }
  }, [organisationName, upcomingEvents, member]);

  useEffect(() => {

  if (!isLoading && localMember && user?.email) {
    // 🔹 Find the snapshot matching the logged-in user's email
    const userSnapshot = localMember?.userSnapshots?.find(
      (snapshot: { email: string | null; }) => snapshot?.email === user.email
    );
    if (!userSnapshot) return;

    const isPrimary = userSnapshot.userType === 'Primary';

    const hasProfileImage =
      userSnapshot.profileImageUrl &&
      userSnapshot.profileImageUrl !== '' &&
      userSnapshot.profileImageUrl !== null &&
      userSnapshot.profileImageUrl !== undefined;

    // Auto-open modal for Non-Primary users without a profile image
    if (!isPrimary && !hasProfileImage) {
      setIsModalOpen(true);
    }
  }
}, [isLoading, localMember, user]);


  const handleConnectionSent = () => {
    // Could show a toast notification here
    console.log('Connection request sent successfully');
    // Refresh suggested members
    fetchSuggestedMembers();
  };

  const fetchSuggestedMembers = async () => {
    try {
      const response = await networkService.getSuggestedMembers(1, 5);
      console.log('Suggested members response:', response);
      if (response.success) {
        setSuggestedMembers(response.data);
        // Extract organisation name from first member
        if (response.data.length > 0) {
          const firstMember = response.data[0].member;
          console.log('First suggested member:', firstMember);
          const orgName = firstMember.organisationInfo?.companyName || '';
          setOrganisationName(orgName);
        }
      }
    } catch (error) {
      console.error('Failed to fetch suggested members:', error);
    }
  };

  const fetchUpcomingEvents = async () => {
    try {
      const nowIso = new Date().toISOString();
      const eventsUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/events?filters[$or][0][startDateTime][$gte]=${encodeURIComponent(nowIso)}&filters[$or][1][endDateTime][$gte]=${encodeURIComponent(nowIso)}&sort[0]=startDateTime:asc&populate[cta][populate]=*&populate[image][populate][image][fields][0]=url&populate[image][populate][image][fields][1]=formats`;

      const eventsRes = await fetch(eventsUrl);
      if (!eventsRes.ok) {
        throw new Error(`HTTP error! status: ${eventsRes.status}`);
      }
      const eventsJson = await eventsRes.json();
      const rawEvents: unknown[] = Array.isArray(eventsJson?.data) ? eventsJson.data : [];
        
      const normalizedUpcoming = rawEvents.map((ev: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const evAny = ev as any;
        const imageData = evAny?.image || evAny?.attributes?.image;
        const imageUrl = imageData?.image?.url
          ? getStrapiMediaUrl(imageData.image.url)
          : imageData?.url
            ? getStrapiMediaUrl(imageData.url)
            : FALLBACK_IMAGE;

        const start = evAny?.startDateTime || evAny?.attributes?.startDateTime || null;
        const end = evAny?.endDateTime || evAny?.attributes?.endDateTime || null;
        const dateStr = formatEventDate(start, end);

        const title = evAny?.title || evAny?.attributes?.title || '';
        const organization = evAny?.organizer || evAny?.attributes?.organizer || '';
        const location = evAny?.location || evAny?.attributes?.location || '';
        const description = evAny?.shortDescription || evAny?.attributes?.shortDescription || '';

        const slug = evAny?.slug || evAny?.attributes?.slug || '';

        return {
          title,
          organizer: organization,
          date: dateStr,
          location,
          slug,
          status: [] as const,
          description,
          image: imageUrl,
          buttonLabel: 'Learn more',
          buttonVariant: 'learn-more' as const,
          type: 'Event',
          time: '',
          duration: '',
        };
      }).filter(Boolean);

      setUpcomingEvents(normalizedUpcoming);
      console.log('Upcoming events fetched:', normalizedUpcoming);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      setUpcomingEvents([]);
    }
  };
  useEffect(() => {
      if (!member?.organisationInfo?.companyName) return;
      async function fetchEvents() {
        try {
          const params = new URLSearchParams(window.location.search);
          const orgName = member?.organisationInfo?.companyName;
  
          // Fetch hosted events using the strapi utility
          const allRawEvents = await strapi.eventApi.fetchHostedEvents(orgName);
  
          console.log(orgName,'Hosted events:', allRawEvents);
  
          // Remove duplicates by documentId if any (though unlikely with single endpoint)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const uniqueEvents = allRawEvents.filter((event, index, self) =>
            index ===
            self.findIndex((e) =>
              (e.documentId || e.attributes?.documentId) ===
              (event.documentId || event.attributes?.documentId)
            )
          );
  
          // Events are already sorted by startDateTime ascending from the API
  
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const normalized: YourEvent[] = uniqueEvents.map((ev: any) => {
            const imageData = ev?.image || ev?.attributes?.image;
            const imageUrl = imageData?.image?.url
              ? getStrapiMediaUrl(imageData.image.url)
              : imageData?.url
                ? getStrapiMediaUrl(imageData.url)
                : FALLBACK_IMAGE;
  
            const title = ev?.title || ev?.attributes?.title || '';
            const organization = ev?.organizer || ev?.attributes?.organizer || orgName;
            const start = ev?.startDateTime || ev?.attributes?.startDateTime || null;
            const end = ev?.endDateTime || ev?.attributes?.endDateTime || null;
            const dateStr = formatEventDate(start, end);
  
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let status = (ev?.eventStatus ||
              ev?.attributes?.status) as YourEvent['status'];
            if (!status) {
              status = 'draft';
            }
            status = status.toLowerCase() as YourEvent['status'];
  
            // Check if past event
            let isPast = false;
            if (end && new Date(end) < new Date()) {
              isPast = true;
            }
  
            if (isPast) {
              status = 'past';
            }
  
            return {
              id: String(ev?.documentId || ev?.attributes?.documentId || ev?.id || Math.random()),
              title,
              organization,
              date: dateStr,
              time: '',
              location: ev?.location || ev?.attributes?.location || '',
              description: ev?.shortDescription || ev?.attributes?.shortDescription || '',
              imageUrl,
              slug: ev?.slug || ev?.attributes?.slug || '',
              eventData: ev,
              status,
            } as YourEvent;
          });
  
          setYourEvents(normalized);
        } catch (error) {
          console.error('Error loading events:', error);
        } 
      }
  
      fetchEvents();
    }, [member]);
  
  const handleModalSuccess = async () => {
    // Refresh member data after successful upload
    if (user?.email) {
      try {
         setIsModalOpen(false)
        const updatedMember = await refreshMemberData(user.email);
        setLocalMember(updatedMember);      
      } catch (error) {
        console.error('Failed to refresh member data:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wfzo-gold-600"></div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#FCFAF8] pb-16">
      {/* Hero Banner */}
      <div
        className="w-full h-[248px] bg-cover bg-center relative"
        style={{
          backgroundImage: "url('https://api.builder.io/api/v1/image/assets/TEMP/210903bd71a3454bb3e27d6c7a3e1712f7f1cbba?width=2880')"
        }}
      />
{showDraftSavedBanner && (
  
    <DraftSavedBanner  message="Details saved as draft" onDismiss={() => setShowDraftSavedBanner(false)} />
 
)}
      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-[120px] -mt-28 relative z-10">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left Column - Main Content */}
          <div className="flex-1 space-y-4">
            {isPrimary ? (
              <ProfileHeader member={localMember} locale={locale} onDraftSaved={() => setShowDraftSavedBanner(true)}  />
            ) : (
              <TeamMemberProfileHeader member={member} userSnapshot={userSnapshot} locale={locale} />
            )}
            {isPrimary &&<YourProfileSection member={member} locale={locale} />}
            {isPrimary && <ManageTeamSection locale={locale} />}
            <YourEventsSection locale={locale} event={yourEvents[0]} />
            <YourPublicationsSection locale={locale} />
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-[379px] space-y-4">
            {isPrimary && !isFeatured && <FeaturedMemberCard locale={locale} />}
            <UpcomingEventsCard locale={locale} event={registeredEvent} isPrimary={isPrimary} />
            {/* <SuggestedEventsCard locale={locale} event={filteredEvent} /> */}
            <SuggestedEventsCard locale={locale} />
            {isPrimary && <SuggestedMembersSection
              key={refreshKey}
              onConnectionSent={handleConnectionSent}
            />}
          </div>
        </div>
      </div>

      {/* Profile Image Upload Modal for Non-Primary users without image */}
      <ProfileImageUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        localMember={userSnapshot}
        memberId={member?.memberId}
        canClose={false}
      />
    </div>
  );
}