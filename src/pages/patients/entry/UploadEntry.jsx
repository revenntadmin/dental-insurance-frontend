import { useRef, useState } from 'react';
import Button from '../../../components/ui/Button.jsx';
import Select from '../../../components/ui/Select.jsx';
import { useUploadDocument } from '../../../features/patients/queries.js';
import { useToast } from '../../../hooks/use_toast.jsx';

export default function UploadEntry({ onExtracted }) {
  const fileRef = useRef(null);
  const [docType, setDocType] = useState('insurance_card');
  const [file, setFile] = useState(null);
  const upload = useUploadDocument();
  const { toast } = useToast();

  function onChange(e) {
    setFile(e.target.files?.[0] || null);
  }

  async function submit() {
    if (!file) {
      toast('Choose a file first.', 'error');
      return;
    }
    try {
      const data = await upload.mutateAsync({ file, document_type: docType });
      // Expected shape: { patient, insurance, confidence }
      onExtracted(data);
    } catch (err) {
      toast(err.response?.data?.message || err.message, 'error');
    }
  }

  return (
    <div className="card p-5 max-w-2xl">
      <h3 className="font-semibold mb-1">Upload an insurance card or document</h3>
      <p className="text-sm text-slate-500 mb-4">
        We’ll extract fields automatically. You’ll review them before saving.
      </p>

      <Select label="Document type" value={docType} onChange={(e) => setDocType(e.target.value)}>
        <option value="insurance_card">Insurance card</option>
        <option value="drivers_license">Driver’s license</option>
        <option value="intake_form">Intake form</option>
      </Select>

      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setFile(e.dataTransfer.files?.[0] || null);
        }}
        className="mt-4 border-2 border-dashed border-slate-300 rounded-md p-8 text-center cursor-pointer hover:border-brand-400"
      >
        {file ? (
          <div className="text-sm text-slate-700">{file.name}</div>
        ) : (
          <div className="text-sm text-slate-500">
            Drop a JPG, PNG, or PDF here, or click to choose
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={onChange}
        />
      </div>

      <div className="mt-5 flex justify-end">
        <Button onClick={submit} disabled={!file || upload.isPending}>
          {upload.isPending ? 'Extracting…' : 'Extract fields'}
        </Button>
      </div>
    </div>
  );
}
