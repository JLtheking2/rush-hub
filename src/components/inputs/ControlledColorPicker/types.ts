export interface ControlledColorPickerProps {
  value: string;
  label: string;
  slug: string;
  onChange: (value: string) => void;
}
