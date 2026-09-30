import { test, expect } from '@playwright/test';
import seed from '../src/data/seed.json' with { type: 'json' };

test('public navigation only targets existing routes or working in-page anchors', async ({ page }) => {
  const fixed = ['/', '/about', '/services', '/features', '/blog', '/gallery', '/contact', '/faq', '/newsletter', '/privacy', '/terms', '/admin', '/admin/login'];
  const paths = [...fixed, ...seed.services.map(item => `/services/${item.slug}`), ...seed.blog_posts.map(item => `/blog/${item.slug}`), ...seed.albums.map(item => `/gallery/${item.slug}`)];
  const valid = new Set(paths);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const path of paths.filter(path => !path.startsWith('/admin'))) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main h1')).toHaveCount(1);
    const links = await page.locator('a[href]').evaluateAll(anchors => anchors.map(anchor => anchor.getAttribute('href')!));
    for (const href of links) {
      expect(href, `${path}: placeholder link`).not.toBe('#');
      if (href.startsWith('#')) await expect(page.locator(href)).toHaveCount(1);
      else if (href.startsWith('/')) expect(valid.has(new URL(href, 'http://127.0.0.1:4173').pathname), `${path}: ${href}`).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});

test('public forms expose honest persistence failure and invalid email states', async ({ page }) => {
  await page.goto('/newsletter');
  const form = page.locator('.page-newsletter-signup form');
  const email = form.getByRole('textbox', { name: 'Your email address' });
  await email.fill('not-an-email');
  await form.getByRole('button', { name: 'Subscribe', exact: true }).click();
  expect(await email.evaluate((element: HTMLInputElement) => element.validity.valid)).toBe(false);
  await email.fill('storage-failure@example.test');
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Simulated storage full', 'QuotaExceededError'); }; });
  await form.getByRole('button', { name: 'Subscribe', exact: true }).click();
  await expect(form.locator('.form-feedback')).toContainText('We couldn’t save your subscription.');
  await expect(form.getByRole('button', { name: 'Subscribe', exact: true })).toBeEnabled();
  await page.goto('/contact');
  await page.locator('#contact-name').fill('Storage Test');
  await page.locator('#contact-email').fill('storage-failure@example.test');
  await page.locator('#contact-subject').selectOption('general');
  await page.locator('#contact-message').fill('Please contact me about a pre-purchase inspection.');
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Simulated storage full', 'QuotaExceededError'); }; });
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.locator('main').getByRole('alert')).toHaveText('We couldn’t send your message. Please try again, or contact us by email.');
  await expect(page.getByRole('button', { name: 'Send message', exact: true })).toBeEnabled();
});
