"use client";

import { eventApi } from "@/lib/api/eventApi";

interface ApproveButtonProps {
  slug: string;
  onApprove?: () => void;
}

export default function ApproveButton({ slug, onApprove }: ApproveButtonProps) {
  const handleApprove = async () => {
    try {
      await eventApi.updateEvent(slug, {
        eventStatus: "Approved"
      });
      alert("Event approved successfully!");

      // Send email non-blocking
      eventApi.fetchEventBySlug(slug).then(fullEvent => {
        if (fullEvent) {
          eventApi.sendEmail({
            email: fullEvent.authorEmail,
            type: "EVENT_APPROVED_USER",
            eventTitle: fullEvent.title,
            scheduledDate: fullEvent.startDateTime,
            organizerName: fullEvent.organizer,
            eventType: "event",
            firstName: fullEvent.authorName?.split(' ')[0],
            lastName: fullEvent.authorName?.split(' ').slice(1).join(' '),
          }).catch(() => {});
        }
        console.log('Fetched event for approval email:', fullEvent);
      }).catch(() => {});

      onApprove?.();
    } catch (error) {
      console.error("Failed to approve event:", error);
      alert("Failed to approve event");
    }
  };

  return (
    <button
      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      onClick={handleApprove}
    >
      Approve Event
    </button>
  );
}