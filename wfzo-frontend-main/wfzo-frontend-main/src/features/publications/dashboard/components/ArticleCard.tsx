'use client';

import React from 'react';
import { AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react';
import { ArticleData } from '../PublicationsDashboard';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import Image from 'next/image';

interface ArticleCardProps {
  article: ArticleData;
  onEdit: () => void;
}

export default function ArticleCard({ article, onEdit }: ArticleCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft':
        return {
          label: 'Draft',
          bgColor: 'bg-wfzo-grey-200',
          textColor: 'text-wfzo-grey-500',
          borderColor: 'border-wfzo-grey-500',
          icon: <FileText className="w-3 h-3" />,
        };
      case 'pending':
        return {
          label: 'Pending review',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-500',
          borderColor: 'border-yellow-500',
          icon: <Clock className="w-3 h-3" />,
        };
      case 'rejected':
        return {
          label: 'Rejected',
          bgColor: 'bg-red-50',
          textColor: 'text-red-500',
          borderColor: 'border-red-500',
          icon: <AlertCircle className="w-3 h-3" />,
          showIndicator: true,
        };
      case 'approved':
        return {
          label: 'Approved',
          bgColor: 'bg-green-50',
          textColor: 'text-green-500',
          borderColor: 'border-green-500',
          icon: <CheckCircle className="w-3 h-3" />,
          showIndicator: true,
        };
      case 'published':
        return {
          label: 'Published',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-500',
          borderColor: 'border-blue-500',
          icon: <CheckCircle className="w-3 h-3" />,
        };
      default:
        return {
          label: 'Draft',
          bgColor: 'bg-wfzo-grey-200',
          textColor: 'text-wfzo-grey-500',
          borderColor: 'border-wfzo-grey-500',
          icon: <FileText className="w-3 h-3" />,
        };
    }
  };

  const statusConfig = getStatusConfig(article.newsStatus || 'draft');
  const imageUrl = article.newsImage?.url || article.attributes?.newsImage?.url;
  const formattedDate = article.updatedAt
    ? new Date(article.updatedAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="flex items-start gap-4 py-3 border-b border-wfzo-gold-200 last:border-0">
      {/* Thumbnail */}
      <div className="relative w-[60px] h-[60px] rounded-xl overflow-hidden bg-wfzo-grey-200 flex-shrink-0">
        {imageUrl ? (
          <Image
            src={getStrapiMediaUrl(imageUrl)}
            alt={article.title || 'Article'}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-wfzo-grey-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1 mb-2">
          {statusConfig.showIndicator && (
            <div className="flex items-center justify-center w-3 h-5 pt-1 flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-red-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-red-200" />
              </div>
            </div>
          )}
          <h3
            className="font-source font-bold text-[16px] leading-5 text-wfzo-grey-900 cursor-pointer hover:text-wfzo-gold-600 transition-colors"
            onClick={onEdit}
          >
            {article.title || article.attributes?.title || 'Untitled Article'}
          </h3>
        </div>

        <p className="font-source text-[12px] leading-4 text-wfzo-grey-700 mb-2">
          {formattedDate}
        </p>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div
            className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-xl border ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}
          >
            {statusConfig.icon}
            <span className="font-source text-[12px] leading-4">{statusConfig.label}</span>
          </div>

          {/* Action Button - varies by status */}
          {article.newsStatus === 'approved' && (
            <button
              onClick={onEdit}
              className="px-6 py-2 rounded-xl border-2 border-wfzo-gold-600 font-source font-semibold text-[16px] leading-6 text-wfzo-gold-600 hover:bg-wfzo-gold-50 transition-colors"
            >
              Publish
            </button>
          )}

          {(article.newsStatus === 'draft' || article.newsStatus === 'pending' || article.newsStatus === 'rejected') && (
            <button
              onClick={onEdit}
              className="px-6 py-2 rounded-xl border-2 border-wfzo-grey-400 font-source font-semibold text-[16px] leading-6 text-wfzo-grey-700 hover:bg-wfzo-grey-100 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
