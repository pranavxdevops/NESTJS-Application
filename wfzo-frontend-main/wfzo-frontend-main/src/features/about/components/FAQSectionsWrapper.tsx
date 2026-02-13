
"use client";

import React, { useState } from "react";
import FAQSection from "@/features/about/components/FAQSection";
import { FAQItem } from "./FAQAccordion";

export default function FAQSectionsWrapper({ faqSections }: { faqSections: any[] }) {
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setActiveItemId(prev => (prev === id ? null : id));
  };

  return (
    <div>
      {faqSections.map((faqSection, idx) => (
        <FAQSection
          className="mb-12"
          key={faqSection.title + idx}
          title={faqSection.title}
          items={(faqSection.items || []).map((item:FAQItem)=>({
           ...item, uniqueId:`${idx}-${item.id}`,
          }))}
          activeItemId={activeItemId}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
}
 