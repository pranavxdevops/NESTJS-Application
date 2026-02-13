"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import ProtectedLayout from "@/components/ProtectedLayout";
import { eventApi } from "@/lib/api/eventApi";
import { Event } from "@/lib/types/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import ApproveButton from "../components/ApproveButton";
import RejectButton from "../components/RejectButton";
type EventDetail = {
  title?: string;
  description?: string;
  imagePosition?: string;
  image?: {
    image?: {
      url?: string;
    };
    alternateText?: string;
  };
};

export default function EventDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      const data = await eventApi.fetchEventBySlug(slug);
      setEvent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch event");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchEvent();
    }
  }, [slug, fetchEvent]);

  const handleApprove = () => {
    // Refresh the event data after approval
    fetchEvent();
  };

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </ProtectedLayout>
    );
  }

  if (error || !event) {
    return (
      <ProtectedLayout>
        <div className="space-y-6">
          <div>
            <button
              onClick={() => router.push("/events")}
              className="text-primary hover:text-secondary font-medium mb-2 flex items-center gap-2"
            >
              ← Back to Events
            </button>
            <h2 className="text-3xl font-bold text-primary">Event Details</h2>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error || "Event not found"}</p>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <button
            onClick={() => router.push("/events")}
            className="text-primary hover:text-secondary font-medium mb-2 flex items-center gap-2"
          >
            ← Back to Events
          </button>
          <h2 className="text-3xl font-bold text-primary">{event.title}</h2>
          <p className="text-gray-600 mt-1">Event Details</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-600">Title</label>
              <p className="mt-1 text-gray-900">{event.title}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Slug</label>
              <p className="mt-1 text-gray-900">{event.slug}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Organizer</label>
              <p className="mt-1 text-gray-900">{event.organizer || "N/A"}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Event Type</label>
              <p className="mt-1 text-gray-900">{event.eventType || "N/A"}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Location</label>
              <p className="mt-1 text-gray-900">{event.location || "N/A"}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">City</label>
              <p className="mt-1 text-gray-900">{event.city || "N/A"}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Is Online</label>
              <p className="mt-1 text-gray-900">{event.isOnline ? "Yes" : "No"}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Single Day Event</label>
              <p className="mt-1 text-gray-900">{event.singleDayEvent ? "Yes" : "No"}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Primary Event</label>
              <p className="mt-1 text-gray-900">{event.primaryEvent ? "Yes" : "No"}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Status</label>
              <p className="mt-1 text-gray-900">{event.eventStatus || "N/A"}</p>
            </div>
          </div>

          {/* Date & Time Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-600">Start Date & Time</label>
              <p className="mt-1 text-gray-900">
                {event.startDateTime ? new Date(event.startDateTime).toLocaleString() : "N/A"}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">End Date & Time</label>
              <p className="mt-1 text-gray-900">
                {event.endDateTime ? new Date(event.endDateTime).toLocaleString() : "N/A"}
              </p>
            </div>
          </div>

          {/* URLs and Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-600">Registration URL</label>
              <p className="mt-1 text-gray-900">
                {event.registrationUrl ? (
                  <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {event.registrationUrl}
                  </a>
                ) : "N/A"}
              </p>
            </div>

            {event.internalLink && (
              <div>
                <label className="text-sm font-semibold text-gray-600">Internal Link</label>
                <p className="mt-1 text-gray-900">
                  <a href={`${process.env.NEXT_PUBLIC_APP_BASE_URL}${event.internalLink.fullPath}` || `/${event.internalLink.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {event.internalLink.title}
                  </a>
                </p>
              </div>
            )}
          </div>

          {event.shortDescription && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Short Description</label>
              <p className="mt-1 text-gray-900">{event.shortDescription}</p>
            </div>
          )}

          {event.longDescription && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Long Description</label>
              <div className="mt-1 text-gray-900 prose max-w-none" dangerouslySetInnerHTML={{ __html: event.longDescription }} />
            </div>
          )}

          {event.comments && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Comments</label>
              <p className="mt-1 text-gray-900">{event.comments}</p>
            </div>
          )}

          {/* Main Event Image */}
          {event.image && event.image.image && event.image.image.url && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Event Image</label>
              <div className="mt-1">
                <Image
                  src={event.image.image.url.startsWith('/uploads')
                    ? `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}${event.image.image.url}`
                    : event.image.image.url}
                  alt={event.image.alternateText || event.title}
                  width={300}
                  height={200}
                  className="max-w-[300px] h-auto rounded-lg shadow-sm"
                />
                {event.image.alternateText && (
                  <p className="text-xs text-gray-500 mt-1">Alt text: {event.image.alternateText}</p>
                )}
              </div>
            </div>
          )}

          {/* Event Primary Details */}
          {event.eventPrimaryDetails && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Primary Details</label>
              <div className="mt-1 border rounded-lg p-4 bg-blue-50">
                <h4 className="font-medium text-blue-900">{event.eventPrimaryDetails.title}</h4>
                <p className="text-sm text-blue-800 mt-1">{event.eventPrimaryDetails.shortDescription}</p>
                <p className="text-xs text-blue-600 mt-1">Image Position: {event.eventPrimaryDetails.imagePosition}</p>
              </div>
            </div>
          )}

          {/* Event Details */}
          {event.event_details && event.event_details.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Event Details</label>
              <div className="mt-1 space-y-3">
                {event.event_details.map((detail: EventDetail, index: number) => (
                  <div key={index} className="border rounded-lg p-4 bg-green-50">
                    <h4 className="font-medium text-green-900">{detail.title}</h4>
                    <p className="text-sm text-green-800 mt-1">{detail.description}</p>
                    <p className="text-xs text-green-600 mt-1">Image Position: {detail.imagePosition}</p>
                    {detail.image && detail.image.image && detail.image.image.url && (
                      <div className="mt-3">
                        <Image
                          src={detail.image.image.url.startsWith('/uploads')
                            ? `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}${detail.image.image.url}`
                            : detail.image.image.url}
                          alt={detail.image.alternateText || detail.title || "Event detail image"}
                          width={300}
                          height={200}
                          className="max-w-[300px] h-auto rounded-lg shadow-sm"
                        />
                        {detail.image.alternateText && (
                          <p className="text-xs text-gray-500 mt-1">Alt text: {detail.image.alternateText}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call to Action */}
          {event.cta && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Call to Action</label>
              <div className="mt-1 border rounded-lg p-4 bg-blue-50">
                <p className="font-medium text-blue-900">{event.cta.title}</p>
                {event.cta.href && (
                  <a href={event.cta.href} target={event.cta.targetBlank ? "_blank" : "_self"} rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                    {event.cta.href}
                  </a>
                )}
                <p className="text-xs text-blue-700 mt-1">Variant: {event.cta.variant} | Type: {event.cta.type}</p>
              </div>
            </div>
          )}

          {/* Media Gallery */}
          {event.media_items && event.media_items.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Media Gallery</label>
              <div className="mt-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {event.media_items.map((item: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{item.description || "No description"}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      <span>Type: {item.type}</span>
                      {item.collectionType && <span> | Collection: {item.collectionType}</span>}
                    </div>
                    {item.type === 'photo' && item.href && (
                      <div className="mt-3">
                        <img
                          src={item.href}
                          alt={item.title}
                          className="w-full h-48 object-cover rounded-md shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {event.eventStatus === "Pending" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-center gap-4">
              {/* <PreviewButton slug={event.slug} /> */}
              <ApproveButton slug={event.slug} onApprove={handleApprove} />
              <RejectButton slug={event.slug} onReject={handleApprove} />
            </div>
          </div>
        )}

        {event.comments && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">{event.comments}</p>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}