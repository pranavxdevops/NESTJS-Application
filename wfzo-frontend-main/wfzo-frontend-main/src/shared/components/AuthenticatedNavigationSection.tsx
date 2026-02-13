"use client";

import { cn } from "@/lib/utils/cn";
import { useParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";

interface NavItem {
  label: string;
  icon: string;
  href: string;
  hasNotification?: boolean;
  notificationCount?: number;
}

interface NavigationBarProps {
  logoSrc?: string;
  items?: NavItem[];
  className?: string;
}

const FALLBACK_BG_IMAGE = "https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=2880";

export default function AuthenticatedNavigationSection({ 
  logoSrc = "https://api.builder.io/api/v1/image/assets/TEMP/5fe03ba44a7675f5fe353a59a65f440da75cb7ae?width=276",
  items = [],
  className 
}: NavigationBarProps) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.locale as string) || 'en';
  const isHomePage = pathname === `/${locale}`;
  const heroSectionHeight = isHomePage ? 700 : 400;
  
  const [showMinimalNav, setShowMinimalNav] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const defaultItems: NavItem[] = [
    {
      label: "Events",
      icon: "/assets/authenticated_nav_icons/events.svg",
      href: `/${locale}/events/dashboard`,
      hasNotification: true
    },
    {
      label: "Knowledge",
      icon: "/assets/authenticated_nav_icons/knowledge.svg",
      href: `/${locale}/knowledge`,
    },
    {
      label: "Network",
      icon: "/assets/authenticated_nav_icons/network.svg",
      href: `/${locale}/network`,
      hasNotification: true
    },
    {
      label: "Publications",
      icon: "/assets/authenticated_nav_icons/publications.svg",
      href: `/${locale}/publications`,
      hasNotification: true
    },
    {
      label: "Inbox",
      icon: "/assets/authenticated_nav_icons/inbox.svg",
      href: `/${locale}/inbox`,
      hasNotification: true
    },
    {
      label: "Search",
      icon: "/assets/authenticated_nav_icons/search.svg",
      href: `/${locale}/search`,
    },
    {
      label: "Profile",
      icon: "/assets/authenticated_nav_icons/profile.svg",
      href: `/${locale}/profile`,
      hasNotification: true
    }
  ];

  const navItems = items.length > 0 ? items : defaultItems;

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  // Scroll effect for minimal nav
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

  // Close mobile menu when switching to minimal nav
  useEffect(() => {
    if (showMinimalNav) {
      setIsMobileMenuOpen(false);
      setIsProfileDropdownOpen(false);
    }
  }, [showMinimalNav]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isProfileDropdownOpen && !target.closest('[data-profile-dropdown]')) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileDropdownOpen]);

  const handleLogout = async () => {
    try {
      console.log('🚪 Starting logout...');
      // Import the unified auth client
      const { logout } = await import("@/lib/auth/authClient");
      await logout();
      
      console.log('✅ Logout completed');
      // Navigate to home page with locale
      router.push(`/${locale}`);
      router.refresh();
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav
        className={cn(
          "hidden md:block fixed top-0 left-0 right-0 z-[502] w-full transition-all duration-500",
          className
        )}
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
        <div className={showMinimalNav ? 'backdrop-blur-lg bg-white/10 dark:bg-zinc-900/40' : 'glass-effect'}>
          <div className="flex flex-col px-4 md:px-6 lg:px-12 xl:px-20">
            {/* Nav Items */}
            <div
              className="flex justify-end items-center transition-all duration-600 ease-in-out h-14 md:h-16 lg:h-[68px]"
            >
              <div className="flex items-center space-x-3 md:space-x-6 lg:space-x-8 overflow-x-auto">
                {navItems.map((item) => {
                  if (item.label === 'Profile') {
                    return (
                      <div key={item.label} className="relative" data-profile-dropdown>
                        <button
                          onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                          className={cn(
                            "flex items-center px-3 md:px-3.5 lg:px-4 py-1.5 md:py-2",
                            "text-[13px] md:text-sm text-white font-source font-semibold",
                            "rounded-xl border border-transparent transition-all cursor-pointer",
                            pathname === item.href
                              ? "bg-white/20 text-white shadow-lg"
                              : "hover:backdrop-blur-md hover:bg-white/10 hover:border-white/20 hover:shadow-md"
                          )}
                        >
                          <div className="relative mr-2">
                            <Image 
                              src={item.icon} 
                              alt={item.label}
                              width={20}
                              height={20}
                              className="w-5 h-5"
                            />
                            {item.hasNotification && (
                              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
                            )}
                          </div>
                          <span>{item.label}</span>
                        </button>
                        
                        {/* Dropdown Menu */}
                        {isProfileDropdownOpen && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-zinc-200 py-2 z-[9999]">
                            <button
                              onClick={() => {
                                router.push(`/${locale}/profile`);
                                setIsProfileDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                            >
                              My Profile
                            </button>
                            <button
                              onClick={() => {
                                router.push(`/${locale}/profile/settings`);
                                setIsProfileDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                            >
                              Settings
                            </button>
                            <hr className="my-2 border-zinc-200" />
                            <button
                              onClick={handleLogout}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Sign Out
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  return (
                    <button
                      key={item.label}
                      onClick={() => handleNavigation(item.href)}
                      className={cn(
                        "flex items-center px-3 md:px-3.5 lg:px-4 py-1.5 md:py-2",
                        "text-[13px] md:text-sm text-white font-source font-semibold",
                        "rounded-xl border border-transparent transition-all cursor-pointer",
                        pathname === item.href
                          ? "bg-white/20 text-white shadow-lg"
                          : "hover:backdrop-blur-md hover:bg-white/10 hover:border-white/20 hover:shadow-md"
                      )}
                    >
                      <div className="relative mr-2">
                        <Image 
                          src={item.icon} 
                          alt={item.label}
                          width={20}
                          height={20}
                          className="w-5 h-5"
                        />
                        {item.hasNotification && (
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
                        )}
                      </div>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logo - Bottom Left */}
            <div className={`absolute bottom-[20px] left-4 md:left-6 lg:left-12 xl:left-20`}>
              <Link href={`/${locale}`}>
                <Image
                  src={logoSrc}
                  alt="World FZO Logo"
                  width={276}
                  height={80}
                  className={`${showMinimalNav ? 'h-8 w-auto lg:w-[138px] lg:h-auto' : 'w-[112px] md:w-[128px] lg:w-[138px] h-auto'}`}
                  unoptimized
                />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav
        className="md:hidden fixed top-0 left-0 right-0 z-[502] transition-all duration-500"
        style={{
          backgroundImage: showMinimalNav ? `url(${FALLBACK_BG_IMAGE})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        onClick={() => {
          if (isMobileMenuOpen) {
            setIsMobileMenuOpen(false);
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
            <Link href={`/${locale}`}>
              <Image
                src={logoSrc}
                alt="World FZO Logo"
                width={112}
                height={32}
                className="h-8 w-auto"
                unoptimized
              />
            </Link>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
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
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 space-y-3">
                {navItems.map((item) => {
                  if (item.label === 'Profile') {
                    return (
                      <div key={item.label}>
                        <button
                          type="button"
                          className={cn(
                            "w-full flex items-center justify-between py-3 px-3",
                            "text-left text-white border-b border-zinc-800/40",
                            "font-source font-semibold",
                            pathname === item.href && "bg-white/10"
                          )}
                          onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Image 
                                src={item.icon} 
                                alt={item.label}
                                width={20}
                                height={20}
                                className="w-5 h-5"
                              />
                              {item.hasNotification && (
                                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
                              )}
                            </div>
                            <span>{item.label}</span>
                          </div>
                        </button>
                        {isProfileDropdownOpen && (
                          <div className="pl-11 py-2 space-y-2 bg-zinc-800/50">
                            <button
                              onClick={() => {
                                router.push(`/${locale}/profile`);
                                setIsMobileMenuOpen(false);
                                setIsProfileDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-zinc-700/50 transition-colors rounded"
                            >
                              My Profile
                            </button>
                            <button
                              onClick={() => {
                                router.push(`/${locale}/profile/settings`);
                                setIsMobileMenuOpen(false);
                                setIsProfileDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-zinc-700/50 transition-colors rounded"
                            >
                              Settings
                            </button>
                            <button
                              onClick={() => {
                                handleLogout();
                                setIsMobileMenuOpen(false);
                                setIsProfileDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-900/30 transition-colors rounded"
                            >
                              Sign Out
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={cn(
                        "w-full flex items-center justify-between py-3 px-3",
                        "text-left text-white border-b border-zinc-800/40",
                        "font-source font-semibold",
                        pathname === item.href && "bg-white/10"
                      )}
                      onClick={() => {
                        handleNavigation(item.href);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Image 
                            src={item.icon} 
                            alt={item.label}
                            width={20}
                            height={20}
                            className="w-5 h-5"
                          />
                          {item.hasNotification && (
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
                          )}
                        </div>
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
