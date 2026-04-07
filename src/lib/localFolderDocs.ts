import { get, set, del } from 'idb-keyval';

// ── Types ──────────────────────────────────────────────────────────────────
export interface DocMeta {
  id: string;
  offerId: string;        // folder path, e.g. "paris/1er arrondissement"
  originalName: string;
  storedName: string;
  type: string;
  size: number;
  createdAt: string;
}

const DIR_HANDLE_KEY = 'lareleve_dir_handle';
const DOCS_META_KEY = 'lareleve_docs_meta';

// ── Feature detection ──────────────────────────────────────────────────────
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

// ── Directory handle persistence ───────────────────────────────────────────
export async function chooseDirectory(): Promise<FileSystemDirectoryHandle> {
  const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
  await saveDirectoryHandle(handle);
  return handle;
}

export async function saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  await set(DIR_HANDLE_KEY, handle);
}

export async function getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const handle = await get<FileSystemDirectoryHandle>(DIR_HANDLE_KEY);
    return handle ?? null;
  } catch {
    return null;
  }
}

export async function clearDirectoryHandle(): Promise<void> {
  await del(DIR_HANDLE_KEY);
}

// ── Permissions ────────────────────────────────────────────────────────────
export async function verifyPermission(
  handle: FileSystemDirectoryHandle,
  readWrite = true
): Promise<boolean> {
  const options: any = { mode: readWrite ? 'readwrite' : 'read' };
  if ((await (handle as any).queryPermission(options)) === 'granted') return true;
  if ((await (handle as any).requestPermission(options)) === 'granted') return true;
  return false;
}

// ── File operations ────────────────────────────────────────────────────────
export async function saveFileToDirectory(
  dirHandle: FileSystemDirectoryHandle,
  file: File,
  storedName: string
): Promise<void> {
  const fileHandle = await dirHandle.getFileHandle(storedName, { create: true });
  const writable = await (fileHandle as any).createWritable();
  await writable.write(file);
  await writable.close();
}

export async function getFileFromDirectory(
  dirHandle: FileSystemDirectoryHandle,
  storedName: string
): Promise<File | null> {
  try {
    const fileHandle = await dirHandle.getFileHandle(storedName);
    return await fileHandle.getFile();
  } catch {
    return null;
  }
}

export async function deleteFileFromDirectory(
  dirHandle: FileSystemDirectoryHandle,
  storedName: string
): Promise<void> {
  try {
    await dirHandle.removeEntry(storedName);
  } catch {
    // File may already be deleted
  }
}

// ── Metadata CRUD (IndexedDB) ─────────────────────────────────────────────
export async function getDocsMeta(): Promise<DocMeta[]> {
  try {
    return (await get<DocMeta[]>(DOCS_META_KEY)) ?? [];
  } catch {
    return [];
  }
}

export async function saveDocsMeta(docs: DocMeta[]): Promise<void> {
  await set(DOCS_META_KEY, docs);
}

export async function addDocMeta(doc: DocMeta): Promise<void> {
  const docs = await getDocsMeta();
  docs.push(doc);
  await saveDocsMeta(docs);
}

export async function removeDocMeta(id: string): Promise<void> {
  const docs = await getDocsMeta();
  await saveDocsMeta(docs.filter(d => d.id !== id));
}

export async function getDocsByOfferId(offerId: string): Promise<DocMeta[]> {
  const docs = await getDocsMeta();
  return docs.filter(d => d.offerId === offerId);
}

// ── Unique filename generator ──────────────────────────────────────────────
export function generateStoredName(originalName: string): string {
  const ext = originalName.includes('.') ? '.' + originalName.split('.').pop() : '';
  const base = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${Date.now()}-${base}${ext}`;
}
