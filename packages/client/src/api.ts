// API client — all requests go through the /api dev proxy (or same-origin in production)

export interface Category {
  id: number;
  name: string;
  sortOrder: number;
}

export interface Photo {
  id: number;
  categoryId: number;
  title: string;
  thumbUrl: string;
  mediumUrl: string;
  sortOrder: number;
}

export interface Plan {
  id: number;
  name: string;
  description: string;
  items: string[];
  price: number;
  sortOrder: number;
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function fetchCategories(): Promise<Category[]> {
  return apiFetch<Category[]>('/api/categories');
}

export function fetchPhotos(categoryId?: number): Promise<Photo[]> {
  const qs = categoryId != null ? `?category=${categoryId}` : '';
  return apiFetch<Photo[]>(`/api/photos${qs}`);
}

export function fetchPlans(): Promise<Plan[]> {
  return apiFetch<Plan[]>('/api/plans');
}
