/** `?set=PRS1&card=001-smile-world` -> the single value, whichever shape Next gives us */
const firstQueryValue = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

export default firstQueryValue;
