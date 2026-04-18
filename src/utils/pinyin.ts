export function formatPinyin(pinyin: string): string {
  return pinyin.replace(/\s+/g, ' ').trim();
}
