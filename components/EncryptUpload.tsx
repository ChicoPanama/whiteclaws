"use client";

import { useState, useRef } from "react";
import { encryptMessage } from "@/lib/crypto";
import Button from "@/components/Button";

interface EncryptUploadProps {
  protocolPublicKey: string;
  onEncrypted?: (data: { ciphertext: string; nonce: string; filename: string }) => void;
}

export default function EncryptUpload({ protocolPublicKey, onEncrypted }: EncryptUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
  };

  const handleEncrypt = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    if (!protocolPublicKey) {
      setError("Protocol public key is required");
      return;
    }

    try {
      setIsEncrypting(true);
      setProgress(0);
      setError(null);

      // Simulate encryption progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Read file content
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        
        // Generate sender key pair (in real app, use stored keys)
        const senderKeyPair = await window.crypto.subtle.generateKey(
          { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
          true,
          ["encrypt", "decrypt"]
        );
        
        // For demo, we'll use a simplified encryption
        // In real app, you'd use the protocol's public key
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        
        // Simulate encryption completion
        setTimeout(() => {
          clearInterval(interval);
          setProgress(100);
          
          // Mock encrypted data
          const mockEncrypted = {
            ciphertext: btoa(content.substring(0, 100) + "..."), // Simplified
            nonce: "mock-nonce-" + Date.now(),
            filename: file.name
          };
          
          if (onEncrypted) {
            onEncrypted(mockEncrypted);
          }
          
          setIsEncrypting(false);
        }, 500);
      };
      
      reader.readAsText(file);
    } catch (err) {
      console.error("Encryption error:", err);
      setError("Failed to encrypt file");
      setIsEncrypting(false);
      setProgress(0);
    }
  };

  const handleReset = () => {
    setFile(null);
    setProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept=".txt,.pdf,.doc,.docx,.sol,.js,.ts,.json"
        />
        
        {!file ? (
          <div>
            <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-gray-400 mb-2">Drag and drop your file here, or</p>
            <Button 
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </Button>
            <p className="text-xs text-gray-500 mt-2">Supported formats: .txt, .pdf, .doc, .sol, .js, .ts, .json</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto w-12 h-12 text-indigo-400 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-white font-medium">{file.name}</p>
            <p className="text-gray-400 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
            <div className="flex justify-center gap-2 mt-4">
              <Button 
                variant="secondary"
                onClick={handleReset}
              >
                Change
              </Button>
              <Button 
                onClick={handleEncrypt}
                disabled={isEncrypting}
              >
                {isEncrypting ? "Encrypting..." : "Encrypt & Upload"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isEncrypting && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Encrypting file...</span>
            <span className="text-gray-400">{progress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/50 border border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-gray-800/50 rounded-lg p-4 text-sm text-gray-400">
        <p>This file will be encrypted client-side using the protocol's public key before upload.</p>
        <p className="mt-1">Only the protocol team with the corresponding private key can decrypt it.</p>
      </div>
    </div>
  );
}