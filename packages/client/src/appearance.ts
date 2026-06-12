// Appearance options — keep ids in sync with packages/server/src/settings.ts

export const THEMES = [
  { id: 'museum-white', label: '米白美術館', note: '溫暖米白底，經典白牆展間' },
  { id: 'dark-gallery', label: '深色畫廊', note: '近黑底、柔金強調，夜間展廳' },
  { id: 'sage', label: '鼠尾草綠', note: '自然沉穩的綠色系' },
  { id: 'film-warm', label: '暖棕底片', note: '復古底片沖印的暖調' },
  { id: 'mono', label: '極簡黑白', note: '純白純黑高對比' },
  { id: 'ink-blue', label: '墨藍夜展', note: '深墨藍底、霧藍強調' },
] as const;

export const LAYOUTS = [
  { id: 'masonry', label: '瀑布流', note: '依比例直向堆疊，密度高' },
  { id: 'editorial', label: '編輯式', note: '大圖與雙圖交錯，留白多' },
  { id: 'justified', label: '展牆式', note: '每列等高、左右切齊' },
] as const;

export const ANIMATIONS = [
  { id: 'off', label: '無動畫', note: '直接顯示' },
  { id: 'subtle', label: '低調淡入', note: '輕微上移淡入' },
  { id: 'curated', label: '策展節奏', note: '慢速浮現、燈光感' },
  { id: 'dramatic', label: '戲劇開幕', note: '布幕揭開、動態強' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];
export type LayoutId = (typeof LAYOUTS)[number]['id'];
export type AnimationId = (typeof ANIMATIONS)[number]['id'];

export const DEFAULT_APPEARANCE = {
  theme: 'museum-white' as ThemeId,
  layout: 'masonry' as LayoutId,
  animation: 'curated' as AnimationId,
};

export function isThemeId(v: unknown): v is ThemeId {
  return THEMES.some((t) => t.id === v);
}
export function isLayoutId(v: unknown): v is LayoutId {
  return LAYOUTS.some((l) => l.id === v);
}
export function isAnimationId(v: unknown): v is AnimationId {
  return ANIMATIONS.some((a) => a.id === v);
}
