'use client';
import React, { JSX, useEffect, useState } from 'react';
import {
  ContactDetailsSection,
  ContactInfo,
} from '@/features/membership/components/ContactDetailsSection';
import { MemberProfileHeader } from '@/features/membership/components/MemberProfileHeader';
import { CONTENTHEADER_BG_IMAGE, FALLBACK_IMAGE } from '@/lib/constants/constants';
import ContentSection from '@/shared/components/ContentSection';
import ContactSection from '@/shared/components/ContactSection';
import ExploreCard from '@/shared/components/ExploreCard';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import Hero from '@/features/about/components/Hero';
import CompleteRegistrationAlert from '@/features/membership/components/CompleteRegistrationAlert';
import { EventsWebinarsTab } from '@/features/membership/components/EventsWebinarsTab';
import { trackMemberView } from '@/lib/analytics/gtag';

import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { useParams } from 'next/navigation';
import { getCountryISOCode } from '@/lib/utils/getCountryISOCode';
import { CustomTabs } from '@/features/membership/components/CustomTabs';
import NewsAndPublicationsTab from '@/features/membership/components/NewsAndPublicationsTab';
import TeamMembersTab, { TeamMember } from '@/features/membership/components/TeamMembersTab';
import { networkService } from '@/features/network/services/networkService';
import { ConnectionStatus } from '@/features/membership/components/ConnectionActions';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { ContactDetailsSectionSkeleton } from '@/features/membership/components/ContactDetailsSectionSkeleton';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';
import { EcosystemCard } from '@/shared/types/globals';

type SocialPlatform = 'facebook' | 'x' | 'youtube' | 'linkedin';
interface SocialMediaItem {
  title: SocialPlatform;
  url: string;
}

const MemberPage = ({ sections }: { sections: any }) => {
  interface FilterOption {
    id: string | number;
    name: string;
  }

  const [activeTab, setActiveTab] = useState<TabId>('contact');
  const { member } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [pageMember, setMember] = useState<any>(null);
  const [memberLoading, setMemberLoading] = useState(true);
  const [industryOptions, setIndustryOptions] = useState<FilterOption[]>([]);

  const isLoggedInMember =  !!member;
 const isSelfPage =
  member?.memberId && pageMember?.memberId &&
  member.memberId === pageMember.memberId;
  const isPrimaryMember = member?.userSnapshots?.some((user: any) => user.userType === 'Primary');

  const showCompleteRegistration =  !isLoggedInMember;

  const slugArray = params.slug as string[];
  const organizationName = decodeURIComponent(slugArray?.[0]);
  const locale = (params?.locale as string) || 'en';

  const onRegistrationAction = () => {
    router.push(`/${locale}/membership/become-a-member`);
  };

  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrganization = async (companyUrl: string) => {
    try {
      const res = await fetch(companyUrl);
      if (!res.ok) {
        console.error('Strapi API error:', res.status);
        return;
      }
      const json = await res.json();
      console.log('Strapi response:', json);

      setOrganization(json.data?.[0]);
    } catch (error) {
      console.log('Failed to fetch organization', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchCompanyDetails = async (apiUrl: string) => {
    try {
      const res = await fetch(apiUrl);

      const data = await res.json();
      setMember(data);
    } catch (error) {
      console.log('member feth failed,', error);
    } finally {
      setMemberLoading(false);
    }
  };

  const apiUrl = member
    ? `/api/member/by-company/${organizationName}?member=true`
    : `/api/member/by-company/${organizationName}`;

  const companyUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/organizations?status=draft&filters[organizationName][$eq]=${encodeURIComponent(organizationName)}&populate[companyImage]=true&populate[organization][populate][image][populate]=image`;

const canShowConnectionActions =
  isLoggedInMember &&
  pageMember?.memberId &&
  member?.memberId &&
  member.memberId !== pageMember.memberId
  isPrimaryMember;

  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const res = await fetch(
          `/api/member-directory/industries?locale=${encodeURIComponent(locale)}`
        );
        if (res.ok) {
          const data = await res.json();
          setIndustryOptions(data);
        }
      } catch (err) {
        console.error('Failed to fetch industries', err);
      }
    };

    fetchIndustries();
  }, [locale]);

  const codeToLabelMap: Record<string, string> = {};

  industryOptions.forEach((option) => {
    codeToLabelMap[String(option.id)] = option.name;
  });

  const industryLabels =
    pageMember?.organisationInfo?.industries?.map((code: string) => codeToLabelMap[code] || code) ||
    [];

  useEffect(() => {
    if (!organizationName) return;

    fetchCompanyDetails(apiUrl);
    fetchOrganization(companyUrl);
  }, [organizationName, member]);

  // Track member view
  useEffect(() => {
    if (member && !memberLoading) {
      trackMemberView(
        member.companyId || organizationName,
        member.companyName || organizationName,
        member.companyName || organizationName
      );
    }
  }, [member, memberLoading, organizationName]);

  const organizationBlocks = Array.isArray(organization?.organization)
    ? organization.organization
    : organization?.organization
      ? [organization.organization]
      : [];
  const textImages = organizationBlocks.map((item: any) => ({
    title: item.title,
    content: item.description,
    imageUrl: item.image?.image,
    imagePosition: item.imagePosition || 'left',
  }));

  const contactPerson = pageMember?.userSnapshots?.find((user: any) => user.userType === 'Primary');
  const orgInfo = pageMember?.organisationInfo;

  const socialMediaHandles: SocialMediaItem[] =
    pageMember?.organisationInfo?.socialMediaHandle || [];

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('none');
  const [connectionId, setConnectionId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const [myConnections, setMyConnections] = useState<any[]>([]);
  const [sentConnectionRequests, setSentConnectionRequests] = useState<any[]>([]);
  const [matchedConnection, setMatchedConnection] = useState<any | null>(null);

  const fetchSentRequests = async () => {
    if (!member) return;
    try {
      const res = await networkService.getSentRequests(1, 100);
      if (res.success) {
        setSentConnectionRequests(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch sent requests', err);
    }
  };

  const fetchMyConnections = async () => {
    if (!member) return;
    try {
      const res = await networkService.getMyConnections(1, 100);
      console.log('Connections API Response:', res);
      if (res.success) {
        setMyConnections(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch connections', err);
    }
  };
  useEffect(() => {
    if (!member) return;
    fetchMyConnections();
    fetchSentRequests();
  }, [member]);

  useEffect(() => {
    if (!pageMember) return;

    const acceptedMatch = myConnections.find((conn) => {
      return conn.member?.memberId === pageMember.memberId && conn.status === 'accepted';
    });

    const pendingMatch = sentConnectionRequests.find(
      (req) => req.member?.memberId === pageMember.memberId
    );
    if (acceptedMatch) {
      setConnectionStatus('connected');
      setConnectionId(acceptedMatch.connectionId);
      setMatchedConnection(acceptedMatch);
    } else if (pendingMatch) {
      setConnectionStatus('pending');
      setConnectionId(pendingMatch.requestId);
      setMatchedConnection(pendingMatch);
    } else {
      setConnectionStatus('none');
      setConnectionId(undefined);
      setMatchedConnection(null);
    }
  }, [pageMember, myConnections, sentConnectionRequests]);

  const isBlocked = matchedConnection?.member?.blockStatus === 'blocked';

  const handleConnect = async () => {
    try {
      setIsConnecting(true);

      const response = await networkService.sendConnectionRequest(pageMember.memberId);

      if (response.success) {
        setConnectionStatus('pending'); // same UX
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleMessage = () => {
    if (!pageMember) return;

    const chatData = {
      type: 'member',
      memberId: pageMember.memberId,
      companyName: pageMember.organisationInfo?.companyName,
      logo: pageMember.organisationInfo?.memberLogoUrl,
    };

    sessionStorage.setItem('openChat', JSON.stringify(chatData));

    router.push(`/${locale}/inbox`);
  };

  const handleRemoveConnection = async (connId: string) => {
    try {
      setIsLoading(true);

      const res = await networkService.removeConnection(connId);

      if (res.success) {
        setConnectionStatus('none');
        setConnectionId(undefined);
      }
    } catch (err) {
      console.error('Remove connection failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReport = async (memberId: string, userId: string | null, reason: string) => {
    try {
      const res = await networkService.reportUser(memberId, userId, reason);

      if (res.success && connectionId) {
        // Optional → also block user after report
        await networkService.blockMember(connectionId, memberId);

        setMatchedConnection((prev: any) =>
          prev
            ? {
                ...prev,
                member: {
                  ...prev.member,
                  blockStatus: 'blocked',
                },
              }
            : prev
        );
      }
    } catch (err) {
      console.error('Report failed', err);
    }
  };

  const handleBlock = async (memberId: string, connId: string) => {
    try {
      await networkService.blockMember(connId, memberId);

      setMatchedConnection((prev: any) =>
        prev
          ? {
              ...prev,
              member: {
                ...prev.member,
                blockStatus: 'blocked',
              },
            }
          : prev
      );
    } catch (err) {
      console.error('Block failed', err);
    }
  };

  const handleUnblock = async (memberId: string, connId: string) => {
    try {
      await networkService.unblockMember(connId, memberId);

      setMatchedConnection((prev: any) =>
        prev
          ? {
              ...prev,
              member: {
                ...prev.member,
                blockStatus: null,
              },
            }
          : prev
      );
    } catch (err) {
      console.error('Unblock failed', err);
    }
  };

  const tabs = [
    { id: 'contact', label: 'Contact Details' },
    { id: 'events', label: 'Events & Webinars' },
    { id: 'news', label: 'News & Publications' },
    { id: 'team', label: 'Team Members' },
  ] as const;

  type TabId = (typeof tabs)[number]['id'];

  const maskText = (value?: string) => {
    if (!value) return '—';
    return '********';
  };

  const contactPersonInfo: ContactInfo[] = [
    {
      label: 'Contact Person',
      value: contactPerson
        ? isLoggedInMember
          ? `${contactPerson.firstName ?? ''} ${contactPerson.lastName ?? ''}`.trim()
          : maskText(`${contactPerson.firstName ?? ''} ${contactPerson.lastName ?? ''}`.trim())
        : '—',
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM9 17.95V16C8.45 16 7.97917 15.8042 7.5875 15.4125C7.19583 15.0208 7 14.55 7 14V13L2.2 8.2C2.15 8.5 2.10417 8.8 2.0625 9.1C2.02083 9.4 2 9.7 2 10C2 12.0167 2.6625 13.7833 3.9875 15.3C5.3125 16.8167 6.98333 17.7 9 17.95ZM15.9 15.4C16.5833 14.65 17.1042 13.8125 17.4625 12.8875C17.8208 11.9625 18 11 18 10C18 8.36667 17.5458 6.875 16.6375 5.525C15.7292 4.175 14.5167 3.2 13 2.6V3C13 3.55 12.8042 4.02083 12.4125 4.4125C12.0208 4.80417 11.55 5 11 5H9V7C9 7.28333 8.90417 7.52083 8.7125 7.7125C8.52083 7.90417 8.28333 8 8 8H6V10H12C12.2833 10 12.5208 10.0958 12.7125 10.2875C12.9042 10.4792 13 10.7167 13 11V14H14C14.4333 14 14.825 14.1292 15.175 14.3875C15.525 14.6458 15.7667 14.9833 15.9 15.4Z"
            fill="#1A1A1A"
          />
        </svg>
      ),

      type: 'text',
      actionIcon: isLoggedInMember ? (
        <svg
          width="15"
          height="17"
          viewBox="0 0 15 17"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 13.3333C4.54167 13.3333 4.14931 13.1701 3.82292 12.8437C3.49653 12.5174 3.33333 12.125 3.33333 11.6667V1.66667C3.33333 1.20833 3.49653 0.815972 3.82292 0.489583C4.14931 0.163194 4.54167 0 5 0H12.5C12.9583 0 13.3507 0.163194 13.6771 0.489583C14.0035 0.815972 14.1667 1.20833 14.1667 1.66667V11.6667C14.1667 12.125 14.0035 12.5174 13.6771 12.8437C13.3507 13.1701 12.9583 13.3333 12.5 13.3333H5ZM5 11.6667H12.5V1.66667H5V11.6667ZM1.66667 16.6667C1.20833 16.6667 0.815972 16.5035 0.489583 16.1771C0.163194 15.8507 0 15.4583 0 15V4.16667C0 3.93056 0.0798611 3.73264 0.239583 3.57292C0.399306 3.41319 0.597222 3.33333 0.833333 3.33333C1.06944 3.33333 1.26736 3.41319 1.42708 3.57292C1.58681 3.73264 1.66667 3.93056 1.66667 4.16667V15H10C10.2361 15 10.434 15.0799 10.5938 15.2396C10.7535 15.3993 10.8333 15.5972 10.8333 15.8333C10.8333 16.0694 10.7535 16.2674 10.5938 16.4271C10.434 16.5868 10.2361 16.6667 10 16.6667H1.66667Z"
            fill="#8B6941"
          />
        </svg>
      ) : undefined,
    },
    {
      label: 'Position',
      value: isLoggedInMember ? orgInfo?.position : maskText(orgInfo?.position),
      icon: (
        <svg
          width="20"
          height="19"
          viewBox="0 0 20 19"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 19C1.45 19 0.979167 18.8042 0.5875 18.4125C0.195833 18.0208 0 17.55 0 17V6C0 5.45 0.195833 4.97917 0.5875 4.5875C0.979167 4.19583 1.45 4 2 4H6V2C6 1.45 6.19583 0.979167 6.5875 0.5875C6.97917 0.195833 7.45 0 8 0H12C12.55 0 13.0208 0.195833 13.4125 0.5875C13.8042 0.979167 14 1.45 14 2V4H18C18.55 4 19.0208 4.19583 19.4125 4.5875C19.8042 4.97917 20 5.45 20 6V17C20 17.55 19.8042 18.0208 19.4125 18.4125C19.0208 18.8042 18.55 19 18 19H2ZM8 4H12V2H8V4ZM18 13H13V15H7V13H2V17H18V13ZM9 13H11V11H9V13ZM2 11H7V9H13V11H18V6H2V11Z"
            fill="#4D4D4D"
          />
        </svg>
      ),
      type: 'text',
    },
    {
      label: 'E-mail Address',
      value: contactPerson?.email,
      icon: (
        <svg
          width="20"
          height="16"
          viewBox="0 0 20 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 16C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H18C18.55 0 19.0208 0.195833 19.4125 0.5875C19.8042 0.979167 20 1.45 20 2V14C20 14.55 19.8042 15.0208 19.4125 15.4125C19.0208 15.8042 18.55 16 18 16H2ZM10 9L2 4V14H18V4L10 9ZM10 7L18 2H2L10 7ZM2 4V2V14V4Z"
            fill="#4D4D4D"
          />
        </svg>
      ),
      type: 'email',
      actionIcon: isLoggedInMember ? (
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1.66667 15C1.20833 15 0.815972 14.8368 0.489583 14.5104C0.163194 14.184 0 13.7917 0 13.3333V1.66667C0 1.20833 0.163194 0.815972 0.489583 0.489583C0.815972 0.163194 1.20833 0 1.66667 0H6.66667C6.90278 0 7.10069 0.0798611 7.26042 0.239583C7.42014 0.399306 7.5 0.597222 7.5 0.833333C7.5 1.06944 7.42014 1.26736 7.26042 1.42708C7.10069 1.58681 6.90278 1.66667 6.66667 1.66667H1.66667V13.3333H13.3333V8.33333C13.3333 8.09722 13.4132 7.89931 13.5729 7.73958C13.7326 7.57986 13.9306 7.5 14.1667 7.5C14.4028 7.5 14.6007 7.57986 14.7604 7.73958C14.9201 7.89931 15 8.09722 15 8.33333V13.3333C15 13.7917 14.8368 14.184 14.5104 14.5104C14.184 14.8368 13.7917 15 13.3333 15H1.66667ZM13.3333 2.83333L6.16667 10C6.01389 10.1528 5.81944 10.2292 5.58333 10.2292C5.34722 10.2292 5.15278 10.1528 5 10C4.84722 9.84722 4.77083 9.65278 4.77083 9.41667C4.77083 9.18056 4.84722 8.98611 5 8.83333L12.1667 1.66667H10C9.76389 1.66667 9.56597 1.58681 9.40625 1.42708C9.24653 1.26736 9.16667 1.06944 9.16667 0.833333C9.16667 0.597222 9.24653 0.399306 9.40625 0.239583C9.56597 0.0798611 9.76389 0 10 0H14.1667C14.4028 0 14.6007 0.0798611 14.7604 0.239583C14.9201 0.399306 15 0.597222 15 0.833333V5C15 5.23611 14.9201 5.43403 14.7604 5.59375C14.6007 5.75347 14.4028 5.83333 14.1667 5.83333C13.9306 5.83333 13.7326 5.75347 13.5729 5.59375C13.4132 5.43403 13.3333 5.23611 13.3333 5V2.83333Z"
            fill="#8B6941"
          />
        </svg>
      ) : undefined,
    },
    {
      label: 'Phone Number',
      value: contactPerson?.contactNumber,
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16.95 18C14.8667 18 12.8083 17.5458 10.775 16.6375C8.74167 15.7292 6.89167 14.4417 5.225 12.775C3.55833 11.1083 2.27083 9.25833 1.3625 7.225C0.454167 5.19167 0 3.13333 0 1.05C0 0.75 0.1 0.5 0.3 0.3C0.5 0.1 0.75 0 1.05 0H5.1C5.33333 0 5.54167 0.0791667 5.725 0.2375C5.90833 0.395833 6.01667 0.583333 6.05 0.8L6.7 4.3C6.73333 4.56667 6.725 4.79167 6.675 4.975C6.625 5.15833 6.53333 5.31667 6.4 5.45L3.975 7.9C4.30833 8.51667 4.70417 9.1125 5.1625 9.6875C5.62083 10.2625 6.125 10.8167 6.675 11.35C7.19167 11.8667 7.73333 12.3458 8.3 12.7875C8.86667 13.2292 9.46667 13.6333 10.1 14L12.45 11.65C12.6 11.5 12.7958 11.3875 13.0375 11.3125C13.2792 11.2375 13.5167 11.2167 13.75 11.25L17.2 11.95C17.4333 12.0167 17.625 12.1375 17.775 12.3125C17.925 12.4875 18 12.6833 18 12.9V16.95C18 17.25 17.9 17.5 17.7 17.7C17.5 17.9 17.25 18 16.95 18ZM3.025 6L4.675 4.35L4.25 2H2.025C2.10833 2.68333 2.225 3.35833 2.375 4.025C2.525 4.69167 2.74167 5.35 3.025 6ZM11.975 14.95C12.625 15.2333 13.2875 15.4583 13.9625 15.625C14.6375 15.7917 15.3167 15.9 16 15.95V13.75L13.65 13.275L11.975 14.95Z"
            fill="#4D4D4D"
          />
        </svg>
      ),
      type: 'phone',
      actionIcon: isLoggedInMember? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.625 3.8025H9.16667C8.93056 3.8025 8.73264 3.72264 8.57292 3.56292C8.41319 3.40319 8.33333 3.20528 8.33333 2.96917C8.33333 2.73306 8.41319 2.53514 8.57292 2.37542C8.73264 2.21569 8.93056 2.13583 9.16667 2.13583H12.625L11.9167 1.4275C11.7639 1.27472 11.684 1.08375 11.6771 0.854583C11.6701 0.625417 11.7431 0.4275 11.8958 0.260833C12.0625 0.0941667 12.2639 0.00736111 12.5 0.000416667C12.7361 -0.00652778 12.9375 0.0733333 13.1042 0.24L15.25 2.4275C15.4167 2.59417 15.5 2.78861 15.5 3.01083C15.5 3.23306 15.4167 3.4275 15.25 3.59417L13.0833 5.71917C12.9167 5.87194 12.7222 5.94833 12.5 5.94833C12.2778 5.94833 12.0833 5.87194 11.9167 5.71917C11.75 5.5525 11.6632 5.35458 11.6563 5.12542C11.6493 4.89625 11.7292 4.69833 11.8958 4.53167L12.625 3.8025ZM14.125 15.4692C12.3889 15.4692 10.6736 15.0907 8.97917 14.3338C7.28472 13.5768 5.74306 12.5039 4.35417 11.115C2.96528 9.72611 1.89236 8.18444 1.13542 6.49C0.378472 4.79556 0 3.08028 0 1.34417C0 1.09417 0.0833333 0.885833 0.25 0.719167C0.416667 0.5525 0.625 0.469167 0.875 0.469167H4.25C4.44444 0.469167 4.61806 0.535139 4.77083 0.667083C4.92361 0.799028 5.01389 0.955278 5.04167 1.13583L5.58333 4.0525C5.61111 4.27472 5.60417 4.46222 5.5625 4.615C5.52083 4.76778 5.44444 4.89972 5.33333 5.01083L3.3125 7.0525C3.59028 7.56639 3.92014 8.06292 4.30208 8.54208C4.68403 9.02125 5.10417 9.48306 5.5625 9.9275C5.99306 10.3581 6.44444 10.7574 6.91667 11.1254C7.38889 11.4935 7.88889 11.8303 8.41667 12.1358L10.375 10.1775C10.5 10.0525 10.6632 9.95875 10.8646 9.89625C11.066 9.83375 11.2639 9.81639 11.4583 9.84417L14.3333 10.4275C14.5278 10.4831 14.6875 10.5838 14.8125 10.7296C14.9375 10.8754 15 11.0386 15 11.2192V14.5942C15 14.8442 14.9167 15.0525 14.75 15.2192C14.5833 15.3858 14.375 15.4692 14.125 15.4692ZM2.52083 5.46917L3.89583 4.09417L3.54167 2.13583H1.6875C1.75694 2.70528 1.85417 3.26778 1.97917 3.82333C2.10417 4.37889 2.28472 4.9275 2.52083 5.46917ZM9.97917 12.9275C10.5208 13.1636 11.0729 13.3511 11.6354 13.49C12.1979 13.6289 12.7639 13.7192 13.3333 13.7608V11.9275L11.375 11.5317L9.97917 12.9275Z"
            fill="#8B6941"
          />
        </svg>
      ) : undefined,
    },
  ];

  const companyInfo: ContactInfo[] = [
    {
      label: 'Website',
      value: orgInfo?.websiteUrl,
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM9 17.95V16C8.45 16 7.97917 15.8042 7.5875 15.4125C7.19583 15.0208 7 14.55 7 14V13L2.2 8.2C2.15 8.5 2.10417 8.8 2.0625 9.1C2.02083 9.4 2 9.7 2 10C2 12.0167 2.6625 13.7833 3.9875 15.3C5.3125 16.8167 6.98333 17.7 9 17.95ZM15.9 15.4C16.5833 14.65 17.1042 13.8125 17.4625 12.8875C17.8208 11.9625 18 11 18 10C18 8.36667 17.5458 6.875 16.6375 5.525C15.7292 4.175 14.5167 3.2 13 2.6V3C13 3.55 12.8042 4.02083 12.4125 4.4125C12.0208 4.80417 11.55 5 11 5H9V7C9 7.28333 8.90417 7.52083 8.7125 7.7125C8.52083 7.90417 8.28333 8 8 8H6V10H12C12.2833 10 12.5208 10.0958 12.7125 10.2875C12.9042 10.4792 13 10.7167 13 11V14H14C14.4333 14 14.825 14.1292 15.175 14.3875C15.525 14.6458 15.7667 14.9833 15.9 15.4Z"
            fill="#1A1A1A"
          />
        </svg>
      ),
      type: 'link',
    },
    {
      label: 'Country',
      value: orgInfo?.address?.country,
      icon: (
        <svg
          width="15"
          height="19"
          viewBox="0 0 15 19"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.09975 8.73075C7.54492 8.73075 7.92483 8.57225 8.2395 8.25525C8.55433 7.93825 8.71175 7.55717 8.71175 7.112C8.71175 6.66683 8.55317 6.28683 8.236 5.972C7.919 5.65733 7.53792 5.5 7.09275 5.5C6.64758 5.5 6.26767 5.6585 5.953 5.9755C5.63817 6.2925 5.48075 6.67358 5.48075 7.11875C5.48075 7.56392 5.63933 7.94392 5.9565 8.25875C6.2735 8.57342 6.65458 8.73075 7.09975 8.73075ZM7.09625 18.0193C4.74625 15.9411 2.97608 14.0029 1.78575 12.2048C0.59525 10.4068 0 8.77058 0 7.29625C0 5.18075 0.688833 3.43583 2.0665 2.0615C3.444 0.687167 5.12058 0 7.09625 0C9.07192 0 10.7485 0.687167 12.126 2.0615C13.5037 3.43583 14.1925 5.18075 14.1925 7.29625C14.1925 8.77058 13.5972 10.4068 12.4067 12.2048C11.2164 14.0029 9.44625 15.9411 7.09625 18.0193Z"
            fill="#4D4D4D"
          />
        </svg>
      ),
      type: 'text',
    },
    {
      label: 'City',
      value: orgInfo?.address?.city,
      icon: (
        <svg
          width="15"
          height="19"
          viewBox="0 0 15 19"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.09975 8.73075C7.54492 8.73075 7.92483 8.57225 8.2395 8.25525C8.55433 7.93825 8.71175 7.55717 8.71175 7.112C8.71175 6.66683 8.55317 6.28683 8.236 5.972C7.919 5.65733 7.53792 5.5 7.09275 5.5C6.64758 5.5 6.26767 5.6585 5.953 5.9755C5.63817 6.2925 5.48075 6.67358 5.48075 7.11875C5.48075 7.56392 5.63933 7.94392 5.9565 8.25875C6.2735 8.57342 6.65458 8.73075 7.09975 8.73075ZM7.09625 18.0193C4.74625 15.9411 2.97608 14.0029 1.78575 12.2048C0.59525 10.4068 0 8.77058 0 7.29625C0 5.18075 0.688833 3.43583 2.0665 2.0615C3.444 0.687167 5.12058 0 7.09625 0C9.07192 0 10.7485 0.687167 12.126 2.0615C13.5037 3.43583 14.1925 5.18075 14.1925 7.29625C14.1925 8.77058 13.5972 10.4068 12.4067 12.2048C11.2164 14.0029 9.44625 15.9411 7.09625 18.0193Z"
            fill="#4D4D4D"
          />
        </svg>
      ),
      type: 'text',
    },
    {
      label: 'Address',
      value: orgInfo?.address?.line1 + ' ' + orgInfo?.address?.line2,
      icon: (
        <svg
          width="15"
          height="19"
          viewBox="0 0 15 19"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.09975 8.73075C7.54492 8.73075 7.92483 8.57225 8.2395 8.25525C8.55433 7.93825 8.71175 7.55717 8.71175 7.112C8.71175 6.66683 8.55317 6.28683 8.236 5.972C7.919 5.65733 7.53792 5.5 7.09275 5.5C6.64758 5.5 6.26767 5.6585 5.953 5.9755C5.63817 6.2925 5.48075 6.67358 5.48075 7.11875C5.48075 7.56392 5.63933 7.94392 5.9565 8.25875C6.2735 8.57342 6.65458 8.73075 7.09975 8.73075ZM7.09625 18.0193C4.74625 15.9411 2.97608 14.0029 1.78575 12.2048C0.59525 10.4068 0 8.77058 0 7.29625C0 5.18075 0.688833 3.43583 2.0665 2.0615C3.444 0.687167 5.12058 0 7.09625 0C9.07192 0 10.7485 0.687167 12.126 2.0615C13.5037 3.43583 14.1925 5.18075 14.1925 7.29625C14.1925 8.77058 13.5972 10.4068 12.4067 12.2048C11.2164 14.0029 9.44625 15.9411 7.09625 18.0193Z"
            fill="#4D4D4D"
          />
        </svg>
      ),
      type: 'text',
    },
  ];
console.log(pageMember?.userSnapshots);

  const teamMembers: TeamMember[] = Array.isArray(pageMember?.userSnapshots)
    ? pageMember.userSnapshots
    .filter((user: any) => user.userType?.toLowerCase() !== 'primary')
    .map((user: any) => ({
        name: `${user.firstName} ${user.lastName}`,
        designation: user.designation,
        email: pageMember.isMember ? user.email : undefined,
        phone: pageMember.isMember ? user.contactNumber : undefined,
        imageUrl: { url: user.profileImageUrl || FALLBACK_IMAGE },
      }))
    : [];
console.log(teamMembers);

 const breadcrumbItems = [
    { isHome: true, label: 'Home',href: `/${locale}` },
    { label: 'Membership' },
    { label: 'Members Directory',href: '/membership/members-directory' },
    { label: organizationName, isCurrent: true },
  ];


  const socialIcons: Record<SocialPlatform, JSX.Element> = {
    facebook: (
      <svg
        width="11"
        height="21"
        viewBox="0 0 11 21"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7.27956 20.5297V11.5477H10.2747L10.8447 7.83215H7.27956V5.42125C7.27956 4.40436 7.77766 3.41362 9.37439 3.41362H10.9951V0.250681C10.9951 0.250681 9.5237 0 8.11771 0C5.18147 0 3.26322 1.77984 3.26322 5.00054V7.83215H0V11.5477H3.26322V20.5297H7.27956Z"
          fill="#9B7548"
        />
      </svg>
    ),

    x: (
      <svg
        width="17"
        height="17"
        viewBox="0 0 17 17"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9.55858 6.95041L15.5379 0H14.121L8.9297 6.03488L4.78256 0H0L6.2703 9.12588L0 16.4142H1.41689L6.89918 10.0414L11.2785 16.4142H16.061L9.55749 6.95041H9.55858ZM7.61744 9.20545L6.98202 8.29646L1.92697 1.06594H4.10354L8.18311 6.90136L8.81853 7.81035L14.1221 15.3962H11.9455L7.61853 9.20654L7.61744 9.20545Z"
          fill="#9B7548"
        />
      </svg>
    ),

    youtube: (
      <svg
        width="22"
        height="15"
        viewBox="0 0 22 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21.1444 4.63978C21.1444 2.07738 19.067 0 16.5046 0H4.63978C2.07738 0 0 2.07738 0 4.63978V10.1613C0 12.7237 2.07738 14.8011 4.63978 14.8011H16.5046C19.067 14.8011 21.1444 12.7237 21.1444 10.1613V4.63978ZM14.1668 7.81362L8.84577 10.4458C8.63759 10.5591 7.92806 10.4076 7.92806 10.17V4.7673C7.92806 4.52752 8.64305 4.37602 8.85122 4.49482L13.9444 7.2654C14.158 7.38638 14.3826 7.69591 14.1657 7.81254L14.1668 7.81362Z"
          fill="#9B7548"
        />
      </svg>
    ),

    linkedin: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6.80547 12.812H10.751V25.4866H6.80547V12.812ZM8.77932 6.51334C10.0414 6.51334 11.0638 7.53677 11.0638 8.79562C11.0638 10.0545 10.0414 11.0812 8.77932 11.0812C7.5172 11.0812 6.49268 10.0556 6.49268 8.79562C6.49268 7.53568 7.51502 6.51334 8.77932 6.51334Z"
          fill="#9B7548"
        />
        <path
          d="M13.2231 12.812H17.0018V14.546H17.053C17.5806 13.5488 18.8645 12.4992 20.7838 12.4992C24.7729 12.4992 25.5075 15.1226 25.5075 18.5362V25.4877H21.5707V19.3253C21.5707 17.8539 21.5424 15.964 19.5228 15.964C17.5032 15.964 17.1598 17.5651 17.1598 19.2174V25.4866H13.222V12.812H13.2231Z"
          fill="#9B7548"
        />
        <rect x="1" y="1" width="30" height="30" rx="1" stroke="#9B7548" strokeWidth="2" />
      </svg>
    ),
  };

  const exploreCards = [
    { title: 'Our History', backgroundImage: '/chairman.jpg', link: '/about-us/our-history' },
    {
      title: 'Board of Directors',
      backgroundImage: '/chairman.jpg',
      link: '/about-us/board-of-directors',
    },
  ];

  if (loading) {
    return <div className="py-20 min-h-screen text-center">Loading organization...</div>;
  }

  if (!organization) {
    return <div className="py-20 min-h-screen text-center">Organization not found</div>;
  }

  return (
    <div>
      <Hero imageUrl={sections.hero?.heroImage} />

     <BreadcrumbContentHeader
        breadcrumbItems={breadcrumbItems}
        contentHeaderProps={{
          header: '',
          description: '',
          exploreAllHref: '/',
        }}
        containerClassName=""
      />
      <div>
        {pageMember && (
          <MemberProfileHeader
            memberId={pageMember.memberId}
            memberName={pageMember.organisationInfo?.companyName}
            avatarUrl={pageMember.organisationInfo?.memberLogoUrl || FALLBACK_IMAGE}
            categories={industryLabels || []}
            flag={getCountryISOCode(pageMember.organisationInfo?.address?.country) ?? 'UN'}
            showConnectionActions={canShowConnectionActions}
            connectionStatus={connectionStatus}
            connectionId={connectionId}
            onConnect={handleConnect}
            isConnectionLoading={isConnecting}
            onMessage={handleMessage}
            onRemoveConnection={handleRemoveConnection}
            onReport={handleReport}
            onBlock={handleBlock}
            isBlocked={isBlocked}
            onUnblock={handleUnblock}
          />
        )}

        <div className="px-5 md:px-30 py-5">
          {/* Tabs */}
          <div className="mb-8">
            <CustomTabs tabs={tabs} defaultTab={activeTab} onTabChange={setActiveTab} />
          </div>
          {showCompleteRegistration && (
            <div className="mb-10">
              <CompleteRegistrationAlert onActionClick={onRegistrationAction} />
            </div>
          )}

          {/* Contact */}
          {activeTab === 'contact' && (
            <>
              {memberLoading ? (
                <ContactDetailsSectionSkeleton />
              ) : (
                <ContactDetailsSection
                  contactPersonInfo={contactPersonInfo}
                  companyInfo={companyInfo}
                  socialIcons={socialIcons}
                  socialMediaHandles={socialMediaHandles}
                />
              )}
            </>
          )}

          {/* Events */}
          {activeTab === 'events' && <EventsWebinarsTab organizationName={organizationName} />}

          {activeTab === 'news' && <NewsAndPublicationsTab organizationName={organizationName} />}

          {/* Team */}
          {activeTab === 'team' && (
            <TeamMembersTab members={teamMembers} isMember={pageMember?.isMember === true} />
          )}
        </div>

        <ContentSection
          title=""
          content={organization?.companyIntro}
          imageUrl={getStrapiMediaUrl(organization?.companyImage?.url)}
          imagePosition={'left'}
          alignment="center"
          backgroundImage={CONTENTHEADER_BG_IMAGE}
        />

        {textImages?.length > 0 && (
          <div className="flex flex-col gap-24">
            {textImages.map((item: any, index: number) => (
              <ContentSection
                key={index}
                title={item.title}
                content={item.content}
                imageUrl={getStrapiMediaUrl(item.imageUrl?.url)}
                imagePosition={item.imagePosition || 'left'}
                imageHeight="tall"
                alignment="center"
              />
            ))}
          </div>
        )}

        {sections.ecosystem && (
          <AdvancedCarousel
            itemsCount={sections.ecosystem?.cards.length}
            title={sections.ecosystem.title}
            description={sections.ecosystem.description}
            pageHeading={false}
            // headerCta={cta}
            visibleSlides={{
              xs: 1.2, // 1 card on mobile
              sm: 2, // 2 cards on small tablets
              md: 2, // 3 cards on tablets
              lg: 3, // 4 cards on desktop
              xl: 3, // 4 cards on large desktop
            }}
            slidesToScroll={1} // Scroll 1 card at a time
            autoplay={true}
            autoplayDelay={5000}
            loop={true}
            showControls={true}
            showProgressBar={true}
            gap={16} // 16px gap between cards
          >
            {sections.ecosystem.cards.map((card: EcosystemCard, idx: number) => (
              <div key={idx} className="h-full mb-6">
                <ExploreCard
                  image={
                    card?.backgroundImage?.formats?.medium
                      ? getStrapiMediaUrl(card.backgroundImage.formats.medium)
                      : card?.backgroundImage?.url
                        ? getStrapiMediaUrl(card.backgroundImage.url)
                        : FALLBACK_IMAGE
                  }
                  title={card.title}
                  link={card.link}
                />
              </div>
            ))}
          </AdvancedCarousel>
        )}
      </div>
      {sections.contactUs && (
        <ContactSection
          title={sections.contactUs.title}
          description={sections.contactUs.description}
          backgroundImage={{ url: sections.contactUs.backgroundImage ?? undefined }}
          cta={sections.contactUs.cta ?? undefined}
        />
      )}
    </div>
  );
};

export default MemberPage;
