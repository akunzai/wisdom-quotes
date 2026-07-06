/** Internal key for quotes without an author (legacy URL param compat). */
export const UNKNOWN_AUTHOR = '未知';

export function isUnknownAuthor(name: string): boolean {
  return name === UNKNOWN_AUTHOR;
}

export function displayAuthorName(name: string, unknownLabel: string): string {
  return isUnknownAuthor(name) ? unknownLabel : name;
}