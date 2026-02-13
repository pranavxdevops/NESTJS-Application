"use client"
import React from 'react';

interface LinkedInButtonProps {
  url: string;
  className?: string;
  style?: React.CSSProperties;
}

const LinkedInButton: React.FC<LinkedInButtonProps> = ({ url }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation(); // 🔥 Prevent card click
  };
  
  return (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 rounded-3xl"
    onClick={handleClick} 
    style={{
      fontSize: 'clamp(0.6rem, 0.8vw, 1.2rem)',
      padding: 'clamp(0.2rem, 0.4vw, 0.7rem) clamp(0.4rem, 0.8vw, 1.5rem)',
      backgroundColor: '#DAEEFB',
    }}
  >
    <svg
      width="14"
      height="14"
      viewBox="3 3 10 10"
      fill="none"
      aria-hidden
      style={{ width: 'clamp(10px, 0.8vw, 20px)', height: 'clamp(10px, 0.8vw, 20px)' }}
    >
      <path
        d="M2.84 6.21H5.06V13.33H2.84V6.21ZM3.95 2.67C4.66 2.67 5.23 3.24 5.23 3.95C5.23 4.66 4.66 5.23 3.95 5.23C3.24 5.23 2.67 4.66 2.67 3.95C2.67 3.24 3.24 2.67 3.95 2.67Z"
        fill="#1478B6"
      />
      <path
        d="M6.44 6.21H8.56V7.18H8.59C8.89 6.62 9.61 6.03 10.68 6.03C12.92 6.03 13.33 7.51 13.33 9.43V13.33H11.13V9.87C11.13 9.04 11.11 7.98 9.98 7.98C8.84 7.98 8.65 8.88 8.65 9.81V13.33H6.44V6.21Z"
        fill="#1478B6"
      />
    </svg>
    <span className="inline">LinkedIn</span>
  </a>
)};


export default LinkedInButton;
