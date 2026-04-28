import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, ImagePlus, X, Bold, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColumnDef<T> {
  key: keyof T;
  label: string;
  type?: 'text' | 'textarea' | 'richtext' | 'select' | 'date' | 'photos';
  options?: string[];
  width?: string;
}

interface EditableTableProps<T extends { id: string }> {
  columns: ColumnDef<T>[];
  rows: T[];
  onUpdate: (rows: T[]) => void;
  createEmpty: () => T;
  statusColors?: Record<string, string>;
}

export default function EditableTable<T extends { id: string }>({
  columns,
  rows,
  onUpdate,
  createEmpty,
  statusColors,
}: EditableTableProps<T>) {
  const [editingCell, setEditingCell] = useState<{ rowId: string; key: string } | null>(null);

  const handleChange = (rowId: string, key: keyof T, value: string) => {
    onUpdate(rows.map(r => (r.id === rowId ? { ...r, [key]: value } : r)));
  };

  const addRow = () => onUpdate([...rows, createEmpty()]);
  const deleteRow = (id: string) => onUpdate(rows.filter(r => r.id !== id));

  const handlePhotos = (rowId: string, key: keyof T, files: FileList) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;

    const existing: string[] = (() => {
      try {
        const val = row[key];
        if (typeof val === 'string' && val.startsWith('[')) return JSON.parse(val);
      } catch {}
      return [];
    })();

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const newPhotos = [...existing, reader.result as string];
        onUpdate(rows.map(r => (r.id === rowId ? { ...r, [key]: JSON.stringify(newPhotos) } : r)));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (rowId: string, key: keyof T, index: number) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;
    try {
      const val = row[key];
      if (typeof val === 'string') {
        const photos: string[] = JSON.parse(val);
        photos.splice(index, 1);
        onUpdate(rows.map(r => (r.id === rowId ? { ...r, [key]: JSON.stringify(photos) } : r)));
      }
    } catch {}
  };

  return (
    <div className="space-y-2">
      <div className="w-full border border-border rounded-lg shadow-card overflow-hidden">
        <table className="w-full text-sm text-left table-fixed">
          <thead className="bg-secondary border-b border-border">
            <tr>
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  className="px-2 py-2.5 text-xs font-semibold text-muted-foreground uppercase break-words"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
              <th className="px-2 py-2.5 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-6 text-muted-foreground">
                  Aucune donnée
                </td>
              </tr>
            )}
            {rows.map(row => (
              <tr key={row.id} className="hover:bg-secondary/30 transition-default align-top">
                {columns.map(col => {
                  const val = String(row[col.key] ?? '');
                  const isEditing = editingCell?.rowId === row.id && editingCell?.key === String(col.key);
                  const colorClass = statusColors && statusColors[val];

                  if (col.type === 'photos') {
                    return <PhotoCell key={String(col.key)} rowId={row.id} colKey={col.key} val={val} onAdd={handlePhotos} onRemove={removePhoto} />;
                  }

                  if (col.type === 'date') {
                    return (
                      <td key={String(col.key)} className="px-2 py-2">
                        <input
                          type="date"
                          value={val}
                          onChange={e => handleChange(row.id, col.key, e.target.value)}
                          className="w-full bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </td>
                    );
                  }

                  if (col.type === 'select' && col.options) {
                    return (
                      <td key={String(col.key)} className="px-2 py-2">
                        <select
                          value={val}
                          onChange={e => handleChange(row.id, col.key, e.target.value)}
                          className={cn(
                            'w-full text-xs font-medium px-2 py-1 rounded-md border-none focus:ring-1 focus:ring-primary cursor-pointer',
                            colorClass || 'bg-secondary'
                          )}
                        >
                          {col.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>
                    );
                  }

                  if (col.type === 'textarea') {
                    return (
                      <td key={String(col.key)} className="px-2 py-2">
                        <AutoTextarea
                          value={val}
                          onChange={v => handleChange(row.id, col.key, v)}
                        />
                      </td>
                    );
                  }

                  if (col.type === 'richtext') {
                    return (
                      <td key={String(col.key)} className="px-2 py-2">
                        <RichTextCell
                          value={val}
                          onChange={v => handleChange(row.id, col.key, v)}
                        />
                      </td>
                    );
                  }

                  return (
                    <td
                      key={String(col.key)}
                      className="px-2 py-2 cursor-text"
                      onClick={() => setEditingCell({ rowId: row.id, key: String(col.key) })}
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          type="text"
                          value={val}
                          onChange={e => handleChange(row.id, col.key, e.target.value)}
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={e => e.key === 'Enter' && setEditingCell(null)}
                          className="w-full bg-background border border-primary rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      ) : (
                        <span className="block whitespace-pre-wrap break-words">{val || '—'}</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-2 py-2">
                  <button onClick={() => deleteRow(row.id)} className="text-destructive hover:text-destructive/80 transition-default" title="Supprimer">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={addRow}
        className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-default"
      >
        <Plus size={16} /> Ajouter une ligne
      </button>
    </div>
  );
}

function PhotoCell<T>({ rowId, colKey, val, onAdd, onRemove }: {
  rowId: string;
  colKey: keyof T;
  val: string;
  onAdd: (rowId: string, key: keyof T, files: FileList) => void;
  onRemove: (rowId: string, key: keyof T, index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  let photos: string[] = [];
  try { if (val.startsWith('[')) photos = JSON.parse(val); } catch {}

  return (
    <td className="px-3 py-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        {photos.map((src, i) => (
          <div key={i} className="relative group w-10 h-10 rounded overflow-hidden border border-border">
            <img src={src} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => onRemove(rowId, colKey, i)}
              className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-default"
            >
              <X size={12} className="text-background" />
            </button>
          </div>
        ))}
        <button
          onClick={() => inputRef.current?.click()}
          className="w-10 h-10 rounded border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-default"
          title="Ajouter une photo"
        >
          <ImagePlus size={16} />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => e.target.files && onAdd(rowId, colKey, e.target.files)}
        />
      </div>
    </td>
  );
}

function AutoTextarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => { resize(); }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      onInput={resize}
      rows={1}
      className="w-full bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none overflow-hidden whitespace-pre-wrap break-words"
    />
  );
}

const RT_COLORS = ['#000000', '#dc2626', '#ea580c', '#16a34a', '#2563eb', '#9333ea'];

function RichTextCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [showColors, setShowColors] = useState(false);

  // Sync external value into editor only when it differs (avoid caret jump)
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); exec('bold'); }}
          className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-default"
          title="Gras"
        >
          <Bold size={13} />
        </button>
        <div className="relative">
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); setShowColors(s => !s); }}
            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-default"
            title="Couleur"
          >
            <Palette size={13} />
          </button>
          {showColors && (
            <div className="absolute z-10 top-full left-0 mt-1 bg-popover border border-border rounded shadow-md p-1 flex gap-1">
              {RT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); exec('foreColor', c); setShowColors(false); }}
                  className="w-4 h-4 rounded-full border border-border"
                  style={{ background: c }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={e => onChange((e.target as HTMLDivElement).innerHTML)}
        className="w-full min-h-[32px] bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary whitespace-pre-wrap break-words"
      />
    </div>
  );
}