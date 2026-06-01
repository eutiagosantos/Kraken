#!/usr/bin/env node
/**
 * Gera N JPEG mínimos para teste de capacidade (ex.: estrutura 1-250-1).
 * Uso: node scripts/generate-test-creatives.mjs [count] [outDir]
 * Default: 250 ficheiros em ./test-creatives-250
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const count = Math.max(1, Number.parseInt(process.argv[2] ?? "250", 10) || 250);
const outDir = process.argv[3] ?? join(process.cwd(), "test-creatives-250");

/** 1×1 JPEG válido (~600 B) — mesmo payload, nomes distintos. */
const MINIMAL_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
  "base64"
);

await mkdir(outDir, { recursive: true });
for (let i = 0; i < count; i++) {
  const name = `creative_${String(i + 1).padStart(3, "0")}.jpg`;
  await writeFile(join(outDir, name), MINIMAL_JPEG);
}
console.log(`Created ${count} JPEG files in ${outDir}`);
