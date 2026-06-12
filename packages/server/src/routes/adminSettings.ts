import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  ANIMATIONS,
  LAYOUTS,
  THEMES,
  readSettings,
  writeSetting,
} from '../settings.js';

export const adminSettingsRouter = Router();
adminSettingsRouter.use(requireAuth);

adminSettingsRouter.get('/', (_req, res) => {
  res.json(readSettings());
});

adminSettingsRouter.put('/', (req, res) => {
  const { siteDisplayName, theme, layout, animation } = req.body as {
    siteDisplayName?: unknown;
    theme?: unknown;
    layout?: unknown;
    animation?: unknown;
  };

  // Validate everything first so a bad field rejects the whole request
  let normalizedName: string | undefined;
  if (siteDisplayName !== undefined) {
    if (typeof siteDisplayName !== 'string') {
      res.status(400).json({ error: 'siteDisplayName must be a string' });
      return;
    }
    normalizedName = siteDisplayName.trim();
    if (normalizedName.length === 0 || normalizedName.length > 80) {
      res.status(400).json({ error: 'siteDisplayName must be 1-80 characters' });
      return;
    }
  }

  if (theme !== undefined && !(THEMES as readonly unknown[]).includes(theme)) {
    res.status(400).json({ error: `theme must be one of: ${THEMES.join(', ')}` });
    return;
  }
  if (layout !== undefined && !(LAYOUTS as readonly unknown[]).includes(layout)) {
    res.status(400).json({ error: `layout must be one of: ${LAYOUTS.join(', ')}` });
    return;
  }
  if (
    animation !== undefined &&
    !(ANIMATIONS as readonly unknown[]).includes(animation)
  ) {
    res
      .status(400)
      .json({ error: `animation must be one of: ${ANIMATIONS.join(', ')}` });
    return;
  }

  if (normalizedName !== undefined) writeSetting('siteDisplayName', normalizedName);
  if (theme !== undefined) writeSetting('theme', theme as string);
  if (layout !== undefined) writeSetting('layout', layout as string);
  if (animation !== undefined) writeSetting('animation', animation as string);

  res.json(readSettings());
});
