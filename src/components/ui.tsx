import { useEffect, useId, useState, type ReactNode, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, ChevronRight, Plus, Minus, CheckCircle2, LoaderCircle, CarFront, Wrench, Sparkles, ClipboardCheck, Settings2, LifeBuoy, ShieldCheck, Award, Cpu, HeartHandshake, BadgeCheck, Gem, Clock3, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCms } from '../context/CmsContext';
import { localized, field, safeUrl as validatedUrl, safeImageUrl, type ContentRecord } from '../lib/types';

export function visible(items: ContentRecord[] = []) { return items.filter(i => i.status === 'published' && i.active !== false).sort((a, b) => a.sort_order - b.sort_order); }
export function safeUrl(value: string, fallback = '/contact') { return validatedUrl(value) || fallback; }
export function Icon({ name, size = 25 }: { name?: string; size?: number }) {
  const icons: Record<string, typeof Wrench> = { car: CarFront, CarFront, 'car-front': CarFront, wrench: Wrench, Wrench, sparkles: Sparkles, Sparkles, inspection: ClipboardCheck, ClipboardCheck, 'clipboard-check': ClipboardCheck, parts: Settings2, Settings2, Settings: Settings2, settings: Settings2, roadside: LifeBuoy, LifeBuoy, 'life-buoy': LifeBuoy, shield: ShieldCheck, ShieldCheck, 'shield-check': ShieldCheck, award: Award, Award, cpu: Cpu, Cpu, heart: HeartHandshake, HeartHandshake, badge: BadgeCheck, BadgeCheck, gem: Gem, Gem, clock: Clock3, Clock3, search: Search };
  const Component = icons[name || ''] || ShieldCheck;
  return <Component size={size} strokeWidth={1.6} aria-hidden="true" />;
}
export function Image({ src, alt, className = '', eager = false }: { src?: string; alt: string; className?: string; eager?: boolean }) {
  return <img src={safeImageUrl(src || '') || '/image-fallback.svg'} alt={alt} className={className} loading={eager ? 'eager' : 'lazy'} onError={event => { const image = event.currentTarget; if (!image.src.endsWith('/image-fallback.svg')) image.src = '/image-fallback.svg'; }} />;
}
export function ButtonLink({ to, children, variant = 'primary', className = '' }: { to: string; children: ReactNode; variant?: 'primary' | 'secondary' | 'outline'; className?: string }) {
  const style = `button button-${variant} ${className}`;
  return /^https?:|^mailto:|^tel:/.test(to) ? <a className={style} href={safeUrl(to)}>{children}<ArrowUpRight size={17} aria-hidden="true" /></a> : <Link className={style} to={safeUrl(to)}>{children}<ArrowUpRight size={17} aria-hidden="true" /></Link>;
}
export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  const { t } = useLanguage();
  return <nav className="breadcrumbs" aria-label={t('Breadcrumb', 'مسار التنقل')}><Link to="/">{t('Home', 'الرئيسية')}</Link>{items.map((item, i) => <span key={i}><ChevronRight size={13} aria-hidden="true" />{item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}</span>)}</nav>;
}
export function PageHero({ eyebrow, title, description, image, children }: { eyebrow?: string; title: string; description?: string; image?: string; children?: ReactNode }) {
  return <section className={`page-hero ${image ? 'page-hero-image' : ''}`}>{image && <Image src={image} alt="" eager />}<div className="container page-hero-inner"><Breadcrumb items={[{ label: title }]} />{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="page-hero-description">{description}</p>}{children}</div></section>;
}
export function SectionHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="section-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2>{description && <p className="section-description">{description}</p>}</div>{action && <div className="section-action">{action}</div>}</div>;
}
export function ServiceCard({ item }: { item: ContentRecord }) {
  const { lang, t } = useLanguage(); const { data } = useCms(); const position = visible(data.services).findIndex(service => service.id === item.id) + 1;
  return <Link className="service-card" to={`/services/${item.slug}`}><div className="service-card-image"><Image src={item.image} alt={localized(item, 'title', lang)} /><span className="service-number">{String(position || 1).padStart(2, '0')}</span></div><div className="service-card-body"><div className="service-title"><span className="service-icon"><Icon name={field(item, 'icon')} /></span><h3>{localized(item, 'title', lang)}</h3></div><p>{localized(item, 'description', lang)}</p><span className="text-link">{t('Explore service', 'اكتشف الخدمة')}<ArrowUpRight size={17} /></span></div></Link>;
}
export function FeatureCard({ item }: { item: ContentRecord }) {
  const { lang } = useLanguage();
  return <article className="feature-card"><span className="feature-icon"><Icon name={field(item, 'icon')} size={29} /></span><h3>{localized(item, 'title', lang)}</h3><p>{localized(item, 'description', lang)}</p></article>;
}
export function BlogCard({ item }: { item: ContentRecord }) {
  const { lang, t } = useLanguage(); const { data } = useCms(); const category = visible(data.blog_categories).find(category => category.id === item.category_id);
  const tags = item[`tags_${lang}`] || item.tags;
  return <article className="blog-card"><Link className="blog-card-image" to={`/blog/${item.slug}`}><Image src={item.image} alt={localized(item, 'title', lang)} /><span className="image-badge">{localized(category, 'title', lang) || localized(item, 'category', lang) || t('Apex Journal', 'مجلة أبيكس')}</span></Link><div className="blog-meta"><span>{new Date(field(item, 'published_at') || item.created_at).toLocaleDateString(lang === 'ar' ? 'ar' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span><span className="meta-dot" /><span>{field(item, 'reading_time') || '5'} {t('min read', 'دقائق للقراءة')}</span></div><Link to={`/blog/${item.slug}`}><h3>{localized(item, 'title', lang)}</h3></Link><p>{localized(item, 'description', lang)}</p><div className="blog-card-byline"><span>{localized(item, 'author', lang)}</span>{Array.isArray(tags) && tags.slice(0, 2).map(tag => <span className="blog-tag" key={String(tag)}>{String(tag)}</span>)}</div><Link className="text-link" to={`/blog/${item.slug}`}>{t('Read the story', 'اقرأ المقال')}<ArrowUpRight size={17} /></Link></article>;
}
export function AlbumCard({ item }: { item: ContentRecord }) {
  const { lang, t } = useLanguage(); const { data } = useCms();
  const count = visible(data.album_images).filter(i => i.album_id === item.id).length;
  return <Link className="album-card" to={`/gallery/${item.slug}`}><Image src={item.image} alt={localized(item, 'title', lang)} /><div className="album-card-content"><span>{count} {t('photographs', 'صورة')}<time dateTime={item.created_at}> · {new Date(item.created_at).toLocaleDateString(lang, { month: 'short', year: 'numeric' })}</time></span><h3>{localized(item, 'title', lang)}</h3><p>{localized(item, 'description', lang)}</p></div><span className="album-arrow"><ArrowUpRight size={24} /></span></Link>;
}
export function FAQAccordion({ items }: { items: ContentRecord[] }) {
  const { lang } = useLanguage(); const [open, setOpen] = useState<string | null>(null);
  return <div className="faq-accordion">{items.map(item => <div key={item.id} className={`faq-item ${open === item.id ? 'is-open' : ''}`}><h3><button type="button" aria-expanded={open === item.id} aria-controls={`faq-${item.id}`} onClick={() => setOpen(open === item.id ? null : item.id)}>{localized(item, 'question', lang) || localized(item, 'title', lang)}{open === item.id ? <Minus size={19} /> : <Plus size={19} />}</button></h3><div id={`faq-${item.id}`} hidden={open !== item.id}><p>{localized(item, 'answer', lang) || localized(item, 'description', lang)}</p></div></div>)}</div>;
}
export function NewsletterForm({ showName = false }: { showName?: boolean }) {
  const { t } = useLanguage(); const { subscribe } = useCms(); const [email, setEmail] = useState(''); const [name, setName] = useState(''); const inputId = useId(); const [state, setState] = useState('idle');
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setState('invalid'); return; } setState('loading'); try { setState(await subscribe(email.trim().toLowerCase(), name.trim())); } catch { setState('error'); } }
  return <form className="newsletter-form" onSubmit={submit}>{showName && <label className="newsletter-name">{t('Name (optional)', 'الاسم (اختياري)')}<input type="text" name="name" value={name} onChange={e => setName(e.target.value)} maxLength={120} autoComplete="name" /></label>}<label className="sr-only" htmlFor={inputId}>{t('Your email address', 'بريدك الإلكتروني')}</label><div className="newsletter-input-group"><input type="email" name="email" id={inputId} aria-label={t('Your email address', 'بريدك الإلكتروني')} placeholder={t('Enter your email address', 'أدخل بريدك الإلكتروني')} value={email} onChange={e => { setEmail(e.target.value); setState('idle'); }} required maxLength={254} autoComplete="email" disabled={state === 'loading'} /><button className="button button-primary" type="submit" disabled={state === 'loading'} aria-label={t('Subscribe', 'اشترك')}>{state === 'loading' ? <LoaderCircle className="spin" size={18} /> : <>{t('Subscribe', 'اشترك')}<ArrowRight size={17} /></>}</button></div><div aria-live="polite" className={`form-feedback ${state === 'error' || state === 'invalid' ? 'error' : ''}`}>{state === 'success' && <><CheckCircle2 size={16} />{t('You’re on the list. Welcome to Apex.', 'تم اشتراكك. أهلاً بك في أبيكس.')}</>}{state === 'duplicate' && t('This email is already subscribed. You’re all set.', 'هذا البريد مشترك بالفعل.')}{state === 'invalid' && t('Please enter a valid email address.', 'يرجى إدخال بريد إلكتروني صحيح.')}{state === 'error' && t('We couldn’t save your subscription. Please try again.', 'تعذر حفظ الاشتراك. يرجى المحاولة مجدداً.')}</div><p className="newsletter-privacy">{t('By subscribing, you agree to our', 'بالاشتراك، توافق على')} <Link to="/privacy">{t('Privacy Policy', 'سياسة الخصوصية')}</Link>.</p></form>;
}
export function CTASection() { const { t } = useLanguage(); return <section className="cta-section"><div className="container cta-inner"><div><p className="eyebrow">{t('THE NEXT CHAPTER STARTS HERE', 'رحلتك القادمة تبدأ هنا')}</p><h2>{t('Your car deserves exceptional.', 'سيارتك تستحق الاستثنائي.')}</h2><p>{t('Let’s make every mile a better one. Talk to the Apex Motors team.', 'لنجعل كل كيلومتر أفضل. تحدث مع فريق أبيكس موتورز.')}</p></div><ButtonLink to="/contact">{t('Let’s talk', 'لنتحدث')}</ButtonLink></div></section>; }
export function EmptyState({ title, description }: { title: string; description?: string }) { return <div className="empty-state"><Search size={32} /><h3>{title}</h3>{description && <p>{description}</p>}</div>; }
export function SEO({ title, description, image }: { title: string; description?: string; image?: string }) {
  const { lang, t } = useLanguage(); const location = useLocation(); const { data } = useCms();
  const settings = data.site_settings?.find(i => i.slug === 'general'); const configured = settings ? field(settings, 'site_url') : '';
  useEffect(() => {
    const brand = settings ? localized(settings, 'company_name', lang) || t('Apex Motors', 'أبيكس موتورز') : t('Apex Motors', 'أبيكس موتورز'); document.title = title.includes(brand) ? title : `${title} | ${brand}`;
    const desc = description || (settings ? localized(settings, 'meta_description', lang) : '') || t('Exceptional vehicles, expert service, and a higher standard of automotive care.', 'سيارات استثنائية وخدمة احترافية ومستوى أعلى من العناية بسيارتك.');
    function meta(key: string, value: string, property = false) { let el = document.head.querySelector<HTMLMetaElement>(`meta[${property ? 'property' : 'name'}="${key}"]`); if (!el) { el = document.createElement('meta'); el.setAttribute(property ? 'property' : 'name', key); document.head.appendChild(el); } el.content = value; }
    const base = /^https?:\/\//.test(configured) ? configured.replace(/\/$/, '') : window.location.origin;
    const canonical = `${base}${location.pathname}${lang === 'ar' ? '?lang=ar' : ''}`;
    const socialImage = safeImageUrl(image || field(settings, 'og_image')) || '/favicon.svg'; const absoluteImage = socialImage.startsWith('/') ? `${base}${socialImage}` : socialImage;
    const favicon = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]'); if (favicon) favicon.href = safeImageUrl(field(settings, 'favicon')) || '/favicon.svg';
    meta('description', desc); meta('og:title', document.title, true); meta('og:description', desc, true); meta('og:url', canonical, true); meta('og:type', location.pathname.startsWith('/blog/') ? 'article' : 'website', true); meta('og:locale', lang === 'ar' ? 'ar_AR' : 'en_US', true); meta('og:image', absoluteImage, true); meta('twitter:card', image ? 'summary_large_image' : 'summary'); meta('robots', location.pathname.startsWith('/admin') ? 'noindex,nofollow' : 'index,follow');
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]'); if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); } link.href = canonical;
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
    ['en', 'ar', 'x-default'].forEach(code => { const alternate = document.createElement('link'); alternate.rel = 'alternate'; alternate.hreflang = code; alternate.href = `${base}${location.pathname}${code === 'ar' ? '?lang=ar' : ''}`; document.head.appendChild(alternate); });
  }, [title, description, image, location.pathname, lang, configured, settings, t]);
  return null;
}
