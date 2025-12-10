// Generate PNG icons from base design
const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Simple PNG generation using Canvas
const { createCanvas } = require('canvas');

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background gradient (navy blue)
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#1e3c72');
  gradient.addColorStop(1, '#2a5298');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Draw histogram bars (simplified icon)
  const barWidth = size / 8;
  const padding = size / 10;
  const heights = [0.4, 0.7, 1.0, 0.8, 0.5]; // Relative heights

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  heights.forEach((h, i) => {
    const x = padding + i * (barWidth + padding / 2);
    const barHeight = (size - 2 * padding) * h;
    const y = size - padding - barHeight;
    ctx.fillRect(x, y, barWidth, barHeight);
  });

  // Draw curve overlay (bell curve)
  ctx.strokeStyle = 'rgba(255, 200, 100, 0.9)';
  ctx.lineWidth = size / 40;
  ctx.beginPath();
  
  const curveY = size / 2;
  const amplitude = size / 4;
  
  for (let x = padding; x < size - padding; x++) {
    const normalized = (x - size / 2) / (size / 4);
    const y = curveY - amplitude * Math.exp(-normalized * normalized / 2);
    if (x === padding) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  const outputPath = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(outputPath, buffer);
  console.log(`✓ Generated ${outputPath}`);
}

// Generate all required sizes
[16, 48, 128].forEach(size => generateIcon(size));

console.log('\n✅ All PNG icons generated successfully!');
