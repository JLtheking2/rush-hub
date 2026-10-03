import normalizeLookupName from './normalizeLookupName';

interface MediaWikiParseResponse {
  parse?: { wikitext?: { '*'?: string } };
  error?: { code: string; info: string };
}

const parseUrl = (apiBase: string, name: string, origin: boolean): string => {
  const pageTitle = normalizeLookupName(name).replace(/\s+/g, '_');
  return `${apiBase}?action=parse&page=${encodeURIComponent(
    pageTitle,
  )}&format=json&prop=wikitext&redirects=1${origin ? '&origin=*' : ''}`;
};

/** `fetch` + JSON, turning network failures (CORS, offline) into `unreachable` */
const fetchParse = async (
  url: string,
  site: string,
): Promise<MediaWikiParseResponse> => {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error(`${site} is unreachable right now`);
  }
  // A missing page is HTTP 200 + `missingtitle`; any other status is an outage
  if (!response.ok) {
    throw new Error(`${site} is unavailable right now (${response.status})`);
  }
  return (await response.json()) as MediaWikiParseResponse;
};

/**
 * Fetches the wikitext of a card's main (Master Rules) Yugipedia page.
 *
 * Runs entirely in the browser — the site is a static export. Yugipedia's
 * `api.php` already sends `Access-Control-Allow-Origin: *`; do NOT add
 * MediaWiki's `origin=*`, which duplicates the header and gets rejected.
 *
 * Throws on every failure path so callers can show `error.message`.
 */
export const fetchYugipediaWikitext = async (name: string): Promise<string> => {
  const apiUrl = parseUrl('https://yugipedia.com/api.php', name, false);

  // Yugipedia intermittently answers `internal_api_error_*`; retry those only
  for (let attempt = 0; attempt < 4; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const body = await fetchParse(apiUrl, 'Yugipedia');
    const wikitext = body.parse?.wikitext?.['*'];
    if (wikitext) return wikitext;

    if (!body.error?.code.startsWith('internal_api_error')) {
      throw new Error('Card not found on Yugipedia');
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise(resolve => {
      setTimeout(resolve, 500 * (attempt + 1));
    });
  }
  throw new Error('Yugipedia is having trouble right now — try again');
};

/**
 * Fallback source: the same card's page on the Yu-Gi-Oh! Fandom wiki. Unlike
 * Yugipedia, Fandom only sends CORS headers when `origin=*` is passed.
 */
export const fetchFandomWikitext = async (name: string): Promise<string> => {
  const body = await fetchParse(
    parseUrl('https://yugioh.fandom.com/api.php', name, true),
    'Fandom',
  );
  const wikitext = body.parse?.wikitext?.['*'];
  if (!wikitext) throw new Error('Card not found on Fandom');
  return wikitext;
};
