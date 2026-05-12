import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicApiClient } from '../../lib/api_client.js';

export default function ScanPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('idle'); // idle | preview | uploading | success | error | invalid
  const [errorMsg, setErrorMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setErrorMsg('No scan session token. Open this page from a generated QR code.');
    }
  }, [token]);

  function onSelect(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setStatus('preview');
  }

  async function upload() {
    if (!file || !token) return;
    setStatus('uploading');
    try {
      const form = new FormData();
      form.append('file', file);
      await publicApiClient.post(`/api/scan/${token}/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Upload failed');
      setStatus('error');
    }
  }

  function retake() {
    setFile(null);
    setPreviewUrl(null);
    setStatus('idle');
    if (fileRef.current) fileRef.current.value = '';
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center text-slate-600">
        {errorMsg}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="px-5 py-4 bg-white border-b border-slate-200">
        <div className="text-lg font-semibold text-brand-600">ClearClaim</div>
        <div className="text-xs text-slate-500">Capture document</div>
      </header>

      <main className="flex-1 p-5 flex flex-col items-center justify-center">
        {status === 'success' ? (
          <div className="text-center">
            <div className="text-emerald-600 text-5xl mb-3">✓</div>
            <div className="text-lg font-semibold">Uploaded</div>
            <div className="text-sm text-slate-500 mt-1">
              Return to the desktop — the form will fill in automatically.
            </div>
          </div>
        ) : (
          <>
            {previewUrl ? (
              <img src={previewUrl} alt="preview" className="max-h-[60vh] rounded-md border border-slate-200" />
            ) : (
              <div className="w-full max-w-sm border-2 border-dashed border-slate-300 rounded-md p-10 text-center text-slate-500 text-sm">
                Tap below to take a photo
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onSelect}
              className="hidden"
            />

            {status === 'error' && (
              <div className="text-sm text-red-600 mt-3">{errorMsg}</div>
            )}

            <div className="mt-5 flex gap-3 w-full max-w-sm">
              {!previewUrl && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="btn-primary flex-1"
                >
                  Take photo
                </button>
              )}
              {previewUrl && status !== 'uploading' && (
                <>
                  <button onClick={retake} className="btn-secondary flex-1">Retake</button>
                  <button onClick={upload} className="btn-primary flex-1">Upload</button>
                </>
              )}
              {status === 'uploading' && (
                <button disabled className="btn-primary flex-1">Uploading…</button>
              )}
            </div>
          </>
        )}
      </main>

      <footer className="p-4 text-center text-xs text-slate-400">
        Secure session · expires in 10 minutes
      </footer>
    </div>
  );
}
