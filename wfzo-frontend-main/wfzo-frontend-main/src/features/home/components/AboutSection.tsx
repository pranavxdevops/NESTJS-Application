"use client";
import React from "react";
import StatCard from "@/shared/components/StatCard";
import { Link } from "i18n/navigation";
import Image from "next/image";
import { CONTENTHEADER_BG_IMAGE } from "@/lib/constants/constants";


interface CTA {
  id: number;
  url: string;
  title: string;
  targetBlank: boolean;
  variant: string;
  type: string;
  internalLink?: any;
}

interface Stat {
  id: number;
  value: number;
  suffix?: string;
  label: string;
  iconKey: string;
}

interface AboutSectionProps {
  id: number;
  title: string;
  shortDescription: string;
  backgroundImage: string;
  cta?: CTA | null;
  stats?: Stat[];
}

export default function AboutSection({
  title,
  shortDescription,
  backgroundImage,
  cta,
  stats = [],
}: AboutSectionProps) {
  const iconMap: Record<string, string> = {
    Members: "/assets/about_members.svg",
    Countries: "/assets/about_countries.svg",
    "Regional Offices": "/assets/about_regional.svg",
    "National Contact Points": "/assets/about_national.svg",
  };

  const roundValue = (label: string, value: number) => {
    if (label === "Members") return Math.floor(value / 100) * 100;
    if (label === "Countries") return Math.floor(value / 10) * 10;
    return value;
  };

  const withSuffix = (label: string) => {
    if (label === "Members" || label === "Countries") return "+";
    return undefined;
  };

  return (
    <section className="relative py-10 md:py-20 bg-[#FCFAF8]">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={
            backgroundImage ||
            CONTENTHEADER_BG_IMAGE
          }
          alt="Background"
          fill
          className="w-full h-full object-cover"
        />
      </div>

      {/* Full-section clickable overlay */}
      {/* {cta?.url && (
        <Link
          href={cta.url as any}
          target={cta.targetBlank ? "_blank" : "_self"}
          className="absolute inset-0 z-10"
          aria-label={cta.title}
        />
      )} */}

      {/* Actual Content */}
      <div className="relative z-20 mx-auto px-5 md:px-30">
        {/* Section Header */}
        <div className="text-center mb-16">
          {cta?.url && (
        <Link
          href={cta.url as any}
          target={cta.targetBlank ? "_blank" : "_self"}
          className="absolute inset-0 z-10"
          aria-label={cta.title}
        />
      )}
          <h2 className="text-4xl md:text-6xl font-montserrat font-black text-wfzo-grey-900 mb-6">
            {title}
          </h2>
          <div className="max-w-4xl mx-auto text-lg text-wfzo-grey-700 font-source leading-relaxed cursor-pointer">
            <p>
              {shortDescription}{" "}
              {cta && (
                <span className="relative z-20 text-wfzo-grey-700 font-bold underline hover:text-wfzo-gold-600 cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = cta.url;
                  }}>
                  {cta.title}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Stats Grid - Desktop */}
        {stats.length > 0 && (
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <StatCard
                key={stat.id}
                icon={
                  <Image
                    src={iconMap[stat.iconKey] ?? "/assets/default.svg"}
                    width={40}
                    height={40}
                    alt={stat.iconKey}
                    className="w-10 h-10"
                  />
                }
                value={roundValue(stat.label, stat.value)}
                suffix={withSuffix(stat.label)}
                label={stat.label}
              />
            ))}
          </div>
        )}

        {/* Stats Grid - Mobile */}
        {stats.length > 0 && (
          <div className="md:hidden space-y-8">
            {stats.map((stat) => (
              <StatCard
                key={stat.id}
                icon={
                  <Image
                    src={iconMap[stat.label] ?? "/assets/default.svg"}
                    alt={stat.label}
                    width={40}
                    height={40}
                    className="w-10 h-10"
                  />
                }
                value={roundValue(stat.label, stat.value)}
                suffix={withSuffix(stat.label)}
                label={stat.label}
                isMobile
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
