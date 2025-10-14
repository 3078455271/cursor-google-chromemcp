@echo off
echo 启动Chrome MCP服务器...

REM 设置环境变量
set PUPPETEER_SKIP_DOWNLOAD=true
set NODE_ENV=production

REM 启动MCP服务器
node index.js

pause

