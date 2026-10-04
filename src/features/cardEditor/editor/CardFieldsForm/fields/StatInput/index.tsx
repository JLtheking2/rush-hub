import TextInput from '@components/inputs/TextInput';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { IconButton, InputAdornment } from '@mui/material';
import { Box } from '@mui/system';
import { FC, KeyboardEvent, useEffect, useRef } from 'react';
import { CTRL_STEP, SHIFT_STEP, stepFor, stepValue } from './step';
import { StatInputProps } from './types';

const StatHelp: FC<{ step: number }> = ({ step }) => (
  <Box
    component="ul"
    sx={{ margin: 0, paddingLeft: 2, '& li': { marginBottom: 0.5 } }}
  >
    <li>
      ▲ / ▼ buttons, ↑ / ↓ keys, or scroll wheel (click into the field first): ±
      {step}
    </li>
    <li>Hold Ctrl: ±{CTRL_STEP}</li>
    <li>Hold Shift: ±{SHIFT_STEP}</li>
    <li>Stops at 0; blank or &quot;?&quot; counts as 0</li>
  </Box>
);

const StatInput: FC<StatInputProps> = ({ step = 100, showHelp, ...props }) => {
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
      // Ctrl+wheel would otherwise zoom the page; preventDefault (below)
      // stops that too as long as the field is focused.
      e.preventDefault();

      // Shift+wheel is turned into horizontal scroll by the browser, so its
      // movement arrives as deltaX instead of deltaY.
      const rawDelta = e.deltaY || e.deltaX;
      if (rawDelta === 0) return;

      const delta = -Math.sign(rawDelta) * stepFor(e, step);
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
      onChange(stepValue(value, stepFor(e, step)));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(stepValue(value, -stepFor(e, step)));
    }
  };

  return (
    <TextInput
      {...props}
      tooltipProps={showHelp ? { title: <StatHelp step={step} /> } : undefined}
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
                onClick={e => onChange(stepValue(value, stepFor(e, step)))}
              >
                <KeyboardArrowUpIcon fontSize="inherit" />
              </IconButton>
              <IconButton
                size="small"
                sx={{ padding: 0 }}
                aria-label={`Decrease ${label} by ${step}`}
                onClick={e => onChange(stepValue(value, -stepFor(e, step)))}
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
