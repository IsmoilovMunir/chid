import { CHID_BRAND } from '../constants/brand'

export interface BrandSettings {
  name: string
  tagline: string
  phone: string
  phoneHref: string
  email: string
  website: string
}

const STORAGE_KEY = 'chid-brand-settings'

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  name: CHID_BRAND.name,
  tagline: CHID_BRAND.tagline,
  phone: CHID_BRAND.phone,
  phoneHref: CHID_BRAND.phoneHref,
  email: CHID_BRAND.email,
  website: CHID_BRAND.website,
}

export function loadBrandSettings(): BrandSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_BRAND_SETTINGS
    const parsed = JSON.parse(raw) as Partial<BrandSettings>
    return { ...DEFAULT_BRAND_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_BRAND_SETTINGS
  }
}

export function saveBrandSettings(settings: BrandSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function phoneToHref(phone: string): string {
  return phone.replace(/[^\d+]/g, '')
}
