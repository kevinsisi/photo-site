import { useEffect } from 'react';
import { fetchSettings } from '../api';
import { BRAND_NAME } from '../constants';
import {
  DEFAULT_APPEARANCE,
  isAnimationId,
  isLayoutId,
  isThemeId,
  type AnimationId,
  type LayoutId,
  type ThemeId,
} from '../appearance';
import { useAsync } from './useAsync';

export interface ResolvedSiteSettings {
  siteDisplayName: string;
  theme: ThemeId;
  layout: LayoutId;
  animation: AnimationId;
  loaded: boolean;
}

// Several components read settings; fetch once per page load
let settingsPromise: ReturnType<typeof fetchSettings> | null = null;
function fetchSettingsOnce() {
  if (!settingsPromise) {
    settingsPromise = fetchSettings().catch((err: unknown) => {
      settingsPromise = null; // allow retry after a failure
      throw err;
    });
  }
  return settingsPromise;
}

export function useSiteSettings(): ResolvedSiteSettings {
  const { state } = useAsync(() => fetchSettingsOnce(), []);

  if (state.status !== 'success') {
    return {
      siteDisplayName: BRAND_NAME,
      ...DEFAULT_APPEARANCE,
      loaded: false,
    };
  }

  const { siteDisplayName, theme, layout, animation } = state.data;
  return {
    siteDisplayName: siteDisplayName || BRAND_NAME,
    theme: isThemeId(theme) ? theme : DEFAULT_APPEARANCE.theme,
    layout: isLayoutId(layout) ? layout : DEFAULT_APPEARANCE.layout,
    animation: isAnimationId(animation) ? animation : DEFAULT_APPEARANCE.animation,
    loaded: true,
  };
}

/**
 * Applies theme/layout/animation as data attributes on <html> so the token
 * CSS retints the whole public site. Call once from the public Layout.
 */
export function useApplyAppearance(settings: ResolvedSiteSettings): void {
  const { theme, layout, animation } = settings;
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.theme = theme;
    el.dataset.layout = layout;
    el.dataset.anim = animation;
  }, [theme, layout, animation]);
}
