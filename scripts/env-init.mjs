import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const useLocal = process.argv[2] === 'local';
const targetName = useLocal ? '.env.local' : '.env';
const envPath = path.join(root, targetName);
const examplePath = path.join(root, '.env.example');

if (fs.existsSync(envPath)) {
	console.log(`${targetName} already exists; not overwriting.`);
	process.exit(0);
}

if (!fs.existsSync(examplePath)) {
	console.error('Missing .env.example');
	process.exit(1);
}

fs.copyFileSync(examplePath, envPath);
console.log(
	`Created ${targetName} from .env.example — add your values.${useLocal ? ' (Overrides .env; use for local backtesting.)' : ''}`
);
