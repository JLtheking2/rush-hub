import { FormControl, TextField } from '@mui/material';
import { FC, useEffect, useState } from 'react';
import { useDebounce } from 'react-use';
import Label from '../Label';
import { GeneralInputProps } from './types';

const GeneralInput: FC<GeneralInputProps> = ({
  slug,
  endAdornment,
  startAdornment,
  label,
  disabled,
  onChange,
  tooltipProps,
  value,
  forceUpdate,
  skipDebounce,
  inputProps,
  InputProps,
  ...rest
}) => {
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value, forceUpdate]);

  useDebounce(
    () => {
      // Components implementing this component will add typing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onChange(tempValue as any);
    },
    skipDebounce ? 0 : 250,
    [tempValue],
  );

  return (
    <FormControl sx={{ width: '100%' }}>
      <Label slug={slug} tooltipProps={tooltipProps}>
        {label}
      </Label>
      <TextField
        id={`${slug}-input`}
        InputProps={{
          startAdornment,
          endAdornment,
          ...InputProps,
        }}
        inputProps={{
          sx: {
            cursor: disabled ? 'not-allowed' : undefined,
          },
          ...inputProps,
        }}
        disabled={disabled}
        onChange={e => setTempValue(e.currentTarget.value)}
        value={tempValue}
        {...rest}
      />
    </FormControl>
  );
};

export default GeneralInput;
