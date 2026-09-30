import { readFileSync, writeFileSync } from 'node:fs';
const data = JSON.parse(readFileSync(new URL('../src/data/seed.json', import.meta.url), 'utf8'));
const common = ['id','title_en','title_ar','description_en','description_ar','slug','status','active','sort_order','image','content_en','content_ar','created_at','updated_at'];
const literal = value => value == null ? 'null' : typeof value === 'boolean' || typeof value === 'number' ? String(value) : `'${String(value).replaceAll("'", "''")}'`;
let sql = '-- Generated from src/data/seed.json. All business details and testimonials are illustrative.\n-- Safe to re-run: existing records are retained. Review demo content before production.\nbegin;\n';
const ordered = ['site_settings','pages','hero_slides','services','features','blog_categories','blog_posts','albums','album_images','faqs','testimonials','team_members','navigation_items','social_links','media'];
for (const table of ordered) {
  const columns = [...common, ...(table === 'album_images' ? ['album_id'] : []), ...(table === 'blog_posts' ? ['category_id'] : [])];
  for (const row of data[table]) {
    const extras = Object.fromEntries(Object.entries(row).filter(([key]) => !columns.includes(key)));
    sql += `insert into public.${table} (${[...columns, 'data'].join(', ')}) values (${[...columns.map(key => literal(row[key])), `${literal(JSON.stringify(extras))}::jsonb`].join(', ')}) on conflict (id) do nothing;\n`;
  }
}
sql += 'commit;\n';
writeFileSync(new URL('./seed.sql', import.meta.url), sql);
console.log('Generated supabase/seed.sql.');
