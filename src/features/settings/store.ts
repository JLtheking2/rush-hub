import { PaletteMode } from '@mui/material';
import create from 'zustand';

export interface SettingsStore {
  theme: PaletteMode;
  setTheme: (theme: PaletteMode) => void;
}

export const useSettingsStore = create<SettingsStore>(set => ({
  theme: 'light',
  setTheme: theme => set({ theme }),
}));
