import { createCanvas } from "canvas";
import { writeFileSync } from "fs";

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Background — dark navy
  ctx.fillStyle = "#0E0F11";
  ctx.beginPath();
  const r = size * 0.15;
  roundedRect(ctx, 0, 0, size, size, r);
  ctx.fill();

  // Blue accent square
  const inset = size * 0.12;
  ctx.fillStyle = "#3B7BF8";
  const innerR = size * 0.1;
  roundedRect(ctx, inset, inset, size - inset * 2, size - inset * 2, innerR);
  ctx.fill();

  // "DF" text
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fontSize = Math.round(size * 0.38);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillText("DF", size / 2, size / 2 + size * 0.02);

  const buffer = canvas.toBuffer("image/png");
  writeFileSync(`client/public/icon-${size}.png`, buffer);
  console.log(`Generated icon-${size}.png`);
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

generateIcon(192);
generateIcon(512);
