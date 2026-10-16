import { readFileSync } from 'node:fs';

export function loadDemo() {
  return JSON.parse(readFileSync(new URL('../examples/cancion-demo.json', import.meta.url), 'utf8'));
}

export const clone = (value) => JSON.parse(JSON.stringify(value));
