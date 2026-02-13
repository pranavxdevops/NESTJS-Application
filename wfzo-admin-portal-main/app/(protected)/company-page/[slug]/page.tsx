"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";
import { organizationApi } from "@/lib/api/organizationApi";
import { Organization } from "@/lib/types/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import ApproveButton from "../components/ApproveButton";
import RejectButton from "../components/RejectButton";

export default function OrganizationDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganization = useCallback(async () => {
    try {
      setLoading(true);
      const data = await organizationApi.fetchOrganizationBySlug(slug);
      setOrganization(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch organization");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchOrganization();
    }
  }, [slug, fetchOrganization]);

  const handleApprove = () => {
    // Refresh the organization data after approval
    fetchOrganization();
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

  if (error || !organization) {
    return (
      <ProtectedLayout>
        <div className="space-y-6">
          <div>
            <button
              onClick={() => router.push("/company-info")}
              className="text-primary hover:text-secondary font-medium mb-2 flex items-center gap-2"
            >
              ← Back to Company Infos
            </button>
            <h2 className="text-3xl font-bold text-primary">Company Info Details</h2>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error || "Company info not found"}</p>
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
            onClick={() => router.push("/company-info")}
            className="text-primary hover:text-secondary font-medium mb-2 flex items-center gap-2"
          >
            ← Back to Company Infos
          </button>
          <h2 className="text-3xl font-bold text-primary">{organization.organizationName}</h2>
          <p className="text-gray-600 mt-1">Company Info Details</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-600">Name</label>
              <p className="mt-1 text-gray-900">{organization.organizationName}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Slug</label>
              <p className="mt-1 text-gray-900">{organization.slug}</p>
            </div>



            <div>
              <label className="text-sm font-semibold text-gray-600">Author Email</label>
              <p className="mt-1 text-gray-900">{organization.authorEmail}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Organization Name</label>
              <p className="mt-1 text-gray-900">{organization.organizationName}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Status</label>
              <p className="mt-1 text-gray-900">{organization.companyStatus}</p>
            </div>
          </div>

          {/* Company Image */}
          {organization.companyImage && organization.companyImage.url && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Company Image</label>
              <div className="mt-1">
                <img
                  src={organization.companyImage.url.startsWith('/uploads')
                    ? `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}${organization.companyImage.url}`
                    : organization.companyImage.url}
                  alt={organization.organizationName}
                  className="max-w-[300px] h-auto rounded-lg shadow-sm"
                />
              </div>
            </div>
          )}

          {/* Date Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-600">Created At</label>
              <p className="mt-1 text-gray-900">
                {new Date(organization.createdAt).toLocaleString()}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Updated At</label>
              <p className="mt-1 text-gray-900">
                {new Date(organization.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {organization.companyIntro && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Company Intro</label>
              <p className="mt-1 text-gray-900">{organization.companyIntro}</p>
            </div>
          )}

          {/* Organization Details */}
          {organization.organization && organization.organization.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Organization Details</label>
              <div className="mt-1 space-y-3">
                {organization.organization.map((detail, index: number) => (
                  <div key={detail.id} className="border rounded-lg p-4 bg-blue-50">
                    <h4 className="font-medium text-blue-900">{detail.title}</h4>
                    <p className="text-sm text-blue-800 mt-1">{detail.description}</p>
                    {detail.imagePosition && (
                      <p className="text-xs text-blue-600 mt-1">Image Position: {detail.imagePosition}</p>
                    )}
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
                        {detail.image.href && (
                          <a href={detail.image.href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs mt-1 block">
                            {detail.image.href}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {organization.comments && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Rejected Reason</label>
              <p className="mt-1 text-gray-900">{organization.comments}</p>
            </div>
          )}
        </div>

        {organization.companyStatus === "Pending" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-center gap-4">
              <ApproveButton slug={organization.slug} onApprove={handleApprove} />
              <RejectButton slug={organization.slug} onReject={handleApprove} />
            </div>
          </div>
        )}

        {organization.comments && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">{organization.comments}</p>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}