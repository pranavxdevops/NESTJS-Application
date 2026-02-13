'use client';

import { useRouter } from 'next/navigation';
import KnowledgeCard from './KnowledgeCard';

interface KnowledgeItem {
  title: string;
  description: string;
  href?: string;
}

interface ClientKnowledgeSectionProps {
  items: KnowledgeItem[];
}

const ClientKnowledgeSection: React.FC<ClientKnowledgeSectionProps> = ({ items }) => {
  const router = useRouter();

  const handleCardClick = (href?: string) => {
    if (href) {
      router.push(href);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {items.map((item, index) => (
        <KnowledgeCard
          key={index}
          title={item.title}
          description={item.description}
          onClick={() => handleCardClick(item.href)}
        />
      ))}
    </div>
  );
};

export default ClientKnowledgeSection;
