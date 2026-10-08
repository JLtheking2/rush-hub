export interface StatInputProps {
  label: string;
  slug: string;
  value: string;
  onChange: (value: string) => void;
  /** Amount each spinner press/wheel tick changes the value by. Default 100. */
  step?: number;
  /** Called instead of a normal paste when the text is an "ATK/DEF" pair. */
  onPastePair?: (pair: { atk: string; def: string }) => void;
  /** Show the controls tooltip on this field's label. */
  showHelp?: boolean;
}
