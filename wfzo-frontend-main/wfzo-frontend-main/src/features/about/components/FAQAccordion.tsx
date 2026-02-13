'use client';
import { Plus, Minus } from 'lucide-react';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  uniqueId:string;
  expanded?: boolean;
  link?: {
    href: string;
    label?: string;
  };
}

interface FAQAccordionProps {
  items: FAQItem[];
  className?: string;
  activeItemId: string | null;
  onToggle: (id: string) => void;
}

export function FAQAccordion({ items = [], className = '' ,activeItemId,onToggle}: FAQAccordionProps) {


  return (
    <div className={`w-full font-source ${className}`}>
      {items.map((item) => {
        //const isOpen=activeItemId===item.uniqueId;
        const isExpanded = activeItemId === item.uniqueId;
        return (
          <div key={item.uniqueId} className="w-full border-b border-gold-200 mt-5">
            <button
              onClick={() => onToggle(item.uniqueId)}
              className="flex w-full items-center justify-between px-4 md:px-8 py-4 md:py-6 text-left transition-colors hover:bg-gold-200/10 cursor-pointer"
            >
              <span className="flex-1 font-source text-sm md:text-base font-bold leading-5 text-gray-700 pr-4">
                {item.question}
              </span>
              <div className="flex h-6 w-6 items-center justify-center">
                {isExpanded ? (
                  <Minus className="h-6 w-6 text-neutral-grey-700" />
                ) : (
                  <Plus className="h-6 w-6 text-neutral-grey-700" />
                )}
              </div>
            </button>
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-4 md:px-8 pb-4 md:pb-6">
                <p className="max-w-[650px] font-source-sans-pro text-sm md:text-base leading-6 text-gray-700">
                  {item.answer}{' '}
                  {item.link && (
                    <a
                      href={item.link.href}
                      className="font-montserrat font-bold underline ml-1 text-gold-600 hover:text-gold-800"
                    >
                      {item.link.label ?? 'click here'}
                    </a>
                  )}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
