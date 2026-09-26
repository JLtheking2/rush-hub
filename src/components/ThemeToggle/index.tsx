import { useSettingsStore } from '@features/settings';
import {
  Brightness4 as MoonIcon,
  Brightness7 as SunIcon,
} from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { FC, useCallback } from 'react';

const ThemeToggle: FC = () => {
  const themeMode = useSettingsStore(store => store.theme);
  const setThemeMode = useSettingsStore(store => store.setTheme);

  const handleClick = useCallback(() => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
  }, [setThemeMode, themeMode]);

  return (
    <IconButton
      aria-label="switch theme"
      color="inherit"
      onClick={handleClick}
      sx={{ ml: 'auto' }}
    >
      {themeMode === 'light' ? <MoonIcon /> : <SunIcon />}
    </IconButton>
  );
};

export default ThemeToggle;
