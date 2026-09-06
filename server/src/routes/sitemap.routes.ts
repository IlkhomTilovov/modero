import { Router } from 'express';
import { prisma } from '../db';
import { asyncHandler } from '../middleware/errorHandler';

export const sitemapRouter = Router();

sitemapRouter.get(
  '/sitemap.xml',
  asyncHandler(async (_req, res) => {
    const settings = await prisma.systemSettings.findFirst();
    const siteUrl = (settings?.primaryDomain || 'https://moredo.uz').replace(/\/+$/, '');

    const [categories, products] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true, isIndexed: true },
        select: { slug: true, updatedAt: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.product.findMany({
        where: { isActive: true, isIndexed: true },
        select: { id: true, slug: true, updatedAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const now = new Date().toISOString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/catalog</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${siteUrl}/about</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${siteUrl}/contact</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${siteUrl}/faq</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`;

    for (const cat of categories) {
      xml += `
  <url>
    <loc>${siteUrl}/catalog?category=${cat.slug}</loc>
    <lastmod>${cat.updatedAt?.toISOString() || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    for (const prod of products) {
      const prodUrl = prod.slug || prod.id;
      xml += `
  <url>
    <loc>${siteUrl}/product/${prodUrl}</loc>
    <lastmod>${prod.updatedAt?.toISOString() || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    xml += `
</urlset>`;

    res.type('application/xml').send(xml);
  })
);
