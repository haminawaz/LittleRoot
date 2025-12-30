import { writeFileSync } from 'fs';
import { resolve } from 'path';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

const DOMAIN = 'https://littlerootstudios.com';

const publicRoutes: SitemapUrl[] = [
  {
    loc: '/',
    changefreq: 'daily',
    priority: 1.0,
  },
  {
    loc: '/home',
    changefreq: 'daily',
    priority: 1.0,
  },
  {
    loc: '/signup',
    changefreq: 'monthly',
    priority: 0.8,
  },
  {
    loc: '/signin',
    changefreq: 'monthly',
    priority: 0.8,
  },
  {
    loc: '/privacypolicy',
    changefreq: 'yearly',
    priority: 0.5,
  },
  {
    loc: '/termsofservice',
    changefreq: 'yearly',
    priority: 0.5,
  },
  {
    loc: '/faq',
    changefreq: 'monthly',
    priority: 0.7,
  },
  {
    loc: '/support',
    changefreq: 'monthly',
    priority: 0.7,
  },
];

function generateSitemap(urls: SitemapUrl[]): string {
  const lastmod = new Date().toISOString().split('T')[0];
  
  const urlEntries = urls
    .map((url) => {
      return `  <url>
    <loc>${DOMAIN}${url.loc}</loc>
    <lastmod>${url.lastmod || lastmod}</lastmod>
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority !== undefined ? `<priority>${url.priority}</priority>` : ''}
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

function main() {
  const sitemap = generateSitemap(publicRoutes);
  const outputPath = resolve(process.cwd(), 'client', 'public', 'sitemap.xml');
  
  writeFileSync(outputPath, sitemap, 'utf-8');
  console.log('✅ Sitemap generated successfully at:', outputPath);
  console.log(`📄 Total URLs: ${publicRoutes.length}`);
}

main();
