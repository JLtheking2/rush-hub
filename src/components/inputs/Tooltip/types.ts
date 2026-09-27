import { ReactNode } from 'react';

export interface TooltipProps {
  // Matches MUI Tooltip's own `title` type, which excludes `undefined`.
  title: NonNullable<ReactNode>;
  withPopup?: boolean;
  children?: ReactNode;
}
