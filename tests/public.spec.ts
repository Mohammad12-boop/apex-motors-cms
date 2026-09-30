import { expect, test } from '@playwright/test';
import seed from '../src/data/seed.json' with { type: 'json' };

const listingSlugs = ['about', 'services', 'features', 'blog', 'gallery', 'contact', 'faq', 'newsletter', 'privacy', 'terms'];

for (const language of ['en', 'ar'] as const) {
  test(`all public listing pages have editable ${language} content and correct direction`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const slug of listingSlugs) {
      const record = seed.pages.find(item => item.slug === slug)!;
      await page.goto(`/${slug}?lang=${language}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('main h1')).toHaveText(record[`title_${language}`]);
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      await expect(page.locator('html')).toHaveAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
      expect(await page.locator('main a[href="#"]').count()).toBe(0);
    }
    expect(errors).toEqual([]);
  });

  test(`every service, article and album renders its ${language} detail`, async ({ page }) => {
    for (const [prefix, records] of [['services', seed.services], ['blog', seed.blog_posts], ['gallery', seed.albums]] as const) {
      for (const record of records) {
        await page.goto(`/${prefix}/${record.slug}?lang=${language}`, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('main h1')).toHaveText(record[`title_${language}`]);
        if (prefix === 'services') {
          await expect(page.locator('.page-benefits')).toBeVisible();
          await expect(page.locator('.page-process-grid article')).toHaveCount(4);
          await expect(page.locator('.page-service-gallery img')).toHaveCount(3);
        } else if (prefix === 'blog') {
          await expect(page.locator('.page-article-body .page-prose h2').first()).toBeVisible();
          await expect(page.locator('.page-tags')).toBeVisible();
        } else {
          await expect(page.locator('.page-photo-grid button')).toHaveCount(6);
        }
      }
    }
  });
}

test('journal search, category filtering, empty results and load-more work', async ({ page }) => {
  await page.goto('/blog?lang=en');
  const search = page.getByRole('textbox', { name: 'Search articles' });
  await search.fill(seed.blog_posts[0].title_en);
  await expect(page.locator('.page-blog-grid .blog-card')).toHaveCount(1);
  await expect(page.locator('.page-featured-article')).toHaveCount(0);
  await search.fill('no-such-article-943812');
  await expect(page.getByRole('heading', { name: 'No stories found.' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search' }).click();
  const category = seed.blog_categories[0];
  await page.getByRole('button', { name: category.title_en, exact: true }).click();
  await expect(page.locator('.page-blog-grid .blog-card')).toHaveCount(seed.blog_posts.filter(item => item.category_id === category.id).length);

  await page.evaluate((data) => {
    const extra = Array.from({ length: 5 }, (_, i) => ({ ...data.blog_posts[0], id: `test-extra-post-${i}`, slug: `test-extra-post-${i}`, title_en: `Additional automotive story ${i}`, sort_order: 100 + i, featured: false }));
    localStorage.setItem('apex-cms-v1', JSON.stringify({ ...data, blog_posts: [...data.blog_posts, ...extra] }));
  }, seed);
  await page.reload();
  await expect(page.locator('.page-blog-grid .blog-card')).toHaveCount(6);
  await page.getByRole('button', { name: 'Load more stories' }).click();
  await expect(page.locator('.page-blog-grid .blog-card')).toHaveCount(10);
  await expect(page.getByRole('button', { name: 'Load more stories' })).toHaveCount(0);
});

test('contact validates fields, preserves subject when switching language, and saves the message', async ({ page }) => {
  await page.goto('/contact?service=vehicle-sales&lang=en');
  await expect(page.locator('#contact-subject')).toHaveValue('vehicle-sales');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.locator('#contact-name')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#contact-email')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#contact-message')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#contact-name').fill('Public QA Driver');
  await page.locator('#contact-email').fill('not-an-email');
  await page.locator('#contact-message').fill('I would like to discuss an inspection appointment for my vehicle.');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.locator('#contact-email-error')).toHaveText('Please enter a valid email address.');
  await page.locator('.language-button').click();
  await expect(page.locator('#contact-email-error')).toHaveText('يرجى إدخال بريد إلكتروني صحيح.');
  await page.locator('.language-button').click();
  await page.locator('#contact-email').fill('public-qa@example.com');
  await page.locator('.language-button').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('#contact-subject')).toHaveValue('vehicle-sales');
  await page.locator('.page-contact-submit').click();
  await expect(page.locator('.page-contact-success')).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('apex-cms-v1') || '{}').contact_messages);
  expect(saved.find((message: { email: string }) => message.email === 'public-qa@example.com')).toMatchObject({ name: 'Public QA Driver', subject: seed.services[0].title_ar, is_read: false });
  await page.getByRole('button', { name: 'إرسال رسالة أخرى' }).click();
  await expect(page.locator('#contact-name')).toHaveValue('');
});

test('newsletter accepts optional name, persists, and prevents duplicate addresses', async ({ page }) => {
  await page.goto('/newsletter?lang=en');
  const form = page.locator('.page-newsletter-signup form');
  await form.getByLabel('Name (optional)').fill('Newsletter Driver');
  await form.getByRole('textbox', { name: 'Your email address' }).fill('driver-newsletter@example.com');
  await form.getByRole('button', { name: 'Subscribe', exact: true }).click();
  await expect(form.locator('.form-feedback')).toContainText('Welcome to Apex');
  await form.getByRole('button', { name: 'Subscribe', exact: true }).click();
  await expect(form.locator('.form-feedback')).toContainText('already subscribed');
  const subscribers = await page.evaluate(() => JSON.parse(localStorage.getItem('apex-cms-v1') || '{}').newsletter_subscribers);
  const saved = subscribers.filter((item: { email: string }) => item.email === 'driver-newsletter@example.com');
  expect(saved).toHaveLength(1);
  expect(saved[0].name).toBe('Newsletter Driver');
});

test('gallery lightbox supports next, previous, keyboard, close, and focus restoration', async ({ page }) => {
  await page.goto(`/gallery/${seed.albums[0].slug}?lang=en`);
  const first = page.locator('.page-photo-grid button').first();
  await first.click();
  const dialog = page.getByRole('dialog', { name: 'Image viewer' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('figcaption')).toContainText('1 / 6');
  await expect(dialog.getByRole('button', { name: 'Close image viewer' })).toBeFocused();
  await dialog.getByRole('button', { name: 'Next image' }).click();
  await expect(dialog.locator('figcaption')).toContainText('2 / 6');
  await page.keyboard.press('ArrowRight');
  await expect(dialog.locator('figcaption')).toContainText('3 / 6');
  await dialog.getByRole('button', { name: 'Previous image' }).click();
  await expect(dialog.locator('figcaption')).toContainText('2 / 6');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(first).toBeFocused();
  expect(await page.locator('body').evaluate(element => element.style.overflow)).not.toBe('hidden');
});

test('FAQ supports category filtering, search, and accessible accordion toggling', async ({ page }) => {
  await page.goto('/faq?lang=en');
  const item = seed.faqs[0];
  await page.locator('.page-faq-nav').getByRole('button', { name: item.category_en }).click();
  const question = page.getByRole('button', { name: item.title_en, exact: true });
  await expect(question).toHaveAttribute('aria-expanded', 'false');
  await question.click();
  await expect(question).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText(item.description_en, { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search questions' }).fill('no-matching-question-943812');
  await expect(page.getByRole('heading', { name: 'No answers found for that search.' })).toBeVisible();
});

test('unknown routes and unpublished records produce a useful 404', async ({ page }) => {
  await page.goto('/missing-route?lang=en');
  await expect(page.getByRole('heading', { name: 'Let’s get you back on track.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
  await page.evaluate((data) => {
    data.services[0].status = 'draft';
    localStorage.setItem('apex-cms-v1', JSON.stringify(data));
  }, seed);
  await page.goto(`/services/${seed.services[0].slug}?lang=en`);
  await expect(page.getByRole('heading', { name: 'Let’s get you back on track.' })).toBeVisible();
});

test('published CMS CTA, social image, service features, team bio and album date reach public pages', async ({ page }) => {
  await page.goto('/services?lang=en');
  const destination = '/contact?service=vehicle-sales&source=cms';
  const socialImage = seed.services[0].gallery[1];
  await page.evaluate(({ data, destination, socialImage }) => {
    const services = data.services.map((item, index) => index ? item : {
      ...item, cta_text_en: 'Plan my next drive', cta_text_ar: 'خطط لرحلتي القادمة', cta_link: destination, og_image: socialImage,
      features_en: ['A dedicated vehicle advisor', 'A documented handover'],
      features_ar: ['مستشار متخصص لسيارتك', 'تسليم موثق'],
    });
    const team_members = data.team_members.map((item, index) => index ? item : { ...item, bio_en: 'Our published advisor biography.', bio_ar: 'السيرة المنشورة لمستشارنا.' });
    const albums = data.albums.map((item, index) => index ? item : { ...item, date: '2025-03-17T12:00:00.000Z' });
    localStorage.setItem('apex-cms-v1', JSON.stringify({ ...data, services, team_members, albums }));
  }, { data: seed, destination, socialImage });
  for (const language of ['en', 'ar']) {
    await page.goto(`/services/${seed.services[0].slug}?lang=${language}`);
    const links = page.getByRole('link', { name: language === 'en' ? 'Plan my next drive' : 'خطط لرحلتي القادمة', exact: true });
    await expect(links).toHaveCount(2);
    await expect(links.first()).toHaveAttribute('href', destination);
    const image = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(image?.endsWith(socialImage)).toBe(true);
    await expect(page.locator('.page-service-features .feature-card h3')).toHaveText(language === 'en' ? ['A dedicated vehicle advisor', 'A documented handover'] : ['مستشار متخصص لسيارتك', 'تسليم موثق']);
    await page.goto(`/about?lang=${language}`);
    await expect(page.locator('.page-team').first()).toContainText(language === 'en' ? 'Our published advisor biography.' : 'السيرة المنشورة لمستشارنا.');
    await page.goto(`/gallery/${seed.albums[0].slug}?lang=${language}`);
    const expectedDate = new Date('2025-03-17T12:00:00.000Z').toLocaleDateString(language, { day: 'numeric', month: 'long', year: 'numeric' });
    await expect(page.locator('.page-album-meta')).toContainText(expectedDate);
  }
});
