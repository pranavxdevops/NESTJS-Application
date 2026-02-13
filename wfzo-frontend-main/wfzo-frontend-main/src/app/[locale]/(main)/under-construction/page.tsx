import React from 'react';
import Link from 'next/link';

// Simple full-bleed under construction page; uses a static public image (replace as needed)
export const metadata = {
  title: 'Under Construction'
};

export default async function UnderConstructionPage() {
  return (
    <main className="relative min-h-[calc(100vh-0px)] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: 'url(/under-construction.jpg)' }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" aria-hidden="true" />
      <div className="relative z-10 px-6 text-center max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-montserrat font-extrabold text-white mb-6">
          {'Page under construction'}
        </h1>
        <p className="text-white/90 text-lg md:text-xl font-source mb-10">
          {'Building the future of this page. Stay tuned.'}
        </p>
        <Link
          href={`/en`}
          className="inline-block rounded-md border border-white/60 bg-white/10 px-6 py-3 text-white font-source hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 transition"
        >
          {'Back to home'}
        </Link>
      </div>
    </main>
  );
}
