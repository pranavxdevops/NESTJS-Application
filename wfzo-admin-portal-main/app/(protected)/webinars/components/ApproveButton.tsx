"use client";

import { useAuth } from "@/context/AuthContext";
import { webinarApi } from "@/lib/api/webinarApi";

interface ApproveButtonProps {
  slug: string;
  onApprove?: () => void;
}

export default function ApproveButton({ slug, onApprove }: ApproveButtonProps) {
  const { user} = useAuth();
  const handleApprove = async () => {
    try {
      await webinarApi.updateWebinar(slug, {
        webinarStatus: "Approved"
      });
      alert("Webinar approved successfully!");

      // Send email non-blocking
      webinarApi.fetchWebinarBySlug(slug).then(fullWebinar => {
        if (fullWebinar) {
          webinarApi.sendEmail({
            email: fullWebinar.authorEmail,
            type: "EVENT_APPROVED_USER",
            eventTitle: fullWebinar.title,
            scheduledDate: fullWebinar.startDate,
            organizerName: fullWebinar.organizer,
            eventType: "webinar",
            firstName: fullWebinar.authorName?.split(' ')[0],
            lastName: fullWebinar.authorName?.split(' ').slice(1).join(' '),
          }).catch(() => {});
        }
        console.log('Fetched webinar for approval email:', fullWebinar);
      }).catch(() => {});

      onApprove?.();
    } catch (error) {
      alert("Failed to approve webinar");
    }
  };

  return (
    <button
      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      onClick={handleApprove}
    >
      Approve Webinar
    </button>
  );
}