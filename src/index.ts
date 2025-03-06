import { Hono } from 'hono';
import { existsSync, mkdirSync, statSync, readdirSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { cors } from 'hono/cors';

const app = new Hono();
app.use(
	cors({
		origin: '*',
		credentials: true,
		allowHeaders: ['Content-Type'],
		allowMethods: ['GET', 'POST', 'DELETE'],
	})
);

const url = 'https://assets.dovely.tech';
const assetsDir = '/app/assets';

if (!existsSync(assetsDir)) mkdirSync(assetsDir, { recursive: true });

app.post('/upload', async c => {
	const body = await c.req.parseBody();
	const files = body['files'];

	if (!files) return c.json({ error: 'No files uploaded' }, 400);

	const fileArray = Array.isArray(files) ? files : [files];
	if (fileArray.length === 0 || !fileArray.every(file => file instanceof File))
		return c.json({ error: 'Invalid file input' }, 400);

	const folderName = c.req.query('folder') || 'default';
	const folderPath = join(assetsDir, folderName);

	if (!existsSync(folderPath)) mkdirSync(folderPath, { recursive: true });

	const fileUrls = await Promise.all(
		fileArray.map(async file => {
			const fileName = file.name;
			const isSvg = fileName.toLowerCase().endsWith('.svg');
			const outputFileName = isSvg
				? fileName
				: fileName.replace(/\.[^/.]+$/, '.webp');
			const filePath = join(folderPath, outputFileName);
			const buffer = await file.arrayBuffer();

			if (isSvg) {
				await Bun.write(filePath, buffer);
			} else {
				await sharp(buffer)
					.resize({ width: 1920, withoutEnlargement: true })
					.webp({ quality: 80 })
					.toFile(filePath);
			}

			return `${url}/${folderName}/${outputFileName}`;
		})
	);

	return c.json({ urls: fileUrls }, 201);
});

app.get('/*', async c => {
	const path = c.req.path.slice(1);
	const json = c.req.query('json') === 'true';

	// Root path
	if (!path)
		return c.json(
			{
				message:
					'Assets API: Use POST /upload to upload files or ?folder= to list files',
			},
			200
		);

	// GET => /example/file.webp{or svg}(?json=true) - serve file/return file url
	const filePath = join(assetsDir, path);
	if (existsSync(filePath)) {
		const stats = statSync(filePath);
		if (stats.isDirectory()) {
			// Treat as folder and list files
			const files = readdirSync(filePath).filter(file =>
				statSync(join(filePath, file)).isFile()
			);
			const fileUrls = files.map(file => `${url}/${path}/${file}`);
			return c.json({ files: fileUrls }, 200);
		} else if (stats.isFile()) {
			if (json) {
				return c.json({ url: `${url}/${path}` }, 200);
			}
			const file = Bun.file(filePath);
			return new Response(file);
		}
	}
	return c.json({ error: 'File not found' }, 404);
});

export default {
	fetch: app.fetch,
	port: 3000,
};
