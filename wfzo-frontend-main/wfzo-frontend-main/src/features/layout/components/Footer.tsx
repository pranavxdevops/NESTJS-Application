'use client';
import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import SocialIcon from '@/shared/components/SocialIcon';
import LightButton from '@/shared/components/LightButton';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { useLocaleSwitcher } from '@/features/main/hooks/useLocaleSwitcher';

const iconMap: Record<string, string> = {
  facebook: '/assets/facebook_icon.svg',
  youtube: '/assets/youtube_icon.svg',
  linkedin: '/assets/linkdein_icon.svg',
  x: '/assets/x_icon.svg',
  email: '/assets/contact_us_email.svg',
  send: '/assets/contact_us_send.svg',
};

export interface NavigationItem {
  label: string;
  url: string;
  children: NavigationItem[];
}

export default function Footer({
  refinedData,
  footRes,
  logo,
}: {
  refinedData: NavigationItem[];
  footRes: any;
  logo: any;
}) {
  return (
    <>
      {/* Contact Section */}
      {/* <ContactSection title={""} description={""} /> */}

      {/* Desktop Footer */}
      <DesktopFooter refinedData={refinedData} footRes={footRes} logo={logo} />

      {/* Mobile Footer */}
      <MobileFooter refinedData={refinedData} footRes={footRes} logo={logo} />
    </>
  );
}

function DesktopFooter({
  refinedData,
  footRes,
  logo,
}: {
  refinedData: NavigationItem[];
  footRes: any;
  logo: any;
}) {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);

  const [open, setOpen] = useState(false);
  const { selectedLang, handleLocaleChange } = useLocaleSwitcher(footRes);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  const showError = touched && !isValid && email.length > 0;

  const borderColor =
    email.length === 0
      ? 'border-white'
      : showError
        ? 'border-red-300'
        : isValid
          ? 'border-green-400'
          : 'border-white';

  const iconColor =
    email.length === 0
      ? 'text-white'
      : showError
        ? 'text-red-300'
        : isValid
          ? 'text-green-400'
          : 'text-white';

  const inputTextColor = showError
    ? 'text-red-300 placeholder-red-300'
    : isValid
      ? 'text-green-400 placeholder-green-400'
      : 'text-white placeholder-white';

  const handleSubscription = async () => {
    if (!isValid) return;
    if (process.env.NEXT_PUBLIC_MAILERLITE_ENABLED !== 'true') return;
    setLoading(true);
    setMessage('');
    try {
      // Check if already subscribed
      const checkResponse = await fetch(`/api/mailerlite/subscribers/${encodeURIComponent(email)}`);
      if (checkResponse.ok) {
        const data = await checkResponse.json();
      
        
        if (data) {
          setAlreadySubscribed(true);

          setMessage('Already subscribed');


        } else {
          // Proceed to subscribe
        
          const response = await fetch(`/api/mailerlite/subscribers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });
          if (response.ok) {
            setMessage('Subscribed successfully');
            setSubscribed(true);
          } else {
            setMessage('Failed to subscribe');
          }
        }
      } else {
        // Proceed to subscribe
        const response = await fetch(`/api/mailerlite/subscribers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });
        if (response.ok) {
          setMessage('Subscribed successfully');
          setSubscribed(true);
        } else {
          setMessage('Failed to subscribe');
        }
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="hidden lg:block bg-[#202020] text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute right-25 top-2 opacity-100">
        <svg
          width="320"
          height="566"
          viewBox="0 0 320 568"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M274.216 0.814453C259.676 1.30186 248.324 2.33084 233.676 4.82206C248.379 5.09284 257.73 5.90519 269.946 7.47574C270.27 3.35982 272.865 1.62681 274.162 0.86861L274.216 0.814453Z"
            fill="#2E2E2E"
          />
          <path
            d="M190.486 15.8164C163.676 25.2397 148.757 33.5798 134.108 42.4074C153.621 37.6416 168.757 36.8834 182.703 36.3418C183.081 27.1893 186.703 19.8782 190.486 15.8706V15.8164Z"
            fill="#2E2E2E"
          />
          <path
            d="M95.8375 84.0539C98.5943 74.089 104.702 64.395 109.459 59.3584C89.5672 74.6306 69.6753 94.5603 54.2158 115.844C70.8104 102.196 81.2429 94.0729 95.8375 83.9997V84.0539Z"
            fill="#2E2E2E"
          />
          <path
            d="M319.892 47.7692C301.676 40.1873 290.757 33.6885 281.784 26.8105C276.487 40.7288 272.325 53.1307 267.406 71.5441C298.973 57.0842 302.703 55.297 319.892 47.7151V47.7692Z"
            fill="#2E2E2E"
          />
          <path
            d="M247.244 186.735C259.027 180.777 292.054 163.989 319.838 149.854C306 142.922 270.541 123.642 257.46 115.41C253.946 134.528 249.73 161.823 247.189 186.735H247.244Z"
            fill="#2E2E2E"
          />
          <path
            d="M193.784 67.3193C181.297 84.4329 171.243 102.846 161.729 123.967C183.73 111.945 207.189 100.355 222.757 92.8813C208.648 82.5374 201.081 75.8761 193.784 67.3193Z"
            fill="#2E2E2E"
          />
          <path
            d="M143.298 175.687C137.136 200.328 133.568 224.807 131.514 251.831C154.92 236.505 177.514 223.399 196.812 212.839C172.163 197.133 156.217 186.193 143.352 175.633L143.298 175.687Z"
            fill="#2E2E2E"
          />
          <path
            d="M67.6211 183.053C84.1617 170.434 102.27 158.682 116.108 150.18C106.702 139.132 100.864 129.763 97.2968 120.177C84.9725 138.915 68.8103 176.067 67.6211 183.053Z"
            fill="#2E2E2E"
          />
          <path
            d="M22.7027 170.379C11.7838 195.291 3.13514 224.211 0 260.713C6.21622 245.874 17.4595 228.381 28.5946 216.575C21.7298 200.978 20.3784 183.702 22.7027 170.325V170.379Z"
            fill="#2E2E2E"
          />
          <path
            d="M320 283.946C320 283.946 312.541 279.776 301.838 273.819C285.135 264.45 260.486 250.64 243.622 240.892V327.001C260.541 317.307 285.135 303.443 301.838 294.074C312.541 288.062 320 283.946 320 283.946Z"
            fill="#2E2E2E"
          />
          <path
            d="M270 560.525C257.784 562.096 248.379 562.908 233.73 563.179C248.325 565.67 259.73 566.699 274.271 567.187C272.973 566.428 270.379 564.641 270.054 560.58L270 560.525Z"
            fill="#2E2E2E"
          />
          <path
            d="M134.108 525.539C148.757 534.367 163.676 542.707 190.486 552.13C186.649 548.068 183.081 540.811 182.703 531.659C168.757 531.117 153.621 530.305 134.108 525.593V525.539Z"
            fill="#2E2E2E"
          />
          <path
            d="M54.2158 452.049C69.7294 473.333 89.5672 493.263 109.459 508.535C104.702 503.552 98.5943 493.804 95.8375 483.839C81.1888 473.766 70.7564 465.697 54.2158 451.995V452.049Z"
            fill="#2E2E2E"
          />
          <path
            d="M281.784 541.083C290.757 534.205 301.676 527.76 319.892 520.124C302.649 512.542 298.919 510.809 267.406 496.295C272.325 514.708 276.487 527.164 281.784 541.028V541.083Z"
            fill="#2E2E2E"
          />
          <path
            d="M319.893 418.092C292.055 403.957 259.028 387.169 247.298 381.157C249.839 406.124 254.001 433.364 257.569 452.482C270.65 444.25 306.109 425.024 319.947 418.038L319.893 418.092Z"
            fill="#2E2E2E"
          />
          <path
            d="M193.784 500.627C201.081 492.071 208.594 485.464 222.757 475.066C207.189 467.538 183.73 456.002 161.729 443.979C171.297 465.101 181.297 483.514 193.784 500.627Z"
            fill="#2E2E2E"
          />
          <path
            d="M196.757 355.054C177.46 344.548 154.865 331.388 131.46 316.062C133.568 343.14 137.082 367.565 143.244 392.206C156.109 381.645 172.055 370.706 196.703 355L196.757 355.054Z"
            fill="#2E2E2E"
          />
          <path
            d="M97.2968 447.717C100.81 438.131 106.648 428.708 116.108 417.714C102.27 409.211 84.1076 397.459 67.6211 384.841C68.8103 391.827 84.9725 428.979 97.2968 447.717Z"
            fill="#2E2E2E"
          />
          <path
            d="M0 307.179C3.13514 343.681 11.7838 372.655 22.7027 397.513C20.3784 384.19 21.7298 366.86 28.5946 351.263C17.5135 339.457 6.27028 322.018 0 307.125V307.179Z"
            fill="#2E2E2E"
          />
          <path
            d="M87.1359 284C75.7845 273.927 67.7304 266.291 61.0277 259.467C57.7304 256.109 54.7574 252.968 51.8926 249.827V318.119C54.7574 314.978 57.7304 311.837 61.0277 308.533C67.7304 301.709 75.7845 294.127 87.1359 284Z"
            fill="#2E2E2E"
          />
        </svg>
      </div>

      <div className="relative z-10 px-[110px] py-[60px]">
        <div className="flex justify-between">
          {/* Newsletter Section */}
          <div className="w-[255px] mr-[64px]">
            <Link href="/" scroll={true}>
              <div className="mb-[88px]">
                <Image
                  src={getStrapiMediaUrl(logo?.image?.url || '/world-fzo-logo.svg')}
                  alt="World FZO Logo"
                  width={184}
                  height={48}
                  className="w-[184px] h-12"
                />
              </div>
            </Link>

            <div className="space-y-6">
              <div>
                <h3 className="font-source text-base font-normal mb-3">
                  {footRes?.newsLetter?.title || 'Newsletter'}
                </h3>
                <p className="text-xs font-source font-normal text-white leading-4">
                  {footRes?.newsLetter?.description ||
                    'Subscribe to our newsletter and stay updated with the latest World FZO news, events, and insights.'}
                </p>
              </div>

              <div className="space-y-1">
                <div
                  className={`flex items-center border-b-2 ${showError ? 'border-red-300' : ''} pb-1 h-12`}
                >
                  <Image
                    src={iconMap[footRes?.newsLetter?.emailIcon] || '/assets/default.svg'}
                    alt="send"
                    width="24"
                    height="24"
                    className={`mr-2 ${iconColor}`}
                  />
                  <input
                    type="text"
                    placeholder={footRes?.newsLetter?.emailText || 'E-mail Address'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched(true)}
                    disabled={subscribed}
                    className={`flex-1 bg-transparent font-source text-base ${inputTextColor}`}
                  />
                  <Image
                    src={iconMap[footRes?.newsLetter?.sendIcon] || '/assets/default.svg'}
                    alt="send"
                    width="24"
                    height="24"
                    className={`mr-2 ${iconColor}`}
                  />
                </div>
                {showError && (
                  <p className="text-xs font-source text-red-300">
                    Please enter a valid email address.
                  </p>
                )}
              </div>

              <LightButton onClick={handleSubscription} disabled={loading || !isValid || subscribed}>
                {loading ? 'Loading...' : subscribed ? 'Subscribed' : alreadySubscribed ? 'Already Subscribed' : (footRes?.newsLetter?.subscribeText || 'Subscribe')}
              </LightButton>
              {/* {message && <p className="text-xs font-source text-white mt-2">{message}</p>} */}
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="flex flex-wrap gap-[51px]">
            {refinedData
              .filter((section) => section.children && section.children.length > 0)
              .map((section) => (
                <div key={section.label} className="w-[127px]">
                  <h3 className="font-montserrat font-bold text-xl mb-3">{section.label}</h3>
                  <div className="space-y-2">
                    {section.children?.map((child) => (
                      <a
                        key={child.label}
                        href={child.url}
                        className="block text-xs font-source font-bold text-white hover:text-wfzo-gold-200 transition-colors leading-4"
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="flex items-center space-x-8 mt-[116px] mb-[16px]">
          {footRes?.socialLinks?.map((social: any, idx: number) => (
            <SocialIcon
              key={social.platform || idx}
              icon={
                <Image
                  src={iconMap[social.platform] || '/assets/default.svg'}
                  alt={social.platform || 'Social Icon'}
                  width={20}
                  height={20}
                  className="w-6 h-6"
                />
              }
            />
          ))}
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-[#4D4D4D] mb-6"></div>

        {/* Footer Bottom */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-source font-normal text-white">
            {footRes?.copyrightText ||
              '© Copyright 2025 World Free Zones Organization, All rights reserved.'}
          </p>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              {footRes?.legalLinks?.map((link: any, idx: number) => (
                <a
                  key={link.id}
                  href={link.href}
                  className="text-xs font-source font-normal text-white hover:text-wfzo-gold-200"
                >
                  {link.title}
                </a>
              ))}
            </div>

            <div className="relative">
              {/* Main Selector */}
              <div
                className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 w-[150px] cursor-pointer"
                onClick={() => setOpen(!open)}
              >
                <span className="text-wfzo-grey-900 font-source text-base flex-1">
                  {selectedLang}
                </span>
                <Image
                  src="/assets/dropdown_black.svg"
                  alt="Dropdown"
                  width={24}
                  height={24}
                  className={`w-6 h-6 text-wfzo-grey-900 transition-transform ${
                    open ? 'rotate-180' : 'rotate-0'
                  }`}
                />
              </div>

              {/* Dropdown List */}
              {open && (
                <div className="absolute bottom-full mb-2 bg-white rounded-xl shadow-lg w-[150px] z-10">
                  {footRes?.languages?.map((lang: any) => (
                    <div
                      key={lang.id}
                      className={`px-4 py-2 text-wfzo-grey-900 font-source text-base cursor-pointer hover:bg-gray-100 ${
                        lang.title === selectedLang ? 'font-semibold' : ''
                      }`}
                      onClick={() => {
                        handleLocaleChange(lang.title,lang.code);
                        setOpen(false);
                      }}
                    >
                      {lang.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function MobileFooter({
  refinedData,
  footRes,
  logo,
}: {
  refinedData: NavigationItem[];
  footRes: any;
  logo: any;
}) {
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const { selectedLang, handleLocaleChange } = useLocaleSwitcher(footRes);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  const showError = touched && !isValid && email.length > 0;

  const iconColor =
    email.length === 0
      ? 'text-white'
      : showError
        ? 'text-red-300'
        : isValid
          ? 'text-green-400'
          : 'text-white';

  const handleSubscription = async () => {
    if (!isValid) return;
    if (process.env.NEXT_PUBLIC_MAILERLITE_ENABLED !== 'true') return;
    setLoading(true);
    setMessage('');
    try {
      // Check if already subscribed
      const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}wfzo/api/v1/mailerlite/subscribers/${encodeURIComponent(email)}`);
      if (checkResponse.ok) {
        const data = await checkResponse.json();
        if (data) {
          setAlreadySubscribed(true);
          setMessage('Already subscribed');
          
        } else {
          // Proceed to subscribe
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}wfzo/api/v1/mailerlite/subscribers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });
          if (response.ok) {
            setMessage('Subscribed successfully');
            setSubscribed(true);
          } else {
            setMessage('Failed to subscribe');
          }
        }
      } else {
        // Proceed to subscribe
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}wfzo/api/v1/mailerlite/subscribers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });
        if (response.ok) {
          setMessage('Subscribed successfully');
          setSubscribed(true);

        } else {
          setMessage('Failed to subscribe');
        }
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  return (
    <footer className="lg:hidden bg-zinc-800 text-white pt-8">
      <div className="px-5 py-5">
        {/* Header with Logo and Language */}
        <div className="flex items-center justify-between mb-5">
          <Link href="/">
            <Image
              src={getStrapiMediaUrl(logo?.image?.url || '/world-fzo-logo.svg')}
              alt="World FZO Logo"
              width={128} // approximate width, optional since w-auto
              height={32} // h-8 = 32px
              className="h-8 w-auto"
            />
          </Link>

          <div className="relative">
            {/* Main Selector */}
            <div
              className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 w-[150px] cursor-pointer"
              onClick={() => setOpen(!open)}
            >
              <span className="text-wfzo-grey-900 font-source text-base flex-1">
                {selectedLang}
              </span>
              <Image
                src="/assets/dropdown_black.svg"
                alt="Dropdown"
                width={24}
                height={24}
                className={`w-6 h-6 text-wfzo-grey-900 transition-transform ${
                  open ? 'rotate-180' : 'rotate-0'
                }`}
              />
            </div>

            {/* Dropdown List */}
            {open && (
              <div className="absolute mt-2 bg-white rounded-xl shadow-lg w-[150px] z-10">
                {footRes?.languages?.map((lang: any) => (
                  <div
                    key={lang.id}
                    className={`px-4 py-2 text-wfzo-grey-900 font-source text-base cursor-pointer hover:bg-gray-100 ${
                      lang.title === selectedLang ? 'font-semibold' : ''
                    }`}
                    onClick={() => {
                      handleLocaleChange(lang.title,lang.code);
                      setOpen(false);
                    }}
                  >
                    {lang.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Collapsible Sections */}
        <div className="space-y-0">
          {refinedData
            .filter((section) => section.children && section.children.length > 0)
            .map((section) => (
              <div key={section.label}>
                <button
                  onClick={() => toggleSection(section.label)}
                  className="flex items-center justify-between w-full py-6 px-8 border-b border-wfzo-grey-700"
                >
                  <span className="font-source text-white">{section.label}</span>
                  <div className="text-white">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M11.5 12.5H6V11.5H11.5V6H12.5V11.5H18V12.5H12.5V18H11.5V12.5Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </button>
                {openSections.includes(section.label) && (
                  <div className="px-8 py-4 space-y-3">
                    {section.children?.map((child) => (
                      <a
                        key={child.label}
                        href={child.url}
                        className="block text-sm font-source font-bold text-white"
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Social Media */}
        <div className="flex justify-center space-x-8 py-5">
          {footRes?.socialLinks?.map((social: any, idx: number) => (
            <SocialIcon
              key={social.platform || idx}
              icon={
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.platform || 'Social Link'}
                >
                  <Image
                    src={iconMap[social.platform] || '/assets/default.svg'}
                    alt={social.platform || 'Social Icon'}
                    width={20}
                    height={20}
                    className="w-6 h-6"
                  />
                </a>
              }
            />
          ))}
        </div>

        {/* Newsletter */}
        <div className="py-5 space-y-6">
          <div>
            <h3 className="font-source text-base mb-3">
              {footRes?.newsLetter?.title || 'Newsletter'}
            </h3>
            <p className="text-sm font-source text-white leading-relaxed">
              {footRes?.newsLetter?.description ||
                'Subscribe to our newsletter and stay updated with the latest World FZO news, events, and insights.'}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center border-b border-gray-500 pb-2">
              <Image
                src={iconMap[footRes?.newsLetter?.emailIcon] || '/assets/default.svg'}
                alt="send"
                width="24"
                height="24"
                className={`mr-2 ${iconColor}`}
              />
              <input
                type="email"
                placeholder={footRes?.newsLetter?.emailText || 'E-mail Address'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                disabled={subscribed}
                className="flex-1 bg-transparent text-white placeholder-white font-source focus:outline-none"
              />
              <Image
                src={iconMap[footRes?.newsLetter?.sendIcon] || '/assets/default.svg'}
                alt="send"
                width="24"
                height="24"
                className={`mr-2 ${iconColor}`}
              />
            </div>

            <div>
              {showError && (
                <p className="text-xs font-source text-red-300">
                  Please enter a valid email address.
                </p>
              )}
            </div>

            <LightButton onClick={handleSubscription} disabled={loading || !isValid || subscribed}>
              {loading ? 'Loading...' : subscribed ? 'Subscribed' : alreadySubscribed ? 'Already Subscribed' : (footRes?.newsLetter?.subscribeText || 'Subscribe')}
            </LightButton>
            {/* {message && <p className="text-xs font-source text-white mt-2">{message}</p>} */}
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="py-5 space-y-4">
          <p className="text-sm font-source text-white">
            {footRes?.copyrightText ||
              '© Copyright 2025 World Free Zones Organization, All rights reserved.'}
          </p>

          <div className="space-y-2">
            {footRes?.legalLinks?.map((link: any, idx: number) => (
              <p className="text-sm font-source text-white" key={link.id}>
                <a href={link.href} className="font-normal text-white hover:text-wfzo-gold-200">
                  {link.title}
                </a>
              </p>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
