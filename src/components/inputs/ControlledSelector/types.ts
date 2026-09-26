import { SelectChangeEvent } from '@mui/material/Select/Select';
import { ReactNode } from 'react';
import { TooltipProps } from '../Tooltip/types';

export interface ControlledSelectorProps {
  displayName: string;
  slug: string;
  value?: number | string;
  gap?: number;
  helpText?: ReactNode;
  tooltipProps?: TooltipProps;
  onChange: (event: SelectChangeEvent) => void;
}
