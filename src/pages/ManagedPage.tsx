import { useParams } from 'react-router-dom';
import { useCms } from '../context/CmsContext';
import { useLanguage } from '../context/LanguageContext';
import { field, localized, publicRecords } from '../lib/types';
import { PageHero, SEO, CTASection } from '../components/ui';
import { NotFoundPage, RichText } from './PublicPages';

/** Additional editorial pages created in the CMS share one public template. */
export default function ManagedPage() {
  const { slug } = useParams();
  const { data } = useCms();
  const { lang } = useLanguage();
  const item = publicRecords(data.pages).find(page => page.slug === slug);
  if (!item) return <NotFoundPage />;
  const title = localized(item, 'title', lang);
  return <><SEO title={localized(item, 'meta_title', lang) || title} description={localized(item, 'meta_description', lang) || localized(item, 'description', lang)} image={field(item, 'og_image') || item.image} /><PageHero title={title} description={localized(item, 'description', lang)} image={item.image || undefined} /><section className="section container page-legal"><RichText content={localized(item, 'content', lang)} /></section><CTASection /></>;
}
