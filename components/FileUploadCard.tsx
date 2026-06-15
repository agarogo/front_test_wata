'use client';

export default function FileUploadCard({
  title,
  description,
  uploadStatus = 'idle',
  uploadMessage,
  onUpload,
}: {
  title: string;
  description?: string;
  uploadStatus?: 'idle' | 'uploading' | 'success' | 'error';
  uploadMessage?: string;
  onUpload?: () => Promise<void> | void;
}) {
  return (
    <div className="upload-card">
      <div>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
        {uploadMessage && <span className={`badge badge-${uploadStatus === 'success' ? 'success' : uploadStatus === 'error' ? 'danger' : 'muted'}`}>{uploadMessage}</span>}
      </div>
      {onUpload && <button className="btn btn-secondary" onClick={() => void onUpload()} disabled={uploadStatus === 'uploading'}>{uploadStatus === 'uploading' ? 'Загрузка...' : 'Выбрать / загрузить'}</button>}
    </div>
  );
}
