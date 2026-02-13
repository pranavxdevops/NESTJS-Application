"use client";

import { useAuth } from "@/context/AuthContext";
import { newsPublicationApi } from "@/lib/api/newsPublicationApi";
import { toast } from "react-toastify";

interface ApproveButtonProps {
  slug: string;
  onApprove?: () => void;
}

export default function ApproveButton({ slug, onApprove }: ApproveButtonProps) {
  const { user} = useAuth();
  const handleApprove = async () => {
    try {
      await newsPublicationApi.updateArticle(slug, {
        newsStatus: "Approved"
      });
      toast.success("Article approved successfully!");

      // Send email non-blocking
      newsPublicationApi.fetchArticleBySlug(slug).then(fullArticle => {
        if (fullArticle) {
          newsPublicationApi.sendEmail({
            email: fullArticle.authorEmail,
            type: "ARTICLE_APPROVED_USER",
            title: fullArticle.title,
            description: fullArticle.shortDescription,
            eventType : "article",
            category: fullArticle.articleCategory,
            organizerName: fullArticle.organizationName,
            firstName: fullArticle.authorName?.split(' ')[0],
            lastName: fullArticle.authorName?.split(' ').slice(1).join(' '),
          }).catch(() => {});
        }
        console.log('Fetched article for approval email:', fullArticle);
      }).catch(() => {});

      onApprove?.();
    } catch (error: any) {
      console.error("Error approving article:", error);
      const errorMessage = error?.message || "Failed to approve article";
      toast.error(errorMessage);
    }
  };

  return (
    <button
      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      onClick={handleApprove}
    >
      Approve Article
    </button>
  );
}