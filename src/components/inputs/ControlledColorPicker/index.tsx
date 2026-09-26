import { ColorObject, ColorPicker } from 'mui-color';
import { FC, useCallback, useState } from 'react';
import { useDebounce } from 'react-use';
import Label from '../Label';
import { StyledFormControl } from './styles';
import { ControlledColorPickerProps } from './types';

const ControlledColorPicker: FC<ControlledColorPickerProps> = ({
  label,
  slug,
  value,
  onChange,
}) => {
  const [color, setColor] = useState<string>(value);

  const handleChange = useCallback((colorObject: ColorObject | '') => {
    if (colorObject === '') return setColor('');
    if (typeof colorObject === 'string') return setColor(colorObject);
    return setColor(`#${colorObject.hex}`);
  }, []);

  useDebounce(
    () => {
      onChange(color);
    },
    250,
    [color],
  );

  return (
    <StyledFormControl>
      <Label
        slug={slug}
        tooltipProps={{
          title: 'Click the box on the left to pick a color',
        }}
      >
        {label}
      </Label>
      <ColorPicker
        value={color}
        // @ts-expect-error - Wrong typing
        onChange={handleChange}
      />
    </StyledFormControl>
  );
};

export default ControlledColorPicker;
