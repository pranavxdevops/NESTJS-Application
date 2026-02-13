// This component is a dynamic file upload field with drag-and-drop and browse functionality, supporting image and PDF uploads to Blob storage with size and type validation.
'use client';

import React, { useCallback, useRef, useState } from 'react';
import {
  RemoveDocument,
  uploadDocument,
  type DocumentPurpose,
} from '@/features/membership/services/documentUpload';
import GoldButton from '../GoldButton';
import Image from 'next/image';
import Tooltip from '../Tooltip';
import { FILE_TYPES, FILE_SIZE_LIMITS, FILE_SIZE_DISPLAY_TEXT } from '@/lib/constants/constants';

interface FileUploadFieldProps {
  label: string;
  value?: string;
  purpose: DocumentPurpose;
  accept?: string;
  hasError?: boolean;
  error?: string;
  disabled?: boolean;
  onChange: (url: string) => void;
  memberId?: string;
}


interface FileResponse {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  mediaKind: string;
  isPublic: boolean;
  createdAt: string;
  variants: {
    key: string;
    url: string;
    contentType: string;
    size: number;
    ready: boolean;
  }[];
  publicUrl: string;
}
export function FileUploadField({
  label,
  value,
  purpose,
  accept = 'image/*,application/pdf',
  hasError = false,
  error,
  disabled = false,
  onChange,
  memberId,
  onExternalErrorClear,
}: FileUploadFieldProps & {
  onExternalErrorClear?: () => void;
}) {
  

  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<FileResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isLogoBox = purpose === FILE_TYPES.MEMBER_LOGO;   
  const isLicenseBox = purpose === FILE_TYPES.MEMBER_LICENSE; 
  const isSignatureBox = purpose === FILE_TYPES.MEMBER_SIGNATURE; 

  /** Handle file selection */
  const handleUpload = useCallback(
    async (file: File) => {
      if (!file) return;

      // File size validation
      const maxSize = isLicenseBox ? FILE_SIZE_LIMITS.PDF : (isLogoBox || isSignatureBox) ? FILE_SIZE_LIMITS.IMAGE : Infinity;
      if (file.size > maxSize) {
        const maxSizeText = isLicenseBox ? FILE_SIZE_DISPLAY_TEXT.PDF : (isLogoBox || isSignatureBox) ? FILE_SIZE_DISPLAY_TEXT.IMAGE : 'unknown';
        setUploadError(`File size exceeds the maximum allowed size of ${maxSizeText}.`);
        return;
      }

      setIsUploading(true);
      setUploadError(null); // Clear any previous errors

      try {
        const response = await uploadDocument(file, purpose, memberId);

        console.log("response", response);


        onChange(response.publicUrl);
        setFile(response)
        onExternalErrorClear?.();
        setUploadError(null); // Clear error on success
      } catch {
        setUploadError("Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [purpose, onChange, memberId]
  );

const handleFileRemove = useCallback(async()=>{

    
    try {
        const response = await RemoveDocument(value);
        console.log("response", response);
        
        onChange('')
        setFile(null);
      } catch {
        setUploadError("Remove Document failed. Please try again.");
      } finally {
       
      }

    
    


  },[purpose, onChange])

  /** Browse button */
  const handleBrowseClick = (e: React.MouseEvent<HTMLElement>) => {
    
    
    e.preventDefault();
    fileInputRef.current?.click();
  };

  /** File chosen using input */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      // File type validation for browse
      const expectedAccept = isLicenseBox ? '.pdf' : (isLogoBox || isSignatureBox) ? 'image/*' : '';
      const isValidType = expectedAccept === '.pdf'
        ? file.type === 'application/pdf'
        : expectedAccept === 'image/*'
        ? file.type.startsWith('image/')
        : true;

      if (!isValidType) {
        setUploadError(`Invalid file type. Please upload ${isLicenseBox ? 'a PDF file' : 'an image file'}.`);
        // Reset file input to allow selecting the same file again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      handleUpload(file);
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /** Drag events */
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
      // File type validation for drag and drop
      const expectedAccept = isLicenseBox ? '.pdf' : (isLogoBox || isSignatureBox) ? 'image/*' : '';
      const isValidType = expectedAccept === '.pdf'
        ? file.type === 'application/pdf'
        : expectedAccept === 'image/*'
        ? file.type.startsWith('image/')
        : true;

      if (!isValidType) {
        setUploadError(`Invalid file type. Please upload ${isLicenseBox ? 'a PDF file' : 'an image file'}.`);
        return;
      }

      handleUpload(file);
    }
  };

  const fileName = value ? value.split('/').pop() : '';
  const extension = fileName ? fileName.split('.').pop() : '';



  return (
    <div className="space-y-2 w-full mt-6">
      {/* LABEL */}
      <label className="text-sm text-gray-700 font-source mb-1 flex items-center">
        {label}
         {(isLogoBox || isLicenseBox) && (
         <Tooltip 
         text={
          isLogoBox
            ? `Upload your logo in JPEG format, max size ${FILE_SIZE_DISPLAY_TEXT.IMAGE}.`
            : isLicenseBox
            ? `Upload your license in PDF format, max size ${FILE_SIZE_DISPLAY_TEXT.PDF}.`
            : isSignatureBox
            ? `Upload your signature in JPEG/PNG format, max size ${FILE_SIZE_DISPLAY_TEXT.IMAGE}.`
            : ""
          } 
          position="top"
          align="start">
          <div className="cursor-pointer ml-2.5">
                <Image width={20} height={20} src="/assets/info.svg" alt='info'/>
          </div>
        </Tooltip>
        )}
      </label>

      {/* Hidden input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={disabled ? undefined : handleFileSelect}
        disabled={disabled}
        className="hidden"
      />

      {/** ============================
        BLUE LICENSE BOX (Uploaded)
      =============================== */}
      {value && (
        <>
        <div className="relative w-full rounded-md border border-blue-300 bg-blue-50 p-6">
          <button
            type="button"
            onClick={disabled? undefined: () => handleFileRemove()}
            className="absolute right-3 top-3 text-neutral-grey-600 hover:text-red-500"
          >
            ✕
          </button>

         <div className="flex justify-center py-4">
          {isLicenseBox ? (
            <a href={value} target="_blank" rel="noopener noreferrer">
              <Image
                src="/assets/pdf_logo.svg"
                alt="PDF Icon"
                width={40} // Adjust the size as necessary
                height={40} // Adjust the size as necessary
                className="w-10 h-10 object-contain"
              />
            </a>
          ) : isLogoBox ? (
            <img
              src={value || '/assets/default_logo.svg'} // Default fallback image if file.publicUrl is not available
              alt="Member Logo"
              width={40} // Adjust the size as necessary
              height={40} // Adjust the size as necessary
              className="w-auto h-30"
            />
          ) : isSignatureBox ? (
             value?.endsWith('.pdf') ? (
               <a href={value} target="_blank" rel="noopener noreferrer">
                <Image
                  src="/assets/pdf_logo.svg"
                  alt="PDF Icon"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain"
                />
              </a>
             ) : (
             <img
              src={value || ''}
              alt="Signature"
              className="w-auto h-20 max-w-full object-contain"
             />
             )
          ) : null }
        </div>


        </div>
        <a href={value} target="_blank" rel="noopener noreferrer">
          <p className="text-sm text-neutral-grey-900 rounded-md  bg-blue-50 py-2.5 pl-4 ">{isLogoBox ? `logo.${extension}` : isLicenseBox ? `license_document.${extension}` : file?.fileName || fileName}</p>
        </a>
          </>
      )}


      {/** ============================
        BROWN LOGO BOX (Drag + Drop)
      =============================== */}
     { !value && (
       <>
       <p className="text-sm text-neutral-grey-900 rounded-md bg-[#FFF8E9] py-2.5 pl-4 ">
         {isLicenseBox ? "Max size: 5MB" : (isLogoBox || isSignatureBox) ? "Max size: 1MB" : null}
         {isLogoBox ? " · Min dimensions: 1200×1200px" : ""}
       </p>
        <div
          className={`w-full rounded-md border border-dashed 
            ${isDragging ? 'border-brown-700 bg-brown-500' : 'border-neutral-grey-400 bg-[#E7DACB]'}
            p-6 transition-all`}
          onDragOver={disabled? undefined: onDragOver}
          onDragLeave={disabled? undefined:onDragLeave}
          onDrop={disabled? undefined: onDrop}
        >
          
            <div className="flex flex-col items-center justify-center gap-3">
              <Image
        src="/assets/file_upload_arrow.svg"
        alt="PDF Icon"
        width={20}
        height={20}
        
    />

              <p className="text-sm text-neutral-grey-700">
                Drag and drop files here
              </p>

              <GoldButton
                
                onClick={ disabled ? undefined :handleBrowseClick}
                disabled={isUploading}
                type='button'
                
              >
                {isUploading ? 'Uploading…' : 'Browse'}
              </GoldButton>
            </div>
    
        </div>
        </>
      )}

      {/* Error */}
      {(hasError && error) || uploadError ? (
        <p className="text-xs text-red-500 font-source">{uploadError || error}</p>
      ) : null}
    </div>
  );
}






