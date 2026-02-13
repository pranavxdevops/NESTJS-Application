'use client';
import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import MinNavigationSection from '@/shared/components/MinNavigationSection';
import EventsCard from '@/shared/components/EventsCard';
import { useRouter } from 'i18n/navigation';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchOverlay from '@/shared/components/SearchOverlay';
import LightButton from '@/shared/components/LightButton';
import { FALLBACK_BG_IMAGE } from '@/lib/constants/constants';
import ProfileDropdownMenu from '@/shared/components/ProfileDropdownMenu';
import { useAuth } from '@/lib/auth/EntraAuthProvider';
import type { Locale } from 'i18n/routing';
export interface NavigationItem {
  label: string;
  url: string;
  children: NavigationItem[];
}

interface NavigationProps {
  logo: { image?: { url?: string } };
  refinedData: NavigationItem[];
  locale: string;
  dropIcon?: React.ReactNode;
  cta: {
    id: any;
    title: any;
    targetBlank: boolean;
    variant: any;
    type: any;
    url: any;
  } | null;
  heroSectionHeight?: number; // optional height to calculate minimal nav
  // Optional featured event to show inside mega menu right column
  featuredEvent?: {
    title?: string | null;
    slug?: string;
    organizer?: string | null;
    summary?: string | null;
    startDateTime?: string | null;
    endDateTime?: string | null;
    location?: string | null;
    registrationUrl?: string | null;
    image?: { image?: { url?: string | null } | null } | null;
    cta?: {
      href?: string | null;
      title?: string | null;
      targetBlank?: boolean | null;
      internalLink?: { fullPath?: string | null } | null;
    } | null;
  };
}

export default function NavigationMenu({
  refinedData,
  logo,
  dropIcon,
  cta,
  featuredEvent,
  locale,
}: NavigationProps) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const heroSectionHeight = isHomePage ? 700 : 400;
  const [showMinimalNav, setShowMinimalNav] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeMobileDropdown, setActiveMobileDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const onScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < lastScrollY) {
        // Scrolling up: show full nav
        setShowMinimalNav(false);
      } else if (currentScrollY > heroSectionHeight) {
        // Scrolling down past hero height: show minimal nav
        setShowMinimalNav(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    onScroll(); // initialize state

    return () => window.removeEventListener('scroll', onScroll);
  }, [heroSectionHeight]);

  const navRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  // // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (mobileNavRef.current && !mobileNavRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen((prev) => !prev);
        setActiveMobileDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Close dropdown when switching nav -> minNav
  useEffect(() => {
    if (showMinimalNav) {
      setIsMobileMenuOpen(false); // close mobile menu
      setActiveMobileDropdown(null); // close mobile submenus
      setActiveDropdown(null); // close desktop dropdowns
    }
  }, [showMinimalNav]);

  return (
    <>
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onResults={() => {}}
        onSubmit={(q: string) => {
          setSearchOpen(false);
          router.push(`/search?q=${encodeURIComponent(q)}` as never);
        }}
      />
      {/* Desktop Navigation */}
      <nav
        ref={navRef}
        onClick={() => setActiveDropdown(null)}
        className={`hidden md:block fixed top-0 left-0 right-0 z-[502] w-full
                    transition-all duration-500
                    `}
        style={
          showMinimalNav
            ? {
                backgroundImage: `url(${FALLBACK_BG_IMAGE})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : {}
        }
      >
        <div className="glass-effect">
          <div className="flex flex-col px-4 md:px-6 lg:px-12 xl:px-20">
            {/* Top Row: Actions */}
            <div className="flex justify-end items-center h-12 md:h-[56px] lg:h-[72px] space-x-2 md:space-x-4">
              {/* Actions */}
              <div className="flex items-center space-x-4">
                {!isAuthenticated && (
                  <Link
                    className="hidden lg:block"
                    href={cta?.url || ('/' as any)}
                    target={cta?.targetBlank ? '_blank' : ''}
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <LightButton>{locale === 'fr' ? 'Rejoignez-nous' : 'Join us'}</LightButton>
                  </Link>
                )}
                <button
                  type="button"
                  aria-label="Search"
                  className="p-1 text-white hover:text-wfzo-gold-200 transition cursor-pointer"
                  onClick={() => setSearchOpen(true)}
                >
                  <Image src="/assets/search.svg" alt="Search" width={24} height={24} />
                </button>
                <ProfileDropdownMenu isAuthenticated={isAuthenticated} />
              </div>
            </div>

            {/* Bottom Row: Logo + Nav */}

            <div
              className={`flex justify-end items-center overflow-hidden transition-all duration-600 ease-in-out ${
                showMinimalNav ? 'h-0' : 'h-14 md:h-16 lg:h-[68px]'
              }`}
            >
              <div className="flex items-center space-x-3 md:space-x-6 lg:space-x-8 overflow-x-auto">
                {refinedData.map((item: NavigationItem) => (
                  <NavDropdown
                    key={item.label}
                    label={item.label}
                    items={item.children?.map((c: NavigationItem) => ({
                      label: c.label,
                      url: c.url,
                    }))}
                    isActive={activeDropdown === item.label}
                    onToggle={() =>
                      setActiveDropdown(activeDropdown === item.label ? null : item.label)
                    }
                    dropIcon={dropIcon}
                    featuredEvent={featuredEvent}
                  />
                ))}
              </div>
            </div>

            <div className={`absolute bottom-[20px] left-4 md:left-6 lg:left-12 xl:left-20`}>
              <Link href="/">
                <Image
                  src={getStrapiMediaUrl(logo.image?.url || '/world-fzo-logo.svg')}
                  alt="World FZO Logo"
                  width={276}
                  height={80}
                  className={`${showMinimalNav ? 'h-8  w-auto lg:w-[138px] lg:h-auto' : 'w-[112px] md:w-[128px] lg:w-[138px] h-auto'}`}
                  unoptimized
                />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Minimal Navigation - Desktop Only */}
      {/* {showMinimalNav && (
        <div className="hidden md:block">
          <MinNavigationSection
            backgroundImage={FALLBACK_BG_IMAGE}
            className="h-8 lg:h-auto lg:w-[138px] w-auto"
            onSearchClick={() => setSearchOpen(true)}
          />
        </div>
      )} */}

      {/* Mobile Navigation - Unified Component with Smooth Transitions */}
      <nav
        ref={mobileNavRef}
        className="md:hidden fixed top-0 left-0 right-0 z-[502] transition-all duration-500 glass-effect"
        style={{
          backgroundImage: showMinimalNav ? `url(${FALLBACK_BG_IMAGE})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        onClick={() => {
          if (isMobileMenuOpen) {
            setIsMobileMenuOpen(false);
            setActiveMobileDropdown(null);
          }
        }}
      >
        <div
          className={`border-b border-white/20 shadow-md transition-all duration-500 ${
            showMinimalNav
              ? 'backdrop-blur-lg bg-white/10 dark:bg-zinc-900/40'
              : 'backdrop-blur-md bg-white/10 dark:bg-zinc-900/55 glass-effect'
          }`}
        >
          {/* Top Bar - Logo + Actions */}
          <div className="flex items-center justify-between h-14 px-5">
            {/* Logo */}
            <Link href="/">
              <Image
                src={getStrapiMediaUrl(logo.image?.url || '/world-fzo-logo.svg')}
                alt="World FZO Logo"
                width={112}
                height={32}
                className="h-8 w-auto"
                unoptimized
              />
            </Link>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              {/* Search Button */}
              <button
                type="button"
                aria-label="Search"
                className="text-white p-2 hover:text-wfzo-gold-200 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchOpen(true);
                }}
              >
                <Image src="/assets/search.svg" alt="Search" width={24} height={24} />
              </button>

              {/* Auth Button */}
              <ProfileDropdownMenu isAuthenticated={isAuthenticated} />

              {/* Menu Button - Hidden in minimal nav */}
              {!showMinimalNav && (
                <button
                  type="button"
                  aria-label="Menu"
                  className="text-white p-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMobileMenuOpen((s) => !s);
                  }}
                >
                  <Menu size={22} />
                </button>
              )}
            </div>
          </div>

          {/* Mobile Dropdown Menu - Only when NOT minimal */}
          {!showMinimalNav && (
            <div
              className={`absolute top-full left-0 right-0 bg-zinc-900/95 transition-all duration-800 overflow-hidden ${
                isMobileMenuOpen ? 'max-h-screen' : 'max-h-0 pointer-events-none'
              }`}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('button,[data-dropdown-trigger]')) return;
                setIsMobileMenuOpen(false);
                setActiveMobileDropdown(null);
              }}
            >
              <div className="px-5 py-4 space-y-3">
                {refinedData.map((item: NavigationItem) => (
                  <MobileNavItem
                    key={item.label}
                    label={item.label}
                    subItems={item.children?.map((c: NavigationItem) => ({
                      label: c.label,
                      url: c.url,
                    }))}
                    dropIcon={dropIcon}
                    isActive={activeMobileDropdown === item.label}
                    onToggle={() =>
                      setActiveMobileDropdown(
                        activeMobileDropdown === item.label ? null : item.label
                      )
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}

/* ---------------------- Desktop dropdown ---------------------- */
interface NavDropdownProps {
  label: string;
  items?: { label: string; url: string }[];
  isActive: boolean;
  onToggle: () => void;
  dropIcon?: React.ReactNode;
  featuredEvent?: {
    title?: string | null;
    slug?: string;
    organizer?: string | null;
    shortDescription?: string | null;
    startDateTime?: string | null;
    endDateTime?: string | null;
    location?: string | null;
    registrationUrl?: string | null;
    image?: { image?: { url?: string | null } | null } | null;
    cta?: {
      href?: string | null;
      title?: string | null;
      targetBlank?: boolean | null;
      internalLink?: { fullPath?: string | null } | null;
    } | null;
  };
}

function NavDropdown({
  label,
  items,
  isActive,
  onToggle,
  dropIcon,
  featuredEvent,
}: NavDropdownProps) {
  const hasChildren = items && items.length > 0;

  // Button ref to measure position for smart dropdown placement
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ left: number; top: number; width: number }>({
    left: 0,
    top: 0,
    width: 0,
  });
  // Local search state and router for redirecting to results
  const router = useRouter();
  const [query, setQuery] = useState('');
  const chips = ['News', 'Articles', 'Membership', 'Congress'];

  function computeMenuPos() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const margin = 16; // viewport padding to avoid touching edges
    const maxWidth = 1440;
    const menuW = Math.min(viewportW - margin * 2, maxWidth);
    // Try to center dropdown around the trigger; clamp to viewport
    const desiredLeft = rect.left + rect.width / 2 - menuW / 2;
    const clampedLeft = Math.max(margin, Math.min(desiredLeft, viewportW - menuW - margin));
    const top = rect.bottom + 16; // 16px gap below the trigger
    setMenuPos({ left: clampedLeft, top, width: menuW });
  }

  // Recompute when opening and on resize/scroll (layout effect to avoid initial flash)
  useLayoutEffect(() => {
    if (!isActive) return;
    computeMenuPos();
    const onResize = () => computeMenuPos();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize);
    };
  }, [isActive]);
  // Note: Title casing helper was removed since chips are now static labels matching SearchOverlay

  const isReady = isActive && menuPos.width > 0;
  const hasFeatured = Boolean(featuredEvent);

  function doSearch() {
    const q = query.trim();
    if (!q) return;
    // Close dropdown then navigate to the search page
    onToggle();
    router.push(`/search?q=${encodeURIComponent(q)}` as never);
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          // Precompute position before showing to avoid initial top-left placement
          computeMenuPos();
          onToggle();
        }}
        className={`flex items-center px-3 md:px-3.5 lg:px-4 py-1.5 md:py-2 text-[13px] md:text-sm text-white font-source font-semibold rounded-xl border border-transparent transition-all cursor-pointer ${
          isActive
            ? 'bg-white/20 text-white shadow-lg font-semibold'
            : 'text-white hover:backdrop-blur-md hover:bg-white/10 hover:border-white/20 hover:shadow-md'
        }`}
      >
        <span>{label}</span>
        {hasChildren && dropIcon}
      </button>

      {/* Desktop mega dropdown (fixed + clamped within viewport) */}
      {hasChildren && (
        <div
          className={`hidden md:block fixed z-[9999] origin-top transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isReady
              ? 'opacity-100 visible scale-100 translate-y-0'
              : 'opacity-0 invisible scale-95 -translate-y-1.5'
          }`}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            left: menuPos.width ? menuPos.left : undefined,
            top: menuPos.width ? menuPos.top : undefined,
            width: menuPos.width ? menuPos.width : undefined,
          }}
        >
          <div className="max-h-[80vh] overflow-y-auto rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] bg-white border border-zinc-200 px-6 md:px-10 lg:px-14 xl:px-[120px] py-6 md:py-8">
            <div
              className={`grid gap-8 h-full ${
                hasFeatured
                  ? 'md:grid-cols-[0.9fr_1.1fr] lg:grid-cols-[1fr_1.15fr_1.1fr]'
                  : 'md:grid-cols-[1fr_1.15fr]'
              }`}
            >
              {/* Left column: search + tags */}
              <div className="pr-8 border-r border-zinc-200">
                <div className="flex items-center gap-3 pb-3 mb-6 border-b border-zinc-200">
                  <Image
                    src="/assets/search.svg"
                    alt="Search"
                    width={20}
                    height={20}
                    className="opacity-60"
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') doSearch();
                    }}
                    type="text"
                    placeholder="Search"
                    className="w-full outline-none placeholder:text-zinc-400 text-zinc-700"
                  />
                  <button
                    type="button"
                    aria-label="Search"
                    onClick={doSearch}
                    className="p-1 disabled:opacity-50"
                    disabled={!query.trim()}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M19.8 12.925L4.4 19.425C4.06667 19.5583 3.75 19.5291 3.45 19.3375C3.15 19.1458 3 18.8666 3 18.5V5.49997C3 5.1333 3.15 4.85414 3.45 4.66247C3.75 4.4708 4.06667 4.44164 4.4 4.57497L19.8 11.075C20.2167 11.2583 20.425 11.5666 20.425 12C20.425 12.4333 20.2167 12.7416 19.8 12.925ZM5 17L16.85 12L5 6.99997V10.5L11 12L5 13.5V17Z"
                        fill="#BE9C74"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  {chips.map((c) => (
                    <button
                      key={`chip-${c}`}
                      type="button"
                      onClick={() => setQuery(c)}
                      className="inline-flex items-center rounded-xl px-3 py-2 text-sm bg-white border border-zinc-200 shadow-sm text-zinc-700 hover:bg-zinc-50"
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {/* Tablet-only featured event card after chips */}
                {hasFeatured && (
                  <div className="mt-6 hidden md:block lg:hidden">
                    <div className="w-full max-w-[520px]" onClick={() => onToggle()}>
                      <EventsCard
                        nav={true}
                        title={featuredEvent!.title || ''}
                        organization={featuredEvent!.organizer || ''}
                        location={featuredEvent!.location || ''}
                        description={featuredEvent!.shortDescription || ''}
                        date={(() => {
                          const start = featuredEvent!.startDateTime
                            ? new Date(featuredEvent!.startDateTime)
                            : null;
                          const end = featuredEvent!.endDateTime
                            ? new Date(featuredEvent!.endDateTime)
                            : null;
                          const fmt = (d: Date) =>
                            d.toLocaleDateString(undefined, {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            });
                          if (start && end) return `${fmt(start)} - ${fmt(end)}`;
                          if (start) return fmt(start);
                          return '';
                        })()}
                        image={getStrapiMediaUrl(
                          featuredEvent!.image?.image?.url || '/about-hero.jpg'
                        )}
                        variant="vertical"
                        singleItem
                        cta={{
                          url: `/events/upcoming-events/${featuredEvent!.slug}`,
                          title: featuredEvent!.cta?.title || 'Learn more',
                          targetBlank: Boolean(featuredEvent!.cta?.targetBlank),
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Middle column: list */}
              <div className={hasFeatured ? 'pr-8 border-r border-zinc-200' : 'pr-0'}>
                <ul className="divide-y divide-zinc-200">
                  {(items || []).map((it) => (
                    <li key={`mid-${it.label}`} className="">
                      <Link
                        href={it.url}
                        onClick={onToggle}
                        className="flex items-center justify-between py-6 px-6 hover:bg-zinc-50 rounded-lg text-zinc-800"
                      >
                        <span className="font-source text-[16px]">{it.label}</span>
                        <Image
                          src="/assets/chevron_next.svg"
                          alt="open"
                          width={16}
                          height={16}
                          className="opacity-40"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right column: featured event card (render only when exists) */}
              {hasFeatured && (
                <div className="hidden lg:flex items-start justify-center">
                  <div className="w-full max-w-[420px]" onClick={() => onToggle()}>
                    <EventsCard
                      nav={true}
                       title={featuredEvent!.title || ''}
                      organization={featuredEvent!.organizer || ''}
                      location={featuredEvent!.location || ''}
                      description={featuredEvent!.shortDescription || ''}
                      date={(() => {
                        const start = featuredEvent!.startDateTime
                          ? new Date(featuredEvent!.startDateTime)
                          : null;
                        const end = featuredEvent!.endDateTime
                          ? new Date(featuredEvent!.endDateTime)
                          : null;
                        const fmt = (d: Date) =>
                          d.toLocaleDateString(undefined, {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          });
                        if (start && end) return `${fmt(start)} - ${fmt(end)}`;
                        if (start) return fmt(start);
                        return '';
                      })()}
                      image={getStrapiMediaUrl(
                        featuredEvent!.image?.image?.url || '/about-hero.jpg'
                      )}
                      variant="vertical"
                      singleItem
                      cta={{
                        url: `/events/upcoming-events/${featuredEvent!.slug}`,
                        title: featuredEvent!.cta?.title || 'Learn more',
                        targetBlank: Boolean(featuredEvent!.cta?.targetBlank),
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------- Mobile nav item ---------------------- */
interface MobileNavItemProps {
  label: string;
  subItems?: { label: string; url: string }[];
  dropIcon?: React.ReactNode;
  isActive: boolean;
  onToggle: () => void;
}

function MobileNavItem({ label, subItems, dropIcon, isActive, onToggle }: MobileNavItemProps) {
  const hasSubItems = subItems && subItems.length > 0;

  return (
    <div>
      <button
        type="button"
        data-dropdown-toggle
        className="w-full flex items-center justify-between py-3 px-3 text-left text-white border-b border-zinc-800/40 font-source font-semibold"
        onClick={(e) => {
          e.stopPropagation();
          if (hasSubItems) onToggle();
        }}
      >
        <span>{label}</span>
        {hasSubItems && dropIcon}
      </button>

      {isActive && hasSubItems && (
        <div className="bg-zinc-900/95 px-4 py-2">
          {subItems!.map((s) => (
            <Link
              key={s.label}
              href={s.url}
              className="block py-2 text-sm text-white"
              onClick={() => onToggle()}
            >
              {s.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
