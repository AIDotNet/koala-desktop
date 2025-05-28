import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

/**
 * 强制清理构建目录，解决顽固的文件锁定问题
 */
async function forceClean() {
  const releasePath = path.join(__dirname, '..', 'release');
  
  console.log('开始强制清理构建目录...');
  
  // 1. 停止所有可能的进程
  console.log('停止所有相关进程...');
  const processesToKill = [
    'Koala Desktop.exe',
    'electron.exe', 
    'app-builder.exe',
    'node.exe'
  ];
  
  for (const processName of processesToKill) {
    try {
      await execAsync(`taskkill /f /im "${processName}" 2>nul`);
      console.log(`✓ 已停止 ${processName}`);
    } catch (error) {
      // 忽略错误，进程可能不存在
    }
  }
  
  // 等待进程完全停止
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 2. 尝试多种方法删除目录
  if (fs.existsSync(releasePath)) {
    console.log('尝试删除 release 目录...');
    
    // 方法1: 使用 Node.js
    try {
      await fs.promises.rm(releasePath, { recursive: true, force: true });
      console.log('✓ 使用 Node.js 成功删除');
      return;
    } catch (error) {
      console.log('Node.js 删除失败，尝试其他方法...');
    }
    
    // 方法2: 使用 rmdir 命令
    try {
      await execAsync(`rmdir /s /q "${releasePath}"`);
      console.log('✓ 使用 rmdir 命令成功删除');
      return;
    } catch (error) {
      console.log('rmdir 命令失败，尝试其他方法...');
    }
    
    // 方法3: 使用 PowerShell
    try {
      await execAsync(`powershell -Command "Remove-Item -Path '${releasePath}' -Recurse -Force"`);
      console.log('✓ 使用 PowerShell 成功删除');
      return;
    } catch (error) {
      console.log('PowerShell 删除失败，尝试其他方法...');
    }
    
    // 方法4: 重命名然后删除
    try {
      const tempName = `${releasePath}-temp-${Date.now()}`;
      await execAsync(`move "${releasePath}" "${tempName}"`);
      console.log('✓ 已重命名目录，稍后将在后台删除');
      
      // 在后台尝试删除重命名的目录
      setTimeout(async () => {
        try {
          await execAsync(`rmdir /s /q "${tempName}"`);
          console.log('✓ 后台删除成功');
        } catch (error) {
          console.log('⚠ 后台删除失败，请手动删除:', tempName);
        }
      }, 5000);
      
      return;
    } catch (error) {
      console.log('重命名失败...');
    }
    
    // 方法5: 创建批处理文件延迟删除
    try {
      const batchFile = path.join(__dirname, 'delayed-delete.bat');
      const batchContent = `@echo off
timeout /t 5 /nobreak >nul
rmdir /s /q "${releasePath}"
del "%~f0"`;
      
      fs.writeFileSync(batchFile, batchContent);
      exec(`start /min "${batchFile}"`);
      console.log('✓ 已创建延迟删除任务');
      return;
    } catch (error) {
      console.log('创建延迟删除任务失败...');
    }
    
    console.warn('⚠ 无法完全删除 release 目录，可能需要手动删除或重启系统');
    console.log('建议：');
    console.log('1. 重启系统后再次尝试构建');
    console.log('2. 或者手动删除 release 目录');
    console.log('3. 或者使用文件解锁工具（如 Unlocker）');
  } else {
    console.log('release 目录不存在，无需清理');
  }
  
  // 清理其他目录
  const otherDirs = ['dist-electron', 'dist', 'temp-build'];
  for (const dir of otherDirs) {
    const dirPath = path.join(__dirname, '..', dir);
    if (fs.existsSync(dirPath)) {
      try {
        await fs.promises.rm(dirPath, { recursive: true, force: true });
        console.log(`✓ 已清理 ${dir} 目录`);
      } catch (error) {
        console.warn(`⚠ 无法清理 ${dir} 目录:`, error.message);
      }
    }
  }
  
  console.log('强制清理完成！');
}

// 如果直接运行此脚本
forceClean().catch(console.error);

export { forceClean }; 