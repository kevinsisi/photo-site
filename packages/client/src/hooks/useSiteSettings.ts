import { fetchSettings } from '../api';
import { BRAND_NAME } from '../constants';
import { useAsync } from './useAsync';

export function useSiteSettings() {
  const { state } = useAsync(() => fetchSettings(), []);
  return {
    siteDisplayName:
      state.status === 'success' ? state.data.siteDisplayName : BRAND_NAME,
  };
}
