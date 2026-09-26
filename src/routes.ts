import normalizeLookupName from '@utils/normalizeLookupName';
import withBasePath from '@utils/withBasePath';

// Every asset path derives from here (basePath-aware).
const assets = withBasePath('/assets');

const Routes = {
  Home: '/',
  Creator: '/creator',
  Sets: '/sets',
  SetsPrint: '/sets/print',
  GitHub: {
    Home: 'https://github.com/JLtheking2/rush-hub',
    Issues: {
      New: 'https://github.com/JLtheking2/rush-hub/issues/new/choose',
    },
  },
  DeviantArt: {
    Search: (query: string) =>
      `https://www.deviantart.com/search?q=${encodeURIComponent(
        query.trim(),
      ).replace(/%20/g, '+')}`,
  },
  Yugipedia: {
    CardArtworks: (cardName: string) =>
      `https://yugipedia.com/wiki/Card_Artworks:${encodeURIComponent(
        normalizeLookupName(cardName).replace(/\s+/g, '_'),
      )}`,
  },
  Assets: {
    Root: assets,
  },
};

export default Routes;
