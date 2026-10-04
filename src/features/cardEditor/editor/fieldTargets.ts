import { CardField } from '@cardEditor/cardStyles/inlineEditStore';

type Accordion =
  | 'cardForm'
  | 'imagesForm'
  | 'statsForm'
  | 'textForm'
  | 'infoForm';

interface FieldTarget {
  accordion: Accordion;
  /** Element to scroll to / focus */
  selector: string;
  kind: 'text' | 'select' | 'section';
}

const fieldTargets: Record<CardField, FieldTarget> = {
  name: { accordion: 'cardForm', selector: '#cardName-input', kind: 'text' },
  attribute: {
    accordion: 'cardForm',
    selector: '#attribute-input',
    kind: 'select',
  },
  template: {
    accordion: 'cardForm',
    selector: '#template-input',
    kind: 'section',
  },
  stIcon: { accordion: 'statsForm', selector: '#stIcon-input', kind: 'select' },
  art: {
    accordion: 'imagesForm',
    selector: '#imagesForm-header',
    kind: 'section',
  },
  level: { accordion: 'statsForm', selector: '#level-input', kind: 'text' },
  atk: { accordion: 'statsForm', selector: '#atk-input', kind: 'text' },
  def: { accordion: 'statsForm', selector: '#def-input', kind: 'text' },
  typeLine: {
    accordion: 'statsForm',
    selector: '#typeLine-input',
    kind: 'text',
  },
  effect: { accordion: 'textForm', selector: '#effect-input', kind: 'text' },
  serial: { accordion: 'infoForm', selector: '#serial-input', kind: 'text' },
  setId: { accordion: 'infoForm', selector: '#setId-input', kind: 'text' },
};

/** MUI's Accordion collapse transition */
const COLLAPSE_MS = 320;
const HIGHLIGHT_MS = 1000;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const highlight = (el: HTMLElement) => {
  const box = el.closest<HTMLElement>('.MuiFormControl-root') ?? el;
  const previous = {
    outline: box.style.outline,
    offset: box.style.outlineOffset,
  };
  box.style.outline = '2px solid #1976d2';
  box.style.outlineOffset = '2px';
  setTimeout(() => {
    box.style.outline = previous.outline;
    box.style.outlineOffset = previous.offset;
  }, HIGHLIGHT_MS);
};

/**
 * Brings the form control behind a card region into view: expands its
 * accordion if collapsed, scrolls to it, flashes it, and (with `focus`)
 * focuses it — cursor at the end for text, dropdown opened for selects.
 */
export const revealField = async (
  field: CardField,
  { focus }: { focus: boolean },
): Promise<void> => {
  const target = fieldTargets[field];

  const header = document.querySelector<HTMLElement>(
    `#${target.accordion}-header`,
  );
  if (header?.getAttribute('aria-expanded') === 'false') {
    header.click();
    await wait(COLLAPSE_MS);
  }

  const el = document.querySelector<HTMLElement>(target.selector);
  if (!el) return;

  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  highlight(el);
  if (!focus) return;

  if (target.kind === 'text') {
    el.focus({ preventScroll: true });
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      const end = el.value.length;
      try {
        el.setSelectionRange(end, end);
      } catch {
        // type=number inputs (Level) don't support selection ranges
      }
    }
  } else if (target.kind === 'select') {
    el.focus({ preventScroll: true });
    // MUI's Select opens on a primary-button mousedown
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
  }
};
