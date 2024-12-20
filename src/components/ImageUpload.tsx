'use client'    

import React, { useState, useRef } from 'react';
import Image from 'next/image';

const ImageUpload = () => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    try {
      setLoading(true);
      setError('');
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Send to API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.result || 'No result returned');
      
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Camera Option */}
        <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Take Photo</span>
        </label>

        {/* Gallery Option */}
        <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Choose from Gallery</span>
        </label>
      </div>

      {image && (
        <div className="mb-4">
          <Image 
            src={image} 
            alt="Uploaded image" 
            width={400} 
            height={400} 
            className="rounded-lg"
          />
        </div>
      )}

      {loading && (
        <div className="text-blue-500">
          Analyzing image... Please wait...
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
          Error: {error}
        </div>
      )}
      
      {result && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h3 className="font-bold mb-2">Analysis Result:</h3>
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
};

export default ImageUpload; 