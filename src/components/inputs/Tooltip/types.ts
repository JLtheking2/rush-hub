import { ReactNode } from 'react';

export interface TooltipProps {
  title: string;
  withPopup?: boolean;
  children?: ReactNode;
}
