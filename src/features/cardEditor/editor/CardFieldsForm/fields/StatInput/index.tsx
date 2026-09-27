import TextInput from '@components/inputs/TextInput';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { IconButton, InputAdornment } from '@mui/material';
import { Box } from '@mui/system';
import { FC, KeyboardEvent, useEffect, useRef } from 'react';
import { StatInputProps } from './types';

/** Clamped at 0; blank/non-numeric values (e.g. "?") are treated as 0. */
const stepValue = (value: string, delta: number): string => {
  const parsed = parseInt(value, 10);
  const base = Number.isNaN(parsed) ? 0 : parsed;
  return String(Math.max(0, base + delta));
};

const StatInput: FC<StatInputProps> = ({ step = 100, ...props }) => {
  const { value, onChange, label } = props;

  // Kept in a ref so the native wheel listener always sees the latest
  // value/onChange without needing to be re-attached on every change.
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return undefined;

    const handleWheel = (e: WheelEvent) => {
      // Only steer the wheel while the field is focused, matching how a
      // native <input type="number"> spinner behaves; otherwise scrolling
      // the page past the field would get hijacked.
      if (document.activeElement !== input) return;
      e.preventDefault();
      const delta = -Math.sign(e.deltaY) * step;
      latest.current.onChange(stepValue(latest.current.value, delta));
    };

    // React's onWheel is passive and can't preventDefault the page scroll,
    // so this is attached natively instead.
    input.addEventListener('wheel', handleWheel, { passive: false });
    return () => input.removeEventListener('wheel', handleWheel);
  }, [step]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(stepValue(value, step));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(stepValue(value, -step));
    }
  };

  return (
    <TextInput
      {...props}
      inputProps={{ onKeyDown: handleKeyDown }}
      InputProps={{
        inputRef,
        endAdornment: (
          <InputAdornment position="end">
            <Box display="flex" flexDirection="column">
              <IconButton
                size="small"
                sx={{ padding: 0 }}
                aria-label={`Increase ${label} by ${step}`}
                onClick={() => onChange(stepValue(value, step))}
              >
                <KeyboardArrowUpIcon fontSize="inherit" />
              </IconButton>
              <IconButton
                size="small"
                sx={{ padding: 0 }}
                aria-label={`Decrease ${label} by ${step}`}
                onClick={() => onChange(stepValue(value, -step))}
              >
                <KeyboardArrowDownIcon fontSize="inherit" />
              </IconButton>
            </Box>
          </InputAdornment>
        ),
      }}
    />
  );
};

export default StatInput;
