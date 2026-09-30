import { test, expect } from '@playwright/test';
import seed from '../src/data/seed.json' with { type: 'json' };

for (const width of [320, 375, 768, 1024, 1440, 1920]) {
  for (const lang of ['en', 'ar']) {
    test(`public layouts fit ${width}px ${lang}`, async ({ page }) => {
      test.setTimeout(90000);
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['/', '/about', '/services', '/features', '/blog', '/gallery', '/contact', '/faq', '/newsletter', '/privacy', '/terms', `/services/${seed.services[0].slug}`, `/blog/${seed.blog_posts[0].slug}`, `/gallery/${seed.albums[0].slug}`]) {
        await page.goto(`${route}?lang=${lang}`);
        await expect(page.locator('main h1').first()).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator('html')).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
        const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
        expect(sizes.scroll, `${route} at ${width}px ${lang}`).toBeLessThanOrEqual(sizes.client + 1);
        const clippedCards = await page.locator('.service-title, .page-newsletter-signup').evaluateAll(elements => elements.filter(element => element.scrollWidth > element.clientWidth + 2).map(element => element.className));
        expect(clippedCards, `${route} clipped content at ${width}px ${lang}`).toEqual([]);
      }
    });
  }
}

test('newsletter band fits narrow screens when web fonts are unavailable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.abort());
  await page.goto('/blog?lang=en');
  await expect(page.locator('main h1')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(321);
});

test('home visual capture and usable mobile navigation', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.hero-content h1')).toBeVisible();
  await page.locator('img').evaluateAll(images => images.forEach(image => { (image as HTMLImageElement).loading = 'eager'; }));
  await expect.poll(() => page.locator('img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete))).toBeTruthy();
  await page.screenshot({ path: '.qa/home-desktop-viewport.png' });
  await page.screenshot({ path: '.qa/home-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lang=ar');
  await page.getByRole('button', { name: 'فتح وإغلاق القائمة' }).click();
  await expect(page.locator('#mobile-navigation')).toBeVisible();
  await page.locator('#mobile-navigation a[href="/services"]').click();
  await expect(page).toHaveURL(/\/services/);
  await expect(page.locator('#mobile-navigation')).toBeHidden();
  await page.goto('/?lang=ar');
  await page.screenshot({ path: '.qa/home-arabic-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});

for (const lang of ['en', 'ar']) {
  for (const width of [320, 375, 768, 1440]) {
    test(`admin tables and editor fit ${width}px ${lang}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/admin/login');
      await page.getByRole('button', { name: 'Open demo workspace' }).click();
      await expect(page.getByRole('heading', { name: 'Dashboard overview' })).toBeVisible();
      await page.goto(`/admin/album-images?lang=${lang}`);
      await expect(page.locator('.admin-table')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      await page.getByRole('button', { name: lang === 'ar' ? 'تعديل السجل' : 'Edit record', exact: true }).first().click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      const bounds = await dialog.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      if (width === 1440 && lang === 'en') {
        await page.goto('/admin');
        await expect(page.getByRole('heading', { name: 'Dashboard overview' })).toBeVisible();
        await page.screenshot({ path: '.qa/admin-desktop.png', fullPage: true });
      }
    });
  }
}
