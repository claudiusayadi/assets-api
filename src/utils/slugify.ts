/**
 * Converts a title string into a URL-friendly slug.
 * @param {string} title - The original string to be converted to a slug
 * @returns {string} A URL-friendly slug string with timestamp appended
 */
export function slugify(title: string): string {
	return `${title
		.toLowerCase()
		.trim()
		.replace(/ /g, '-')
		.replace(/[^\w-]+/g, '')}-${Date.now()}`;
}
