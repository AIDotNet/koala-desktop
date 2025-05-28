import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

/**
 * 清理构建目录，解决文件被锁定的问题
 */
async function cleanBuild() {
  const releasePath = path.join(__dirname, '..', 'release');
  const distElectronPath = path.join(__dirname, '..', 'dist-electron');
  const distPath = path.join(__dirname, '..', 'dist');
  
  console.log('开始清理构建目录...');
  
  // 1. 尝试停止所有相关进程
  console.log('停止相关进程...');
  try {
    await execAsync('taskkill /f /im "Koala Desktop.exe" 2>nul || echo "No Koala Desktop process found"');
    await execAsync('taskkill /f /im electron.exe 2>nul || echo "No electron process found"');
    await execAsync('taskkill /f /im app-builder.exe 2>nul || echo "No app-builder process found"');
  } catch (error) {
    console.log('进程停止完成（可能没有运行的进程）');
  }
  
  // 等待一下让进程完全停止
  await new Promise(resolve => setTimeout(resolve, 2000));
  
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
        // 尝试使用 Node.js 删除
        await fs.promises.rm(dir.path, { recursive: true, force: true });
        console.log(`✓ ${dir.name} 目录已清理`);
      } catch (error) {
        console.log(`使用系统命令清理 ${dir.name}...`);
        try {
          // 使用系统命令强制删除
          await execAsync(`rmdir /s /q "${dir.path}"`);
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
    path.join(__dirname, '..', '.tmp')
  ];
  
  for (const tempDir of tempDirs) {
    if (fs.existsSync(tempDir)) {
      console.log(`清理临时目录 ${path.basename(tempDir)}...`);
      try {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
        console.log(`✓ ${path.basename(tempDir)} 已清理`);
      } catch (error) {
        console.warn(`⚠ 无法清理 ${path.basename(tempDir)}:`, error.message);
      }
    }
  }
  
  console.log('构建目录清理完成！');
  console.log('现在可以重新运行构建命令了。');
}

// 如果直接运行此脚本
cleanBuild().catch(console.error);

export { cleanBuild }; 