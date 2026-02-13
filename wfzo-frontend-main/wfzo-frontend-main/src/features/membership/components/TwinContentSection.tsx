import { FALLBACK_IMAGE } from "@/lib/constants/constants";
import { getStrapiMediaUrl } from "@/lib/utils/getMediaUrl";
import ContentSection from "@/shared/components/ContentSection";
import { ImageType } from "@/shared/types/globals";
import React from "react";


interface TwinContentSectionProps {
  sections: {
    title?: string;
    content: string;
    imageUrl: ImageType;
    imagePosition: "left" | "right";
    imageHeight?: "normal" | "tall";
    alignment?: string;
    backgroundImage?: string;
  }[];
}

export default function TwinContentSection({ sections }: TwinContentSectionProps) {

  const [first, second] = sections;

  return (
    <div className="w-full max-w-full mx-auto py:10 md:py-20">
      {/* First Section (normal padding from ContentSection) */}
      <ContentSection
        title={first.title}
        content={first.content}
        imageUrl={
                  first?.imageUrl?.formats?.large
                    ? getStrapiMediaUrl(first.imageUrl.formats.large)
                    : first?.imageUrl?.url
                      ? getStrapiMediaUrl(first.imageUrl.url)
                      : FALLBACK_IMAGE
                } 
        imagePosition={first.imagePosition}
        imageHeight={first.imageHeight || "tall"}
        alignment={first.alignment || "center"}
        backgroundImage={first.backgroundImage}
        className="pt-0 md:pt-0 pb-0 md:pb-0"
      />

      {/* Second Section (remove top padding and adjust gap) */}
      <div className="mt-6 md:mt-16"> {/* 24px mobile, 64px desktop */}
        <ContentSection
          title={second.title}
          content={second.content}
          imageUrl={
                  second?.imageUrl?.formats?.large
                    ? getStrapiMediaUrl(second.imageUrl.formats.large)
                    : second?.imageUrl?.url
                      ? getStrapiMediaUrl(second.imageUrl.url)
                      : FALLBACK_IMAGE
                } 
          imagePosition={second.imagePosition}
          imageHeight={second.imageHeight || "tall"}
          alignment={second.alignment || "center"}
          backgroundImage={second.backgroundImage}
          className="pt-0 md:pt-0 pb-0 md:pb-0" // removes top padding for seamless stacking
        />
      </div>
    </div>
  );
}
