import { useState, useRef } from 'react';
import { Plus, Trash2, ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColumnDef<T> {
  key: keyof T;
  label: string;
  type?: 'text' | 'select' | 'date' | 'photos' | 'link' | 'textarea';
  options?: string[];
  customOptionLabel?: string;
  customOptionPlaceholder?: string;
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
      <div className="overflow-x-auto border border-border rounded-lg shadow-card">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary border-b border-border">
            <tr>
              {columns.map(col => (
                <th key={String(col.key)} className="px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap" style={col.width ? { minWidth: col.width } : undefined}>
                  {col.label}
                </th>
              ))}
              <th className="px-3 py-2.5 w-10"></th>
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
              <tr key={row.id} className="hover:bg-secondary/30 transition-default">
                {columns.map(col => {
                  const val = String(row[col.key] ?? '');
                  const isEditing = editingCell?.rowId === row.id && editingCell?.key === String(col.key);
                  const isCustomSelectValue = col.type === 'select' && col.options && col.customOptionLabel
                    ? Boolean(val) && !col.options.includes(val)
                    : false;
                  const colorClass = statusColors && (statusColors[val] || (isCustomSelectValue ? statusColors[col.customOptionLabel!] : undefined));

                  if (col.type === 'photos') {
                    return <PhotoCell key={String(col.key)} rowId={row.id} colKey={col.key} val={val} onAdd={handlePhotos} onRemove={removePhoto} />;
                  }

                  if (col.type === 'date') {
                    return (
                      <td key={String(col.key)} className="px-3 py-2">
                        <input
                          type="date"
                          value={val}
                          onChange={e => handleChange(row.id, col.key, e.target.value)}
                          className="bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </td>
                    );
                  }

                  if (col.type === 'link') {
                    const href = formatHref(val);

                    return (
                      <td
                        key={String(col.key)}
                        className="px-3 py-2 cursor-text"
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
                        ) : href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="block truncate max-w-[200px] text-primary underline-offset-2 hover:underline"
                            onClick={e => e.stopPropagation()}
                          >
                            {val}
                          </a>
                        ) : (
                          <span className="block truncate max-w-[200px] text-muted-foreground">â€”</span>
                        )}
                      </td>
                    );
                  }

                  if (col.type === 'select' && col.options) {
                    const selectValue = val && col.options.includes(val)
                      ? val
                      : isCustomSelectValue
                        ? col.customOptionLabel!
                        : '';

                    return (
                      <td key={String(col.key)} className="px-3 py-2 space-y-1">
                        <select
                          value={selectValue}
                          onChange={e => handleChange(row.id, col.key, e.target.value)}
                          className={cn(
                            'text-xs font-medium px-2 py-1 rounded-md border-none focus:ring-1 focus:ring-primary cursor-pointer',
                            colorClass || 'bg-secondary'
                          )}
                        >
                          <option value="">-</option>
                          {col.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        {col.customOptionLabel && (selectValue === col.customOptionLabel || isCustomSelectValue) && (
                          <input
                            type="text"
                            value={val === col.customOptionLabel ? '' : val}
                            onChange={e => handleChange(row.id, col.key, e.target.value)}
                            placeholder={col.customOptionPlaceholder || col.customOptionLabel}
                            className={cn(
                              'w-full bg-background border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary',
                              colorClass || 'border-border'
                            )}
                          />
                        )}
                      </td>
                    );
                  }

                  if (col.type === 'textarea') {
                    return (
                      <td
                        key={String(col.key)}
                        className="px-3 py-2 cursor-text align-top"
                        onClick={() => setEditingCell({ rowId: row.id, key: String(col.key) })}
                      >
                        {isEditing ? (
                          <textarea
                            autoFocus
                            value={val}
                            onChange={e => handleChange(row.id, col.key, e.target.value)}
                            onBlur={() => setEditingCell(null)}
                            className="w-full min-h-24 bg-background border border-primary rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                          />
                        ) : (
                          <span className="block max-w-[260px] whitespace-pre-wrap break-words">{val || 'â€”'}</span>
                        )}
                      </td>
                    );
                  }

                  return (
                    <td
                      key={String(col.key)}
                      className="px-3 py-2 cursor-text"
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
                        <span className="block truncate max-w-[200px]">{val || '—'}</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2">
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

function formatHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
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
