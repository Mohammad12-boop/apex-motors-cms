import { describe, expect, it } from 'vitest';
import { seedData } from '../data/seed';
import { CONTENT_TABLES, emptyRecord, localized, publicRecords, safeImageUrl, safeUrl, validEmail } from './types';
import { decodeRecord, encodeRecord, validateRecord, visibleCmsData } from './cms-data';

describe('bilingual content dataset', () => {
  it('provides all collections and every requested route-level content model', () => {
    expect(Object.keys(seedData).sort()).toEqual([...CONTENT_TABLES].sort());
    for (const [table, minimum] of Object.entries({ hero_slides: 3, services: 6, features: 8, blog_posts: 6, albums: 4, album_images: 24, faqs: 8, testimonials: 4 })) {
      expect(seedData[table].length, table).toBeGreaterThanOrEqual(minimum);
    }
    expect(seedData.pages.map(row => row.slug)).toEqual(expect.arrayContaining(['home', 'about', 'services', 'features', 'blog', 'gallery', 'contact', 'faq', 'newsletter', 'privacy', 'terms']));
    expect(seedData.services.map(row => row.title_en)).toEqual(['Vehicle Sales', 'Maintenance & Service', 'Premium Detailing', 'Vehicle Inspection', 'Parts & Accessories', 'Roadside Assistance']);
  });

  it('has unique UUIDs, unique slugs within each collection, and real Arabic translations', () => {
    const ids = new Set<string>();
    for (const rows of Object.values(seedData)) {
      const slugs = new Set<string>();
      for (const row of rows) {
        expect(row.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
        expect(ids.has(row.id), row.id).toBe(false); ids.add(row.id);
        expect(slugs.has(row.slug), row.slug).toBe(false); slugs.add(row.slug);
        expect(row.title_en.trim().length).toBeGreaterThan(0);
        expect(row.title_ar).toMatch(/[\u0600-\u06ff]/);
        expect(row.title_ar).not.toBe(row.title_en);
        expect(`${row.content_en} ${row.content_ar}`).not.toMatch(/lorem ipsum/i);
      }
    }
  });

  it('maintains category and album references, useful captions, and complete service content', () => {
    const categoryIds = new Set(seedData.blog_categories.map(row => row.id));
    const albumIds = new Set(seedData.albums.map(row => row.id));
    for (const article of seedData.blog_posts) {
      expect(categoryIds.has(String(article.category_id))).toBe(true);
      expect(article.content_en.split(/\s+/).length).toBeGreaterThan(160);
      expect(article.content_ar.split(/\s+/).length).toBeGreaterThan(110);
    }
    for (const image of seedData.album_images) {
      expect(albumIds.has(String(image.album_id))).toBe(true);
      expect(localized(image, 'alt_text', 'ar')).toMatch(/[\u0600-\u06ff]/);
    }
    for (const album of seedData.albums) expect(seedData.album_images.filter(image => image.album_id === album.id)).toHaveLength(6);
    for (const service of seedData.services) {
      expect(service.content_en.length).toBeGreaterThan(500);
      expect(service.benefits_en).toHaveLength(4);
      expect(service.benefits_ar).toHaveLength(4);
      expect(service.process_en).toHaveLength(4);
      expect(service.process_ar).toHaveLength(4);
      expect(service.gallery).toHaveLength(3);
    }
  });

  it('uses navigable internal destinations and safe external image URLs', () => {
    const routes = new Set(['/', '/about', '/services', '/features', '/blog', '/gallery', '/faq', '/contact']);
    for (const item of seedData.navigation_items) expect(routes.has(String(item.href))).toBe(true);
    for (const rows of Object.values(seedData)) for (const row of rows) if (row.image) {
      expect(safeImageUrl(row.image)).toBe(row.image);
      expect(row.image.startsWith('/') || new URL(row.image).protocol === 'https:').toBe(true);
    }
  });
});

describe('publication and input boundaries', () => {
  it('excludes drafts, archived and inactive content while keeping stable sort order', () => {
    const records = [emptyRecord({ title_en: 'Second', status: 'published', sort_order: 2 }), emptyRecord({ title_en: 'Draft' }), emptyRecord({ title_en: 'Inactive', status: 'published', active: false }), emptyRecord({ title_en: 'Archived', status: 'archived' }), emptyRecord({ title_en: 'First', status: 'published', sort_order: 1 })];
    expect(publicRecords(records).map(record => record.title_en)).toEqual(['First', 'Second']);
    expect(publicRecords(undefined)).toEqual([]);
    expect(records[0].title_en).toBe('Second');
  });

  it('rejects executable and protocol-relative URLs and accepts real internal destinations', () => {
    for (const url of ['javascript:alert(1)', 'data:text/html,test', '//evil.example', 'not a URL']) expect(safeUrl(url)).toBe('');
    for (const url of ['/services/vehicle-sales', 'https://example.com', 'mailto:hello@example.com', 'tel:+123456789']) expect(safeUrl(url)).toBe(url);
  });

  it('validates email shape and bounds without changing the localized fallback', () => {
    expect(validEmail('driver@example.com')).toBe(true);
    for (const email of ['', 'driver@', '@example.com', 'a b@example.com', 'a'.repeat(250) + '@example.com']) expect(validEmail(email)).toBe(false);
    expect(localized({ title_en: 'Vehicle care' }, 'title', 'ar')).toBe('Vehicle care');
    expect(localized({ title_en: 'Care', title_ar: 'عناية' }, 'title', 'ar')).toBe('عناية');
  });

  it('keeps inbox records and images of unpublished albums out of public data', () => {
    const data = structuredClone(seedData);
    data.albums[0].status = 'draft';
    data.contact_messages = [emptyRecord({ status: 'published', name: 'Private sender' })];
    data.newsletter_subscribers = [emptyRecord({ status: 'published', email: 'private@example.com' })];
    const publicData = visibleCmsData(data, false);
    expect(publicData.contact_messages).toEqual([]);
    expect(publicData.newsletter_subscribers).toEqual([]);
    expect(publicData.album_images.some(image => image.album_id === data.albums[0].id)).toBe(false);
    expect(visibleCmsData(data, true).contact_messages).toHaveLength(1);
  });

  it('blocks local slug and subscriber duplicates, including email case variations', () => {
    const data = structuredClone(seedData);
    const service = emptyRecord({ slug: data.services[0].slug });
    expect(() => validateRecord('services', service, data)).toThrow(/already in use/);
    expect(() => validateRecord('services', data.services[0], data)).not.toThrow();
    data.newsletter_subscribers = [emptyRecord({ email: 'driver@example.com' })];
    expect(() => validateRecord('newsletter_subscribers', emptyRecord({ email: ' DRIVER@EXAMPLE.COM ' }), data)).toThrow(/already subscribed/);
    expect(validateRecord('newsletter_subscribers', emptyRecord({ email: ' OTHER@EXAMPLE.COM ' }), data).email).toBe('other@example.com');
    expect(() => validateRecord('album_images', emptyRecord({ album_id: 'missing' }), data)).toThrow(/existing gallery album/);
  });

  it('round-trips bilingual structured fields without letting metadata override protected columns', () => {
    const service = seedData.services[0];
    expect(decodeRecord(encodeRecord('services', service))).toEqual(service);
    const decoded = decodeRecord({ ...encodeRecord('services', service), status: 'draft', data: { status: 'published', active: true, title_en: 'Spoofed title' } });
    expect(decoded.status).toBe('draft');
    expect(decoded.title_en).toBe(service.title_en);
  });

  it('accepts raster local uploads without allowing active SVG or HTML data URLs', () => {
    expect(safeImageUrl('data:image/png;base64,aGVsbG8=')).toBe('data:image/png;base64,aGVsbG8=');
    expect(safeImageUrl('https://example.com/car.webp')).toBe('https://example.com/car.webp');
    for (const url of ['data:image/svg+xml;base64,aGVsbG8=', 'data:text/html;base64,aGVsbG8=', 'javascript:alert(1)', 'mailto:test@example.com', '/\\evil.example']) expect(safeImageUrl(url)).toBe('');
  });
});
