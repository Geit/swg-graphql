const REGEX_COLOR_ESCAPE = /(\\#[A-Fa-f0-9]{6})/g;

/**
 * Removes modifier tokens from user generated names. This is to be used to places
 * where changing the color of the output is not possible (e.g. in the document title).
 *
 * @param content The string to strip from
 * @returns The input string with no modifiers.
 */
export const stripUGCModifiers = (content: string) => {
  return content.replaceAll(REGEX_COLOR_ESCAPE, '').replaceAll('\\', '');
};
