"use client";

import React, { useState } from "react";
import VideoFAQSection from "@/features/knowledge/components/VideoFAQSection";
// import { VideoFAQItem } from "./VideoFAQAccordion";

interface VideoFAQSectionData {
  title: string;
  items: {
    id: string;
    question: string;
    videos: { src: string; title?: string }[];
  }[];
}


export default function VideoFAQSectionsWrapper({ videoFaqSections }: { videoFaqSections?: VideoFAQSectionData[] }) {
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setActiveItemId(prev => (prev === id ? null : id));
  };

  // Dummy data for now
  const dummySections = [
    {
      title: "Frequently Asked Questions",
      items: [
        {
          id: "1",
          question: "What is the purpose of Ask an Expert?",
          videos: [
            { src: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4", title: "Introduction Video 1" },
            { src: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4", title: "Explanation Video 2" },
            { src: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4", title: "Demo Video 3" },
            { src: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_10mb.mp4", title: "Advanced Video 4" },
          ],
          uniqueId: "0-1",
        },
        {
          id: "2",
          question: "How do I submit a question?",
          videos: [
            { src: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4", title: "Step 1 Video" },
            { src: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4", title: "Step 2 Video" },
          ],
          uniqueId: "0-2",
        },
      ],
    },
    {
      title: "Expert Tips",
      items: [
        {
          id: "3",
          question: "Tips for getting the best response?",
          videos: [
            { src: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4", title: "Tip Video 1" },
            { src: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_10mb.mp4", title: "Tip Video 2" },
            { src: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4", title: "Tip Video 3" },
            { src: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4", title: "Tip Video 4" },
            { src: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4", title: "Tip Video 5" },
          ],
          uniqueId: "1-3",
        },
      ],
    },
  ];

  const sectionsToUse = videoFaqSections && videoFaqSections.length > 0 ? videoFaqSections : dummySections;

  return (
    <div className="py-10 md:py-20">
      {sectionsToUse.map((videoSection, idx) => (
        <VideoFAQSection
          className="mb-12"
          key={videoSection.title + idx}
          title={videoSection.title}
          items={videoSection.items.map((item) => ({
            ...item,
            uniqueId: `${idx}-${item.id}`,
          }))}
          activeItemId={activeItemId}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
}