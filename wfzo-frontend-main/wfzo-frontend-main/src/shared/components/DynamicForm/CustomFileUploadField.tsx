//This component is a custom file upload field for strapi uploads with drag-and-drop and preview functionality for images and PDFs.
'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { FILE_SIZE_LIMITS, FILE_SIZE_DISPLAY_TEXT } from '@/lib/constants/constants';
import GoldButton from '../GoldButton';

interface CustomFileUploadFieldProps {
  label: string;
  previewUrl?: string;
  fileName?: string;
  accept?: string;
  disabled?: boolean;
  onSelect: (file: File) => void;
  onRemove: () => void;
  hasError?: boolean;
  error?: string;
}

export function CustomFileUploadField({
  label,
  previewUrl,
  fileName,
  accept = 'image/*',
  disabled = false,
  onSelect,
  onRemove,
  hasError = false,
  error = '',
}: CustomFileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // const getFileName = previewUrl ? previewUrl.split('/').pop() : '';
  console.log("previewurl", previewUrl);
  
  const isImageFile = accept === 'image/*';
  // const extension = previewUrl ? previewUrl.split('.').pop() : '';
  const displayName = fileName
  ? fileName
  : isImageFile
  ? `image`
  : 'document.pdf';

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];

    if (file) {
      // File type validation
      const isValidType = isImageFile
        ? file.type.startsWith('image/')
        : file.type === 'application/pdf';

      if (!isValidType) {
        setUploadError(`Invalid file type. Please upload ${isImageFile ? 'an image file' : 'a PDF file'}.`);
        return;
      }

      // File size validation
      const maxSize = isImageFile ? FILE_SIZE_LIMITS.IMAGE : FILE_SIZE_LIMITS.PDF;
      const maxSizeText = isImageFile ? FILE_SIZE_DISPLAY_TEXT.IMAGE : FILE_SIZE_DISPLAY_TEXT.PDF;
      if (file.size > maxSize) {
        setUploadError(`File size exceeds the maximum allowed size of ${maxSizeText}.`);
        return;
      }

      setUploadError(null); // Clear any previous errors
      onSelect(file);
    }
  };

  return (
    <div className="space-y-2 w-full">
      {/* LABEL */}
      {/* <label className="text-sm text-gray-700 font-source">
        {label} <span className="text-red-500">*</span>
      </label> */}

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            // File size validation
            const maxSize = isImageFile ? FILE_SIZE_LIMITS.IMAGE : FILE_SIZE_LIMITS.PDF;
            const maxSizeText = isImageFile ? FILE_SIZE_DISPLAY_TEXT.IMAGE : FILE_SIZE_DISPLAY_TEXT.PDF;
            if (file.size > maxSize) {
              setUploadError(`File size exceeds the maximum allowed size of ${maxSizeText}.`);
              return;
            }

            setUploadError(null); // Clear any previous errors
            onSelect(file);
          }
        }}
      />

      {/* ================= UPLOADED STATE ================= */}
      {previewUrl && (
        <>
          <div className="relative w-full rounded-md border  border-dashed border-blue-300 bg-blue-50 p-6">
            {/* Remove */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
                setUploadError(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="absolute right-3 top-3 text-neutral-grey-600 hover:text-red-500"
            >
              ✕
            </button>

            {/* Preview */}
            { isImageFile ?
            <div className="flex justify-center py-4">
             
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-32 object-contain"
              />
            </div>
            :
            <div className="flex items-center justify-center py-4">
              <Image
                src="/assets/pdf_logo.svg"
                alt="PDF Preview"
                width={48}
                height={48}
              />
            </div>
            }
          </div>
          

          {/* File name strip */}
          {previewUrl && (
            <a href={previewUrl} target="_blank" rel="noopener noreferrer" className='cursor-pointer'>
            <div className="text-sm text-neutral-grey-900 rounded-md bg-blue-50 py-2.5 pl-4">
              {displayName}
            </div>
            </a>
          )}
        </>
      )}

      {/* ================= EMPTY STATE ================= */}
      {!previewUrl && (
        <>
          <div
            onClick={() => !disabled && inputRef.current?.click()}
            onDragOver={disabled ? undefined : onDragOver}
            onDragLeave={disabled ? undefined : onDragLeave}
            onDrop={disabled ? undefined : onDrop}
            className={`
  w-full rounded-md
  border border-dashed ${isDragging ? 'border-brown-700 bg-brown-500' : 'border-neutral-grey-400 bg-[#E7DACB]'}
  p-6
  cursor-pointer
  transition-all
`}
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <Image
                src="/assets/file_upload_arrow.svg"
                alt="Upload"
                width={20}
                height={20}
              />

              <p className="text-sm text-neutral-grey-700 font-source">
                {isDragging ? 'Drop files here' : `Drag and drop or browse to upload ${accept === "image/*" ? "Image" : "PDF"}`}
              </p>

              <GoldButton
                type="button"
                disabled={disabled}
                
              >
                Browse
              </GoldButton>
            </div>
          </div>
        </>
      )}

      {/* ERROR */}
      {(hasError && error) || uploadError ? (
        <p className="text-xs text-red-500 font-source">
          {uploadError || error}
        </p>
      ) : null}
    </div>
  );
}
 