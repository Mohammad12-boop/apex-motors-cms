import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4174', '--strictPort', '--configLoader', 'native'], { windowsHide: true, stdio: 'pipe' });
let browser;
try {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (server.exitCode !== null) throw new Error('Production preview exited unexpectedly.');
    try { const response = await fetch('http://127.0.0.1:4174'); if (response.ok) break; } catch { /* Wait for local startup. */ }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless: true });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4174/admin/services');
  await page.waitForURL('**/admin/login');
  assert.equal(await page.getByRole('button', { name: 'Open demo workspace' }).count(), 0, 'Production must never expose a local demo login by default.');
  await page.getByRole('textbox', { name: 'Email address' }).fill('invalid');
  await page.getByRole('button', { name: 'Sign in securely' }).click();
  assert.equal(await page.getByRole('textbox', { name: 'Email address' }).evaluate(input => input.validity.valid), false);
  await page.getByRole('textbox', { name: 'Email address' }).fill('qa@example.test');
  await page.getByLabel('Password').fill('not-a-real-account');
  await page.getByRole('button', { name: 'Sign in securely' }).click();
  await page.getByRole('alert').filter({ hasText: 'Supabase is not connected.' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Sign in securely' }).isEnabled(), true);
  await page.goto('http://127.0.0.1:4174/newsletter');
  const form = page.locator('.page-newsletter-signup form');
  await form.getByRole('textbox', { name: 'Your email address' }).fill('production-check@example.test');
  await form.getByRole('button', { name: 'Subscribe', exact: true }).click();
  await form.locator('.form-feedback').filter({ hasText: 'We couldn’t save your subscription.' }).waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('apex-cms-v1')), null, 'Unconfigured production must not claim to save private submissions.');
  console.log('Production safeguards PASS: admin protection, demo disabled, email validation, login failure, submission failure.');
} finally {
  await browser?.close();
  server.kill();
}
