import { baseEmphemeralUnit } from './constants';

/** 421-space units → em (the card container's font-size is the ephemeral unit) */
export const u = (units: number): string => `${units / baseEmphemeralUnit}em`;
