import normalizeLookupName from './normalizeLookupName';

interface MediaWikiParseResponse {
  parse?: { wikitext?: { '*'?: string } };
  error?: { code: string; info: string };
}

/**
 * Fetches the wikitext of a card's main (Master Rules) Yugipedia page.
 *
 * Runs entirely in the browser — the site is a static export. Yugipedia's
 * `api.php` already sends `Access-Control-Allow-Origin: *`; do NOT add
 * MediaWiki's `origin=*`, which duplicates the header and gets rejected.
 *
 * Throws on every failure path so callers can show `error.message`.
 */
const fetchYugipediaWikitext = async (name: string): Promise<string> => {
  const pageTitle = normalizeLookupName(name).replace(/\s+/g, '_');
  const apiUrl = `https://yugipedia.com/api.php?action=parse&page=${encodeURIComponent(
    pageTitle,
  )}&format=json&prop=wikitext&redirects=1`;

  // Yugipedia intermittently answers `internal_api_error_*`; retry those only
  for (let attempt = 0; attempt < 4; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('Card not found on Yugipedia');

    // eslint-disable-next-line no-await-in-loop
    const body = (await response.json()) as MediaWikiParseResponse;
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

export default fetchYugipediaWikitext;
