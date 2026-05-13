import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, RefreshCw, Upload } from 'lucide-react';
import { api } from '@/lib/api_client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function ScanCapturePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const file_ref = useRef(null);
  const [file, set_file] = useState(null);
  const [preview, set_preview] = useState(null);
  const [progress, set_progress] = useState(null);
  const [error, set_error] = useState(null);

  function on_pick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    set_file(f);
    set_preview(URL.createObjectURL(f));
    set_error(null);
  }

  async function on_upload() {
    if (!file) return;
    set_progress(0);
    set_error(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`/api/scan/${token}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) set_progress(Math.round((e.loaded / e.total) * 100));
        },
      });
      navigate(`/scan/${token}/complete`);
    } catch (err) {
      const status = err?.response?.status;
      const code = err?.response?.data?.error;
      if (status === 404 || status === 410) navigate(`/scan/${token}/expired`);
      else if (status === 409 && code === 'already_used') navigate(`/scan/${token}/expired`);
      else set_error('Upload failed. Please try again.');
    } finally {
      set_progress(null);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6 text-center">
        <h1 className="text-lg font-semibold">Capture document</h1>
        <p className="text-sm text-muted-foreground">Use your camera to capture the document.</p>

        {preview ? (
          <div className="space-y-3">
            <img src={preview} alt="Document preview" className="mx-auto max-h-72 rounded-md border" />
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => { set_preview(null); set_file(null); file_ref.current?.click(); }}>
                <RefreshCw className="mr-2 h-4 w-4" /> Retake
              </Button>
              <Button onClick={on_upload} disabled={progress != null}>
                <Upload className="mr-2 h-4 w-4" />
                {progress != null ? `Uploading ${progress}%` : 'Upload'}
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => file_ref.current?.click()} className="w-full">
            <Camera className="mr-2 h-4 w-4" /> Take photo
          </Button>
        )}
        <input
          ref={file_ref}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={on_pick}
        />
        {progress != null && (
          <div className="h-2 w-full overflow-hidden rounded bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
