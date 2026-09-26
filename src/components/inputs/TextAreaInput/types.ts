import { InputProps } from '../GeneralInput/types';

export interface TextAreaInputProps extends InputProps {
  onChange: (value: string) => void;
  /** Overrides the default single-line-ish height. */
  minRows?: number;
}
