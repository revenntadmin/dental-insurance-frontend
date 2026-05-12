import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Button from '../../../components/ui/Button.jsx';
import {
  useCreateScanSession,
  useScanSessionPoll,
} from '../../../features/patients/queries.js';
import { useToast } from '../../../hooks/use_toast.jsx';

export default function QrScanEntry({ onExtracted }) {
  const [session, setSession] = useState(null);
  const create = useCreateScanSession();
  const poll = useScanSessionPoll(session?.session_id, !!session);
  const { toast } = useToast();

  async function generate() {
    try {
      const data = await create.mutateAsync({ document_type: 'insurance_card' });
      setSession(data);
    } catch (err) {
      toast(err.response?.data?.message || err.message, 'error');
    }
  }

  useEffect(() => {
    if (poll.data?.status === 'completed' && poll.data.extracted_fields) {
      onExtracted(poll.data.extracted_fields);
      setSession(null);
    }
  }, [poll.data, onExtracted]);

  const status = poll.data?.status;
  const isExpired = status === 'expired';
  const isError = status === 'error';

  return (
    <div className="card p-6 max-w-xl">
      <h3 className="font-semibold mb-1">Scan with phone</h3>
      <p className="text-sm text-slate-500 mb-5">
        Generate a QR code, scan it with any phone, take a photo. We’ll extract fields
        and bring them back here.
      </p>

      {!session ? (
        <Button onClick={generate} disabled={create.isPending}>
          {create.isPending ? 'Generating…' : 'Generate QR code'}
        </Button>
      ) : (
        <div className="flex flex-col items-center">
          <div className="p-4 bg-white border border-slate-200 rounded">
            <QRCodeSVG value={session.qr_url} size={220} includeMargin={false} />
          </div>
          <div className="mt-4 text-sm text-slate-600">
            Waiting for phone capture…
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Session expires in 10 minutes
          </div>
          {(isExpired || isError) && (
            <div className="mt-3 text-sm text-red-600">
              {isExpired ? 'Session expired.' : 'Capture failed.'}
            </div>
          )}
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" onClick={() => setSession(null)}>Cancel</Button>
            <Button onClick={generate}>Generate new QR code</Button>
          </div>
        </div>
      )}
    </div>
  );
}
