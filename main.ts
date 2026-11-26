// Your Agent in One Emoji — entry program (program/v1, Node 22, stdlib only).
// Writes a single emoji to $MAKEFUN_OUTPUT_DIR/entry.txt
// (fallback /output/entry.txt), then reads it back and verifies the bytes.
// Gates enforced before writing: exactly one code point, and that code
// point is an emoji; no other text, no white space, no newline.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The owl: wide awake while its owner sleeps, hunting through the night
// for free credits, deals and bounties, and bringing the catch home.
const EMOJI = "🦉";

// Emoji code-point ranges (Unicode emoji blocks: no modifiers, no ZWJ,
// no variation selectors — one stand-alone pictograph).
const EMOJI_RANGES: Array<[number, number]> = [
  [0x1f000, 0x1faff], // emoticons, pictographs, transport, supplemental symbols
  [0x2600, 0x27bf], // miscellaneous symbols and dingbats
  [0x2b00, 0x2bff], // miscellaneous symbols and arrows
];

function isEmojiCodePoint(cp: number): boolean {
  return EMOJI_RANGES.some(([lo, hi]) => cp >= lo && cp <= hi);
}

const codePoints = [...EMOJI];
if (codePoints.length !== 1) {
  throw new Error(
    `Entry must be exactly one emoji, got ${codePoints.length} code point(s)`,
  );
}
const cp = EMOJI.codePointAt(0)!;
// A lone variation selector, ZWJ or combining mark would ride along as
// a second code point, but reject them explicitly so a sneaky multi-part
// glyph can never slip through the one-code-point check above.
if (cp === 0x200d || (cp >= 0xfe00 && cp <= 0xfe0f) || (cp >= 0x1f3fb && cp <= 0x1f3ff)) {
  throw new Error(
    `Entry U+${cp.toString(16).toUpperCase()} is a modifier, not a stand-alone emoji`,
  );
}
if (!isEmojiCodePoint(cp)) {
  throw new Error(
    `Entry U+${cp.toString(16).toUpperCase()} is not in an emoji range`,
  );
}
if (/\s/.test(EMOJI)) {
  throw new Error("Entry must not contain white space or a newline");
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "entry.txt");
writeFileSync(outPath, EMOJI, "utf8");

const back = readFileSync(outPath, "utf8");
if (back !== EMOJI) {
  throw new Error("Verification failed: entry.txt does not match the emoji");
}
// Byte-level verification as well: the file must hold exactly the emoji's
// UTF-8 bytes, nothing more (no trailing newline, no BOM, no padding).
const raw = readFileSync(outPath);
const expected = Buffer.from(EMOJI, "utf8");
if (raw.length !== expected.length || !raw.equals(expected)) {
  throw new Error(
    `Verification failed: entry.txt is ${raw.length} bytes, expected ${expected.length}`,
  );
}

console.log(`Wrote ${outPath}: ${EMOJI}`);
console.log(
  `Code points: ${codePoints.length}, UTF-8 bytes: ${Buffer.byteLength(EMOJI, "utf8")}, code point: U+${cp.toString(16).toUpperCase()}`,
);
