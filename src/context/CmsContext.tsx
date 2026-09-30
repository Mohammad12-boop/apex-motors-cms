import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { seedData } from '../data/seed';
import { CONTENT_TABLES, PRIVATE_TABLES, emptyRecord, validEmail, type ContentRecord } from '../lib/types';
import { visibleCmsData as visible, decodeRecord as decode, encodeRecord as encode, validateRecord } from '../lib/cms-data';
import { demoEnabled, supabase } from '../lib/supabase';

type Data = Record<string, ContentRecord[]>;
type ContactInput = { name: string; email: string; phone: string; subject: string; message: string };
interface CmsValue {
  data: Data; ready: boolean; error: string | null;
  save(table: string, record: Partial<ContentRecord>): Promise<void>;
  remove(table: string, id: string): Promise<void>;
  refresh(): Promise<void>;
  submitContact(input: ContactInput): Promise<void>;
  subscribe(email: string, name?: string): Promise<'success' | 'duplicate'>;
  uploadMedia(file: File, metadata?: Partial<ContentRecord>): Promise<ContentRecord>;
}
const CmsContext = createContext<CmsValue | null>(null);
const STORAGE_KEY = 'apex-cms-v1';
const emptyData = (): Data => Object.fromEntries(CONTENT_TABLES.map(table => [table, []]));
function readLocal(): Data {
  if (demoEnabled) {
    try { const value = localStorage.getItem(STORAGE_KEY); if (value) return { ...structuredClone(seedData), ...JSON.parse(value) }; } catch { /* Recover an unreadable browser cache with the bundled demo. */ }
  }
  return structuredClone(seedData);
}

export function CmsProvider({ children }: { children: ReactNode }) {
  const { isAdmin, loading: authLoading } = useAuth();
  const localData = useRef<Data>(readLocal());
  const [data, setData] = useState<Data>(() => supabase ? emptyData() : visible(localData.current, false));
  const [ready, setReady] = useState(!supabase);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);

  const refresh = useCallback(async () => {
    const current = ++generation.current;
    if (!supabase) { localData.current = readLocal(); setData(visible(localData.current, isAdmin)); setReady(true); setError(null); return; }
    setError(null);
    const next = emptyData();
    try {
      await Promise.all(CONTENT_TABLES.map(async table => {
        if (PRIVATE_TABLES.includes(table) && !isAdmin) return;
        let query = supabase!.from(table).select('*').order('sort_order', { ascending: true });
        if (!isAdmin) query = query.eq('active', true).eq('status', 'published');
        const { data: rows, error: queryError } = await query;
        if (queryError) throw queryError;
        next[table] = (rows ?? []).map(decode);
      }));
      if (generation.current === current) setData(visible(next, isAdmin));
    } catch (cause) {
      if (generation.current === current) { setError(cause instanceof Error ? cause.message : String((cause as { message?: string })?.message ?? 'Unable to load content.')); setData(emptyData()); }
    } finally { if (generation.current === current) setReady(true); }
  }, [isAdmin]);

  useEffect(() => { if (!authLoading) void refresh(); }, [refresh, authLoading]);
  useEffect(() => {
    const listener = (event: StorageEvent) => { if (event.key === STORAGE_KEY && !supabase) void refresh(); };
    window.addEventListener('storage', listener); return () => window.removeEventListener('storage', listener);
  }, [refresh]);

  function persist(next: Data) {
    if (!demoEnabled) throw new Error('Connect Supabase to save changes. The local demo is disabled in this deployment.');
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { throw new Error('Browser storage is full. Delete unused demo media or connect Supabase Storage.'); }
    localData.current = next; setData(visible(next, isAdmin));
  }
  function requireAdmin(table: string) {
    if (!isAdmin) throw new Error('Administrator access is required.');
    if (!CONTENT_TABLES.includes(table as typeof CONTENT_TABLES[number])) throw new Error('Unknown content collection.');
  }
  async function save(table: string, input: Partial<ContentRecord>) {
    requireAdmin(table);
    const prior = data[table]?.find(row => row.id === input.id);
    const record = validateRecord(table, emptyRecord({ ...prior, ...input, updated_at: new Date().toISOString() }), supabase ? data : localData.current);
    if (supabase) { const { error: writeError } = await supabase.from(table).upsert(encode(table, record)); if (writeError) throw writeError; await refresh(); }
    else { const next = structuredClone(localData.current); const index = next[table].findIndex(row => row.id === record.id); if (index < 0) next[table].push(record); else next[table][index] = record; persist(next); }
  }
  async function remove(table: string, id: string) {
    requireAdmin(table);
    const record = data[table]?.find(row => row.id === id);
    if (supabase) {
      if (table === 'media' && typeof record?.storage_path === 'string' && record.storage_path) { const { error: storageError } = await supabase.storage.from('apex-media').remove([record.storage_path]); if (storageError) throw storageError; }
      const { error: deleteError } = await supabase.from(table).delete().eq('id', id); if (deleteError) throw deleteError; await refresh();
    } else {
      const next = structuredClone(localData.current); next[table] = next[table].filter(row => row.id !== id);
      if (table === 'albums') next.album_images = next.album_images.filter(row => row.album_id !== id);
      if (table === 'blog_categories') next.blog_posts = next.blog_posts.map(row => row.category_id === id ? { ...row, category_id: null } : row);
      persist(next);
    }
  }
  async function submitContact(input: ContactInput) {
    const clean = Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value.trim()])) as ContactInput;
    if (clean.name.length < 2 || clean.name.length > 120 || !validEmail(clean.email) || clean.phone.length > 40 || clean.subject.length < 2 || clean.subject.length > 180 || clean.message.length < 10 || clean.message.length > 5000) throw new Error('Please provide a name, valid email, subject, and a message between 10 and 5,000 characters.');
    if (supabase) { const { error: submitError } = await supabase.rpc('submit_contact', { p_name: clean.name, p_email: clean.email, p_phone: clean.phone, p_subject: clean.subject, p_message: clean.message }); if (submitError) throw submitError; }
    else { const next = structuredClone(localData.current); next.contact_messages.unshift(emptyRecord({ ...clean, title_en: clean.subject, title_ar: clean.subject, status: 'received', is_read: false })); persist(next); }
    if (isAdmin && supabase) await refresh();
  }
  async function subscribe(email: string, name = ''): Promise<'success' | 'duplicate'> {
    email = email.trim().toLowerCase(); name = name.trim();
    if (!validEmail(email) || name.length > 120) throw new Error('Please enter a valid email address and a name under 120 characters.');
    if (supabase) { const { data: result, error: submitError } = await supabase.rpc('subscribe_newsletter', { p_email: email, p_name: name }); if (submitError) throw submitError; if (isAdmin) await refresh(); return result === 'duplicate' ? 'duplicate' : 'success'; }
    if (localData.current.newsletter_subscribers.some(row => String(row.email).toLowerCase() === email)) return 'duplicate';
    const next = structuredClone(localData.current); next.newsletter_subscribers.unshift(emptyRecord({ email, name, title_en: name || email, title_ar: name || email, status: 'active', active: true })); persist(next); return 'success';
  }
  async function uploadMedia(file: File, metadata: Partial<ContentRecord> = {}) {
    requireAdmin('media');
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'].includes(file.type)) throw new Error('Use a JPEG, PNG, WebP, AVIF, or GIF image.');
    if (file.size > 5 * 1024 * 1024) throw new Error('Images must be smaller than 5 MB.');
    let image = ''; let storage_path = '';
    if (supabase) {
      const extension: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif' };
      storage_path = `${crypto.randomUUID()}.${extension[file.type]}`;
      const { error: uploadError } = await supabase.storage.from('apex-media').upload(storage_path, file, { contentType: file.type, upsert: false }); if (uploadError) throw uploadError;
      image = supabase.storage.from('apex-media').getPublicUrl(storage_path).data.publicUrl;
    } else {
      if (file.size > 1024 * 1024) throw new Error('Local demo uploads are limited to 1 MB. Connect Supabase for larger files.');
      image = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Unable to read the selected image.')); reader.readAsDataURL(file); });
    }
    const record = emptyRecord({ title_en: file.name, title_ar: file.name, alt_text_en: file.name, alt_text_ar: file.name, ...metadata, image, storage_path, mime_type: file.type, size: file.size, status: 'published' });
    try { await save('media', record); } catch (cause) { if (supabase && storage_path) await supabase.storage.from('apex-media').remove([storage_path]); throw cause; }
    return record;
  }
  return <CmsContext.Provider value={{ data: visible(data, isAdmin), ready, error, save, remove, refresh, submitContact, subscribe, uploadMedia }}>{children}</CmsContext.Provider>;
}

export function useCms() { const context = useContext(CmsContext); if (!context) throw new Error('useCms must be used inside CmsProvider'); return context; }
