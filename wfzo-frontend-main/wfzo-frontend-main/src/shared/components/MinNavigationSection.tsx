'use client';
import Link from "next/link";
import Image from "next/image";
import LightButton from "./LightButton";

interface MinNavigationSectionProps {
  backgroundImage: string;
  className?: string; // allow passing custom logo size
  membershipUrl?: string;
  onSearchClick?:()=>void;
}

export default function MinNavigationSection({
  backgroundImage,
  className = "h-8  w-auto lg:w-[138px] lg:h-auto", // default same as desktop/mobile
  membershipUrl = 'https://www.worldfzo.org/Membership',
  onSearchClick 
}: MinNavigationSectionProps) {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[2000] w-full"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="backdrop-blur-lg bg-white/10 dark:bg-zinc-900/40 border-b border-white/20 dark:border-zinc-800/40 shadow-md">
        <div className="flex justify-between items-center h-14 lg:h-[72px] px-6 lg:px-20">
          {/* Logo */}
          <div>
            <Link href="/">
              <Image
                src="/wfzologo.png"
                alt="World FZO Logo"
                width={276}
                height={80}
                className={className}
                unoptimized
              />
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <a className="hidden lg:block"
              href={membershipUrl || '/'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <LightButton>Join us</LightButton>
            </a>

            <button type="button" aria-label="Search" className="p-1 text-white hover:text-wfzo-gold-200 transition" onClick={() => onSearchClick?.()}>
              <Image src="/assets/search.svg" alt="Search" width={24} height={24} />
            </button>

            <button type="button" aria-label="Account" className="p-1 text-white hover:text-wfzo-gold-200 transition">
              <Image src="/assets/account.svg" alt="Account" width={24} height={24} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
