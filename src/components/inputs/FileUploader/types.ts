import { PropsWithChildren, ReactNode } from 'react';
import { TooltipProps } from '../Tooltip/types';

export interface FileUploaderProps {
  slug: string;
  label: string;
  onChange: (name: string, src: string) => void;
  file?: string;
  tooltipProps?: PropsWithChildren<TooltipProps>;
  /**
   * If this is passed, the fileName will not show up when uploading. Only the button text
   */
  buttonText?: ReactNode;
}
