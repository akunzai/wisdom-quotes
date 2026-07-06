const PETS_KEY = 'wq-pets';

export function getPetsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return localStorage.getItem(PETS_KEY) !== 'off';
}

export function setPetsEnabled(enabled: boolean): void {
  localStorage.setItem(PETS_KEY, enabled ? 'on' : 'off');
}