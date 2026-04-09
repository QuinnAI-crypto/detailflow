const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const WIDTH = 1200;
const HEIGHT = 630;
const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext("2d");

// Background
ctx.fillStyle = "#0E0F11";
ctx.fillRect(0, 0, WIDTH, HEIGHT);

// Subtle grid lines for texture
ctx.strokeStyle = "rgba(255,255,255,0.02)";
ctx.lineWidth = 1;
for (let x = 0; x < WIDTH; x += 60) {
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, HEIGHT);
  ctx.stroke();
}
for (let y = 0; y < HEIGHT; y += 60) {
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(WIDTH, y);
  ctx.stroke();
}

// Logo icon (D in blue rounded rect) - top left
const logoX = 64;
const logoY = 56;
const logoSize = 52;

// Blue rounded rect
const r = 10;
ctx.fillStyle = "#3B7BF8";
ctx.beginPath();
ctx.moveTo(logoX + r, logoY);
ctx.lineTo(logoX + logoSize - r, logoY);
ctx.quadraticCurveTo(logoX + logoSize, logoY, logoX + logoSize, logoY + r);
ctx.lineTo(logoX + logoSize, logoY + logoSize - r);
ctx.quadraticCurveTo(logoX + logoSize, logoY + logoSize, logoX + logoSize - r, logoY + logoSize);
ctx.lineTo(logoX + r, logoY + logoSize);
ctx.quadraticCurveTo(logoX, logoY + logoSize, logoX, logoY + logoSize - r);
ctx.lineTo(logoX, logoY + r);
ctx.quadraticCurveTo(logoX, logoY, logoX + r, logoY);
ctx.closePath();
ctx.fill();

// D shape inside logo
ctx.strokeStyle = "white";
ctx.lineWidth = 3;
ctx.lineCap = "round";
ctx.beginPath();
const dX = logoX + 14;
const dY = logoY + 12;
ctx.moveTo(dX, dY);
ctx.lineTo(dX + 8, dY);
const cp = logoSize - 24;
ctx.bezierCurveTo(dX + 8 + cp, dY, dX + 8 + cp, dY + cp + 4, dX + 8, dY + cp + 4);
ctx.lineTo(dX, dY + cp + 4);
ctx.closePath();
ctx.stroke();

// Dot inside D
ctx.fillStyle = "white";
ctx.beginPath();
ctx.arc(logoX + 26, logoY + 30, 4, 0, Math.PI * 2);
ctx.fill();

// "DetailFlow" text next to logo
ctx.fillStyle = "rgba(255,255,255,0.5)";
ctx.font = "500 22px 'Helvetica Neue', Arial, sans-serif";
ctx.fillText("DetailFlow", logoX + logoSize + 16, logoY + 34);

// Blue accent bar
ctx.fillStyle = "#3B7BF8";
ctx.fillRect(64, 190, 80, 4);

// Main headline
ctx.fillStyle = "#FFFFFF";
ctx.font = "bold 64px 'Helvetica Neue', Arial, sans-serif";
ctx.fillText("Run your detail shop.", 64, 270);
ctx.fillText("Not the paperwork.", 64, 345);

// Subtitle
ctx.fillStyle = "rgba(255,255,255,0.5)";
ctx.font = "400 24px 'Helvetica Neue', Arial, sans-serif";
ctx.fillText("AI-powered scheduling, quoting, CRM, and automated texts", 64, 410);

// Bottom blue bar
ctx.fillStyle = "#3B7BF8";
ctx.fillRect(0, HEIGHT - 6, WIDTH, 6);

// Domain bottom right
ctx.fillStyle = "rgba(255,255,255,0.35)";
ctx.font = "400 18px 'Helvetica Neue', Arial, sans-serif";
ctx.textAlign = "right";
ctx.fillText("detailflowapp.com", WIDTH - 64, HEIGHT - 40);

// Save
const outDir = path.join(__dirname, "..", "client", "public");
const buf = canvas.toBuffer("image/png");
fs.writeFileSync(path.join(outDir, "og-image.png"), buf);
console.log("Generated og-image.png (" + buf.length + " bytes)");
