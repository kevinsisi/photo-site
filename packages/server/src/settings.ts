import { db } from './db/index.js';

// Appearance enums — keep in sync with packages/client/src/appearance.ts
export const THEMES = [
  'museum-white',
  'dark-gallery',
  'sage',
  'film-warm',
  'mono',
  'ink-blue',
] as const;
export const LAYOUTS = ['masonry', 'editorial', 'justified'] as const;
export const ANIMATIONS = ['off', 'subtle', 'curated', 'dramatic'] as const;

export const SETTING_DEFAULTS = {
  siteDisplayName: 'KEVIN PHOTOGRAPHY',
  theme: 'museum-white',
  layout: 'masonry',
  animation: 'curated',
} as const;

export type SiteSettings = {
  siteDisplayName: string;
  theme: string;
  layout: string;
  animation: string;
};

export function readSettings(): SiteSettings {
  const rows = db
    .prepare('SELECT key, value FROM settings')
    .all() as Array<{ key: string; value: string }>;
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    siteDisplayName: map.siteDisplayName ?? SETTING_DEFAULTS.siteDisplayName,
    theme: (THEMES as readonly string[]).includes(map.theme)
      ? map.theme
      : SETTING_DEFAULTS.theme,
    layout: (LAYOUTS as readonly string[]).includes(map.layout)
      ? map.layout
      : SETTING_DEFAULTS.layout,
    animation: (ANIMATIONS as readonly string[]).includes(map.animation)
      ? map.animation
      : SETTING_DEFAULTS.animation,
  };
}

export function writeSetting(key: string, value: string): void {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, value);
}
