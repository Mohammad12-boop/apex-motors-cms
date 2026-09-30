import { test, expect, type Page } from '@playwright/test';

const modules = ['pages', 'hero-slides', 'services', 'blog-posts', 'blog-categories', 'albums', 'album-images', 'faqs', 'testimonials', 'team-members', 'navigation-items', 'social-links'];
async function login(page: Page) {
  await page.goto('/admin/login');
  await page.getByRole('button', { name: 'Open demo workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard overview' })).toBeVisible();
}
for (const module of modules) {
  test(`${module}: real editor create, publish, edit, reload, archive and delete`, async ({ page }) => {
    await login(page);
    const title = `QA ${module}`;
    await page.goto(`/admin/${module}`);
    await page.getByRole('button', { name: 'Add new', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(module === 'faqs' ? 'Question · English' : 'Title · English').fill(title);
    await dialog.getByLabel(module === 'faqs' ? 'Question · Arabic' : 'Title · Arabic').fill('محتوى تحقق أبيكس');
    const descriptions = dialog.locator('textarea');
    if (await descriptions.count() >= 2) {
      await descriptions.nth(0).fill('Automotive care with a precise scope and a clear written estimate.');
      await descriptions.nth(1).fill('عناية بالسيارات بنطاق دقيق وتقدير مكتوب واضح.');
    }
    if (module === 'album-images') {
      await dialog.getByRole('tab', { name: 'Details', exact: true }).click();
      await dialog.getByLabel('Gallery album').selectOption({ index: 1 });
    }
    if (module === 'navigation-items' || module === 'social-links') {
      await dialog.getByRole('tab', { name: 'Details', exact: true }).click();
      await dialog.getByLabel(module === 'navigation-items' ? 'Destination URL' : 'Profile URL').fill(module === 'navigation-items' ? '/contact' : 'https://example.com/apex');
      if (module === 'navigation-items') await dialog.getByLabel('Menu location').selectOption('both');
    }
    await dialog.getByRole('tab', { name: 'Publishing', exact: true }).click();
    const slug = await dialog.getByLabel('URL slug').inputValue();
    await dialog.getByLabel('Publication status').selectOption('published');
    await dialog.getByRole('button', { name: 'Save changes' }).click();
    await expect(dialog).toHaveCount(0);
    await page.getByRole('textbox', { name: 'Search records' }).fill(title);
    let row = page.getByRole('row').filter({ hasText: title });
    await expect(row).toContainText('Published');

    const paths: Record<string, string> = { pages: `/pages/${slug}`, 'hero-slides': '/', services: `/services/${slug}`, 'blog-posts': `/blog/${slug}`, 'blog-categories': '/blog', albums: `/gallery/${slug}`, 'album-images': '/gallery/luxury-collection', faqs: '/faq', testimonials: '/', 'team-members': '/about', 'navigation-items': '/', 'social-links': '/' };
    await page.goto(paths[module]);
    if (module === 'social-links') await expect(page.locator(`footer a[aria-label="${title}"]`)).toHaveAttribute('href', 'https://example.com/apex');
    else if (module === 'album-images') await expect(page.getByRole('button', { name: `Open image: ${title}`, exact: true })).toBeVisible();
    else if (module === 'navigation-items') {
      await expect(page.locator('.desktop-nav').getByRole('link', { name: title, exact: true })).toHaveAttribute('href', '/contact');
      await expect(page.locator('footer').getByRole('link', { name: title, exact: true })).toBeVisible();
    } else if (['blog-categories', 'faqs'].includes(module)) await expect(page.getByRole('button', { name: title, exact: true })).toBeVisible();
    else await expect(page.locator('main').getByText(title, { exact: true }).first()).toBeVisible();

    await page.goto(`/admin/${module}`);
    await page.getByRole('textbox', { name: 'Search records' }).fill(title);
    row = page.getByRole('row').filter({ hasText: title });
    await row.getByRole('button', { name: 'Edit record', exact: true }).click();
    await dialog.getByLabel(module === 'faqs' ? 'Question · English' : 'Title · English').fill(`${title} updated`);
    await dialog.getByRole('button', { name: 'Save changes' }).click();
    await expect(dialog).toHaveCount(0);
    await page.reload();
    await page.getByRole('textbox', { name: 'Search records' }).fill(`${title} updated`);
    row = page.getByRole('row').filter({ hasText: `${title} updated` });
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Edit record', exact: true }).click();
    await expect(dialog.getByLabel(module === 'faqs' ? 'Question · Arabic' : 'Title · Arabic')).toHaveValue('محتوى تحقق أبيكس');
    await dialog.getByRole('tab', { name: 'Publishing', exact: true }).click();
    await expect(dialog.getByLabel('URL slug')).toHaveValue(slug);
    await dialog.getByLabel('Publication status').selectOption('archived');
    await dialog.getByRole('button', { name: 'Save changes' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(row).toContainText('Archived');
    await page.getByLabel('Filter by status').selectOption('published');
    await expect(page.getByRole('heading', { name: 'No matching results' })).toBeVisible();
    await page.getByLabel('Filter by status').selectOption('archived');
    await row.getByRole('button', { name: 'Delete record', exact: true }).click();
    await dialog.getByRole('button', { name: 'Delete record', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'No matching results' })).toBeVisible();
  });
}

test('editable SEO, favicon and publishing state are respected', async ({ page }) => {
  await login(page);
  await page.goto('/admin/pages');
  await page.getByRole('textbox', { name: 'Search records' }).fill('home');
  const row = page.getByRole('row').filter({ has: page.locator('small', { hasText: /^home$/ }) });
  await row.getByRole('button', { name: 'Edit record', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('tab', { name: 'SEO', exact: true }).click();
  await dialog.getByLabel('SEO title · English').fill('Expert care | Apex Motors');
  await dialog.getByLabel('Meta description · English').fill('A precise automotive description edited and saved through the CMS.');
  await dialog.getByLabel('Social sharing image URL').fill('/image-fallback.svg');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(dialog).toHaveCount(0);
  await page.goto('/');
  await expect(page).toHaveTitle('Expert care | Apex Motors');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'http://127.0.0.1:4173/image-fallback.svg');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', 'A precise automotive description edited and saved through the CMS.');
  await page.goto('/admin/pages');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  await page.getByRole('textbox', { name: 'Search records' }).fill('home');
  await row.getByRole('button', { name: 'Publish / unpublish', exact: true }).click();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Let’s get you back on track.' })).toBeVisible();
});
