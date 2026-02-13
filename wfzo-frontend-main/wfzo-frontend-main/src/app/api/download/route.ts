import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get('file');

  if (!fileUrl) {
    return new NextResponse("File parameter is required", { status: 400 });
  }

  try {
    // Validate that the URL is actually a valid URL
    const parsedUrl = new URL(fileUrl);

    // (Optional) You can whitelist allowed origins for security:
    // For example:
    // if (!parsedUrl.origin.includes('your-strapi-base-url.com')) {
    //   return new NextResponse("Invalid file URL", { status: 400 });
    // }

    const response = await fetch(fileUrl);

    if (!response.ok) {
      return new NextResponse("Failed to fetch file", { status: 500 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract filename from URL path
    const pathname = parsedUrl.pathname;
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1) || 'download.pdf';

    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Content-Type', 'application/pdf'); // Assuming PDF, adjust if needed

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
