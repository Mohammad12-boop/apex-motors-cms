import { Component, Suspense, lazy, type ErrorInfo, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import HomePage from './pages/HomePage';
import ManagedPage from './pages/ManagedPage';
import { useCms } from './context/CmsContext';
import { useLanguage } from './context/LanguageContext';
import { publicRecords } from './lib/types';
import { SEO } from './components/ui';
import { AboutPage, ServicesPage, ServiceDetailPage, FeaturesPage, BlogPage, BlogDetailPage, GalleryPage, AlbumDetailPage, ContactPage, FAQPage, NewsletterPage, LegalPage, NotFoundPage } from './pages/PublicPages';
const AdminApp = lazy(() => import('./admin/AdminApp'));

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Apex application error', error, info.componentStack); }
  render() { if (this.state.hasError) return <main className="empty-state"><h1>{document.documentElement.lang === 'ar' ? 'تعذر عرض الصفحة' : 'Something went wrong'}</h1><p>{document.documentElement.lang === 'ar' ? 'يرجى إعادة تحميل الصفحة للمحاولة مجدداً.' : 'Please reload the page to try again.'}</p><button className="button button-primary" onClick={() => window.location.reload()}>{document.documentElement.lang === 'ar' ? 'إعادة التحميل' : 'Reload page'}</button></main>; return this.props.children; }
}
function PublishedPage({ slug, children }: { slug: string; children: ReactNode }) { const { data } = useCms(); return publicRecords(data.pages).some(page => page.slug === slug) ? children : <NotFoundPage />; }
function AdminRoute() { const { t } = useLanguage(); return <><SEO title={t('Administration', 'الإدارة')} /><AdminApp /></>; }
export default function App() {
  return <ErrorBoundary><Suspense fallback={<div className="loading-page container"><div className="skeleton skeleton-hero" /></div>}><Routes><Route path="/admin/*" element={<AdminRoute />} /><Route element={<Layout />}><Route index element={<PublishedPage slug="home"><HomePage /></PublishedPage>} /><Route path="about" element={<PublishedPage slug="about"><AboutPage /></PublishedPage>} /><Route path="services" element={<PublishedPage slug="services"><ServicesPage /></PublishedPage>} /><Route path="services/:slug" element={<ServiceDetailPage />} /><Route path="features" element={<PublishedPage slug="features"><FeaturesPage /></PublishedPage>} /><Route path="blog" element={<PublishedPage slug="blog"><BlogPage /></PublishedPage>} /><Route path="blog/:slug" element={<BlogDetailPage />} /><Route path="gallery" element={<PublishedPage slug="gallery"><GalleryPage /></PublishedPage>} /><Route path="gallery/:slug" element={<AlbumDetailPage />} /><Route path="contact" element={<PublishedPage slug="contact"><ContactPage /></PublishedPage>} /><Route path="faq" element={<PublishedPage slug="faq"><FAQPage /></PublishedPage>} /><Route path="newsletter" element={<PublishedPage slug="newsletter"><NewsletterPage /></PublishedPage>} /><Route path="privacy" element={<PublishedPage slug="privacy"><LegalPage kind="privacy" /></PublishedPage>} /><Route path="terms" element={<PublishedPage slug="terms"><LegalPage kind="terms" /></PublishedPage>} /><Route path="pages/:slug" element={<ManagedPage />} /><Route path="*" element={<NotFoundPage />} /></Route></Routes></Suspense></ErrorBoundary>;
}
