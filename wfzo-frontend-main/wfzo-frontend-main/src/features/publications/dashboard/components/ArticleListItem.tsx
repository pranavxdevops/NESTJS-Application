import { cn } from "@/lib/utils/cn";
import StatusBadge from "@/features/events/dashboard/component/StatusBadge";
import { ArticleData } from "../PublicationsDashboard";
import { getStrapiMediaUrl } from "@/lib/utils/getMediaUrl";

interface ArticleListItemProps {
  article: ArticleData;
  onClick?: () => void;
  onActionClick?: () => void;
  className?: string;
}

export default function ArticleListItem({
  article,
  onClick,
  onActionClick,
  className
}: ArticleListItemProps) {
  const imageUrl = article.newsImage?.url || article.attributes?.newsImage?.url;
  const displayImageUrl = imageUrl ? getStrapiMediaUrl(imageUrl) : "/public/assets/account.svg";

  const title = article.title || article.attributes?.title || 'Untitled Article';
  const organization = article.organizationName || article.attributes?.organizerName || '';
  const category = article.articleCategory || article.attributes?.articleCategory || '';
  const status = ((article.newsStatus || article.attributes?.newsStatus || 'draft').toLowerCase()) as "draft" | "pending" | "rejected" | "approved" | "published";
  const hasNotification = status === 'rejected' || status === 'approved';

  const formattedDate = article.updatedAt || article.attributes?.updatedAt
    ? new Date(article.updatedAt || article.attributes?.updatedAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  // Determine action button based on status
  const showActionButton = status === 'approved';
  const actionButtonText = status === 'approved' ? 'Publish' : '';
  const actionButtonColorClass = status === 'approved'
    ? 'text-wfzo-gold-600 border-wfzo-gold-600 hover:bg-wfzo-gold-50'
    : 'text-wfzo-grey-700 border-wfzo-grey-400 hover:bg-wfzo-grey-100';

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onActionClick?.();
  };

  return (
    <div className={cn("flex flex-col gap-3", onClick ? "cursor-pointer" : "", className)} onClick={onClick}>
      <div className="flex items-start gap-4">
        <div
          className="w-15 h-15 rounded-xl flex-shrink-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${displayImageUrl})` }}
        />

        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-start gap-1">
            {hasNotification && (
              <div className="w-3 h-5 flex items-center justify-center pt-1">
                <div className="w-3 h-3 rounded-full bg-red-500 relative">
                  <div className="w-2 h-2 rounded-full bg-red-200 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}
            <h4 className="font-source text-base font-bold leading-5 text-wfzo-grey-900 flex-1 hover:text-wfzo-gold-600 transition-colors">
              {title}
            </h4>
          </div>

          <p className="font-source text-base font-normal leading-6 text-wfzo-grey-800">
            {formattedDate}
          </p>

          <div>
            <div>
              <StatusBadge status={status} />
            </div>
            

            {/* Action Button - varies by status */}
            {showActionButton && (
              <div className="mt-2">
              <button
                type="button"
                onClick={handleActionClick}
                className={`font-source text-base font-bold leading-5 cursor-pointer border-2 rounded-[12px] py-2 px-6 flex items-center justify-center gap-[10px] transition-colors ${actionButtonColorClass}`}
              >
                {actionButtonText}
              </button>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
