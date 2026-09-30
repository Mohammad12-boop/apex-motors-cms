import { useEffect, useMemo, useRef, useState, type FormEvent, type SyntheticEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, Check, Mail, Phone, MapPin, Clock, Search, X, ChevronLeft, ChevronRight, Share2, CheckCircle2, ShieldCheck, Wrench, CalendarDays, Target, CarFront, LoaderCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCms } from '../context/CmsContext';
import { localized, field, safeImageUrl, safeUrl, type ContentRecord } from '../lib/types';
import { PageHero, SectionHeader, ButtonLink, ServiceCard, BlogCard, AlbumCard, FeatureCard, FAQAccordion, NewsletterForm, CTASection, Breadcrumb, EmptyState, SEO } from '../components/ui';
import './public-pages.css';

type Data = Record<string, ContentRecord[]>;
type Copy = (en: string, ar: string) => string;
const publicItems = (data: Data, key: string) => (data[key] || []).filter(item => item.active && item.status === 'published').sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
const pageRecord = (data: Data, slug: string) => publicItems(data, 'pages').find(item => item.slug === slug);
const textValue = (item: ContentRecord | undefined, key: string, lang: 'en' | 'ar', fallback = '') => item ? localized(item, key, lang) || fallback : fallback;
const cleanImage = (item: ContentRecord) => safeImageUrl(field(item, 'image') || field(item, 'url') || field(item, 'image_url'));
function handleImageError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (!image.src.endsWith('/image-fallback.svg')) image.src = '/image-fallback.svg';
}
const friendlyDate = (value: unknown, lang: string) => {
  const date = new Date(String(value || ''));
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(lang === 'ar' ? 'ar' : 'en', { day: 'numeric', month: 'long', year: 'numeric' });
};
function listValue(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try { const parsed: unknown = JSON.parse(value); if (Array.isArray(parsed)) return parsed; } catch { /* Plain multiline CMS fields are also supported. */ }
  return value.split('\n').map(line => line.replace(/^[-•]\s*/, '').trim()).filter(Boolean);
}
function listText(value: unknown, lang: 'en' | 'ar', key = 'title'): string {
  if (typeof value === 'string' || typeof value === 'number') return key === 'title' ? String(value) : '';
  if (!value || typeof value !== 'object') return '';
  const entry = value as Record<string, unknown>;
  const result = entry[`${key}_${lang}`] ?? entry[`${key}_en`] ?? entry[key] ?? entry[lang] ?? entry.en;
  return typeof result === 'string' || typeof result === 'number' ? String(result) : '';
}
function localizedList(item: ContentRecord | undefined, key: string, lang: 'en' | 'ar') {
  if (!item) return [];
  return listValue(item[`${key}_${lang}`] || item[key] || item[`${key}_en`]);
}
export function RichText({ content, className = '' }: { content: string; className?: string }) {
  return <div className={`page-prose ${className}`}>{content.split(/\n\s*\n/).filter(Boolean).map((block, index) => {
    const value = block.trim();
    if (value.startsWith('### ')) return <h3 key={index}>{value.slice(4)}</h3>;
    if (value.startsWith('## ')) return <h2 key={index}>{value.slice(3)}</h2>;
    if (value.startsWith('# ')) return <h2 key={index}>{value.slice(2)}</h2>;
    if (value.length < 100 && !/[.!?؟。،:؛]$/.test(value) && !value.includes('\n')) return <h2 key={index}>{value}</h2>;
    if (value.split('\n').every(line => /^[-•]\s/.test(line))) return <ul key={index}>{value.split('\n').map((line, n) => <li key={n}>{line.replace(/^[-•]\s*/, '')}</li>)}</ul>;
    return <p key={index}>{value}</p>;
  })}</div>;
}
function LoadingPage() {
  const { t } = useLanguage();
  const { error } = useCms();
  return <section className="section container page-loading" aria-live="polite"><span className="eyebrow">APEX MOTORS</span><h1>{error ? t('We could not load this page.', 'تعذّر تحميل هذه الصفحة.') : t('Preparing your experience…', 'نُجهّز تجربتك…')}</h1>{error ? <><p>{t('Please check your connection and try again.', 'يرجى التحقق من اتصالك والمحاولة مجددًا.')}</p><button className="button button-primary" onClick={() => window.location.reload()}>{t('Try again', 'إعادة المحاولة')}</button></> : <div className="page-skeleton-grid" aria-label={t('Loading content', 'جارٍ تحميل المحتوى')}><div /><div /><div /></div>}</section>;
}
function PageSEO({ item, title, description }: { item?: ContentRecord; title: string; description?: string }) {
  const { lang } = useLanguage();
  return <SEO title={textValue(item, 'meta_title', lang, title)} description={textValue(item, 'meta_description', lang, description || '')} image={item ? safeImageUrl(field(item, 'og_image')) || cleanImage(item) : undefined} />;
}
function categoryName(item: ContentRecord, categories: ContentRecord[], lang: 'en' | 'ar', t: Copy) {
  const category = categories.find(category => category.id === field(item, 'category_id') || category.slug === field(item, 'category'));
  return category ? localized(category, 'title', lang) : localized(item, 'category', lang) || field(item, 'category') || t('Automotive insights', 'رؤى عالم السيارات');
}

export function AboutPage() {
  const { data, ready, error } = useCms();
  const { lang, t } = useLanguage();
  const page = pageRecord(data, 'about');
  const team = publicItems(data, 'team_members');
  const features = publicItems(data, 'features').slice(0, 4);
  const values = localizedList(page, 'values', lang);
  const milestoneValues = localizedList(page, 'milestones', lang);
  const milestones = (milestoneValues.length ? milestoneValues : localizedList(page, 'timeline', lang)).map(value => {
    if (typeof value !== 'string') return value;
    const [year, ...title] = value.split(' — ');
    return title.length ? { year, title: title.join(' — ') } : { title: year };
  });
  const settings = publicItems(data, 'site_settings')[0];
  const pageStats = localizedList(page, 'stats', lang);
  const stats = pageStats.length ? pageStats : [1, 2, 3, 4].map(index => ({ value: field(settings, `stat_${index}_value`), label: localized(settings, `stat_${index}_label`, lang) })).filter(stat => stat.value);
  if (!ready || error) return <LoadingPage />;
  return <>
    <PageSEO item={page} title={t('About Apex Motors', 'عن أبيكس موتورز')} description={t('Meet the people and principles behind a more considered automotive experience.', 'تعرّف إلى فريقنا وقيمنا التي تصنع تجربة سيارات استثنائية.')} />
    <PageHero eyebrow={t('THE APEX STANDARD', 'معيار أبيكس')} title={textValue(page, 'title', lang, t('Excellence. In every detail.', 'التميّز. في كل تفصيل.'))} description={textValue(page, 'description', lang, t('Built around a simple belief: your automotive experience should be as exceptional as the vehicle you drive.', 'نؤمن بأن تجربتك في عالم السيارات تستحق أن تكون استثنائية بقدر السيارة التي تقودها.'))} />
    <section className="section container page-story">
      <div className="page-story-image"><img onError={handleImageError} src={cleanImage(page || {} as ContentRecord) || '/images/photo-1563720223185-11003d516935.jpg'} alt={t('The sculpted details of a premium vehicle', 'تفاصيل التصميم المتقن لسيارة فاخرة')} /><div className="page-image-label"><span>APEX MOTORS</span><strong>{t('Driven by Excellence.', 'التميّز يقودنا.')}</strong></div></div>
      <div><SectionHeader eyebrow={t('OUR STORY', 'قصتنا')} title={t('A shared passion. A higher standard.', 'شغف يجمعنا. ومعيار يرتقي بنا.')} /><RichText content={textValue(page, 'content', lang, t('Apex Motors brings vehicle sales, specialist maintenance and premium care together under one roof. We believe that confidence starts with clear advice, thoughtful attention and workmanship you can trust.\n\nFrom helping you choose your next vehicle to protecting the one you already love, our team takes time to understand what matters to you. Every recommendation is explained. Every detail receives the attention it deserves.', 'تجمع أبيكس موتورز بين مبيعات السيارات والصيانة المتخصصة والعناية الفاخرة تحت سقف واحد. نؤمن بأن الثقة تبدأ بالنصيحة الواضحة والاهتمام الدقيق والعمل المتقن.\n\nمن مساعدتك على اختيار سيارتك القادمة إلى الحفاظ على السيارة التي تحبها، يأخذ فريقنا الوقت لفهم أولوياتك. نشرح كل توصية ونمنح كل تفصيل الاهتمام الذي يستحقه.'))} /><ButtonLink to="/contact" variant="outline">{t('Get to know our team', 'تعرّف إلى فريقنا')}</ButtonLink></div>
    </section>
    <section className="page-principles"><div className="container grid-2"><article><Target size={27} /><span className="eyebrow">{t('OUR MISSION', 'رسالتنا')}</span><h2>{t('Make every journey better.', 'نجعل كل رحلة أفضل.')}</h2><p>{textValue(page, 'mission', lang, t('To deliver thoughtful automotive solutions through expert care, transparent advice and an unwavering commitment to quality.', 'تقديم حلول سيارات مدروسة تجمع بين العناية المتخصصة والنصيحة الشفافة والالتزام الراسخ بالجودة.'))}</p></article><article><CarFront size={27} /><span className="eyebrow">{t('OUR VISION', 'رؤيتنا')}</span><h2>{t('Raise the standard of ownership.', 'نرتقي بتجربة امتلاك السيارة.')}</h2><p>{textValue(page, 'vision', lang, t('To become the automotive partner people choose for every stage of vehicle ownership — by earning their confidence, every day.', 'أن نكون الشريك الذي يختاره العملاء في كل مرحلة من مراحل امتلاك السيارة، من خلال استحقاق ثقتهم كل يوم.'))}</p></article></div></section>
    {stats.length > 0 && <section className="container page-stat-strip">{stats.map((stat, i) => <div key={i}><strong>{listText(stat, lang, 'value')}</strong><span>{listText(stat, lang, 'label') || listText(stat, lang)}</span></div>)}</section>}
    <section className="section container"><SectionHeader eyebrow={t('WHAT DRIVES US', 'ما يدفعنا للأمام')} title={t('Principles without compromise.', 'مبادئ لا تقبل المساومة.')} description={t('More than a promise. A way of working, from the first conversation to the final handover.', 'أكثر من مجرد وعد. إنها طريقتنا في العمل، من أول حديث وحتى تسليم السيارة.')} /><div className="grid-3 page-values page-about-values">{(values.length ? values : [{ title_en: 'Integrity, always', title_ar: 'النزاهة دائمًا', description_en: 'Honest advice, clear estimates and your approval before work begins.', description_ar: 'نصيحة صادقة وتقديرات واضحة وموافقتك قبل بدء العمل.' }, { title_en: 'Precision in practice', title_ar: 'الدقة في العمل', description_en: 'The right process, the right tools and attention to the smallest detail.', description_ar: 'إجراءات صحيحة وأدوات مناسبة واهتمام بأدق التفاصيل.' }, { title_en: 'People come first', title_ar: 'الإنسان أولًا', description_en: 'We listen, explain and build relationships that last beyond a single visit.', description_ar: 'نستمع ونشرح ونبني علاقات تدوم إلى ما بعد الزيارة الأولى.' }]).map((value, index) => <article className="page-value" key={index}><span className="page-number">0{index + 1}</span><h3>{listText(value, lang)}</h3><p>{listText(value, lang, 'description')}</p></article>)}</div></section>
    {features.length > 0 && <section className="section page-light-section"><div className="container"><SectionHeader eyebrow={t('WHY APEX', 'لماذا أبيكس')} title={t('Confidence comes as standard.', 'الثقة جزء من معاييرنا.')} action={<ButtonLink to="/features" variant="outline">{t('The Apex advantage', 'مزايا أبيكس')}</ButtonLink>} /><div className="grid-4">{features.map(item => <FeatureCard key={item.id} item={item} />)}</div></div></section>}
    {team.length > 0 && <section className="section container"><SectionHeader eyebrow={t('THE PEOPLE BEHIND THE PRECISION', 'الأشخاص وراء هذا الإتقان')} title={t('Expert hands. Shared passion.', 'أيدٍ خبيرة. وشغف مشترك.')} description={t('Meet the people who bring the Apex Motors experience to life. Demonstration team profiles.', 'تعرّف إلى الأشخاص الذين يصنعون تجربة أبيكس موتورز. ملفات تعريفية تجريبية للفريق.')} /><div className="grid-3 page-team-grid">{team.map(member => <article className="page-team" key={member.id}><div><img onError={handleImageError} src={cleanImage(member)} alt={localized(member, 'title', lang)} loading="lazy" /></div><h3>{localized(member, 'title', lang)}</h3><span>{localized(member, 'role', lang) || localized(member, 'description', lang)}</span>{(localized(member, 'bio', lang) || localized(member, 'content', lang)) && <p>{localized(member, 'bio', lang) || localized(member, 'content', lang)}</p>}</article>)}</div></section>}
    {milestones.length > 0 && <section className="section page-light-section"><div className="container page-timeline-layout"><SectionHeader eyebrow={t('OUR JOURNEY', 'رحلتنا')} title={t('Always moving forward.', 'دائمًا نتقدم.')} description={t('The milestones that shape our commitment to automotive excellence.', 'محطات تشكّل التزامنا بالتميّز في عالم السيارات.')} /><div className="page-timeline">{milestones.map((milestone, index) => <article key={index}><span>{listText(milestone, lang, 'year')}</span><div><h3>{listText(milestone, lang)}</h3><p>{listText(milestone, lang, 'description')}</p></div></article>)}</div></div></section>}
    <CTASection />
  </>;
}

export function ServicesPage() {
  const { data, ready, error } = useCms();
  const { lang, t } = useLanguage();
  const page = pageRecord(data, 'services');
  const services = publicItems(data, 'services');
  if (!ready || error) return <LoadingPage />;
  return <><PageSEO item={page} title={t('Automotive Services', 'خدمات السيارات')} description={t('From your next vehicle to its next service. Explore the full Apex Motors experience.', 'من سيارتك القادمة إلى موعد صيانتها القادم. اكتشف تجربة أبيكس موتورز المتكاملة.')} /><PageHero eyebrow={t('OUR SERVICES', 'خدماتنا')} title={textValue(page, 'title', lang, t('Every need. Expertly handled.', 'كل احتياج. بخبرة متخصصة.'))} description={textValue(page, 'description', lang, t('Six specialist services. One unwavering standard. Complete automotive care, built around you.', 'ست خدمات متخصصة. معيار واحد ثابت. عناية متكاملة بالسيارات، تتمحور حولك.'))} /><section className="section container">{services.length ? <div className="grid-3 page-service-grid">{services.map(item => <ServiceCard key={item.id} item={item} />)}</div> : <EmptyState title={t('Our services will be available soon.', 'خدماتنا ستكون متاحة قريبًا.')} />}<div className="page-help-strip"><span><Wrench size={22} /><span><strong>{t('Not sure where to start?', 'لا تعرف من أين تبدأ؟')}</strong><span>{t('Tell us what your vehicle needs. We’ll guide you from there.', 'أخبرنا بما تحتاجه سيارتك، وسنرشدك إلى الخطوة التالية.')}</span></span></span><ButtonLink to="/contact" variant="outline">{t('Talk to our team', 'تحدث إلى فريقنا')}</ButtonLink></div></section><section className="section page-light-section"><div className="container"><SectionHeader eyebrow={t('A CLEAR WAY FORWARD', 'خطوات واضحة للأمام')} title={t('Great service starts with clarity.', 'الخدمة الرائعة تبدأ بالوضوح.')} /><div className="grid-3 page-values">{[{ title: t('Tell us what you need', 'أخبرنا باحتياجاتك'), text: t('Start with a conversation about your vehicle, your priorities and your schedule.', 'نبدأ بمحادثة حول سيارتك وأولوياتك ومواعيدك.') }, { title: t('Agree on a plan', 'نتفق على الخطة'), text: t('Receive a clear assessment and estimate. We explain the work before you approve it.', 'تحصل على تقييم وتقدير واضحين. نشرح العمل المطلوب قبل موافقتك.') }, { title: t('Drive away confident', 'انطلق بثقة'), text: t('Carefully checked work, a clear handover and practical advice for the road ahead.', 'عمل مفحوص بعناية وتسليم واضح ونصائح عملية للرحلة القادمة.') }].map((item, i) => <article className="page-value" key={i}><span className="page-number">0{i + 1}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></div></section><CTASection /></>;
}

export function ServiceDetailPage() {
  const { slug } = useParams();
  const { data, ready, error } = useCms();
  const { lang, t } = useLanguage();
  const services = publicItems(data, 'services');
  const item = services.find(item => item.slug === slug);
  if (!ready || error) return <LoadingPage />;
  if (!item) return <NotFoundPage />;
  const benefits = localizedList(item, 'benefits', lang);
  const process = localizedList(item, 'process', lang);
  const serviceFeatures: ContentRecord[] = localizedList(item, 'features', lang).map((feature, index) => ({
    ...item,
    id: `${item.id}-feature-${index}`,
    title_en: listText(feature, lang),
    title_ar: listText(feature, lang),
    description_en: listText(feature, lang, 'description'),
    description_ar: listText(feature, lang, 'description'),
  }));
  const gallery = listValue(item.gallery);
  const title = localized(item, 'title', lang);
  const ctaLink = safeUrl(field(item, 'cta_link')) || `/contact?service=${encodeURIComponent(item.slug)}`;
  const ctaText = localized(item, 'cta_text', lang) || t('Enquire about this service', 'استفسر عن هذه الخدمة');
  const relatedIds = listValue(item.related_services).map(String);
  const related = services.filter(service => service.id !== item.id && (!relatedIds.length || relatedIds.includes(service.id) || relatedIds.includes(service.slug))).slice(0, 3);
  return <><PageSEO item={item} title={title} description={localized(item, 'description', lang)} /><PageHero eyebrow={t('SPECIALIST AUTOMOTIVE CARE', 'عناية متخصصة بالسيارات')} title={title} description={localized(item, 'description', lang)} image={cleanImage(item)}><ButtonLink to={ctaLink}>{ctaText}</ButtonLink></PageHero><div className="container"><Breadcrumb items={[{ label: t('Services', 'الخدمات'), to: '/services' }, { label: title }]} /></div><section className="section container page-service-detail"><div><SectionHeader eyebrow={t('CRAFTED AROUND YOUR VEHICLE', 'عناية تناسب سيارتك')} title={t('The care your vehicle deserves.', 'العناية التي تستحقها سيارتك.')} /><RichText content={localized(item, 'content', lang)} />{benefits.length > 0 && <div className="page-benefits"><h2>{t('What you can expect', 'ما يمكنك توقعه')}</h2>{benefits.map((benefit, i) => <div key={i}><CheckCircle2 size={20} /><span><strong>{listText(benefit, lang)}</strong>{listText(benefit, lang, 'description') && <p>{listText(benefit, lang, 'description')}</p>}</span></div>)}</div>}</div><aside className="page-service-aside"><ShieldCheck size={34} /><span className="eyebrow">{t('THE APEX PROMISE', 'وعد أبيكس')}</span><h2>{t('Expert advice. No guesswork.', 'نصيحة خبير. بوضوح تام.')}</h2><p>{t('Let’s discuss your vehicle and put together the right plan for you. Our team will confirm the scope, timing and pricing before any work begins.', 'لنتحدث عن سيارتك ونضع الخطة المناسبة لك. سيؤكد فريقنا نطاق العمل والتوقيت والتكلفة قبل البدء.')}</p><ButtonLink to={ctaLink}>{ctaText}</ButtonLink><span className="page-aside-note"><Clock size={14} />{t('Appointments confirmed by our team', 'يؤكد فريقنا المواعيد مباشرة')}</span><Link to="/faq">{t('Questions? Explore our FAQs', 'لديك أسئلة؟ اقرأ الأسئلة الشائعة')}<ArrowRight size={15} /></Link></aside></section>{serviceFeatures.length > 0 && <section className="section page-light-section page-service-features"><div className="container"><SectionHeader eyebrow={t('IN THE DETAILS', 'في التفاصيل')} title={t('A complete approach.', 'نهج متكامل.')} /><div className="grid-3">{serviceFeatures.map(feature => <FeatureCard key={feature.id} item={feature} />)}</div></div></section>}{process.length > 0 && <section className="section page-light-section"><div className="container"><SectionHeader eyebrow={t('HOW IT WORKS', 'كيف نعمل')} title={t('From the first hello to the open road.', 'من الترحيب الأول إلى الطريق.')} /><div className="page-process-grid">{process.map((step, i) => <article key={i}><span className="page-number">{String(i + 1).padStart(2, '0')}</span><h3>{listText(step, lang)}</h3><p>{listText(step, lang, 'description')}</p></article>)}</div></div></section>}{gallery.length > 0 && <section className="section container"><SectionHeader title={t('A closer look.', 'نظرة أقرب.')} /><div className="grid-3 page-service-gallery">{gallery.map((photo, index) => { const src = typeof photo === 'string' ? photo : listText(photo, lang, 'image'); return src ? <img onError={handleImageError} key={index} src={safeImageUrl(src)} alt={typeof photo === 'string' ? `${title} ${index + 1}` : listText(photo, lang, 'alt_text') || title} loading="lazy" /> : null; })}</div></section>}{related.length > 0 && <section className="section container"><SectionHeader eyebrow={t('MORE FROM APEX', 'المزيد من أبيكس')} title={t('Care beyond the expected.', 'عناية تتجاوز التوقعات.')} action={<ButtonLink to="/services" variant="outline">{t('All services', 'جميع الخدمات')}</ButtonLink>} /><div className="grid-3 page-related-grid">{related.map(item => <ServiceCard key={item.id} item={item} />)}</div></section>}<CTASection /></>;
}

export function FeaturesPage() {
  const { data, ready, error } = useCms();
  const { lang, t } = useLanguage();
  const page = pageRecord(data, 'features');
  const features = publicItems(data, 'features');
  if (!ready || error) return <LoadingPage />;
  return <><PageSEO item={page} title={t('The Apex Advantage', 'مزايا أبيكس')} /><PageHero eyebrow={t('THE APEX ADVANTAGE', 'مزايا أبيكس')} title={textValue(page, 'title', lang, t('The difference is in the details.', 'الفرق يكمن في التفاصيل.'))} description={textValue(page, 'description', lang, t('The expertise, technology and thoughtful attention that turn automotive care into something exceptional.', 'الخبرة والتقنية والاهتمام المدروس الذي يحوّل العناية بالسيارات إلى تجربة استثنائية.'))} /><section className="section container">{features.length ? <div className="grid-4 page-feature-grid">{features.map(item => <FeatureCard key={item.id} item={item} />)}</div> : <EmptyState title={t('More about our expertise is coming soon.', 'المزيد حول خبراتنا قريبًا.')} />}</section><section className="section page-light-section"><div className="container page-feature-story"><img onError={handleImageError} src={cleanImage(page || {} as ContentRecord) || '/images/photo-1486262715619-67b85e0b08d3.jpg'} alt={t('Precision tools for professional automotive care', 'أدوات دقيقة للعناية الاحترافية بالسيارات')} loading="lazy" /><div><SectionHeader eyebrow={t('OUR COMMITMENT', 'التزامنا')} title={t('Trust is earned. Every visit.', 'الثقة تُكتسب. في كل زيارة.')} /><RichText content={textValue(page, 'content', lang, t('A premium experience is about more than a beautiful space. It is the clarity of a recommendation, the care taken with your vehicle and the confidence you feel when you drive away.\n\nWe bring those details together in a straightforward, personal approach to automotive service. Tell us what matters to you. We will take it from there.', 'التجربة الفاخرة تتجاوز جمال المكان. إنها وضوح التوصية والعناية بسيارتك والثقة التي تشعر بها عند الانطلاق.\n\nنجمع هذه التفاصيل في نهج شخصي وواضح لخدمة السيارات. أخبرنا بما يهمك، وسنتولى الباقي.'))} /><ButtonLink to="/services">{t('Experience our services', 'اكتشف خدماتنا')}</ButtonLink></div></div></section><CTASection /></>;
}

export function BlogPage() {
  const { data, ready, error } = useCms();
  const { lang, t } = useLanguage();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [visible, setVisible] = useState(6);
  const categories = publicItems(data, 'blog_categories');
  const posts = publicItems(data, 'blog_posts');
  const page = pageRecord(data, 'blog');
  const filtered = posts.filter(post => (category === 'all' || field(post, 'category_id') === category || field(post, 'category') === category) && `${localized(post, 'title', lang)} ${localized(post, 'description', lang)} ${localized(post, 'tags', lang)}`.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim()));
  const featured = search || category !== 'all' ? undefined : posts.find(post => post.featured) || posts[0];
  const gridPosts = filtered.filter(post => post.id !== featured?.id);
  if (!ready || error) return <LoadingPage />;
  return <><PageSEO item={page} title={t('The Apex Journal', 'مجلة أبيكس')} description={t('Expert perspectives, practical advice and stories from the world of automotive excellence.', 'رؤى الخبراء ونصائح عملية وقصص من عالم التميّز في السيارات.')} /><PageHero eyebrow={t('THE APEX JOURNAL', 'مجلة أبيكس')} title={textValue(page, 'title', lang, t('For the road ahead.', 'للطريق القادم.'))} description={textValue(page, 'description', lang, t('Expert insights. Considered advice. A closer look at the world we move in.', 'رؤى متخصصة. ونصائح مدروسة. ونظرة أقرب إلى عالمنا المتحرك.'))} /><section className="section container page-blog-content">{featured && <article className="page-featured-article"><Link className="page-featured-photo" to={`/blog/${featured.slug}`}><img onError={handleImageError} src={cleanImage(featured)} alt={localized(featured, 'alt_text', lang) || localized(featured, 'title', lang)} /><span>{t('EDITOR’S PICK', 'اختيار المحرر')}</span></Link><div><span className="eyebrow">{categoryName(featured, categories, lang, t)}</span><h2><Link to={`/blog/${featured.slug}`}>{localized(featured, 'title', lang)}</Link></h2><p>{localized(featured, 'description', lang)}</p><div className="page-article-meta"><span>{friendlyDate(featured.published_at || featured.created_at, lang)}</span><i /> <span>{field(featured, 'reading_time') || '5'} {t('min read', 'دقائق للقراءة')}</span></div><ButtonLink to={`/blog/${featured.slug}`} variant="outline">{t('Read the story', 'اقرأ المقال')}</ButtonLink></div></article>}<div className="page-blog-toolbar"><div className="page-category-tabs" role="group" aria-label={t('Filter by category', 'التصفية حسب الفئة')}><button className={category === 'all' ? 'active' : ''} onClick={() => { setCategory('all'); setVisible(6); }}>{t('All stories', 'كل المقالات')}</button>{categories.map(item => <button className={category === item.id ? 'active' : ''} key={item.id} onClick={() => { setCategory(item.id); setVisible(6); }}>{localized(item, 'title', lang)}</button>)}</div><label className="page-search"><Search size={18} /><input value={search} onChange={event => { setSearch(event.target.value); setVisible(6); }} placeholder={t('Search the journal', 'ابحث في المجلة')} aria-label={t('Search articles', 'البحث في المقالات')} />{search && <button aria-label={t('Clear search', 'مسح البحث')} onClick={() => setSearch('')}><X size={15} /></button>}</label></div><div aria-live="polite">{gridPosts.length ? <div className="grid-3 page-blog-grid">{gridPosts.slice(0, visible).map(item => <BlogCard key={item.id} item={item} />)}</div> : !featured && <EmptyState title={t('No stories found.', 'لم يتم العثور على مقالات.')} description={t('Try another search term or browse a different category.', 'جرّب عبارة بحث أخرى أو تصفّح فئة مختلفة.')} />}</div>{gridPosts.length > visible && <div className="page-load-more"><button className="button button-outline" onClick={() => setVisible(value => value + 6)}>{t('Load more stories', 'تحميل المزيد من المقالات')}<ArrowRight size={16} /></button><span>{t(`Showing ${visible} of ${gridPosts.length} stories`, `عرض ${visible} من ${gridPosts.length} مقالًا`)}</span></div>}</section><NewsletterBand /></>;
}

export function BlogDetailPage() {
  const { slug } = useParams();
  const { data, ready, error } = useCms();
  const { lang, t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState('');
  const posts = publicItems(data, 'blog_posts');
  const categories = publicItems(data, 'blog_categories');
  const index = posts.findIndex(post => post.slug === slug);
  const post = posts[index];
  useEffect(() => { setCopied(false); setShareError(''); }, [slug]);
  if (!ready || error) return <LoadingPage />;
  if (!post) return <NotFoundPage />;
  const title = localized(post, 'title', lang);
  const related = posts.filter(item => item.id !== post.id).sort((a, b) => Number(field(b, 'category_id') === field(post, 'category_id')) - Number(field(a, 'category_id') === field(post, 'category_id'))).slice(0, 3);
  const tags = localizedList(post, 'tags', lang);
  const share = async () => {
    try {
      if (navigator.share) { await navigator.share({ title, url: window.location.href }); }
      else { await navigator.clipboard.writeText(window.location.href); setCopied(true); }
    } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) setShareError(t('Unable to share. Copy the address from your browser.', 'تعذرت المشاركة. انسخ الرابط من شريط عنوان المتصفح.')); }
  };
  return <><PageSEO item={post} title={title} description={localized(post, 'description', lang)} /><article className="container page-article"><Breadcrumb items={[{ label: t('Journal', 'المجلة'), to: '/blog' }, { label: title }]} /><header className="page-article-header"><span className="eyebrow">{categoryName(post, categories, lang, t)}</span><h1>{title}</h1><p>{localized(post, 'description', lang)}</p><div className="page-article-byline"><div className="page-author-avatar">A</div><div><strong>{localized(post, 'author', lang) || field(post, 'author') || t('Apex Editorial Team', 'فريق تحرير أبيكس')}</strong><div className="page-article-meta"><span>{friendlyDate(post.published_at || post.created_at, lang)}</span><i /><span>{field(post, 'reading_time') || '5'} {t('min read', 'دقائق للقراءة')}</span></div></div><button className="page-share-button" onClick={share}>{copied ? <Check size={17} /> : <Share2 size={17} />}{copied ? t('Link copied', 'تم نسخ الرابط') : t('Share article', 'شارك المقال')}</button></div>{shareError && <p role="status" className="page-form-error">{shareError}</p>}</header><img onError={handleImageError} className="page-article-cover" src={cleanImage(post)} alt={localized(post, 'alt_text', lang) || title} /><div className="page-article-body"><RichText content={localized(post, 'content', lang)} />{tags.length > 0 && <div className="page-tags" aria-label={t('Article tags', 'وسوم المقال')}>{tags.map((tag, i) => <span key={i}>{listText(tag, lang)}</span>)}</div>}<div className="page-article-end"><div><ShieldCheck size={25} /><div><strong>{t('A little expertise goes a long way.', 'قليل من الخبرة يصنع فرقًا كبيرًا.')}</strong><p>{t('Get personal advice for your vehicle from the Apex team.', 'احصل على نصيحة تناسب سيارتك من فريق أبيكس.')}</p></div></div><ButtonLink to="/contact" variant="outline">{t('Let’s talk', 'لنتحدث')}</ButtonLink></div><nav className="page-article-navigation" aria-label={t('More articles', 'المزيد من المقالات')}>{posts[index - 1] ? <Link to={`/blog/${posts[index - 1].slug}`}><span><ChevronLeft size={15} />{t('Previous story', 'المقال السابق')}</span><strong>{localized(posts[index - 1], 'title', lang)}</strong></Link> : <span />}{posts[index + 1] ? <Link to={`/blog/${posts[index + 1].slug}`}><span>{t('Next story', 'المقال التالي')}<ChevronRight size={15} /></span><strong>{localized(posts[index + 1], 'title', lang)}</strong></Link> : <span />}</nav></div></article>{related.length > 0 && <section className="section page-light-section"><div className="container"><SectionHeader eyebrow={t('KEEP EXPLORING', 'واصل الاستكشاف')} title={t('A few more good reads.', 'مقالات أخرى تستحق القراءة.')} action={<ButtonLink to="/blog" variant="outline">{t('All stories', 'كل المقالات')}</ButtonLink>} /><div className="grid-3 page-related-grid">{related.map(item => <BlogCard key={item.id} item={item} />)}</div></div></section>}<NewsletterBand /></>;
}

export function GalleryPage() {
  const { data, ready, error } = useCms();
  const { lang, t } = useLanguage();
  const page = pageRecord(data, 'gallery');
  const albums = publicItems(data, 'albums');
  if (!ready || error) return <LoadingPage />;
  return <><PageSEO item={page} title={t('The Apex Collection', 'مجموعة أبيكس')} /><PageHero eyebrow={t('IN THE FRAME', 'داخل الإطار')} title={textValue(page, 'title', lang, t('A passion worth capturing.', 'شغف يستحق أن يُوثّق.'))} description={textValue(page, 'description', lang, t('Extraordinary vehicles. Exceptional details. Moments from the world of Apex Motors.', 'سيارات استثنائية. تفاصيل مذهلة. لحظات من عالم أبيكس موتورز.'))} /><section className="section container">{albums.length ? <div className="grid-2 page-album-grid">{albums.map(item => <AlbumCard key={item.id} item={item} />)}</div> : <EmptyState title={t('Our next collection is on its way.', 'مجموعتنا القادمة في الطريق.')} />}<p className="page-gallery-note">{t('Gallery imagery is for inspiration and demonstration. Contact our team for current vehicle availability.', 'صور المعرض للإلهام والعرض التجريبي. تواصل مع فريقنا لمعرفة السيارات المتاحة حاليًا.')}</p></section><CTASection /></>;
}

export function AlbumDetailPage() {
  const { slug } = useParams();
  const { data, ready, error } = useCms();
  const { lang, t } = useLanguage();
  const [selected, setSelected] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const album = publicItems(data, 'albums').find(item => item.slug === slug);
  const images = useMemo(() => publicItems(data, 'album_images').filter(image => album && (field(image, 'album_id') === album.id || field(image, 'album_slug') === album.slug)), [data, album]);
  useEffect(() => { setSelected(null); }, [slug]);
  useEffect(() => {
    if (selected === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
      if (event.key === 'ArrowRight') { event.preventDefault(); setSelected(value => value === null ? null : (value + (lang === 'ar' ? -1 : 1) + images.length) % images.length); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); setSelected(value => value === null ? null : (value + (lang === 'ar' ? 1 : -1) + images.length) % images.length); }
      if (event.key === 'Tab') {
        const controls = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button');
        if (!controls?.length) return;
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', listener);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', listener); triggerRef.current?.focus(); };
  }, [selected !== null, images.length, lang]);
  if (!ready || error) return <LoadingPage />;
  if (!album) return <NotFoundPage />;
  const title = localized(album, 'title', lang);
  const current = selected === null ? undefined : images[selected];
  return <><PageSEO item={album} title={title} description={localized(album, 'description', lang)} /><PageHero eyebrow={t('THE APEX COLLECTION', 'مجموعة أبيكس')} title={title} description={localized(album, 'description', lang)} /><div className="container"><Breadcrumb items={[{ label: t('Gallery', 'المعرض'), to: '/gallery' }, { label: title }]} /></div><section className="section container page-album-detail"><div className="page-album-meta"><span>{images.length} {t('photographs', 'صورة')}</span><span>{friendlyDate(album.date || album.created_at, lang)}</span><span>{t('Select an image to explore', 'اختر صورة لاستكشافها')}</span></div>{images.length ? <div className="page-photo-grid">{images.map((item, i) => <button key={item.id} onClick={event => { triggerRef.current = event.currentTarget; setSelected(i); }} aria-label={`${t('Open image', 'افتح الصورة')}: ${localized(item, 'alt_text', lang) || localized(item, 'title', lang) || title}`}><img onError={handleImageError} src={cleanImage(item)} alt={localized(item, 'alt_text', lang) || localized(item, 'title', lang) || title} loading="lazy" /><span><span>{localized(item, 'caption', lang) || localized(item, 'title', lang)}</span><ArrowUpRight size={20} /></span></button>)}</div> : <EmptyState title={t('Images are being curated.', 'جارٍ إعداد الصور.')} description={t('Come back soon for a closer look at this collection.', 'عد قريبًا لإلقاء نظرة أقرب على هذه المجموعة.')} />}<div className="page-load-more"><ButtonLink to="/gallery" variant="outline">{t('Back to all collections', 'العودة إلى جميع المجموعات')}</ButtonLink></div></section>{current && selected !== null && <div className="page-lightbox" ref={dialogRef} role="dialog" aria-modal="true" aria-label={t('Image viewer', 'عارض الصور')} onClick={event => { if (event.target === event.currentTarget) setSelected(null); }}><button className="page-lightbox-close" onClick={() => setSelected(null)} aria-label={t('Close image viewer', 'إغلاق عارض الصور')}><X size={24} /></button><button className="page-lightbox-prev" onClick={() => setSelected((selected - 1 + images.length) % images.length)} aria-label={t('Previous image', 'الصورة السابقة')}><ChevronLeft size={28} /></button><figure><img onError={handleImageError} src={cleanImage(current)} alt={localized(current, 'alt_text', lang) || localized(current, 'title', lang) || title} /><figcaption><span>{localized(current, 'caption', lang) || localized(current, 'title', lang)}</span><span aria-live="polite">{selected + 1} / {images.length}</span></figcaption></figure><button className="page-lightbox-next" onClick={() => setSelected((selected + 1) % images.length)} aria-label={t('Next image', 'الصورة التالية')}><ChevronRight size={28} /></button></div>}<CTASection /></>;
}

export function ContactPage() {
  const { data, ready, error, submitContact } = useCms();
  const { lang, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const page = pageRecord(data, 'contact');
  const settings = publicItems(data, 'site_settings')[0];
  const service = publicItems(data, 'services').find(item => item.slug === searchParams.get('service'));
  const [values, setValues] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const validationMessages: Record<string, string> = {
    name: t('Please enter your full name.', 'يرجى إدخال اسمك الكامل.'),
    email: t('Please enter a valid email address.', 'يرجى إدخال بريد إلكتروني صحيح.'),
    subject: t('Please choose a subject.', 'يرجى اختيار موضوع.'),
    message: t('Please include at least 10 characters in your message.', 'يرجى كتابة 10 أحرف على الأقل في رسالتك.'),
    phone: t('Please enter a valid phone number.', 'يرجى إدخال رقم هاتف صحيح.'),
  };
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');
  useEffect(() => { if (service) setValues(previous => ({ ...previous, subject: service.slug })); }, [service?.id]);
  const phone = field(settings || {} as ContentRecord, 'phone');
  const email = field(settings || {} as ContentRecord, 'email');
  const address = textValue(settings, 'address', lang, t('Showroom location to be confirmed', 'سيتم تأكيد موقع صالة العرض'));
  const hours = textValue(settings, 'working_hours', lang, t('Contact us to arrange an appointment', 'تواصل معنا لترتيب موعد'));
  const socialLinks = publicItems(data, 'social_links').filter(item => /^https?:\/\//.test(field(item, 'url')));
  const update = (key: keyof typeof values, value: string) => { setValues(previous => ({ ...previous, [key]: value })); setErrors(previous => ({ ...previous, [key]: '' })); if (state === 'error') setState('idle'); };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (values.name.trim().length < 2) nextErrors.name = t('Please enter your full name.', 'يرجى إدخال اسمك الكامل.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) nextErrors.email = t('Please enter a valid email address.', 'يرجى إدخال بريد إلكتروني صحيح.');
    if (!values.subject.trim()) nextErrors.subject = t('Please choose a subject.', 'يرجى اختيار موضوع.');
    if (values.message.trim().length < 10) nextErrors.message = t('Please include at least 10 characters in your message.', 'يرجى كتابة 10 أحرف على الأقل في رسالتك.');
    if (values.phone && !/^[+\d\s().-]{6,25}$/.test(values.phone.trim())) nextErrors.phone = t('Please enter a valid phone number.', 'يرجى إدخال رقم هاتف صحيح.');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { document.getElementById(`contact-${Object.keys(nextErrors)[0]}`)?.focus(); return; }
    setState('loading');
    const subjectService = publicItems(data, 'services').find(item => item.slug === values.subject);
    const subject = subjectService ? localized(subjectService, 'title', lang) : values.subject === 'privacy' ? t('Privacy enquiry', 'استفسار خصوصية') : values.subject === 'feedback' ? t('Feedback', 'ملاحظات واقتراحات') : t('General enquiry', 'استفسار عام');
    try { await submitContact({ name: values.name.trim(), email: values.email.trim().toLowerCase(), phone: values.phone.trim(), subject, message: values.message.trim() }); setState('success'); setValues({ name: '', email: '', phone: '', subject: '', message: '' }); }
    catch { setState('error'); setFormError(t('We couldn’t send your message. Please try again, or contact us by email.', 'تعذّر إرسال رسالتك. يرجى المحاولة مجددًا أو التواصل عبر البريد الإلكتروني.')); }
  };
  if (!ready || error) return <LoadingPage />;
  return <><PageSEO item={page} title={t('Contact Apex Motors', 'تواصل مع أبيكس موتورز')} /><PageHero eyebrow={t('LET’S TALK', 'لنتحدث')} title={textValue(page, 'title', lang, t('Your next chapter starts here.', 'فصلك القادم يبدأ هنا.'))} description={textValue(page, 'description', lang, t('A question, an appointment or your next vehicle. Whatever brings you here, we’re ready to help.', 'سؤال أو موعد أو سيارتك القادمة. مهما كان سبب زيارتك، نحن هنا لمساعدتك.'))} /><section className="section container page-contact-layout"><aside><SectionHeader eyebrow={t('PERSONAL SERVICE, FROM THE START', 'خدمة شخصية منذ البداية')} title={t('Good conversations. Great journeys.', 'حوارات مثمرة. رحلات رائعة.')} description={t('Tell us what you have in mind. Our team will help you find the right next step.', 'أخبرنا بما تفكّر فيه. سيساعدك فريقنا في العثور على الخطوة المناسبة.')} /><p className="page-contact-demo">{textValue(settings, 'demo_notice', lang)}</p><div className="page-contact-methods">{[{ Icon: MapPin, label: t('Visit us', 'زرنا'), value: address }, ...(phone ? [{ Icon: Phone, label: t('Call our team', 'اتصل بفريقنا'), value: phone, href: `tel:${phone.replace(/[^+\d]/g, '')}` }] : []), ...(email ? [{ Icon: Mail, label: t('Email us', 'راسلنا'), value: email, href: `mailto:${email}` }] : []), { Icon: Clock, label: t('Opening hours', 'ساعات العمل'), value: hours }].map(({ Icon, label, value, ...rest }, i) => <div key={i}><span><Icon size={20} /></span><div><strong>{label}</strong>{'href' in rest ? <a href={rest.href as string} dir="ltr">{value}</a> : <p>{value}</p>}</div></div>)}</div>{socialLinks.length > 0 && <div className="page-contact-social"><strong>{t('Follow the journey', 'تابع رحلتنا')}</strong><div>{socialLinks.map(link => <a key={link.id} href={field(link, 'url')} target="_blank" rel="noopener noreferrer">{localized(link, 'title', lang)}<ArrowUpRight size={15} /></a>)}</div></div>}<div className="page-contact-note"><ShieldCheck size={18} /><p>{t('Your details are used only to respond to your enquiry. Read our ', 'تُستخدم بياناتك للرد على استفسارك فقط. اقرأ ')}<Link to="/privacy">{t('privacy policy', 'سياسة الخصوصية')}</Link>.</p></div></aside><div className="page-contact-form-card">{state === 'success' ? <div className="page-contact-success" role="status"><CheckCircle2 size={48} /><span className="eyebrow">{t('MESSAGE RECEIVED', 'وصلت رسالتك')}</span><h2>{t('You’re in good hands.', 'أنت في أيدٍ أمينة.')}</h2><p>{t('Thank you for getting in touch. Your message has been saved and our team will follow up using the details you provided.', 'شكرًا لتواصلك معنا. تم حفظ رسالتك وسيتابع فريقنا معك باستخدام المعلومات التي قدّمتها.')}</p><button className="button button-outline" onClick={() => setState('idle')}>{t('Send another message', 'إرسال رسالة أخرى')}</button></div> : <><h2>{t('How can we help?', 'كيف يمكننا مساعدتك؟')}</h2><p>{t('Leave us a message. We’ll take it from here.', 'اترك لنا رسالة. وسنتولى الباقي.')}</p><form onSubmit={submit} noValidate><div className="page-form-row"><div><label htmlFor="contact-name">{t('Full name', 'الاسم الكامل')} <span>*</span></label><input id="contact-name" autoComplete="name" value={values.name} onChange={event => update('name', event.target.value)} placeholder={t('Your full name', 'اسمك الكامل')} maxLength={120} required aria-invalid={!!errors.name} aria-describedby={errors.name ? 'contact-name-error' : undefined} />{errors.name && <span id="contact-name-error" className="page-field-error">{validationMessages.name}</span>}</div><div><label htmlFor="contact-email">{t('Email address', 'البريد الإلكتروني')} <span>*</span></label><input id="contact-email" type="email" autoComplete="email" dir="ltr" value={values.email} onChange={event => update('email', event.target.value)} placeholder="you@example.com" maxLength={254} required aria-invalid={!!errors.email} aria-describedby={errors.email ? 'contact-email-error' : undefined} />{errors.email && <span id="contact-email-error" className="page-field-error">{validationMessages.email}</span>}</div></div><div className="page-form-row"><div><label htmlFor="contact-phone">{t('Phone number', 'رقم الهاتف')} <small>{t('(optional)', '(اختياري)')}</small></label><input id="contact-phone" type="tel" autoComplete="tel" dir="ltr" value={values.phone} onChange={event => update('phone', event.target.value)} placeholder={t('Your phone number', 'رقم هاتفك')} maxLength={25} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'contact-phone-error' : undefined} />{errors.phone && <span id="contact-phone-error" className="page-field-error">{validationMessages.phone}</span>}</div><div><label htmlFor="contact-subject">{t('I’m interested in', 'أنا مهتم بـ')} <span>*</span></label><select id="contact-subject" value={values.subject} onChange={event => update('subject', event.target.value)} required aria-invalid={!!errors.subject} aria-describedby={errors.subject ? 'contact-subject-error' : undefined}><option value="">{t('Select a subject', 'اختر موضوعًا')}</option>{publicItems(data, 'services').map(item => <option key={item.id} value={item.slug}>{localized(item, 'title', lang)}</option>)}<option value="general">{t('General enquiry', 'استفسار عام')}</option><option value="privacy">{t('Privacy enquiry', 'استفسار خصوصية')}</option><option value="feedback">{t('Feedback', 'ملاحظات واقتراحات')}</option></select>{errors.subject && <span id="contact-subject-error" className="page-field-error">{validationMessages.subject}</span>}</div></div><div><label htmlFor="contact-message">{t('Your message', 'رسالتك')} <span>*</span></label><textarea id="contact-message" value={values.message} onChange={event => update('message', event.target.value)} placeholder={t('Tell us about your vehicle, preferred date or how we can help…', 'أخبرنا عن سيارتك أو موعدك المفضّل أو كيف يمكننا مساعدتك…')} rows={5} minLength={10} maxLength={5000} required aria-invalid={!!errors.message} aria-describedby={errors.message ? 'contact-message-error' : undefined} />{errors.message && <span id="contact-message-error" className="page-field-error">{validationMessages.message}</span>}</div>{state === 'error' && <p role="alert" className="page-form-error">{formError}</p>}<p className="page-form-disclaimer">{t('By submitting, you agree to our ', 'بإرسال الرسالة، فإنك توافق على ')}<Link to="/privacy">{t('Privacy Policy', 'سياسة الخصوصية')}</Link>{t('. Fields marked * are required.', '. الحقول المميزة بـ * مطلوبة.')}</p><button className="button button-primary page-contact-submit" type="submit" disabled={state === 'loading'}>{state === 'loading' ? <><LoaderCircle size={17} className="page-spin" />{t('Sending your message…', 'جارٍ إرسال رسالتك…')}</> : <>{t('Send message', 'إرسال الرسالة')}<ArrowUpRight size={17} /></>}</button></form></>}</div></section><section className="container page-map-section"><div className="page-map-visual" aria-hidden="true"><div className="page-map-road one" /><div className="page-map-road two" /><div className="page-map-road three" /><div className="page-map-pin"><MapPin size={29} /><strong>APEX MOTORS</strong></div></div><div className="page-map-info"><span className="eyebrow">{t('PLAN YOUR VISIT', 'خطط لزيارتك')}</span><h2>{t('We look forward to meeting you.', 'نتطلع إلى لقائك.')}</h2><p>{address}</p><span>{t('Illustrative location map. Contact our team to confirm the showroom address and arrange your visit.', 'خريطة توضيحية. تواصل مع فريقنا لتأكيد عنوان صالة العرض وترتيب زيارتك.')}</span>{email && <a className="page-text-link" href={`mailto:${email}?subject=${encodeURIComponent(t('Arrange a showroom visit', 'ترتيب زيارة لصالة العرض'))}`}>{t('Arrange a visit', 'رتّب زيارة')}<ArrowUpRight size={16} /></a>}</div></section></>;
}

export function FAQPage() {
  const { data, ready, error } = useCms();
  const { lang, t } = useLanguage();
  const [selected, setSelected] = useState('all');
  const [search, setSearch] = useState('');
  const items = publicItems(data, 'faqs');
  const page = pageRecord(data, 'faq');
  const categories = [...new Set(items.map(item => field(item, 'category') || 'general'))];
  const names = new Map(categories.map(key => { const sample = items.find(item => (field(item, 'category') || 'general') === key)!; return [key, localized(sample, 'category', lang) || (key === 'general' ? t('General', 'عام') : key)]; }));
  const filtered = items.filter(item => (selected === 'all' || (field(item, 'category') || 'general') === selected) && `${localized(item, 'title', lang)} ${localized(item, 'question', lang)} ${localized(item, 'description', lang)} ${localized(item, 'answer', lang)}`.toLowerCase().includes(search.trim().toLowerCase()));
  if (!ready || error) return <LoadingPage />;
  return <><PageSEO item={page} title={t('Frequently Asked Questions', 'الأسئلة الشائعة')} /><PageHero eyebrow={t('A LITTLE CLARITY', 'بعض التوضيح')} title={textValue(page, 'title', lang, t('Good questions. Clear answers.', 'أسئلة جيدة. إجابات واضحة.'))} description={textValue(page, 'description', lang, t('Everything you need to know before your next visit. Still curious? We’re one conversation away.', 'كل ما تحتاج معرفته قبل زيارتك القادمة. لديك المزيد من الأسئلة؟ نحن على بُعد محادثة واحدة.'))} /><section className="section container page-faq-layout"><aside><label className="page-search"><Search size={18} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder={t('Find an answer…', 'ابحث عن إجابة…')} aria-label={t('Search questions', 'ابحث في الأسئلة')} /></label><nav className="page-faq-nav" aria-label={t('Question categories', 'فئات الأسئلة')}><button className={selected === 'all' ? 'active' : ''} onClick={() => setSelected('all')}>{t('All questions', 'جميع الأسئلة')}<span>{items.length}</span></button>{categories.map(category => <button className={selected === category ? 'active' : ''} onClick={() => setSelected(category)} key={category}>{names.get(category)}<ArrowUpRight size={15} /></button>)}</nav><div className="page-faq-help"><Mail size={24} /><h3>{t('Let’s make it personal.', 'دعنا نساعدك مباشرة.')}</h3><p>{t('Our team can help with questions specific to your vehicle.', 'يمكن لفريقنا المساعدة في الأسئلة الخاصة بسيارتك.')}</p><Link to="/contact">{t('Get in touch', 'تواصل معنا')}<ArrowUpRight size={15} /></Link></div></aside><div className="page-faq-groups" aria-live="polite">{filtered.length ? categories.map(category => { const group = filtered.filter(item => (field(item, 'category') || 'general') === category); return group.length ? <section key={category}><span className="eyebrow">{names.get(category)}</span><FAQAccordion items={group} /></section> : null; }) : <EmptyState title={t('No answers found for that search.', 'لم نجد إجابات لهذا البحث.')} description={t('Try a broader term or ask our team directly.', 'جرّب كلمة أعمّ أو اسأل فريقنا مباشرة.')} />}</div></section><CTASection /></>;
}

function NewsletterBand() {
  const { t } = useLanguage();
  return <section className="page-newsletter-band"><div className="container"><div><span className="eyebrow">{t('STAY IN THE KNOW', 'ابقَ على اطلاع')}</span><h2>{t('A better-informed journey.', 'رحلة أكثر معرفة.')}</h2><p>{t('Expert advice, fresh perspectives and news from Apex. Delivered thoughtfully.', 'نصائح الخبراء ورؤى جديدة وأخبار أبيكس. تصل إليك بعناية.')}</p></div><NewsletterForm /></div></section>;
}

export function NewsletterPage() {
  const { lang, t } = useLanguage();
  const { data, ready, error } = useCms();
  const page = pageRecord(data, 'newsletter');
  if (!ready || error) return <LoadingPage />;
  return <><PageSEO item={page} title={t('The Apex Newsletter', 'نشرة أبيكس البريدية')} /><PageHero eyebrow={t('THE INSIDE LINE', 'من داخل عالم أبيكس')} title={textValue(page, 'title', lang, t('A little inspiration for the journey.', 'بعض الإلهام لرحلتك.'))} description={textValue(page, 'description', lang, t('Get thoughtful automotive advice, new perspectives and the latest from Apex Motors. Straight to your inbox.', 'احصل على نصائح مدروسة ورؤى جديدة وآخر أخبار أبيكس موتورز. مباشرة إلى بريدك الإلكتروني.'))} /><section className="section container page-newsletter-page"><div className="page-newsletter-benefits"><SectionHeader eyebrow={t('WORTH OPENING', 'تستحق القراءة')} title={t('Your passion. Our perspective.', 'شغفك. رؤيتنا.')} />{[{ Icon: Wrench, title: t('Care that goes further', 'عناية تدوم أكثر'), description: t('Practical maintenance advice to keep your vehicle at its best.', 'نصائح صيانة عملية للحفاظ على سيارتك في أفضل حالاتها.') }, { Icon: CarFront, title: t('A closer look', 'نظرة أقرب'), description: t('Explore automotive craftsmanship, new services and considered buying guides.', 'اكتشف حرفية السيارات والخدمات الجديدة وأدلة الشراء المدروسة.') }, { Icon: CalendarDays, title: t('First to know', 'أول من يعلم'), description: t('Company updates, seasonal tips and moments from the Apex community.', 'أخبار الشركة ونصائح موسمية ولحظات من مجتمع أبيكس.') }].map(({ Icon, title, description }, i) => <div key={i}><span><Icon size={23} /></span><div><h3>{title}</h3><p>{description}</p></div></div>)}</div><div className="page-newsletter-signup"><Mail size={35} /><h2>{t('Welcome to the inner circle.', 'مرحبًا بك في دائرتنا.')}</h2><p>{t('Join the Apex Motors newsletter.', 'اشترك في نشرة أبيكس موتورز البريدية.')}</p><NewsletterForm showName /><div className="page-newsletter-trust"><ShieldCheck size={16} /><span>{t('Thoughtful updates. Unsubscribe whenever you like.', 'تحديثات مدروسة. يمكنك إلغاء الاشتراك متى شئت.')}</span></div><Link className="page-text-link" to="/privacy">{t('Read our privacy policy', 'اقرأ سياسة الخصوصية')}<ArrowUpRight size={14} /></Link></div></section></>;
}

export function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const { data, ready, error } = useCms();
  const { lang, t } = useLanguage();
  const page = pageRecord(data, kind);
  const title = textValue(page, 'title', lang, kind === 'privacy' ? t('Privacy Policy', 'سياسة الخصوصية') : t('Terms & Conditions', 'الشروط والأحكام'));
  if (!ready || error) return <LoadingPage />;
  return <><PageSEO item={page} title={title} /><PageHero eyebrow={t('THE DETAILS THAT MATTER', 'التفاصيل المهمة')} title={title} description={textValue(page, 'description', lang, t('Clear information about your experience with Apex Motors.', 'معلومات واضحة حول تجربتك مع أبيكس موتورز.'))} /><section className="section container page-legal-layout"><aside><span className="eyebrow">APEX MOTORS</span><nav aria-label={t('Legal pages', 'الصفحات القانونية')}><Link to="/privacy" aria-current={kind === 'privacy' ? 'page' : undefined}>{t('Privacy Policy', 'سياسة الخصوصية')}<ArrowUpRight size={15} /></Link><Link to="/terms" aria-current={kind === 'terms' ? 'page' : undefined}>{t('Terms & Conditions', 'الشروط والأحكام')}<ArrowUpRight size={15} /></Link><Link to="/contact">{t('Contact us', 'تواصل معنا')}<ArrowUpRight size={15} /></Link></nav></aside><div>{page ? <><p className="page-legal-date">{t('Last updated', 'آخر تحديث')}: {friendlyDate(page.updated_at || page.created_at, lang)}</p><RichText content={localized(page, 'content', lang)} /></> : <EmptyState title={t('This policy is being updated.', 'جارٍ تحديث هذه السياسة.')} description={t('Please contact our team for information about our policies.', 'يرجى التواصل مع فريقنا للحصول على معلومات حول سياساتنا.')} />}</div></section></>;
}

export function NotFoundPage() {
  const { t } = useLanguage();
  return <><SEO title={t('Page not found', 'الصفحة غير موجودة')} /><section className="container page-not-found"><span className="page-error-number">404</span><span className="eyebrow">{t('A SMALL DETOUR', 'انعطاف بسيط')}</span><h1>{t('Let’s get you back on track.', 'لنعِدك إلى المسار الصحيح.')}</h1><p>{t('The page you’re looking for may have moved, or is not currently available. Your next journey starts below.', 'قد تكون الصفحة التي تبحث عنها قد انتقلت أو غير متاحة حاليًا. تبدأ رحلتك التالية أدناه.')}</p><div><ButtonLink to="/">{t('Back to home', 'العودة للرئيسية')}</ButtonLink><ButtonLink to="/services" variant="outline">{t('Explore services', 'استكشف الخدمات')}</ButtonLink></div></section></>;
}
