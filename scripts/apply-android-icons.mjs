import fs from 'fs';
import path from 'path';

const androidResDir = path.resolve('android/app/src/main/res');
const sourceResDir = path.resolve('public/android-res');

if (fs.existsSync(androidResDir) && fs.existsSync(sourceResDir)) {
  const mipmapDirs = [
    'mipmap-mdpi',
    'mipmap-hdpi',
    'mipmap-xhdpi',
    'mipmap-xxhdpi',
    'mipmap-xxxhdpi',
  ];

  for (const dir of mipmapDirs) {
    const srcFolder = path.join(sourceResDir, dir);
    const dstFolder = path.join(androidResDir, dir);
    if (!fs.existsSync(srcFolder)) continue;
    fs.mkdirSync(dstFolder, { recursive: true });

    for (const file of ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png']) {
      const srcFile = path.join(srcFolder, file);
      const dstFile = path.join(dstFolder, file);
      if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, dstFile);
      }
    }
  }

  // Remove default Capacitor adaptive vector XMLs in mipmap-anydpi-v26 so Android uses our PNG mipmaps directly
  const anyDpiDir = path.join(androidResDir, 'mipmap-anydpi-v26');
  if (fs.existsSync(anyDpiDir)) {
    fs.rmSync(anyDpiDir, { recursive: true, force: true });
  }

  console.log('Applied custom Ludo Warrior launcher icons to Android project.');
}
