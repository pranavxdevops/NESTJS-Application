'use client';

import { FAQAccordion } from './FAQAccordion';

interface FAQSectionProps {
  title: string;
  items: { question: string; answer: string; id: string ; uniqueId:string }[];
  className?: string;
  activeItemId: string | null;
  onToggle: (id: string) => void;
}

export default function FAQSection({ title, items=[], className = '',activeItemId, onToggle, }: FAQSectionProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <h2 className="font-montserrat text-2xl lg:text-3xl font-black leading-tight text-neutral-grey-900">
        {title}
      </h2>
      <FAQAccordion items={items} activeItemId={activeItemId} onToggle={onToggle} />
    </div>
  );
}
 