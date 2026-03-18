import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColumnDef<T> {
  key: keyof T;
  label: string;
  type?: 'text' | 'select';
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
                  const colorClass = statusColors && statusColors[val];

                  if (col.type === 'select' && col.options) {
                    return (
                      <td key={String(col.key)} className="px-3 py-2">
                        <select
                          value={val}
                          onChange={e => handleChange(row.id, col.key, e.target.value)}
                          className={cn(
                            'text-xs font-medium px-2 py-1 rounded-md border-none focus:ring-1 focus:ring-primary cursor-pointer',
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
