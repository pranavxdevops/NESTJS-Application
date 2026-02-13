"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";
import { webinarApi } from "@/lib/api/webinarApi";
import { Event, Webinar } from "@/lib/types/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import PreviewButton from "../components/PreviewButton";
import RejectButton from "../components/RejectButton";
import ApproveButton from "../components/ApproveButton";


export default function WebinarDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [webinar, setWebinar] = useState<Webinar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWebinar = useCallback(async () => {
    try {
      setLoading(true);
      const data = await webinarApi.fetchWebinarBySlug(slug);
      setWebinar(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch webinar");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchWebinar();
    }
  }, [slug, fetchWebinar]);

  const handleApprove = () => {
    // Refresh the webinar data after approval
    fetchWebinar();
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

  if (error || !webinar) {
    return (
      <ProtectedLayout>
        <div className="space-y-6">
          <div>
            <button
              onClick={() => router.push("/webinars")}
              className="text-primary hover:text-secondary font-medium mb-2 flex items-center gap-2"
            >
              ← Back to Webinars
            </button>
            <h2 className="text-3xl font-bold text-primary">Webinar Details</h2>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error || "Webinar not found"}</p>
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
            onClick={() => router.push("/webinars")}
            className="text-primary hover:text-secondary font-medium mb-2 flex items-center gap-2"
          >
            ← Back to Webinars
          </button>
          <h2 className="text-3xl font-bold text-primary">{webinar.title}</h2>
          <p className="text-gray-600 mt-1">Webinar Details</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-600">Title</label>
              <p className="mt-1 text-gray-900">{webinar.title}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Slug</label>
              <p className="mt-1 text-gray-900">{webinar.slug}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Organizer</label>
              <p className="mt-1 text-gray-900">{webinar.organizer || "N/A"}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Event Type</label>
              <p className="mt-1 text-gray-900">{webinar.eventType || "N/A"}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Location</label>
              <p className="mt-1 text-gray-900">{webinar.location || "N/A"}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">City</label>
              <p className="mt-1 text-gray-900">{webinar.city || "N/A"}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Is Online</label>
              <p className="mt-1 text-gray-900">{webinar.isOnline ? "Yes" : "No"}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Single Day Event</label>
              <p className="mt-1 text-gray-900">{webinar.singleDayEvent ? "Yes" : "No"}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Primary Event</label>
              <p className="mt-1 text-gray-900">{webinar.primaryEvent ? "Yes" : "No"}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Status</label>
              <p className="mt-1 text-gray-900">{webinar.webinarStatus || "N/A"}</p>
            </div>
          </div>

          {/* Date & Time Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-600">Start Date & Time</label>
              <p className="mt-1 text-gray-900">
                {webinar.startDate ? new Date(webinar.startDate).toLocaleString() : "N/A"}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">End Date & Time</label>
              <p className="mt-1 text-gray-900">
                {webinar.endDateTime ? new Date(webinar.endDateTime).toLocaleString() : "N/A"}
              </p>
            </div>
          </div>

          {/* URLs and Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-600">Registration URL</label>
              <p className="mt-1 text-gray-900">
                {webinar.registrationUrl ? (
                  <a href={webinar.registrationUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {webinar.registrationUrl}
                  </a>
                ) : "N/A"}
              </p>
            </div>

            {webinar.internalLink && (
              <div>
                <label className="text-sm font-semibold text-gray-600">Internal Link</label>
                <p className="mt-1 text-gray-900">
                  <a href={`${process.env.NEXT_PUBLIC_APP_BASE_URL}${webinar.internalLink.fullPath}` || `/${webinar.internalLink.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {webinar.internalLink.title}
                  </a>
                </p>
              </div>
            )}
          </div>

          {webinar.shortDescription && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Short Description</label>
              <p className="mt-1 text-gray-900">{webinar.shortDescription}</p>
            </div>
          )}

          {webinar.longDescription && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Long Description</label>
              <div className="mt-1 text-gray-900 prose max-w-none" dangerouslySetInnerHTML={{ __html: webinar.longDescription }} />
            </div>
          )}

          {webinar.comments && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Comments</label>
              <p className="mt-1 text-gray-900">{webinar.comments}</p>
            </div>
          )}

          {/* Main Event Image */}
          {webinar.image && webinar.image.image && webinar.image.image.url && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Webinar Image</label>
              <div className="mt-1">
                <img
                  src={webinar.image.image.url.startsWith('/uploads') 
                  ? `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}${webinar.image.image.url}` 
                  : webinar.image.image.url}
                  alt={webinar.image.alternateText || webinar.title}
                  className="max-w-[300px] h-auto rounded-lg shadow-sm"
                />
                {webinar.image.alternateText && (
                  <p className="text-xs text-gray-500 mt-1">Alt text: {webinar.image.alternateText}</p>
                )}
              </div>
            </div>
          )}

          {/* Event Primary Details */}
          {webinar.eventPrimaryDetails && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Primary Details</label>
              <div className="mt-1 border rounded-lg p-4 bg-blue-50">
                <h4 className="font-medium text-blue-900">{webinar.eventPrimaryDetails.title}</h4>
                <p className="text-sm text-blue-800 mt-1">{webinar.eventPrimaryDetails.shortDescription}</p>
                <p className="text-xs text-blue-600 mt-1">Image Position: {webinar.eventPrimaryDetails.imagePosition}</p>
              </div>
            </div>
          )}

          {/* Event Details */}
          {webinar.webinar_details && webinar.webinar_details.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Event Details</label>
              <div className="mt-1 space-y-3">
                {webinar.webinar_details.map((detail: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 bg-green-50">
                    <h4 className="font-medium text-green-900">{detail.title}</h4>
                    <p className="text-sm text-green-800 mt-1">{detail.description}</p>
                    <p className="text-xs text-green-600 mt-1">Image Position: {detail.imagePosition}</p>
                    {detail.image && detail.image.image && detail.image.image.url && (
                      <div className="mt-3">
                        <img
                          src={detail.image.image.url.startsWith('/uploads') 
                          ? `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}${detail.image.image.url}` 
                          : detail.image.image.url}
                          alt={detail.image.alternateText || detail.title}
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
          {webinar.cta && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Call to Action</label>
              <div className="mt-1 border rounded-lg p-4 bg-blue-50">
                <p className="font-medium text-blue-900">{webinar.cta.title}</p>
                {webinar.cta.href && (
                  <a href={webinar.cta.href} target={webinar.cta.targetBlank ? "_blank" : "_self"} rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                    {webinar.cta.href}
                  </a>
                )}
                <p className="text-xs text-blue-700 mt-1">Variant: {webinar.cta.variant} | Type: {webinar.cta.type}</p>
              </div>
            </div>
          )}

          {/* Media Gallery */}
          {webinar.media_items && webinar.media_items.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Media Gallery</label>
              <div className="mt-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {webinar.media_items.map((item: any, index: number) => (
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

        {webinar.webinarStatus === "Pending" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-center gap-4">
              {/* <PreviewButton slug={webinar.slug} /> */}
              <ApproveButton slug={webinar.slug} onApprove={handleApprove} />
              <RejectButton slug={webinar.slug} onReject={handleApprove} />
            </div>
          </div>
        )}

        {webinar.comments && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">{webinar.comments}</p>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}