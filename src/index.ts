import { cors } from 'hono/cors';
import { existsSync, mkdirSync, statSync, readdirSync } from 'fs';
import { Hono } from 'hono';
import { join } from 'path';
import sharp from 'sharp';
import { assertDir, slugify } from './utils';

const app = new Hono();
const url = 'https://assets.dovely.tech';
const assetsDir = '/app/assets';

if (!existsSync(assetsDir)) mkdirSync(assetsDir, { recursive: true });

app.use(
	cors({
		origin: '*',
		credentials: true,
		allowHeaders: ['Content-Type'],
		allowMethods: ['GET', 'POST', 'DELETE'],
	})
);

async function processFile(file: File, folder: string) {
	const filename = file.name.replace(/\.[^/.]+$/, '');
	const isSvg = filename.toLowerCase().endsWith('.svg');
	const slugified = slugify(filename);
	const output = isSvg ? `${slugified}.svg` : `${slugified}.webp`;
	const filepath = join(folder, output);
	const buffer = await file.arrayBuffer();

	if (isSvg) await Bun.write(filepath, buffer);
	else
		await sharp(buffer)
			.resize({ width: 1920, withoutEnlargement: true })
			.webp({ quality: 80 })
			.toFile(filepath);

	return output;
}

app.post('/upload', async c => {
	const body = await c.req.parseBody();
	const files = body['files'];

	if (!files) return c.json({ error: 'No files uploaded' }, 400);

	const fileArray = Array.isArray(files) ? files : [files];
	if (fileArray.length === 0 || !fileArray.every(file => file instanceof File))
		return c.json({ error: 'Invalid file input' }, 400);

	const folderName = c.req.query('folder') || 'default';
	const folder = assertDir(join(assetsDir, folderName));

	const fileUrls = await Promise.all(
		fileArray.map(async file => {
			const output = await processFile(file, folder);
			return `${url}/${folderName}/${output}`;
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

	// GET => list/serve files
	const filepath = join(assetsDir, path);
	if (!existsSync(filepath)) return c.json({ error: 'File not found' }, 404);

	const stats = statSync(filepath);
	if (stats.isDirectory()) {
		// List directory files
		const files = readdirSync(filepath).filter(file =>
			statSync(join(filepath, file)).isFile()
		);
		const fileUrls = files.map(file => `${url}/${path}/${file}`);
		return c.json({ files: fileUrls }, 200);
	}

	if (stats.isFile()) {
		// List/serve file
		if (json) return c.json({ url: `${url}/${path}` }, 200);
		return new Response(Bun.file(filepath));
	}

	return c.json({ error: 'Resource not found' }, 404);
});

export default {
	fetch: app.fetch,
	port: 3000,
};
