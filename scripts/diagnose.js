import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Koala Desktop 构建环境诊断');
console.log('================================');

// 检查 Node.js 版本
console.log('📋 系统信息:');
console.log('  Node.js 版本:', process.version);
console.log('  平台:', process.platform);
console.log('  架构:', process.arch);

// 检查 npm 版本
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log('  npm 版本:', npmVersion);
} catch (error) {
  console.log('  npm 版本: 检测失败');
}

// 检查环境变量
console.log('\n🌍 环境变量:');
console.log('  ELECTRON_MIRROR:', process.env.ELECTRON_MIRROR || '未设置');
console.log('  ELECTRON_BUILDER_CACHE:', process.env.ELECTRON_BUILDER_CACHE || '未设置');

// 检查关键文件
console.log('\n📁 关键文件检查:');
const projectRoot = path.dirname(__dirname);
const keyFiles = [
  'package.json',
  'electron-builder.json',
  '.npmrc',
  'node_modules/electron/package.json',
  'node_modules/app-builder-bin/win/x64/app-builder.exe',
  '.electron-cache'
];

keyFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${file}: ${exists ? '✅ 存在' : '❌ 不存在'}`);
  
  if (exists && file.endsWith('.json')) {
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (file === 'package.json') {
        console.log(`    版本: ${content.version}`);
        console.log(`    Electron: ${content.devDependencies?.electron || '未找到'}`);
      }
    } catch (error) {
      console.log(`    解析失败: ${error.message}`);
    }
  }
});

// 检查 app-builder.exe
console.log('\n🔧 app-builder.exe 检查:');
const appBuilderPath = path.join(projectRoot, 'node_modules', 'app-builder-bin', 'win', 'x64', 'app-builder.exe');
if (fs.existsSync(appBuilderPath)) {
  try {
    const result = execSync(`"${appBuilderPath}" --version`, { 
      encoding: 'utf8',
      timeout: 5000 
    });
    console.log('  版本:', result.trim());
    console.log('  状态: ✅ 可执行');
  } catch (error) {
    console.log('  状态: ❌ 执行失败');
    console.log('  错误:', error.message);
  }
} else {
  console.log('  状态: ❌ 文件不存在');
}

// 检查缓存目录
console.log('\n💾 缓存目录检查:');
const cacheDir = path.join(projectRoot, '.electron-cache');
if (fs.existsSync(cacheDir)) {
  try {
    const cacheFiles = fs.readdirSync(cacheDir);
    console.log(`  文件数量: ${cacheFiles.length}`);
    if (cacheFiles.length > 0) {
      console.log('  文件列表:', cacheFiles.slice(0, 5).join(', '));
      if (cacheFiles.length > 5) {
        console.log(`    ... 还有 ${cacheFiles.length - 5} 个文件`);
      }
    }
  } catch (error) {
    console.log('  读取失败:', error.message);
  }
} else {
  console.log('  状态: ❌ 目录不存在');
}

// 检查构建输出
console.log('\n📦 构建输出检查:');
const releaseDir = path.join(projectRoot, 'release');
if (fs.existsSync(releaseDir)) {
  try {
    const versions = fs.readdirSync(releaseDir);
    console.log('  版本目录:', versions.join(', '));
  } catch (error) {
    console.log('  读取失败:', error.message);
  }
} else {
  console.log('  状态: 无构建输出');
}

console.log('\n🎯 建议:');
console.log('  1. 如果 app-builder.exe 执行失败，运行: npm run fix-builder');
console.log('  2. 如果下载慢，确保已配置镜像源');
console.log('  3. 使用优化构建命令: npm run build:optimized:win');
console.log('  4. 如果遇到权限问题，尝试以管理员身份运行');

console.log('\n✅ 诊断完成！'); 