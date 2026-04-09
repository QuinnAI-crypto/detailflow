const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

function makeFavicon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Blue rounded rect
  const r = size * 0.2;
  ctx.fillStyle = "#3B7BF8";
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // D shape
  const pad = size * 0.25;
  const dW = size * 0.45;
  const dH = size * 0.55;
  ctx.strokeStyle = "white";
  ctx.lineWidth = size * 0.08;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad + dW * 0.3, pad);
  ctx.bezierCurveTo(pad + dW + size * 0.1, pad, pad + dW + size * 0.1, pad + dH, pad + dW * 0.3, pad + dH);
  ctx.lineTo(pad, pad + dH);
  ctx.closePath();
  ctx.stroke();

  // Dot
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(size * 0.52, size * 0.58, size * 0.09, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

const outDir = path.join(__dirname, "..", "client", "public");
const buf32 = makeFavicon(32).toBuffer("image/png");
fs.writeFileSync(path.join(outDir, "favicon.png"), buf32);
console.log("Generated favicon.png (" + buf32.length + " bytes)");
