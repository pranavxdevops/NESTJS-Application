'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '../Input';
import LightButton from '../LightButton';
import LightPressButton from '../LightPressButton';
import { FileUploadField } from './FileUploadField';
import { DocumentPurpose } from '@/features/membership/services/documentUpload';

// Alias for native Image constructor to avoid conflict
const NativeImage = window.Image;

interface SignatureFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder?: string;
  hasError?: boolean;
  disabled?: boolean;
  memberId?: string;
}

export function SignatureField({
  value,
  onChange,
  onBlur,
  placeholder,
  hasError,
  disabled,
  memberId,
}: SignatureFieldProps) {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Persistent states for each tab
  const [typedSignature, setTypedSignature] = useState('');
  const [uploadedSignature, setUploadedSignature] = useState('');
  const [drawnSignatureData, setDrawnSignatureData] = useState(''); // Persist drawing data URL
  
  const [externalValue, setExternalValue] = useState('');
  const initializedRef = useRef(false);

  useEffect(() => {
    // Initialize canvas if in draw mode
    if (activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [activeTab]);

  // Sync external value from prop
  // Initialize from value prop
  useEffect(() => {
    setExternalValue(value ?? '');
    
    // Only determine tab from value if it's the first load or if value changed externally and doesn't match current internal state
    if (value && !initializedRef.current) {
        if (value.startsWith('data:')) {
            setActiveTab('draw');
            setDrawnSignatureData(value);
        } else if (value.startsWith('http') || value.startsWith('/')) {
            setActiveTab('upload');
            setUploadedSignature(value);
        } else {
            setActiveTab('type');
            setTypedSignature(value);
        }
        initializedRef.current = true;
    } else if (!value && !initializedRef.current) {
        setActiveTab('draw');
        initializedRef.current = true;
    }
  }, [value]);

  // Restore drawing when switching back to draw tab
  useEffect(() => {
      if (activeTab === 'draw' && canvasRef.current && drawnSignatureData) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          const img = new NativeImage();
          img.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0); // Simplistic draw back, assuming same canvas size
          };
          img.src = drawnSignatureData;
      } else if (activeTab === 'draw' && canvasRef.current && !drawnSignatureData) {
           const ctx = canvasRef.current.getContext('2d');
           if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
  }, [activeTab, drawnSignatureData]);

  // Draw external data URL value to canvas when it changes and we're in draw tab
  // (Removed old useEffect that drew externalValue directly)

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const canvas = canvasRef.current;
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        setDrawnSignatureData(dataUrl);
        onChange(dataUrl);
      }
    }
    setIsDrawing(false);
  };

  const handleTypedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setTypedSignature(newValue);
    onChange(newValue);
  };

  const handleTabChange = (tab: 'draw' | 'type' | 'upload') => {
    setActiveTab(tab);
    // Switch value to the stored state of the new active tab
    if (tab === 'draw') {
        onChange(drawnSignatureData);
    } else if (tab === 'type') {
        onChange(typedSignature);
    } else if (tab === 'upload') {
        onChange(uploadedSignature);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setDrawnSignatureData('');
      onChange(''); // Clear the signature value
    }
  };

  return (
    <div className="space-y-4">
      {/* Signature Canvas/Input Area */}
      {activeTab === 'upload' ? (
        <div className="w-full">
            <FileUploadField
              label=""
              purpose={"memberSignature" as DocumentPurpose}
              value={uploadedSignature}
              onChange={(val) => {
                  setUploadedSignature(val);
                  onChange(val);
              }}
              hasError={hasError}
              disabled={disabled}
              memberId={memberId}
              accept="image/*,application/pdf"
            />
        </div>
      ) : (
      <div
        className={`relative w-full h-[200px] border-2 rounded-lg bg-white ${
          hasError ? 'border-red-500' : 'border-neutral-grey-300'
        }`}
      >
        {activeTab === 'draw' ? (
          <>
            <canvas
              ref={canvasRef}
              width={800}
              height={200}
              className={`w-full h-full cursor-crosshair rounded-lg ${
                disabled ? 'pointer-events-none opacity-50' : ''
              }`}
              onMouseDown={disabled ? undefined : startDrawing}
              onMouseMove={disabled ? undefined : draw}
              onMouseUp={disabled ? undefined : stopDrawing}
              onMouseLeave={disabled ? undefined : stopDrawing}
              onTouchStart={disabled ? undefined : startDrawing}
              onTouchMove={disabled ? undefined : draw}
              onTouchEnd={disabled ? undefined : stopDrawing}
            />
          
          </>
        ) : (
          <div className="flex items-center justify-center w-full h-full p-6">
            <Input
              type="text"
              value={typedSignature}
              onChange={handleTypedChange}
              onBlur={onBlur}
              placeholder={placeholder || 'Type your signature'}
              className="text-2xl font-script text-center border-none focus:outline-none"
              style={{ fontFamily: 'cursive' }}
              disabled={disabled}
            />
          </div>
        )}
      </div>
      )}

      {/* Tab Buttons */}
      <div className="flex items-center gap-4 font-source">
  {activeTab === "draw" ? (
    <LightPressButton type="button" onClick={() => handleTabChange("draw")}>
      Draw
    </LightPressButton>
  ) : (
    <button
      type="button"
      onClick={() => handleTabChange("draw")}
      className="px-4 py-2 rounded-md text-sm"
    >
      Draw
    </button>
  )}

  {activeTab === "type" ? (
    <LightPressButton onClick={() => handleTabChange("type")} type="button">
      Type
    </LightPressButton>
  ) : (
    <button
      type="button"
      onClick={() => handleTabChange("type")}
      className="px-4 py-2 rounded-md text-sm"
    >
      Type
    </button>
  )}

  {activeTab === "upload" ? (
    <LightPressButton onClick={() => handleTabChange("upload")} type="button">
      Upload
    </LightPressButton>
  ) : (
    <button
      type="button"
      onClick={() => handleTabChange("upload")}
      className="px-4 py-2 rounded-md text-sm"
    >
      Upload
    </button>
  )}

  {/* Push to right */}
  {!disabled && activeTab === 'draw' && value && (
  <button
    type="button"
    onClick={clearCanvas}
    className="ml-auto items-center cursor-pointer justify-center transition-colors text-sm"
    title="Clear signature"
  >
    Clear Signature
  </button>
)}
</div>


      {/* Helper Text */}
      <p className="text-sm text-gray-700 font-source">
        {activeTab === 'draw'
          ? 'Please use your mouse or trackpad'
          : activeTab === 'upload'
            ? 'Upload an image of your signature'
            : 'Type your name as it appears in your official documents'}
      </p>
    </div>
  );
}
