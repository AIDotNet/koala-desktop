import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

/**
 * Linux 环境下的构建目录清理
 */
async function cleanBuildLinux() {
  const releasePath = path.join(__dirname, '..', 'release');
  const distElectronPath = path.join(__dirname, '..', 'dist-electron');
  const distPath = path.join(__dirname, '..', 'dist');
  
  console.log('开始清理 Linux 构建目录...');
  
  // 1. 停止相关进程
  console.log('停止相关进程...');
  try {
    await execAsync('pkill -f "koala-desktop" || true');
    await execAsync('pkill -f "electron" || true');
    await execAsync('pkill -f "app-builder" || true');
  } catch (error) {
    console.log('进程停止完成（可能没有运行的进程）');
  }
  
  // 等待进程完全停止
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 2. 清理目录
  const dirsToClean = [
    { path: releasePath, name: 'release' },
    { path: distElectronPath, name: 'dist-electron' },
    { path: distPath, name: 'dist' }
  ];
  
  for (const dir of dirsToClean) {
    if (fs.existsSync(dir.path)) {
      console.log(`清理 ${dir.name} 目录...`);
      try {
        await fs.promises.rm(dir.path, { recursive: true, force: true });
        console.log(`✓ ${dir.name} 目录已清理`);
      } catch (error) {
        console.log(`使用系统命令清理 ${dir.name}...`);
        try {
          await execAsync(`rm -rf "${dir.path}"`);
          console.log(`✓ ${dir.name} 目录已清理（使用系统命令）`);
        } catch (cmdError) {
          console.warn(`⚠ 无法清理 ${dir.name} 目录:`, cmdError.message);
        }
      }
    } else {
      console.log(`${dir.name} 目录不存在，跳过清理`);
    }
  }
  
  // 3. 清理 node_modules/.cache
  const cacheDir = path.join(__dirname, '..', 'node_modules', '.cache');
  if (fs.existsSync(cacheDir)) {
    console.log('清理 node_modules/.cache...');
    try {
      await fs.promises.rm(cacheDir, { recursive: true, force: true });
      console.log('✓ 缓存目录已清理');
    } catch (error) {
      console.warn('⚠ 无法清理缓存目录:', error.message);
    }
  }
  
  // 4. 清理临时文件
  const tempDirs = [
    path.join(__dirname, '..', 'temp-build'),
    path.join(__dirname, '..', '.tmp'),
    '/tmp/electron-*'
  ];
  
  for (const tempDir of tempDirs) {
    if (tempDir.includes('*')) {
      // 使用通配符清理
      try {
        await execAsync(`rm -rf ${tempDir}`);
        console.log(`✓ 已清理临时文件: ${tempDir}`);
      } catch (error) {
        // 忽略错误，文件可能不存在
      }
    } else if (fs.existsSync(tempDir)) {
      console.log(`清理临时目录 ${path.basename(tempDir)}...`);
      try {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
        console.log(`✓ ${path.basename(tempDir)} 已清理`);
      } catch (error) {
        console.warn(`⚠ 无法清理 ${path.basename(tempDir)}:`, error.message);
      }
    }
  }
  
  console.log('Linux 构建目录清理完成！');
  console.log('现在可以重新运行构建命令了。');
}

// 如果直接运行此脚本
cleanBuildLinux().catch(console.error);

export { cleanBuildLinux }; 