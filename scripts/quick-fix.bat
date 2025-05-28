@echo off
echo ========================================
echo Koala Desktop 构建问题快速修复工具
echo ========================================
echo.

echo 1. 停止相关进程...
taskkill /f /im "Koala Desktop.exe" 2>nul
taskkill /f /im electron.exe 2>nul
taskkill /f /im app-builder.exe 2>nul
taskkill /f /im node.exe 2>nul

echo 2. 等待进程完全停止...
timeout /t 3 /nobreak >nul

echo 3. 强制删除构建目录...
if exist "release" (
    echo 删除 release 目录...
    rmdir /s /q "release" 2>nul
    if exist "release" (
        echo 尝试重命名目录...
        ren "release" "release-old-%RANDOM%" 2>nul
    )
)

if exist "dist" (
    echo 删除 dist 目录...
    rmdir /s /q "dist" 2>nul
)

if exist "dist-electron" (
    echo 删除 dist-electron 目录...
    rmdir /s /q "dist-electron" 2>nul
)

echo 4. 清理完成！
echo.
echo 现在可以运行以下命令重新构建：
echo npm run build:win
echo.
echo 如果问题仍然存在，请：
echo 1. 重启计算机
echo 2. 或查看 docs/BUILD_ISSUES.md 获取更多解决方案
echo.
pause 