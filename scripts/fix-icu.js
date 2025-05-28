import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 修复 Electron 应用的 ICU 数据文件问题
 * 解决 "Invalid file descriptor to ICU data received" 错误
 */
function fixICUData() {
  const electronPath = path.join(__dirname, '..', 'node_modules', 'electron', 'dist');
  const releasePath = path.join(__dirname, '..', 'release');
  
  console.log('开始修复 ICU 数据文件...');
  console.log('Release 路径:', releasePath);
  console.log('Electron 路径:', electronPath);
  
  // 查找最新的发布版本目录
  if (fs.existsSync(releasePath)) {
    console.log('找到 release 目录');
    const versions = fs.readdirSync(releasePath).filter(dir => {
      const fullPath = path.join(releasePath, dir);
      return fs.statSync(fullPath).isDirectory();
    });
    
    console.log('找到版本:', versions);
    
    if (versions.length === 0) {
      console.log('未找到任何版本目录');
      return;
    }
    
    versions.forEach(version => {
      const versionPath = path.join(releasePath, version);
      const winUnpackedPath = path.join(versionPath, 'win-unpacked');
      
      console.log(`检查版本路径: ${winUnpackedPath}`);
      
      if (fs.existsSync(winUnpackedPath)) {
        console.log(`处理版本: ${version}`);
        
        // 检查并复制 ICU 数据文件
        const sourceICU = path.join(electronPath, 'icudtl.dat');
        const targetICU = path.join(winUnpackedPath, 'icudtl.dat');
        
        console.log(`检查 ICU 文件: ${sourceICU} -> ${targetICU}`);
        
        if (fs.existsSync(sourceICU)) {
          if (!fs.existsSync(targetICU)) {
            fs.copyFileSync(sourceICU, targetICU);
            console.log('✓ 复制 icudtl.dat 文件');
          } else {
            console.log('✓ icudtl.dat 文件已存在');
          }
        } else {
          console.warn('⚠ 源 ICU 数据文件不存在:', sourceICU);
        }
        
        // 检查并复制 locales 目录
        const sourceLocales = path.join(electronPath, 'locales');
        const targetLocales = path.join(winUnpackedPath, 'locales');
        
        console.log(`检查 locales 目录: ${sourceLocales} -> ${targetLocales}`);
        
        if (fs.existsSync(sourceLocales)) {
          if (!fs.existsSync(targetLocales)) {
            fs.mkdirSync(targetLocales, { recursive: true });
            const localeFiles = fs.readdirSync(sourceLocales);
            
            localeFiles.forEach(file => {
              const sourcePath = path.join(sourceLocales, file);
              const targetPath = path.join(targetLocales, file);
              fs.copyFileSync(sourcePath, targetPath);
            });
            
            console.log('✓ 复制 locales 目录');
          } else {
            console.log('✓ locales 目录已存在');
          }
        } else {
          console.warn('⚠ 源 locales 目录不存在:', sourceLocales);
        }
        
        // 验证文件权限
        try {
          if (fs.existsSync(targetICU)) {
            fs.accessSync(targetICU, fs.constants.R_OK);
            console.log('✓ ICU 数据文件权限正常');
          }
        } catch (error) {
          console.warn('⚠ ICU 数据文件权限可能有问题:', error.message);
        }
      } else {
        console.log(`未找到 win-unpacked 目录: ${winUnpackedPath}`);
      }
    });
  } else {
    console.log('未找到 release 目录，请先构建应用');
  }
  
  console.log('ICU 数据文件修复完成');
}

// 如果直接运行此脚本
fixICUData();

export { fixICUData }; 