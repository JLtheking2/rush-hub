import { RushCard, parseRushCard } from '@cardEditor/card';
import { cardId } from '@cardEditor/cardStyles';
import { makeCardPngBlob } from '../CardDownloader/utils';

export interface FolderCard {
  handle: FileSystemFileHandle;
  text: string;
  card: RushCard;
}

/** Where New looks for the highest Set ID: the open card's folder */
export type NewSource = { kind: 'folder'; parent: FileSystemDirectoryHandle };

export const incrementCardNumber = (value?: string): string | undefined => {
  if (value === undefined || value === '') return value;

  const match = value.match(/^(.*?)(\d+)$/);
  if (!match) return value; // no trailing digits — pass through unchanged

  const [, prefix, digits] = match;
  // Preserve zero-padding width (e.g. "007" -> "008"), unless the increment overflows it (e.g. "099" -> "100")
  const incremented = String(Number(digits) + 1).padStart(digits.length, '0');
  return prefix + incremented;
};

// Orders Set IDs by their trailing number (the part New increments), so
// "RDM-01-009" sorts before "RDM-01-010" and before "RDM-01-100".
const splitSetId = (setId: string): [string, number] => {
  const match = setId.match(/^(.*?)(\d+)$/);
  return match ? [match[1], Number(match[2])] : [setId, -1];
};

export const compareFolderCards = (
  a: { setId: string; fileName: string },
  b: { setId: string; fileName: string },
): number => {
  // Cards without a Set ID go last
  if (!a.setId !== !b.setId) return a.setId ? -1 : 1;
  const [prefixA, numberA] = splitSetId(a.setId);
  const [prefixB, numberB] = splitSetId(b.setId);
  return (
    prefixA.localeCompare(prefixB) ||
    numberA - numberB ||
    a.fileName.localeCompare(b.fileName, undefined, { numeric: true })
  );
};

// Every valid card .json directly inside parentHandle, in Set ID order.
// Invalid or unreadable files are skipped.
export const listFolderCards = async (
  parentHandle: FileSystemDirectoryHandle,
): Promise<FolderCard[]> => {
  const handles: FileSystemFileHandle[] = [];
  // eslint-disable-next-line no-restricted-syntax
  for await (const entryHandle of parentHandle.values()) {
    if (entryHandle.kind === 'file' && /\.json$/i.test(entryHandle.name)) {
      handles.push(entryHandle as FileSystemFileHandle);
    }
  }

  const cards = await Promise.all(
    handles.map(async (handle): Promise<FolderCard | null> => {
      try {
        const text = await (await handle.getFile()).text();
        const result = parseRushCard(text);
        return result.ok ? { handle, text, card: result.card } : null;
      } catch {
        return null;
      }
    }),
  );

  return cards
    .filter((c): c is FolderCard => c !== null)
    .sort((a, b) =>
      compareFolderCards(
        { setId: a.card.setId, fileName: a.handle.name },
        { setId: b.card.setId, fileName: b.handle.name },
      ),
    );
};

export const requestDirectoryHandle = async (
  startIn?: FileSystemHandle,
): Promise<FileSystemDirectoryHandle> => {
  const handle = await window.showDirectoryPicker({
    mode: 'readwrite',
    ...(startIn ? { startIn } : {}),
  });
  if ((await handle.queryPermission({ mode: 'readwrite' })) !== 'granted') {
    await handle.requestPermission({ mode: 'readwrite' });
  }
  return handle;
};

// A picked file can't be mapped up to its folder (resolve() only walks down),
// so the closest to "switch automatically" is opening the folder picker
// already inside the file's folder. Returns null if the chosen folder doesn't
// contain the file; a cancelled picker throws.
export const adoptDirectoryFor = async (
  picked: FileSystemHandle,
): Promise<FileSystemDirectoryHandle | null> => {
  const handle = await requestDirectoryHandle(picked);
  return (await handle.resolve(picked)) !== null ? handle : null;
};

export const ensureDirectoryHandle = async (
  directoryHandle: FileSystemDirectoryHandle | null,
  setDirectoryHandle: (h: FileSystemDirectoryHandle) => void,
): Promise<FileSystemDirectoryHandle> => {
  if (directoryHandle) return directoryHandle;
  const handle = await requestDirectoryHandle();
  setDirectoryHandle(handle);
  return handle;
};

export const checkWithinWorkingDirectory = async (
  directoryHandle: FileSystemDirectoryHandle,
  pickedHandle: FileSystemHandle,
): Promise<boolean> => (await directoryHandle.resolve(pickedHandle)) !== null;

// FileSystemHandle.remove() exists at runtime in modern Chromium but isn't
// declared by the installed @types/wicg-file-system-access version yet.
interface RemovableFileSystemHandle extends FileSystemHandle {
  remove(options?: { recursive?: boolean }): Promise<void>;
}

// showSaveFilePicker() creates its backing file on disk the moment the user
// confirms a location — before any write happens. When we reject that
// location for being outside the working directory, this deletes the stray
// (empty) file it already created so nothing is left behind.
export const discardStrayHandle = async (
  handle: FileSystemHandle,
): Promise<void> => {
  try {
    await (handle as RemovableFileSystemHandle).remove();
  } catch (e) {
    console.warn('Failed to discard stray file:', e);
  }
};

// Case-insensitive search for a same-base-name file with the given extension
// directly inside parentHandle (not recursive).
export const findSiblingFileHandle = async (
  parentHandle: FileSystemDirectoryHandle,
  baseName: string,
  extension: string,
): Promise<FileSystemFileHandle | null> => {
  const target = `${baseName}.${extension}`.toLowerCase();
  // eslint-disable-next-line no-restricted-syntax
  for await (const [entryName, entryHandle] of parentHandle.entries()) {
    if (entryHandle.kind === 'file' && entryName.toLowerCase() === target) {
      return entryHandle as FileSystemFileHandle;
    }
  }
  return null;
};

// Walks the resolved path from the working directory down to (but not
// including) the picked file, returning the actual folder it lives in —
// needed since the picked file may be nested in a subfolder of the working
// directory rather than sitting directly inside it.
export const getParentDirectoryHandle = async (
  directoryHandle: FileSystemDirectoryHandle,
  pickedHandle: FileSystemFileHandle,
): Promise<FileSystemDirectoryHandle> => {
  const path = await directoryHandle.resolve(pickedHandle);
  if (!path) return directoryHandle;

  return path
    .slice(0, -1)
    .reduce<Promise<FileSystemDirectoryHandle>>(
      async (currentPromise, segment) =>
        (await currentPromise).getDirectoryHandle(segment),
      Promise.resolve(directoryHandle),
    );
};

// Renders the card and writes the PNG to an already-resolved file handle.
// Never throws — a render timeout or declined permission is warned and
// swallowed, because the JSON write that follows must not be blocked by it
// (the JSON is the authoritative, re-loadable artifact).
export const writeCardPngToHandle = async (
  pngHandle: FileSystemFileHandle,
  imgWidth?: number,
  imgHeight?: number,
): Promise<void> => {
  try {
    const blob = await makeCardPngBlob(cardId, imgWidth, imgHeight);
    if (!blob) return;
    const writable = await pngHandle.createWritable();
    await writable.write(blob);
    await writable.close();
  } catch (e) {
    console.warn('Failed to write card PNG:', e);
  }
};

// Same as writeCardPngToHandle, but resolves (creating if needed)
// <baseName>.png inside parentHandle first. Also never throws.
export const writeCardPng = async (
  parentHandle: FileSystemDirectoryHandle,
  baseName: string,
  imgWidth?: number,
  imgHeight?: number,
): Promise<void> => {
  try {
    const pngHandle = await parentHandle.getFileHandle(`${baseName}.png`, {
      create: true,
    });
    await writeCardPngToHandle(pngHandle, imgWidth, imgHeight);
  } catch (e) {
    console.warn('Failed to resolve card PNG file:', e);
  }
};

// Writes <baseName>.json into parentHandle and returns its handle.
// Deliberately unguarded — a JSON failure must surface to the caller.
export const writeCardJson = async (
  parentHandle: FileSystemDirectoryHandle,
  baseName: string,
  json: string,
): Promise<FileSystemFileHandle> => {
  const jsonHandle = await parentHandle.getFileHandle(`${baseName}.json`, {
    create: true,
  });
  const writable = await jsonHandle.createWritable();
  await writable.write(json);
  await writable.close();
  return jsonHandle;
};
