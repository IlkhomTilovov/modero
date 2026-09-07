import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './env';
import { authRouter } from './routes/auth.routes';
import { usersRouter } from './routes/users.routes';
import { branchesRouter } from './routes/branches.routes';
import { heroSlidesRouter } from './routes/heroSlides.routes';
import { promoTilesRouter } from './routes/promoTiles.routes';
import { setsRouter } from './routes/sets.routes';
import { checkoutFieldsRouter, checkoutFieldOptionsRouter } from './routes/checkoutFields.routes';
import { sectionsRouter } from './routes/sections.routes';
import { categoriesRouter } from './routes/categories.routes';
import { themesRouter } from './routes/themes.routes';
import { siteContentRouter } from './routes/siteContent.routes';
import { systemSettingsRouter } from './routes/systemSettings.routes';
import { contactMessagesRouter } from './routes/contactMessages.routes';
import { customersRouter } from './routes/customers.routes';
import { productsRouter } from './routes/products.routes';
import { settingsRouter } from './routes/settings.routes';
import { ordersRouter } from './routes/orders.routes';
import { amocrmRouter } from './routes/amocrm.routes';
import { telegramRouter } from './routes/telegram.routes';
import { uploadsRouter } from './routes/uploads.routes';
import { sitemapRouter } from './routes/sitemap.routes';
import { prerenderRouter } from './routes/prerender.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), { maxAge: '1y', immutable: true }));
app.use(sitemapRouter);
app.use(prerenderRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/admin/users', usersRouter);
app.use('/api/branches', branchesRouter);
app.use('/api/hero-slides', heroSlidesRouter);
app.use('/api/promo-tiles', promoTilesRouter);
app.use('/api/sets', setsRouter);
app.use('/api/checkout-fields', checkoutFieldsRouter);
app.use('/api/checkout-field-options', checkoutFieldOptionsRouter);
app.use('/api/sections', sectionsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/themes', themesRouter);
app.use('/api/site-content', siteContentRouter);
app.use('/api/system-settings', systemSettingsRouter);
app.use('/api/contact-messages', contactMessagesRouter);
app.use('/api/customers', customersRouter);
app.use('/api/products', productsRouter);
app.use('/api/admin/settings', settingsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin/amocrm', amocrmRouter);
app.use('/api/admin/telegram', telegramRouter);
app.use('/api/uploads', uploadsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Modero API http://localhost:${env.PORT}`);
});
