# Chrome MCP Server

Chrome浏览器控制MCP服务器，为Cursor提供强大的浏览器自动化功能。

## 📚 用户指南

### 小白用户专用文档
- 📖 [小白使用指南](Chrome浏览器搜索功能-小白使用指南.md) - 详细的功能介绍和使用方法
- 🚀 [5分钟快速上手](快速上手-5分钟学会使用.md) - 最简单的入门指南  
- 🔧 [安装配置步骤](安装配置详细步骤.md) - 详细的安装和配置说明
- ❓ [常见问题解答](常见问题解答FAQ.md) - 解决使用中的常见问题

**推荐阅读顺序**：快速上手 → 安装配置 → 小白指南 → 常见问题

## 功能特性

### 🌐 页面导航
- **chrome_navigate**: 导航到指定URL
- **chrome_search**: 使用Bing搜索引擎搜索内容（适合国内使用）
- **chrome_wait_for_element**: 等待页面元素加载

### 📸 内容获取
- **chrome_screenshot**: 页面截图（支持全页面截图）
- **chrome_get_content**: 获取页面内容或指定元素内容

### 🖱️ 页面交互
- **chrome_click**: 点击页面元素
- **chrome_type**: 在输入框中输入文本
- **chrome_scroll**: 页面滚动控制

### 🔧 浏览器管理
- **chrome_close**: 关闭浏览器实例

## 安装依赖

```bash
cd chrome-mcp-server
npm install
```

## 使用示例

### 1. 直接搜索（推荐）
```javascript
// 使用Bing搜索引擎直接搜索
await chrome_search({
  "query": "嵌入式入门条件"
})

// 截取搜索结果页面
await chrome_screenshot({
  "fullPage": true,
  "quality": 90
})
```

### 2. 手动导航和操作
```javascript
// 导航到网页
await chrome_navigate({
  "url": "https://www.bing.com",
  "waitUntil": "networkidle2"
})

// 在搜索框输入文本
await chrome_type({
  "selector": "#sb_form_q",
  "text": "人工智能",
  "clear": true
})

// 点击搜索按钮
await chrome_click({
  "selector": "#search_icon"
})

// 等待结果加载
await chrome_wait_for_element({
  "selector": "#b_results",
  "timeout": 10000
})
```

### 3. 获取页面内容
```javascript
// 获取整个页面内容
await chrome_get_content({})

// 获取特定元素内容
await chrome_get_content({
  "selector": ".result h3"
})
```

### 4. 页面滚动
```javascript
// 向下滚动
await chrome_scroll({
  "direction": "down",
  "distance": 500,
  "smooth": true
})

// 滚动到页面顶部
await chrome_scroll({
  "direction": "top"
})
```

## 配置说明

在Cursor的`mcp.json`配置文件中已添加Chrome MCP服务器：

```json
{
  "mcpServers": {
    "Chrome-Browser": {
      "disabled": false,
      "timeout": 120,
      "command": "node",
      "args": [
        "D:\\code\\hd-backend\\chrome-mcp-server\\index.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## 技术架构

### 核心组件
- **ChromeController**: 浏览器控制核心类
- **MCP Server**: 协议处理和工具注册
- **Puppeteer**: Chrome浏览器自动化引擎

### 安全特性
- 错误处理和超时控制
- 优雅关闭机制
- 详细的日志记录

### 性能优化
- 单例浏览器实例
- 智能等待策略
- 内存管理优化

## 开发规范

遵循项目的开发规范要求：
- ✅ SOLID原则设计
- ✅ 完善的错误处理和监控
- ✅ 详细的代码注释
- ✅ 简单可控的解决方案
- ✅ 飞书平台集成规范

## 故障排除

### 常见问题

1. **浏览器启动失败**
   - 检查Chrome是否正确安装
   - 确认系统权限设置
   - 查看错误日志信息

2. **元素定位失败**
   - 验证CSS选择器正确性
   - 增加等待时间
   - 检查页面加载状态

3. **截图失败**
   - 确认页面完全加载
   - 检查内存使用情况
   - 调整截图参数

### 调试模式

启动时设置环境变量启用调试：
```bash
DEBUG=true node index.js
```

## 版本历史

- **v1.0.0**: 初始版本，支持基础浏览器控制功能

## 作者

AI进化论-花生团队

