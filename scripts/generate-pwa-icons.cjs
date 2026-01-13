const fs = require('fs');
const path = require('path');

/**
 * Generate PWA icons from the logomark
 * This is a placeholder - proper icons should be generated with an image library
 * For now, we'll copy the logomark to both icon sizes
 * 
 * TODO: Install sharp or jimp and generate proper 192x192 and 512x512 icons
 */

const logoPath = path.join(__dirname, '../public/agritectum-logomark.png');
const icon192Path = path.join(__dirname, '../public/icon-192x192.png');
const icon512Path = path.join(__dirname, '../public/icon-512x512.png');

try {
  console.log('📱 Generating PWA icons...');
  
  // For now, copy the logomark to both sizes
  // This is not ideal but will fix the "invalid image" error
  fs.copyFileSync(logoPath, icon192Path);
  fs.copyFileSync(logoPath, icon512Path);
  
  console.log('✅ PWA icons generated successfully');
  console.log('⚠️  Note: Icons are using the logomark directly.');
  console.log('   For production, please resize to proper dimensions:');
  console.log('   - icon-192x192.png should be exactly 192x192 pixels');
  console.log('   - icon-512x512.png should be exactly 512x512 pixels');
  console.log('');
  console.log('💡 To generate proper icons, install sharp:');
  console.log('   npm install --save-dev sharp');
  console.log('   Then update this script to resize the images');
} catch (error) {
  console.error('❌ Error generating icons:', error.message);
  process.exit(1);
}
