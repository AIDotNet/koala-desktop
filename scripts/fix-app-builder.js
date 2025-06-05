import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 开始修复 app-builder.exe 执行问题...');

const appBuilderPath = path.join(path.dirname(__dirname), 'node_modules', 'app-builder-bin', 'win', 'x64', 'app-builder.exe');

// 检查文件是否存在
if (!fs.existsSync(appBuilderPath)) {
  console.error('❌ app-builder.exe 文件不存在');
  process.exit(1);
}

console.log('📁 app-builder.exe 路径:', appBuilderPath);

// 方案1: 重新安装 app-builder-bin
console.log('🔄 重新安装 app-builder-bin...');
try {
  execSync('npm uninstall app-builder-bin', { stdio: 'inherit' });
  execSync('npm install app-builder-bin@latest', { stdio: 'inherit' });
  console.log('✅ app-builder-bin 重新安装完成');
} catch (error) {
  console.warn('⚠️ 重新安装失败，尝试其他方案');
}

// 方案2: 测试 app-builder.exe 是否可执行
console.log('🧪 测试 app-builder.exe 执行权限...');
try {
  const result = execSync(`"${appBuilderPath}" --version`, { 
    encoding: 'utf8',
    timeout: 10000 
  });
  console.log('✅ app-builder.exe 可正常执行，版本:', result.trim());
} catch (error) {
  console.error('❌ app-builder.exe 执行失败:', error.message);
  
  // 方案3: 尝试使用 PowerShell 解除文件阻止
  console.log('🔓 尝试解除文件阻止...');
  try {
    execSync(`powershell -Command "Unblock-File -Path '${appBuilderPath}'"`, { stdio: 'inherit' });
    console.log('✅ 文件阻止已解除');
    
    // 再次测试
    const result = execSync(`"${appBuilderPath}" --version`, { 
      encoding: 'utf8',
      timeout: 10000 
    });
    console.log('✅ 修复成功，app-builder.exe 版本:', result.trim());
  } catch (unblockError) {
    console.error('❌ 解除文件阻止失败:', unblockError.message);
  }
}

// 方案4: 检查防病毒软件提示
console.log('💡 如果问题仍然存在，请检查：');
console.log('   1. 防病毒软件是否阻止了 app-builder.exe');
console.log('   2. Windows Defender 是否将文件标记为威胁');
console.log('   3. 是否需要以管理员权限运行');
console.log('   4. 文件路径是否包含特殊字符或中文');

console.log('🎉 修复脚本执行完成！'); 