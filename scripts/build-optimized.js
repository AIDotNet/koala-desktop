import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 设置环境变量
process.env.ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/';
process.env.ELECTRON_BUILDER_CACHE = '.electron-cache';

console.log('🚀 开始优化构建流程...');

// 步骤1: 检查和修复 app-builder
console.log('🔧 步骤1: 检查 app-builder.exe...');
const appBuilderPath = path.join(path.dirname(__dirname), 'node_modules', 'app-builder-bin', 'win', 'x64', 'app-builder.exe');

try {
  const result = execSync(`"${appBuilderPath}" --version`, { 
    encoding: 'utf8',
    timeout: 10000 
  });
  console.log('✅ app-builder.exe 正常，版本:', result.trim());
} catch (error) {
  console.log('⚠️ app-builder.exe 有问题，尝试修复...');
  try {
    execSync(`powershell -Command "Unblock-File -Path '${appBuilderPath}'"`, { stdio: 'inherit' });
    console.log('✅ 文件阻止已解除');
  } catch (unblockError) {
    console.warn('⚠️ 无法解除文件阻止，继续构建...');
  }
}

// 步骤2: 确保缓存目录存在
console.log('📁 步骤2: 检查缓存目录...');
const cacheDir = path.join(path.dirname(__dirname), '.electron-cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
  console.log('✅ 创建缓存目录:', cacheDir);
} else {
  console.log('✅ 缓存目录已存在');
}

// 步骤3: 预下载 Electron 二进制文件
console.log('⬇️ 步骤3: 预下载 Electron 二进制文件...');
try {
  execSync('electron-builder install-app-deps', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('✅ Electron 二进制文件下载完成');
} catch (error) {
  console.warn('⚠️ 预下载失败，将在构建时重试');
}

// 步骤4: 清理构建目录
console.log('🧹 步骤4: 清理构建目录...');
try {
  if (process.platform === 'win32') {
    execSync('node scripts/clean-build.js', { stdio: 'inherit' });
  } else {
    execSync('node scripts/clean-build-linux.js', { stdio: 'inherit' });
  }
  console.log('✅ 构建目录清理完成');
} catch (error) {
  console.warn('⚠️ 清理失败，继续构建...');
}

// 步骤5: TypeScript 编译
console.log('🔨 步骤5: TypeScript 编译...');
try {
  execSync('tsc', { stdio: 'inherit' });
  console.log('✅ TypeScript 编译完成');
} catch (error) {
  console.error('❌ TypeScript 编译失败');
  process.exit(1);
}

// 步骤6: Vite 构建
console.log('⚡ 步骤6: Vite 构建...');
try {
  execSync('vite build', { stdio: 'inherit' });
  console.log('✅ Vite 构建完成');
} catch (error) {
  console.error('❌ Vite 构建失败');
  process.exit(1);
}

// 步骤7: Electron 打包
console.log('📦 步骤7: Electron 打包...');
const platform = process.argv[2] || 'win';
const buildCommand = platform === 'win' ? 'electron-builder --win' : 
                    platform === 'mac' ? 'electron-builder --mac' : 
                    'electron-builder --linux';

try {
  execSync(buildCommand, { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('✅ Electron 打包完成');
} catch (error) {
  console.error('❌ Electron 打包失败');
  process.exit(1);
}

// 步骤8: 后处理（如果是 Windows）
if (platform === 'win') {
  console.log('🔧 步骤8: Windows 后处理...');
  try {
    execSync('node scripts/fix-icu.js', { stdio: 'inherit' });
    console.log('✅ ICU 修复完成');
  } catch (error) {
    console.warn('⚠️ ICU 修复失败，但构建已完成');
  }
}

// 显示构建结果
console.log('🎉 构建完成！');
const releaseDir = path.join(path.dirname(__dirname), 'release');
if (fs.existsSync(releaseDir)) {
  console.log('📁 构建输出目录:', releaseDir);
  try {
    const versions = fs.readdirSync(releaseDir);
    console.log('📦 可用版本:', versions.join(', '));
  } catch (error) {
    console.log('�� 构建文件已生成');
  }
} 