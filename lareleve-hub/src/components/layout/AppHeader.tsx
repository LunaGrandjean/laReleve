import { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { storageService } from '@/services/storageService';

interface HeaderProps {
  title?: string;
}

export default function AppHeader({ title = 'LaRelève' }: HeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const backup = await storageService.exportAll();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `lareleve-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        await storageService.importAll(JSON.parse(String(reader.result)));
        window.location.reload();
      } catch {
        alert("Impossible d'importer ce fichier. Vérifie que c'est bien une sauvegarde LaRelève.");
      }
    };

    reader.readAsText(file);
  };

  return (
    <header className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <div className="pl-12 lg:pl-0">
        <h1 className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleExport}
          className="action-button py-1.5"
        >
          <Download size={16} /> Exporter
        </button>
        <button
          onClick={() => inputRef.current?.click()}
          className="action-button-primary py-1.5"
        >
          <Upload size={16} /> Importer
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleImport(file);
            e.currentTarget.value = '';
          }}
        />
      </div>
    </header>
  );
}
