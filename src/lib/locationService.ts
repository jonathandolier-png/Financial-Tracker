export function getFlagEmoji(countryCode: string): string {
  const offset = 127397;
  return Array.from(countryCode.toUpperCase())
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + offset))
    .join('');
}
