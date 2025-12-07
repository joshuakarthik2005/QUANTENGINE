/**
 * Simple icon generator for QuantEngine
 * Creates basic SVG-based icons for the extension
 * For production, consider using a professional designer
 */

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

function generateSVGIcon(size) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e3c72;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2a5298;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".35em" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white">Q</text>
  <path d="M ${size * 0.2} ${size * 0.7} Q ${size * 0.3} ${size * 0.75} ${size * 0.4} ${size * 0.7} T ${size * 0.6} ${size * 0.7} T ${size * 0.8} ${size * 0.7}" stroke="white" stroke-width="${size * 0.05}" fill="none" opacity="0.6"/>
</svg>`;
}

// Generate icons
[16, 48, 128].forEach(size => {
  const svg = generateSVGIcon(size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.svg`), svg);
  console.log(`Generated icon${size}.svg`);
});

console.log('\nIcon generation complete!');
console.log('Note: SVG icons work in Chrome. For production, convert to PNG using a tool like Inkscape or GIMP.');
console.log('\nTo convert to PNG:');
console.log('1. Open SVG in Inkscape or online converter');
console.log('2. Export as PNG with appropriate size');
console.log('3. Replace the SVG files with PNG files in the manifest');
