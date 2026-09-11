import { Router } from 'express';
import { prisma } from '../db';
import { asyncHandler } from '../middleware/errorHandler';
import { faqs } from '@shared/faqData';
import { getPageSeo } from '@shared/pageSeo';

export const prerenderRouter = Router();

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function page(opts: {
  siteUrl: string;
  path: string;
  title: string;
  description: string;
  image?: string | null;
  noindex?: boolean;
  nofollow?: boolean;
  jsonLd?: unknown[];
  bodyHtml: string;
}): string {
  const canonical = opts.siteUrl + opts.path;
  const robots = [opts.noindex ? 'noindex' : 'index', opts.nofollow ? 'nofollow' : 'follow'].join(', ');
  const jsonLdScripts = (opts.jsonLd || [])
    .map((obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`)
    .join('\n');

  return `<!doctype html>
<html lang="uz">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.description)}" />
<meta name="robots" content="${robots}" />
<link rel="canonical" href="${esc(canonical)}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${esc(opts.title)}" />
<meta property="og:description" content="${esc(opts.description)}" />
<meta property="og:url" content="${esc(canonical)}" />
${opts.image ? `<meta property="og:image" content="${esc(opts.image)}" />` : ''}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(opts.title)}" />
<meta name="twitter:description" content="${esc(opts.description)}" />
${opts.image ? `<meta name="twitter:image" content="${esc(opts.image)}" />` : ''}
${jsonLdScripts}
</head>
<body>
${opts.bodyHtml}
</body>
</html>`;
}

prerenderRouter.get(
  '/prerender/*',
  asyncHandler(async (req, res) => {
    const subPath = '/' + (req.params[0] || '');
    const settings = await prisma.systemSettings.findFirst();
    const siteUrl = (settings?.primaryDomain || 'https://moredo.uz').replace(/\/+$/, '');
    const siteName = settings?.siteName || 'Moredo';
    const defaultDesc = settings?.seoDescription || settings?.shortDescriptionUz || '';

    res.type('html');

    // Product page: /product/:idOrSlug
    const productMatch = subPath.match(/^\/product\/([^/]+)\/?$/);
    if (productMatch) {
      const idOrSlug = decodeURIComponent(productMatch[1]);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      const product = isUuid
        ? await prisma.product.findUnique({ where: { id: idOrSlug } })
        : await prisma.product.findUnique({ where: { slug: idOrSlug } });

      if (!product || !product.isActive) {
        res.status(404).send(
          page({
            siteUrl,
            path: subPath,
            title: `Mahsulot topilmadi — ${siteName}`,
            description: defaultDesc,
            noindex: true,
            bodyHtml: `<h1>Mahsulot topilmadi</h1>`,
          })
        );
        return;
      }

      const name = product.nameUz || product.nameRu || '';
      const description = product.descriptionUz || product.fullDescriptionUz || defaultDesc;
      const title = product.metaTitleUz || product.targetKeyword || product.keywordUz || name;
      const metaDescription = product.metaDescriptionUz || description;
      const imageUrls = (product.images || []).filter((img) => {
        try {
          const parsed = JSON.parse(img);
          return parsed.type === 'image';
        } catch {
          return !img.includes('youtube.com') && !img.includes('instagram.com');
        }
      });

      const jsonLd = [
        {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: title || name,
          description,
          image: imageUrls.length > 0 ? imageUrls : undefined,
          sku: product.id,
          url: `${siteUrl}${subPath}`,
          brand: { '@type': 'Brand', name: siteName },
          offers: {
            '@type': 'Offer',
            price: product.price || 0,
            priceCurrency: 'UZS',
            availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: `${siteUrl}${subPath}`,
          },
        },
      ];

      const bodyHtml = `
<h1>${esc(name)}</h1>
${product.price ? `<p>Narxi: ${esc(product.price)} so'm</p>` : ''}
<div>${esc(description)}</div>
${imageUrls.map((src) => `<img src="${esc(src)}" alt="${esc(name)}" />`).join('\n')}
`;

      res.send(
        page({
          siteUrl,
          path: subPath,
          title: title || name,
          description: metaDescription,
          image: imageUrls[0],
          noindex: !product.isIndexed,
          nofollow: !product.isFollowed,
          jsonLd,
          bodyHtml,
        })
      );
      return;
    }

    // Catalog page: /catalog (optionally ?category=slug)
    if (subPath === '/catalog') {
      const categorySlug = typeof req.query.category === 'string' ? req.query.category : undefined;
      const category = categorySlug
        ? await prisma.category.findUnique({ where: { slug: categorySlug } })
        : null;

      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          isIndexed: true,
          ...(category ? { categoryId: category.id } : {}),
        },
        select: { id: true, slug: true, nameUz: true, price: true, images: true },
        orderBy: { sortOrder: 'asc' },
        take: 60,
      });

      const title = category
        ? category.metaTitleUz || `${category.nameUz} — ${siteName}`
        : `Katalog — ${siteName}`;
      const description = category ? category.metaDescriptionUz || defaultDesc : defaultDesc;

      const jsonLd = [
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: products.map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${siteUrl}/product/${p.slug || p.id}`,
            name: p.nameUz,
          })),
        },
      ];

      const bodyHtml = `
<h1>${esc(category ? category.nameUz : 'Katalog')}</h1>
<ul>
${products
  .map(
    (p) =>
      `<li><a href="${siteUrl}/product/${esc(p.slug || p.id)}">${esc(p.nameUz)}</a>${
        p.price ? ` — ${esc(p.price)} so'm` : ''
      }</li>`
  )
  .join('\n')}
</ul>
`;

      res.send(
        page({
          siteUrl,
          path: subPath + (categorySlug ? `?category=${categorySlug}` : ''),
          title,
          description,
          jsonLd,
          bodyHtml,
        })
      );
      return;
    }

    // Home page
    if (subPath === '/' || subPath === '') {
      const title = settings?.seoTitle || siteName;
      const jsonLd = [
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: siteName,
          url: siteUrl,
          description: defaultDesc,
          address: {
            '@type': 'PostalAddress',
            streetAddress: settings?.addressUz || "Bunyodkor ko'chasi, 15-uy, Chilonzor tumani",
            addressLocality: 'Toshkent',
            addressCountry: 'UZ',
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: siteName,
          url: siteUrl,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${siteUrl}/catalog?search={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        },
      ];

      res.send(
        page({
          siteUrl,
          path: '/',
          title,
          description: defaultDesc,
          jsonLd,
          bodyHtml: `<h1>${esc(siteName)}</h1><p>${esc(defaultDesc)}</p>`,
        })
      );
      return;
    }

    // FAQ page — same Q&A the client renders, exposed as FAQPage JSON-LD for
    // crawlers (e.g. GPTBot, ChatGPT-User) that don't execute JavaScript.
    if (subPath === '/faq') {
      const seo = getPageSeo('faq', 'uz');
      const jsonLd = [
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.question_uz,
            acceptedAnswer: { '@type': 'Answer', text: f.answer_uz },
          })),
        },
      ];
      const bodyHtml = `
<h1>${esc(seo.title)}</h1>
${faqs.map((f) => `<h2>${esc(f.question_uz)}</h2>\n<p>${esc(f.answer_uz)}</p>`).join('\n')}
`;
      res.send(page({ siteUrl, path: subPath, title: seo.title, description: seo.description, jsonLd, bodyHtml }));
      return;
    }

    // About page
    if (subPath === '/about') {
      const seo = getPageSeo('about', 'uz');
      res.send(
        page({
          siteUrl,
          path: subPath,
          title: seo.title,
          description: seo.description,
          bodyHtml: `<h1>${esc(seo.title)}</h1><p>${esc(seo.description)}</p>`,
        })
      );
      return;
    }

    // Contact page — list the real branches so crawlers see the actual
    // address(es) instead of a blank shell.
    if (subPath === '/contact') {
      const seo = getPageSeo('contact', 'uz');
      const branches = await prisma.branch.findMany({
        where: { isActive: true },
        orderBy: { orderIndex: 'asc' },
      });
      const jsonLd = branches.length
        ? [
            {
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: siteName,
              url: siteUrl,
              address: {
                '@type': 'PostalAddress',
                streetAddress: branches[0].addressUz,
                addressLocality: 'Toshkent',
                addressCountry: 'UZ',
              },
            },
          ]
        : undefined;
      const bodyHtml = `
<h1>${esc(seo.title)}</h1>
<ul>
${branches.map((b) => `<li>${esc(b.nameUz)}: ${esc(b.addressUz)}${b.phone ? ' — ' + esc(b.phone) : ''}</li>`).join('\n')}
</ul>
`;
      res.send(page({ siteUrl, path: subPath, title: seo.title, description: seo.description, jsonLd, bodyHtml }));
      return;
    }

    // Fallback: generic page for any other static route
    res.send(
      page({
        siteUrl,
        path: subPath,
        title: settings?.seoTitle || siteName,
        description: defaultDesc,
        bodyHtml: `<h1>${esc(siteName)}</h1>`,
      })
    );
  })
);
