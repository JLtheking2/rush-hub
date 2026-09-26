import { cardId } from '@cardEditor/cardStyles';
import { makeCardPngBlob } from '../CardDownloader/utils';

export const requestDirectoryHandle =
  async (): Promise<FileSystemDirectoryHandle> => {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    if ((await handle.queryPermission({ mode: 'readwrite' })) !== 'granted') {
      await handle.requestPermission({ mode: 'readwrite' });
    }
    return handle;
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
