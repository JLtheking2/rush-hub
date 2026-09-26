import {
  baseEmphemeralUnit,
  cardImgHeight,
  cardImgWidth,
} from '@cardEditor/cardStyles/constants';
import { toCanvas } from 'html-to-image';

// 1×1 transparent PNG — used as a placeholder for any image that fails to load
// during export. Without this, html-to-image sets clonedNode.src = '' which
// fires neither onload nor onerror, hanging the entire toCanvas call forever.
const TRANSPARENT_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

// Hard timeout (ms) for the entire toCanvas call. Backstops any case where
// fetch() itself stalls (it has no built-in timeout), guaranteeing the export
// always settles rather than hanging the UI indefinitely.
const EXPORT_TIMEOUT_MS = 15000;

export const makeCanvas = async (
  cardId: string,
  imgWidth: number = cardImgWidth,
  imgHeight: number = cardImgHeight,
): Promise<HTMLCanvasElement | undefined> => {
  const tempDiv = document.querySelector('#temp') as HTMLElement | null;
  const originalDiv = document.querySelector(
    `#${cardId}`,
  ) as HTMLElement | null;

  if (!tempDiv || !originalDiv) {
    return undefined;
  }

  const div = originalDiv.cloneNode(true) as HTMLCanvasElement;
  // Add the cloned div to the DOM in an invisible div
  tempDiv.append(div);

  // Set desired css attributes
  div.style.width = `${imgWidth}px`;
  div.style.height = `${imgHeight}px`;
  div.style.fontSize = `${baseEmphemeralUnit}px`;

  try {
    const canvas = await Promise.race([
      toCanvas(div, {
        backgroundColor: 'transparent',
        height: div.clientHeight,
        width: div.clientWidth,
        // Replace any broken/missing image with a transparent pixel so the
        // export completes cleanly instead of hanging on an empty src.
        imagePlaceholder: TRANSPARENT_PIXEL,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Card export timed out')),
          EXPORT_TIMEOUT_MS,
        ),
      ),
    ]);
    return canvas;
  } catch (e) {
    console.warn('makeCanvas failed:', e);
    return undefined;
  } finally {
    // Always remove the cloned div from the DOM, even on failure or timeout.
    div.remove();
  }
};

export const canvasToPngBlob = (
  canvas: HTMLCanvasElement,
): Promise<Blob | undefined> =>
  new Promise(resolve =>
    canvas.toBlob(blob => resolve(blob ?? undefined), 'image/png', 1),
  );

export const makeCardPngBlob = async (
  cardId: string,
  imgWidth?: number,
  imgHeight?: number,
): Promise<Blob | undefined> => {
  const canvas = await makeCanvas(cardId, imgWidth, imgHeight);
  return canvas ? canvasToPngBlob(canvas) : undefined;
};
