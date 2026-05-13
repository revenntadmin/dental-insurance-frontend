import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer } from 'lucide-react';
import { Button } from './ui/button';

export function QRCodeDisplay({ url, size = 256, caption }) {
  function download_svg() {
    const svg = document.getElementById('qr-svg');
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'qr-code.svg';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function print_qr() {
    window.print();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-lg border bg-white p-4 print-poster">
        <QRCodeSVG id="qr-svg" value={url} size={size} className="qr" />
        {caption && <p className="mt-3 text-center text-sm text-muted-foreground">{caption}</p>}
      </div>
      <div className="flex gap-2 no-print">
        <Button variant="outline" size="sm" onClick={print_qr}>
          <Printer className="mr-2 h-4 w-4" /> Print
        </Button>
        <Button variant="outline" size="sm" onClick={download_svg}>
          <Download className="mr-2 h-4 w-4" /> Download SVG
        </Button>
      </div>
    </div>
  );
}
