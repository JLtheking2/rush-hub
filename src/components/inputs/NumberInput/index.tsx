import { FC, useCallback } from 'react';
import { useBoolean } from 'react-use';
import GeneralInput from '../GeneralInput';
import { NumberInputProps } from './types';

const NumberInput: FC<NumberInputProps> = ({
  onChange,
  min,
  max,
  step = 1,
  ...props
}) => {
  const [update, forceUpdate] = useBoolean(false);

  const handleChange = useCallback(
    (value: number | '') => {
      let finalValue = value;
      if (finalValue !== '') {
        if (min !== undefined) finalValue = Math.max(min, finalValue);
        if (max !== undefined) finalValue = Math.min(max, finalValue);
        if (+finalValue !== +value) forceUpdate();
      }
      onChange(finalValue);
    },
    [onChange, min, max, forceUpdate],
  );

  return (
    <GeneralInput
      inputProps={{
        inputMode: 'numeric',
        pattern: '[0-9]*',
        step,
      }}
      type="number"
      onChange={handleChange}
      forceUpdate={update}
      {...props}
    />
  );
};

export default NumberInput;
