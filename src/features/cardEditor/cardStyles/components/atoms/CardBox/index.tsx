import { FC, HTMLAttributes } from 'react';
import { u } from '../../../units';

export interface CardBoxProps extends HTMLAttributes<HTMLDivElement> {
  /** [left, top, width?, height?] in 421-space units */
  at: [number, number, number?, number?];
}

/** Absolutely positions its children using 421-space units (converted to em) */
const CardBox: FC<CardBoxProps> = ({ at, style, children, ...props }) => (
  <div
    {...props}
    style={{
      position: 'absolute',
      left: u(at[0]),
      top: u(at[1]),
      width: at[2] === undefined ? undefined : u(at[2]),
      height: at[3] === undefined ? undefined : u(at[3]),
      ...style,
    }}
  >
    {children}
  </div>
);

export default CardBox;
