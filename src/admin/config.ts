export type AdminModule = { key: string; en: string; ar: string; description: string; descriptionAr: string; icon: string; group: 'content' | 'audience' | 'configuration' };

export const modules: AdminModule[] = [
  { key: 'pages', en: 'Pages', ar: 'الصفحات', description: 'Your company story, legal pages, and website content.', descriptionAr: 'قصة شركتك والصفحات القانونية ومحتوى الموقع.', icon: 'pages', group: 'content' },
  { key: 'hero_slides', en: 'Hero slides', ar: 'شرائح الرئيسية', description: 'Make a strong first impression. Manage your homepage slides.', descriptionAr: 'اترك انطباعاً مميزاً. أدر شرائح الصفحة الرئيسية.', icon: 'slides', group: 'content' },
  { key: 'services', en: 'Services', ar: 'الخدمات', description: 'Showcase the expertise behind every Apex Motors service.', descriptionAr: 'اعرض الخبرات التي تقف خلف كل خدمة من أبيكس موتورز.', icon: 'services', group: 'content' },
  { key: 'features', en: 'Features', ar: 'المزايا', description: 'The details that make the Apex Motors experience different.', descriptionAr: 'التفاصيل التي تجعل تجربة أبيكس موتورز مختلفة.', icon: 'features', group: 'content' },
  { key: 'blog_posts', en: 'Journal posts', ar: 'مقالات المجلة', description: 'Automotive stories, expert advice, and company updates.', descriptionAr: 'قصص السيارات ونصائح الخبراء وأخبار الشركة.', icon: 'blog', group: 'content' },
  { key: 'blog_categories', en: 'Blog categories', ar: 'تصنيفات المقالات', description: 'Keep your journal organized and easy to explore.', descriptionAr: 'نظّم مقالاتك واجعل استكشافها سهلاً.', icon: 'categories', group: 'content' },
  { key: 'albums', en: 'Gallery albums', ar: 'ألبومات المعرض', description: 'Curate the collections that tell your automotive story.', descriptionAr: 'اختر المجموعات التي تروي قصة شغفك بالسيارات.', icon: 'albums', group: 'content' },
  { key: 'album_images', en: 'Gallery images', ar: 'صور المعرض', description: 'Manage album photography and bilingual image captions.', descriptionAr: 'أدر صور الألبومات والتعليقات باللغتين.', icon: 'images', group: 'content' },
  { key: 'faqs', en: 'FAQs', ar: 'الأسئلة الشائعة', description: 'Clear answers to your customers’ most common questions.', descriptionAr: 'إجابات واضحة عن أسئلة عملائك الأكثر شيوعاً.', icon: 'faqs', group: 'content' },
  { key: 'testimonials', en: 'Testimonials', ar: 'آراء العملاء', description: 'Customer experiences, in their own words.', descriptionAr: 'تجارب العملاء بكلماتهم.', icon: 'testimonials', group: 'content' },
  { key: 'team_members', en: 'Our team', ar: 'فريقنا', description: 'Introduce the people behind your automotive expertise.', descriptionAr: 'عرّف بالخبراء الذين يقفون خلف خدماتك.', icon: 'team', group: 'content' },
  { key: 'contact_messages', en: 'Messages', ar: 'الرسائل', description: 'Customer inquiries and service requests, all in one place.', descriptionAr: 'استفسارات العملاء وطلبات الخدمة في مكان واحد.', icon: 'messages', group: 'audience' },
  { key: 'newsletter_subscribers', en: 'Subscribers', ar: 'المشتركون', description: 'Manage the audience subscribed to your automotive updates.', descriptionAr: 'أدر جمهور المشتركين في تحديثات السيارات.', icon: 'subscribers', group: 'audience' },
  { key: 'media', en: 'Media library', ar: 'مكتبة الوسائط', description: 'A home for all your brand and automotive photography.', descriptionAr: 'مكان واحد لجميع صور علامتك التجارية والسيارات.', icon: 'media', group: 'content' },
  { key: 'navigation_items', en: 'Navigation', ar: 'القوائم', description: 'Shape the way visitors move through your website.', descriptionAr: 'تحكّم في طريقة تنقّل الزوار عبر موقعك.', icon: 'navigation', group: 'configuration' },
  { key: 'social_links', en: 'Social links', ar: 'روابط التواصل', description: 'Connect your website with your official social profiles.', descriptionAr: 'اربط موقعك بحسابات التواصل الاجتماعي الرسمية.', icon: 'social', group: 'configuration' },
];

export type FieldDefinition = { key: string; en: string; ar: string; kind?: 'text' | 'textarea' | 'number' | 'date' | 'lines' | 'json' | 'select'; options?: { value: string; label: string }[]; wide?: boolean; required?: boolean };

export const extraFields: Record<string, FieldDefinition[]> = {
  hero_slides: [
    { key: 'subtitle_en', en: 'Subtitle · English', ar: 'العنوان الفرعي · الإنجليزية' }, { key: 'subtitle_ar', en: 'Subtitle · Arabic', ar: 'العنوان الفرعي · العربية' },
    { key: 'cta_text_en', en: 'Primary button · English', ar: 'الزر الرئيسي · الإنجليزية' }, { key: 'cta_text_ar', en: 'Primary button · Arabic', ar: 'الزر الرئيسي · العربية' },
    { key: 'cta_link', en: 'Primary button link', ar: 'رابط الزر الرئيسي' },
    { key: 'secondary_text_en', en: 'Secondary button · English', ar: 'الزر الثانوي · الإنجليزية' }, { key: 'secondary_text_ar', en: 'Secondary button · Arabic', ar: 'الزر الثانوي · العربية' },
    { key: 'secondary_link', en: 'Secondary button link', ar: 'رابط الزر الثانوي' },
  ],
  services: [
    { key: 'icon', en: 'Icon name', ar: 'اسم الأيقونة' }, { key: 'category_en', en: 'Category · English', ar: 'التصنيف · الإنجليزية' }, { key: 'category_ar', en: 'Category · Arabic', ar: 'التصنيف · العربية' },
    { key: 'benefits_en', en: 'Benefits · English (one per line)', ar: 'الفوائد · الإنجليزية (واحدة في كل سطر)', kind: 'lines' }, { key: 'benefits_ar', en: 'Benefits · Arabic (one per line)', ar: 'الفوائد · العربية (واحدة في كل سطر)', kind: 'lines' },
    { key: 'process_en', en: 'Service process · English (one step per line)', ar: 'مراحل الخدمة · الإنجليزية (خطوة في كل سطر)', kind: 'lines' }, { key: 'process_ar', en: 'Service process · Arabic (one step per line)', ar: 'مراحل الخدمة · العربية (خطوة في كل سطر)', kind: 'lines' },
    { key: 'features_en', en: 'Service features · English (one per line)', ar: 'مزايا الخدمة · الإنجليزية (واحدة في كل سطر)', kind: 'lines' }, { key: 'features_ar', en: 'Service features · Arabic (one per line)', ar: 'مزايا الخدمة · العربية (واحدة في كل سطر)', kind: 'lines' },
    { key: 'gallery', en: 'Gallery image URLs (one per line)', ar: 'روابط صور المعرض (رابط في كل سطر)', kind: 'lines', wide: true },
    { key: 'cta_text_en', en: 'Button text · English', ar: 'نص الزر · الإنجليزية' }, { key: 'cta_text_ar', en: 'Button text · Arabic', ar: 'نص الزر · العربية' }, { key: 'cta_link', en: 'Button destination', ar: 'رابط الزر' },
  ],
  features: [{ key: 'icon', en: 'Icon name', ar: 'اسم الأيقونة' }],
  blog_posts: [
    { key: 'author_en', en: 'Author · English', ar: 'الكاتب · الإنجليزية' }, { key: 'author_ar', en: 'Author · Arabic', ar: 'الكاتب · العربية' }, { key: 'published_at', en: 'Publication date', ar: 'تاريخ النشر', kind: 'date' },
    { key: 'reading_time', en: 'Reading time (minutes)', ar: 'مدة القراءة (دقائق)', kind: 'number' }, { key: 'tags_en', en: 'Tags · English (one per line)', ar: 'الوسوم · الإنجليزية (واحد في كل سطر)', kind: 'lines' }, { key: 'tags_ar', en: 'Tags · Arabic (one per line)', ar: 'الوسوم · العربية (واحد في كل سطر)', kind: 'lines' },
  ],
  album_images: [{ key: 'caption_en', en: 'Caption · English', ar: 'التعليق · الإنجليزية' }, { key: 'caption_ar', en: 'Caption · Arabic', ar: 'التعليق · العربية' }],
  albums: [{ key: 'date', en: 'Album date', ar: 'تاريخ الألبوم', kind: 'date' }],
  faqs: [{ key: 'category_en', en: 'Category · English', ar: 'التصنيف · الإنجليزية' }, { key: 'category_ar', en: 'Category · Arabic', ar: 'التصنيف · العربية' }],
  testimonials: [{ key: 'role_en', en: 'Customer description · English', ar: 'وصف العميل · الإنجليزية' }, { key: 'role_ar', en: 'Customer description · Arabic', ar: 'وصف العميل · العربية' }, { key: 'rating', en: 'Rating (1–5)', ar: 'التقييم (١–٥)', kind: 'number' }],
  team_members: [{ key: 'role_en', en: 'Job title · English', ar: 'المسمى الوظيفي · الإنجليزية' }, { key: 'role_ar', en: 'Job title · Arabic', ar: 'المسمى الوظيفي · العربية' }, { key: 'bio_en', en: 'Biography · English', ar: 'السيرة · الإنجليزية', kind: 'textarea' }, { key: 'bio_ar', en: 'Biography · Arabic', ar: 'السيرة · العربية', kind: 'textarea' }],
  navigation_items: [{ key: 'href', en: 'Destination URL', ar: 'رابط الوجهة', required: true }, { key: 'location', en: 'Menu location', ar: 'موضع القائمة', kind: 'select', options: [{ value: 'header', label: 'Header / الرأس' }, { value: 'footer', label: 'Footer / التذييل' }, { value: 'both', label: 'Both / كلاهما' }] }],
  social_links: [{ key: 'icon', en: 'Platform icon', ar: 'أيقونة المنصة' }, { key: 'url', en: 'Profile URL', ar: 'رابط الحساب', required: true }],
};

export const settingsFields: Record<string, FieldDefinition[]> = {
  website: [
    { key: 'company_name_en', en: 'Company name · English', ar: 'اسم الشركة · الإنجليزية', required: true }, { key: 'company_name_ar', en: 'Company name · Arabic', ar: 'اسم الشركة · العربية', required: true },
    { key: 'tagline_en', en: 'Tagline · English', ar: 'الشعار · الإنجليزية' }, { key: 'tagline_ar', en: 'Tagline · Arabic', ar: 'الشعار · العربية' },
    { key: 'phone', en: 'Phone number', ar: 'رقم الهاتف' }, { key: 'email', en: 'Contact email', ar: 'البريد الإلكتروني' },
    { key: 'address_en', en: 'Address · English', ar: 'العنوان · الإنجليزية' }, { key: 'address_ar', en: 'Address · Arabic', ar: 'العنوان · العربية' },
    { key: 'working_hours_en', en: 'Working hours · English', ar: 'ساعات العمل · الإنجليزية' }, { key: 'working_hours_ar', en: 'Working hours · Arabic', ar: 'ساعات العمل · العربية' },
    { key: 'site_url', en: 'Website URL', ar: 'رابط الموقع' }, { key: 'logo', en: 'Logo image URL', ar: 'رابط صورة الشعار' }, { key: 'favicon', en: 'Favicon URL', ar: 'رابط أيقونة الموقع' },
    { key: 'years_experience', en: 'Experience badge value', ar: 'قيمة شارة سنوات الخبرة' },
    ...[1, 2, 3, 4].flatMap(index => [
      { key: `stat_${index}_value`, en: `Statistic ${index} · Value`, ar: `الإحصائية ${index} · القيمة`, wide: true },
      { key: `stat_${index}_label_en`, en: `Statistic ${index} · English label`, ar: `الإحصائية ${index} · الوصف الإنجليزي` },
      { key: `stat_${index}_label_ar`, en: `Statistic ${index} · Arabic label`, ar: `الإحصائية ${index} · الوصف العربي` },
    ]),
  ],
  footer: [{ key: 'footer_text_en', en: 'Footer description · English', ar: 'وصف التذييل · الإنجليزية', kind: 'textarea' }, { key: 'footer_text_ar', en: 'Footer description · Arabic', ar: 'وصف التذييل · العربية', kind: 'textarea' }, { key: 'copyright_en', en: 'Copyright · English', ar: 'حقوق النشر · الإنجليزية' }, { key: 'copyright_ar', en: 'Copyright · Arabic', ar: 'حقوق النشر · العربية' }, { key: 'demo_notice_en', en: 'Demonstration notice · English', ar: 'إشعار العرض التجريبي · الإنجليزية', kind: 'textarea' }, { key: 'demo_notice_ar', en: 'Demonstration notice · Arabic', ar: 'إشعار العرض التجريبي · العربية', kind: 'textarea' }],
  seo: [
    { key: 'meta_title_en', en: 'Default SEO title · English', ar: 'عنوان البحث الافتراضي · الإنجليزية' }, { key: 'meta_title_ar', en: 'Default SEO title · Arabic', ar: 'عنوان البحث الافتراضي · العربية' },
    { key: 'meta_description_en', en: 'Default meta description · English', ar: 'وصف البحث الافتراضي · الإنجليزية', kind: 'textarea' }, { key: 'meta_description_ar', en: 'Default meta description · Arabic', ar: 'وصف البحث الافتراضي · العربية', kind: 'textarea' },
    { key: 'og_image', en: 'Default social sharing image URL', ar: 'رابط صورة المشاركة الافتراضية' }, { key: 'site_url', en: 'Canonical website URL', ar: 'الرابط الأساسي للموقع' },
  ],
};

export function pageFields(slug: string): FieldDefinition[] {
  if (slug === 'about') return [
    ...(['mission', 'vision'] as const).flatMap(key => (['en', 'ar'] as const).map(language => ({ key: `${key}_${language}`, en: `${key === 'mission' ? 'Mission' : 'Vision'} · ${language === 'en' ? 'English' : 'Arabic'}`, ar: `${key === 'mission' ? 'الرسالة' : 'الرؤية'} · ${language === 'en' ? 'الإنجليزية' : 'العربية'}`, kind: 'textarea' as const }))),
    ...(['values', 'timeline'] as const).flatMap(key => (['en', 'ar'] as const).map(language => ({ key: `${key}_${language}`, en: `${key === 'values' ? 'Values' : 'Timeline'} · ${language === 'en' ? 'English' : 'Arabic'} (one per line)`, ar: `${key === 'values' ? 'القيم' : 'المراحل'} · ${language === 'en' ? 'الإنجليزية' : 'العربية'} (واحدة في كل سطر)`, kind: 'lines' as const }))),
  ];
  if (slug !== 'home') return [];
  const sections = [{ key: 'intro', en: 'Introduction', ar: 'المقدمة' }, { key: 'services', en: 'Services', ar: 'الخدمات' }, { key: 'standard', en: 'Brand promise', ar: 'وعد العلامة' }, { key: 'gallery', en: 'Gallery', ar: 'المعرض' }, { key: 'benefits', en: 'Why choose us', ar: 'لماذا تختارنا' }, { key: 'testimonials', en: 'Testimonials', ar: 'آراء العملاء' }, { key: 'blog', en: 'Journal', ar: 'المجلة' }, { key: 'faq', en: 'FAQ', ar: 'الأسئلة الشائعة' }];
  return sections.flatMap(section => (section.key === 'benefits' ? ['title'] : ['title', 'description']).flatMap(part => (['en', 'ar'] as const).map(language => ({ key: `${section.key}_${part}_${language}`, en: `${section.en} ${part} · ${language === 'en' ? 'English' : 'Arabic'}`, ar: `${part === 'title' ? 'عنوان' : 'وصف'} ${section.ar} · ${language === 'en' ? 'الإنجليزية' : 'العربية'}`, kind: part === 'description' ? 'textarea' as const : 'text' as const }))));
}
