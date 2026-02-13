import React from 'react';
import { ChevronRight } from 'lucide-react';

interface KnowledgeCardProps {
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
}

const KnowledgeCard: React.FC<KnowledgeCardProps> = ({
  title,
  description,
  href,
  onClick,
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      window.location.href = href;
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-6 p-8 rounded-[20px] border border-wfzo-gold-200 bg-wfzo-gold-50 hover:bg-wfzo-gold-100 transition-colors cursor-pointer text-left"
    >
      <div className="flex flex-col gap-4 flex-1">
        <h3 className="font-montserrat text-xl font-semibold leading-6 text-wfzo-grey-900">
          {title}
        </h3>
        <p className="font-source text-base font-normal leading-6 text-[#4D4D4D]">
          {description}
        </p>
      </div>
      <div className="flex-shrink-0">
        <ChevronRight className="w-6 h-6 text-wfzo-grey-700" />
      </div>
    </button>
  );
};

export default KnowledgeCard;
