import { BASE_COLUMNS, PRIVATE_TABLES, validEmail, type ContentRecord } from './types';

export type CmsData = Record<string, ContentRecord[]>;

export function visibleCmsData(data: CmsData, admin: boolean): CmsData {
  if (admin) return data;
  const result = Object.fromEntries(Object.entries(data).map(([table, rows]) => [table, PRIVATE_TABLES.includes(table) ? [] : rows.filter(row => row.status === 'published' && row.active)]));
  const albums = new Set(result.albums?.map(album => album.id));
  result.album_images = (result.album_images ?? []).filter(row => albums.has(String(row.album_id)));
  return result;
}

export function decodeRecord(row: Record<string, unknown>): ContentRecord {
  const { data, ...columns } = row;
  return { ...(data as Record<string, unknown> ?? {}), ...columns } as ContentRecord;
}

export function encodeRecord(table: string, record: ContentRecord): Record<string, unknown> {
  const columns = new Set([...BASE_COLUMNS, ...(table === 'album_images' ? ['album_id'] : []), ...(table === 'blog_posts' ? ['category_id'] : []), ...(table === 'contact_messages' ? ['name', 'email', 'phone', 'subject', 'message', 'is_read'] : []), ...(table === 'newsletter_subscribers' ? ['name', 'email'] : [])]);
  const row: Record<string, unknown> = {}; const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) { if (key === 'data') continue; if (columns.has(key)) row[key] = value; else data[key] = value; }
  if ('category_id' in row && !row.category_id) row.category_id = null;
  return { ...row, data };
}

/** Shared early validation for local demo writes and connected database writes. */
export function validateRecord(table: string, record: ContentRecord, data: CmsData): ContentRecord {
  const next: ContentRecord = { ...record, slug: record.slug.trim() };
  if (next.slug && (data[table] ?? []).some(row => row.id !== next.id && row.slug === next.slug)) throw new Error('This URL slug is already in use. Choose a unique slug.');
  if (next.slug && /[/?#\\\s]/.test(next.slug)) throw new Error('A slug cannot contain spaces, slashes, or URL query characters.');
  if (table === 'album_images' && !data.albums?.some(album => album.id === next.album_id)) throw new Error('Select an existing gallery album.');
  if (table === 'blog_posts' && next.category_id && !data.blog_categories?.some(category => category.id === next.category_id)) throw new Error('Select an existing blog category.');
  if (table === 'newsletter_subscribers') {
    next.email = String(next.email ?? '').trim().toLowerCase();
    if (!validEmail(String(next.email))) throw new Error('Please enter a valid email address.');
    if ((data.newsletter_subscribers ?? []).some(row => row.id !== next.id && String(row.email).trim().toLowerCase() === next.email)) throw new Error('This email address is already subscribed.');
  }
  return next;
}
