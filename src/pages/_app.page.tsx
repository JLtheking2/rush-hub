import { CacheProvider, EmotionCache, ThemeProvider } from '@emotion/react';
import { CssBaseline } from '@mui/material';
import { AppProps as NextAppProps } from 'next/app';
import { FC } from 'react';
import { createEmotionCache } from '@css';
import { Footer, Header } from '@layout';
import { useSettingsStore } from '@features/settings';
import { getTheme } from '@utils/theme';
import { Background, MainContainer } from './styles';

interface AppProps extends NextAppProps {
  emotionCache: EmotionCache;
}

const clientSideCache = createEmotionCache();

const App: FC<AppProps> = ({
  emotionCache = clientSideCache,
  Component,
  pageProps,
}) => {
  const theme = useSettingsStore(store => store.theme);

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={getTheme(theme)}>
        <CssBaseline />
        <Background>
          <Header />
          <MainContainer as="main">
            <Component {...pageProps} />
          </MainContainer>
          <Footer />
        </Background>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default App;
