const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 设置环境变量
process.env.ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/';
process.env.ELECTRON_BUILDER_CACHE = '.electron-cache';

console.log('🚀 开始优化构建流程...');

// 检查缓存目录
const cacheDir = path.join(process.cwd(), '.electron-cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
  console.log('📁 创建缓存目录:', cacheDir);
}

// 预下载 Electron 二进制文件
console.log('⬇️ 预下载 Electron 二进制文件...');
try {
  execSync('electron-builder install-app-deps', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('✅ Electron 二进制文件下载完成');
} catch (error) {
  console.warn('⚠️ 预下载失败，将在构建时重试');
}

// 显示缓存信息
if (fs.existsSync(cacheDir)) {
  const cacheFiles = fs.readdirSync(cacheDir);
  console.log(`📦 缓存目录包含 ${cacheFiles.length} 个文件`);
}

console.log('🎉 构建优化完成！'); 