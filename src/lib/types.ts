export type Language = 'en' | 'ar';

export interface ContentRecord {
  [key: string]: unknown;
  id: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  slug: string;
  status: string;
  active: boolean;
  sort_order: number;
  image: string;
  content_en: string;
  content_ar: string;
  created_at: string;
  updated_at: string;
}

export function field(record: Partial<ContentRecord> | undefined, key: string): string {
  const value = record?.[key];
  return value == null ? '' : typeof value === 'string' ? value : String(value);
}

export function localized(record: Partial<ContentRecord> | undefined, key: string, lang: Language): string {
  return field(record, `${key}_${lang}`) || field(record, `${key}_en`) || field(record, key);
}

export const CONTENT_TABLES = ['pages', 'hero_slides', 'services', 'features', 'blog_posts', 'blog_categories', 'albums', 'album_images', 'faqs', 'testimonials', 'team_members', 'navigation_items', 'social_links', 'site_settings', 'media', 'contact_messages', 'newsletter_subscribers'] as const;
export const PRIVATE_TABLES = ['contact_messages', 'newsletter_subscribers'];
export const BASE_COLUMNS = ['id', 'title_en', 'title_ar', 'description_en', 'description_ar', 'slug', 'status', 'active', 'sort_order', 'image', 'content_en', 'content_ar', 'created_at', 'updated_at'];

export function emptyRecord(input: Partial<ContentRecord> = {}): ContentRecord {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), title_en: '', title_ar: '', description_en: '', description_ar: '', slug: '', status: 'draft', active: true, sort_order: 0, image: '', content_en: '', content_ar: '', created_at: now, updated_at: now, ...input };
}

export function isPublished(record: ContentRecord): boolean { return record.active && record.status === 'published'; }
export function publicRecords(records: ContentRecord[] | undefined): ContentRecord[] { return (records ?? []).filter(isPublished).sort((a, b) => a.sort_order - b.sort_order); }

export function validEmail(value: string): boolean { return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }

export function safeUrl(value: string): string {
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return value;
  try { const url = new URL(value); return ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol) ? value : ''; } catch { return ''; }
}

/** Raster data URLs are accepted for browser-local demo uploads; SVG is deliberately excluded. */
export function safeImageUrl(value: string): string {
  if (/^data:image\/(?:png|jpe?g|webp|gif|avif);base64,[a-z0-9+/=\s]+$/i.test(value)) return value;
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return value;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? value : ''; } catch { return ''; }
}
