import React from "react";
import { Link } from "i18n/navigation";
import { parseRichText } from "@/lib/utils/renderRichText";


interface CTA {
  href: string | null;
  title: string | null;
  targetBlank?: boolean;
  // descri?: string | null;
}

export interface ContentHeaderProps {
  header: string;
  description?: string | React.ReactNode;
  cta?: CTA | null;
  exploreAllHref?: string;
  exploreAllHash?: string; 
  showExploreAll?: boolean;
  showOrgName?: string;
  pageHeading?: boolean;
}

const ContentHeader: React.FC<ContentHeaderProps> = ({ header, description="", cta, exploreAllHref,
  exploreAllHash, showExploreAll, pageHeading= true, showOrgName = "" }) => {
  // Final href = base + hash if provided
  const finalExploreAllHref = exploreAllHref
    ? `${exploreAllHref}${exploreAllHash || ""}`
    : null;
 
  return (
    <div className={`${pageHeading ? "" : "mb-6"}`}>
      <div className="flex items-center justify-between gap-4">
      {/* Title */}
      <h2 className={`${pageHeading? "lg:text-5xl md:text-3xl " : "lg:text-3xl md:text-2xl "} ${ description? "mb-6 mt-6" : "mt-6"} text-3xl font-montserrat font-black text-wfzo-grey-900`}>
        {header}
      </h2>
      
      {/* Conditionally render Explore All only if showExploreAll is true and URL is provided */}
      {!description && showExploreAll && finalExploreAllHref && (
        <Link
          href={finalExploreAllHref as any}
          className="text-wfzo-gold-600 font-source font-bold hover:text-wfzo-gold-700 ml-0 md:ml-8 md:mt-0 "
        >
          Explore All
        </Link>
      )}
      </div>
      {/* Summary + inline CTA */}
      {/* <div className="font-source leading-relaxed flex-wrap flex items-end justify-between gap-4">
        {description && 
        <p className="text-gray-700 max-w-2xl">
          {description}{" "}
          {cta?.href && cta?.title && (
            <Link
              href={cta.href || "/" as any}
              target={cta.targetBlank ? "_blank" : "_self"}
              className="text-wfzo-grey-700 font-bold underline hover:text-wfzo-gold-600"
            >
              {cta.title}
            </Link>
          )}
        </p>
        }
        {description && showExploreAll && finalExploreAllHref && (
        <Link
          href={finalExploreAllHref as any}
          className="text-wfzo-gold-600 font-source font-bold hover:text-wfzo-gold-700 ml-auto"
        >
          Explore All
        </Link>
      )}
      
      </div> */}
      {showOrgName && <div className="font-source text-base leading-6 font-semibold text-wfzo-gold-600 mb-2">
        {showOrgName}
        </div>}
      <div className="font-source leading-relaxed flex-wrap flex items-end justify-between gap-4">
  {description && (
    <div className="text-gray-700 max-w-2xl">
      <div
        dangerouslySetInnerHTML={{ __html: parseRichText(description) }}
      />

      {cta?.href && cta?.title && (
        <Link
          href={cta.href || "/" as any}
          target={cta.targetBlank ? "_blank" : "_self"}
          className="text-wfzo-grey-700 font-bold underline hover:text-wfzo-gold-600"
        >
          {cta.title}
        </Link>
      )}
    </div>
  )}

  {description && showExploreAll && finalExploreAllHref && (
    <Link
      href={finalExploreAllHref as any}
      className="text-wfzo-gold-600 font-source font-bold hover:text-wfzo-gold-700 ml-auto"
    >
      Explore All
    </Link>
  )}
</div>

    </div>
  );
}; 
export default ContentHeader;
