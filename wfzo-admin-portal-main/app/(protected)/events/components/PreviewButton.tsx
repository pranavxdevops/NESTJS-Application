"use client";

interface PreviewButtonProps {
  slug: string;
}

export default function PreviewButton({ slug }: PreviewButtonProps) {
  const handlePreview = () => {
    // Open preview in new tab - adjust URL as needed for your frontend
    const previewUrl = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/events/${slug}`;
    window.open(previewUrl, '_blank');
  };

  return (
    <button
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      onClick={handlePreview}
    >
      Preview Event
    </button>
  );
}