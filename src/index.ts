import { Hono } from 'hono';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const app = new Hono();
const url = 'https://assets.dovely.tech';

const assetsDir = '/app/assets';
if (!existsSync(assetsDir)) {
	mkdirSync(assetsDir, { recursive: true });
}

// POST => /upload?folder=example
app.post('/upload', async c => {
	const body = await c.req.parseBody();
	const file = body['file'];
	if (!file || !(file instanceof File)) {
		return c.json({ error: 'No file uploaded' }, 400);
	}

	const folderName = c.req.query('folder') || 'default';
	const fileName = file.name;
	const folderPath = join(assetsDir, folderName);

	if (!existsSync(folderPath)) {
		mkdirSync(folderPath, { recursive: true });
	}

	const filePath = join(folderPath, fileName.replace(/\.[^/.]+$/, '.webp'));
	const buffer = await file.arrayBuffer();

	await sharp(buffer)
		.resize({ width: 1920, withoutEnlargement: true })
		.webp({ quality: 80 })
		.toFile(filePath);

	const fileUrl = `${url}/${folderName}/${fileName.replace(
		/\.[^/.]+$/,
		'.webp'
	)}`;
	return c.json({ url: fileUrl }, 201);
});

// Serve static files from /assets
app.get('/*', async c => {
	const path = c.req.path.slice(1); // Remove leading "/"
	const filePath = join(assetsDir, path);

	if (existsSync(filePath)) {
		const file = Bun.file(filePath);
		return new Response(file);
	}
	return c.json({ error: 'File not found' }, 404);
});

export default {
	fetch: app.fetch,
	port: 3000,
};
