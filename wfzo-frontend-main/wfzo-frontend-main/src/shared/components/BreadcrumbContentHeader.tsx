import React from 'react';
import { Breadcrumb, BreadcrumbItem } from '@/shared/components/Breadcrumb';
import ContentHeader, { ContentHeaderProps } from '@/shared/components/ContentHeader';

interface BreadcrumbContentHeaderProps {
  breadcrumbItems: BreadcrumbItem[];
  contentHeaderProps: ContentHeaderProps;
  containerClassName?: string; // for custom width/margin/padding if needed
  innerClassName?: string; // for custom width/margin/padding if needed
}

const BreadcrumbContentHeader: React.FC<BreadcrumbContentHeaderProps> = ({
  breadcrumbItems,
  contentHeaderProps,
  containerClassName = '',
  innerClassName = '',
}) => {
  return (
    <div
      className={`mx-auto 
        pt-10 pb-5 px-5
        md:pt-20 md:pb-10 md:px-30
        ${containerClassName}`}
    >
      <div className={`${innerClassName}`}>
        {/* Breadcrumb */}
        <div className="">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Content Header */}
        <div>
          <ContentHeader {...contentHeaderProps} />
        </div>
      </div>
    </div>
  );
};

export default BreadcrumbContentHeader;
