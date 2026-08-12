import { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { storageService } from '@/services/storageService';

interface HeaderProps {
  title?: string;
}

export default function AppHeader({ title = 'LaRelève' }: HeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const backup = storageService.exportAll();
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

    reader.onload = () => {
      try {
        storageService.importAll(JSON.parse(String(reader.result)));
        window.location.reload();
      } catch {
        alert("Impossible d'importer ce fichier. Vérifie que c'est bien une sauvegarde LaRelève.");
      }
    };

    reader.readAsText(file);
  };

  return (
    <header className="h-14 bg-primary flex items-center justify-between gap-4 px-6 lg:px-8 shrink-0">
      <h1 className="text-lg font-bold text-primary-foreground tracking-wide pl-10 lg:pl-0">
        {title}
      </h1>

      <div className="flex items-center gap-2">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary-foreground/15 text-primary-foreground text-sm font-medium hover:bg-primary-foreground/25 transition-default"
        >
          <Download size={16} /> Exporter
        </button>
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary-foreground text-primary text-sm font-medium hover:bg-primary-foreground/90 transition-default"
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
