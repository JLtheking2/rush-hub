export interface StatInputProps {
  label: string;
  slug: string;
  value: string;
  onChange: (value: string) => void;
  /** Amount each spinner press/wheel tick changes the value by. Default 100. */
  step?: number;
}
