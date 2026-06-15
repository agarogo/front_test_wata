"use client";

import { useState } from 'react';

interface FileUploadCardProps {
  title: string;
  description?: string;
  accepted?: string;
  required?: boolean;
  uploadedFile?: File | null;
  uploadStatus?: 'idle' | 'uploading' | 'success' | 'error';
  uploadMessage?: string;
  rowCount?: number;
  onFileChange?: (file: File | null) => void;
  onUpload?: () => Promise<void>;
  disabled?: boolean;
}

export default function FileUploadCard({
  title,
  description,
  accepted = '.xlsx,.csv',
  required = false,
  uploadedFile,
  uploadStatus = 'idle',
  uploadMessage,
  rowCount,
  onFileChange,
  onUpload,
  disabled = false,
}: FileUploadCardProps) {
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [localStatus, setLocalStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [localMessage, setLocalMessage] = useState<string>('');

  const file = uploadedFile ?? localFile;
  const status = uploadStatus ?? localStatus;
  const message = uploadMessage ?? localMessage;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0] || null;
    setLocalFile(selectedFile);
    if (onFileChange) {
      onFileChange(selectedFile);
    }
  }

  async function handleUpload() {
    if (!file) return;
    
    setLocalStatus('uploading');
    setLocalMessage('Загрузка...');
    
    try {
      if (onUpload) {
        await onUpload();
        setLocalStatus('success');
        setLocalMessage('Файл успешно загружен');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setLocalStatus('error');
      setLocalMessage(error.message || 'Ошибка загрузки');
    }
  }

  function handleReset() {
    setLocalFile(null);
    setLocalStatus('idle');
    setLocalMessage('');
    if (onFileChange) {
      onFileChange(null);
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          {title}
          {required && <span className="required-badge">*</span>}
        </div>
        {description && <div className="text-muted text-sm">{description}</div>}
      </div>
      
      <div className="card-body">
        <div className="file-upload-area">
          <input
            type="file"
            accept={accepted}
            onChange={handleFileChange}
            disabled={disabled || status === 'uploading'}
            required={required}
          />
          {file && (
            <div className="file-info">
              <span className="file-name">{file.name}</span>
              <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
              {rowCount && <span className="file-rows">({rowCount} строк)</span>}
            </div>
          )}
        </div>

        {status === 'success' && (
          <div className="success-message">{message}</div>
        )}
        
        {status === 'error' && (
          <div className="error-message">{message}</div>
        )}

        <div className="actions">
          {file && status !== 'uploading' && (
            <button 
              onClick={handleUpload} 
              disabled={disabled}
              className="primary"
            >
              Загрузить
            </button>
          )}
          
          {file && (
            <button 
              onClick={handleReset} 
              disabled={status === 'uploading'}
              className="secondary"
            >
              Сбросить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
