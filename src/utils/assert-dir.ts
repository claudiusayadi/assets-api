import { existsSync, mkdirSync } from 'fs';

/**
 * Asserts that a directory exists and creates it if it doesn't.
 * @param {string} folder - Path to the directory to check/create.
 * @returns {string} A string path to the directory.
 */
export function assertDir(folder: string): string {
	if (!existsSync(folder)) {
		mkdirSync(folder, { recursive: true });
	}
	return folder;
}
