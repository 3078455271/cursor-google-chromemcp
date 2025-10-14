#!/usr/bin/env node

/**
 * Chrome Browser Control MCP Server
 * 为Cursor提供Chrome浏览器自动化控制功能
 * 
 * 功能包括：
 * - 打开网页和导航
 * - 页面截图和内容提取
 * - 表单填写和点击操作
 * - 页面滚动和等待
 * - Cookie和会话管理
 * 
 * @author 海绵小子
 * @version 1.0.0
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import puppeteer from 'puppeteer';

/**
 * Chrome浏览器控制器类
 * 封装了所有浏览器操作的核心逻辑
 */
class ChromeController {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isInitialized = false;
  }

  /**
   * 初始化浏览器实例
   * @param {Object} options - 浏览器启动选项
   */
  async initialize(options = {}) {
    try {
      if (this.browser) {
        await this.browser.close();
      }

      const defaultOptions = {
        headless: false, // 默认显示浏览器界面
        defaultViewport: { width: 1920, height: 1080 },
        executablePath: process.env.CHROME_PATH || null, // 使用系统Chrome
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      };

      this.browser = await puppeteer.launch({ ...defaultOptions, ...options });
      this.page = await this.browser.newPage();
      this.isInitialized = true;

      // 设置用户代理
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      console.log('✅ Chrome浏览器初始化成功');
      return { success: true, message: 'Chrome浏览器初始化成功' };
    } catch (error) {
      console.error('❌ Chrome浏览器初始化失败:', error);
      throw new McpError(ErrorCode.InternalError, `浏览器初始化失败: ${error.message}`);
    }
  }

  /**
   * 导航到指定URL
   * @param {string} url - 目标URL
   * @param {Object} options - 导航选项
   */
  async navigateTo(url, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const defaultOptions = {
        waitUntil: 'networkidle2',
        timeout: 30000
      };

      await this.page.goto(url, { ...defaultOptions, ...options });
      console.log(`✅ 成功导航到: ${url}`);
      
      return {
        success: true,
        url: this.page.url(),
        title: await this.page.title(),
        message: `成功导航到: ${url}`
      };
    } catch (error) {
      console.error(`❌ 导航失败: ${error.message}`);
      throw new McpError(ErrorCode.InternalError, `导航失败: ${error.message}`);
    }
  }

  /**
   * 直接搜索功能 - 使用Bing搜索引擎
   * @param {string} query - 搜索关键词
   */
  async search(query) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log(`🔍 使用Bing搜索: ${query}`);
      
      // 导航到Bing搜索页面
      await this.page.goto('https://www.bing.com', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // 等待搜索框加载
      await this.page.waitForSelector('#sb_form_q', { timeout: 10000 });
      
      // 清空搜索框并输入搜索内容
      await this.page.click('#sb_form_q');
      await this.page.evaluate(() => {
        const searchBox = document.querySelector('#sb_form_q');
        if (searchBox) searchBox.value = '';
      });
      await this.page.type('#sb_form_q', query);
      
      // 按回车搜索
      await this.page.keyboard.press('Enter');
      
      // 等待搜索结果加载
      await this.page.waitForSelector('#b_results', { timeout: 15000 });
      
      console.log(`✅ 成功搜索: ${query}`);
      return { 
        success: true, 
        query, 
        url: this.page.url(),
        title: await this.page.title(),
        message: `已在Bing中搜索"${query}"，结果已加载`
      };
    } catch (error) {
      console.error(`❌ 搜索失败: ${error.message}`);
      throw new McpError(ErrorCode.InternalError, `搜索失败: ${error.message}`);
    }
  }

  /**
   * 页面截图
   * @param {Object} options - 截图选项
   */
  async takeScreenshot(options = {}) {
    if (!this.page) {
      throw new McpError(ErrorCode.InvalidRequest, '浏览器未初始化');
    }

    try {
      const defaultOptions = {
        type: 'png',
        fullPage: true,
        quality: 90
      };

      const screenshot = await this.page.screenshot({ ...defaultOptions, ...options });
      const base64 = screenshot.toString('base64');
      
      console.log('✅ 页面截图完成');
      return {
        success: true,
        screenshot: `data:image/png;base64,${base64}`,
        message: '页面截图完成'
      };
    } catch (error) {
      console.error(`❌ 截图失败: ${error.message}`);
      throw new McpError(ErrorCode.InternalError, `截图失败: ${error.message}`);
    }
  }

  /**
   * 获取页面内容
   * @param {string} selector - CSS选择器（可选）
   */
  async getContent(selector = null) {
    if (!this.page) {
      throw new McpError(ErrorCode.InvalidRequest, '浏览器未初始化');
    }

    try {
      let content;
      if (selector) {
        content = await this.page.$eval(selector, el => el.textContent || el.innerHTML);
      } else {
        content = await this.page.content();
      }

      console.log('✅ 页面内容获取完成');
      return {
        success: true,
        content,
        url: this.page.url(),
        title: await this.page.title(),
        message: '页面内容获取完成'
      };
    } catch (error) {
      console.error(`❌ 获取内容失败: ${error.message}`);
      throw new McpError(ErrorCode.InternalError, `获取内容失败: ${error.message}`);
    }
  }

  /**
   * 点击元素
   * @param {string} selector - CSS选择器
   * @param {Object} options - 点击选项
   */
  async clickElement(selector, options = {}) {
    if (!this.page) {
      throw new McpError(ErrorCode.InvalidRequest, '浏览器未初始化');
    }

    try {
      await this.page.waitForSelector(selector, { timeout: 10000 });
      await this.page.click(selector, options);
      
      console.log(`✅ 成功点击元素: ${selector}`);
      return {
        success: true,
        selector,
        message: `成功点击元素: ${selector}`
      };
    } catch (error) {
      console.error(`❌ 点击元素失败: ${error.message}`);
      throw new McpError(ErrorCode.InternalError, `点击元素失败: ${error.message}`);
    }
  }

  /**
   * 输入文本
   * @param {string} selector - CSS选择器
   * @param {string} text - 要输入的文本
   * @param {Object} options - 输入选项
   */
  async typeText(selector, text, options = {}) {
    if (!this.page) {
      throw new McpError(ErrorCode.InvalidRequest, '浏览器未初始化');
    }

    try {
      await this.page.waitForSelector(selector, { timeout: 10000 });
      
      if (options.clear) {
        await this.page.click(selector, { clickCount: 3 });
      }
      
      await this.page.type(selector, text, { delay: options.delay || 50 });
      
      console.log(`✅ 成功输入文本到: ${selector}`);
      return {
        success: true,
        selector,
        text,
        message: `成功输入文本到: ${selector}`
      };
    } catch (error) {
      console.error(`❌ 输入文本失败: ${error.message}`);
      throw new McpError(ErrorCode.InternalError, `输入文本失败: ${error.message}`);
    }
  }

  /**
   * 等待元素出现
   * @param {string} selector - CSS选择器
   * @param {number} timeout - 超时时间（毫秒）
   */
  async waitForElement(selector, timeout = 10000) {
    if (!this.page) {
      throw new McpError(ErrorCode.InvalidRequest, '浏览器未初始化');
    }

    try {
      await this.page.waitForSelector(selector, { timeout });
      
      console.log(`✅ 元素已出现: ${selector}`);
      return {
        success: true,
        selector,
        message: `元素已出现: ${selector}`
      };
    } catch (error) {
      console.error(`❌ 等待元素失败: ${error.message}`);
      throw new McpError(ErrorCode.InternalError, `等待元素失败: ${error.message}`);
    }
  }

  /**
   * 滚动页面
   * @param {Object} options - 滚动选项
   */
  async scrollPage(options = {}) {
    if (!this.page) {
      throw new McpError(ErrorCode.InvalidRequest, '浏览器未初始化');
    }

    try {
      const { direction = 'down', distance = 500, smooth = true } = options;
      
      await this.page.evaluate((direction, distance, smooth) => {
        const scrollOptions = smooth ? { behavior: 'smooth' } : {};
        
        if (direction === 'down') {
          window.scrollBy({ top: distance, ...scrollOptions });
        } else if (direction === 'up') {
          window.scrollBy({ top: -distance, ...scrollOptions });
        } else if (direction === 'top') {
          window.scrollTo({ top: 0, ...scrollOptions });
        } else if (direction === 'bottom') {
          window.scrollTo({ top: document.body.scrollHeight, ...scrollOptions });
        }
      }, direction, distance, smooth);

      console.log(`✅ 页面滚动完成: ${direction}`);
      return {
        success: true,
        direction,
        distance,
        message: `页面滚动完成: ${direction}`
      };
    } catch (error) {
      console.error(`❌ 页面滚动失败: ${error.message}`);
      throw new McpError(ErrorCode.InternalError, `页面滚动失败: ${error.message}`);
    }
  }

  /**
   * 关闭浏览器
   */
  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
        this.isInitialized = false;
        console.log('✅ 浏览器已关闭');
        return { success: true, message: '浏览器已关闭' };
      }
    } catch (error) {
      console.error(`❌ 关闭浏览器失败: ${error.message}`);
      throw new McpError(ErrorCode.InternalError, `关闭浏览器失败: ${error.message}`);
    }
  }
}

// 创建全局Chrome控制器实例
const chromeController = new ChromeController();

/**
 * 创建MCP服务器实例
 */
const server = new Server(
  {
    name: 'chrome-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * 工具列表处理器
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'chrome_navigate',
        description: '导航到指定的URL地址',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: '要导航到的URL地址',
            },
            waitUntil: {
              type: 'string',
              description: '等待条件 (load, domcontentloaded, networkidle0, networkidle2)',
              default: 'networkidle2',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'chrome_search',
        description: '使用Bing搜索引擎搜索指定内容',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: '要搜索的关键词或内容',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'chrome_screenshot',
        description: '对当前页面进行截图',
        inputSchema: {
          type: 'object',
          properties: {
            fullPage: {
              type: 'boolean',
              description: '是否截取整个页面',
              default: true,
            },
            quality: {
              type: 'number',
              description: '截图质量 (1-100)',
              default: 90,
            },
          },
        },
      },
      {
        name: 'chrome_get_content',
        description: '获取页面内容或指定元素的内容',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS选择器，如果不提供则获取整个页面内容',
            },
          },
        },
      },
      {
        name: 'chrome_click',
        description: '点击页面上的元素',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: '要点击的元素的CSS选择器',
            },
          },
          required: ['selector'],
        },
      },
      {
        name: 'chrome_type',
        description: '在指定的输入框中输入文本',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: '输入框的CSS选择器',
            },
            text: {
              type: 'string',
              description: '要输入的文本内容',
            },
            clear: {
              type: 'boolean',
              description: '是否先清空输入框',
              default: false,
            },
          },
          required: ['selector', 'text'],
        },
      },
      {
        name: 'chrome_wait_for_element',
        description: '等待指定元素出现在页面上',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: '要等待的元素的CSS选择器',
            },
            timeout: {
              type: 'number',
              description: '超时时间（毫秒）',
              default: 10000,
            },
          },
          required: ['selector'],
        },
      },
      {
        name: 'chrome_scroll',
        description: '滚动页面',
        inputSchema: {
          type: 'object',
          properties: {
            direction: {
              type: 'string',
              description: '滚动方向 (up, down, top, bottom)',
              default: 'down',
            },
            distance: {
              type: 'number',
              description: '滚动距离（像素）',
              default: 500,
            },
            smooth: {
              type: 'boolean',
              description: '是否平滑滚动',
              default: true,
            },
          },
        },
      },
      {
        name: 'chrome_close',
        description: '关闭Chrome浏览器',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

/**
 * 工具调用处理器
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'chrome_navigate':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await chromeController.navigateTo(args.url, {
                waitUntil: args.waitUntil || 'networkidle2'
              }), null, 2),
            },
          ],
        };

      case 'chrome_search':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await chromeController.search(args.query), null, 2),
            },
          ],
        };

      case 'chrome_screenshot':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await chromeController.takeScreenshot({
                fullPage: args.fullPage !== false,
                quality: args.quality || 90
              }), null, 2),
            },
          ],
        };

      case 'chrome_get_content':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await chromeController.getContent(args.selector), null, 2),
            },
          ],
        };

      case 'chrome_click':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await chromeController.clickElement(args.selector), null, 2),
            },
          ],
        };

      case 'chrome_type':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await chromeController.typeText(
                args.selector, 
                args.text, 
                { clear: args.clear }
              ), null, 2),
            },
          ],
        };

      case 'chrome_wait_for_element':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await chromeController.waitForElement(
                args.selector, 
                args.timeout || 10000
              ), null, 2),
            },
          ],
        };

      case 'chrome_scroll':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await chromeController.scrollPage({
                direction: args.direction || 'down',
                distance: args.distance || 500,
                smooth: args.smooth !== false
              }), null, 2),
            },
          ],
        };

      case 'chrome_close':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await chromeController.close(), null, 2),
            },
          ],
        };

      default:
        throw new McpError(ErrorCode.MethodNotFound, `未知的工具: ${name}`);
    }
  } catch (error) {
    console.error(`工具调用错误 [${name}]:`, error);
    
    if (error instanceof McpError) {
      throw error;
    }
    
    throw new McpError(ErrorCode.InternalError, `工具执行失败: ${error.message}`);
  }
});

/**
 * 启动MCP服务器
 */
async function main() {
  console.log('🚀 启动Chrome MCP服务器...');
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.log('✅ Chrome MCP服务器已启动，等待连接...');
}

// 优雅关闭处理
process.on('SIGINT', async () => {
  console.log('\n🛑 收到关闭信号，正在关闭服务器...');
  await chromeController.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 收到终止信号，正在关闭服务器...');
  await chromeController.close();
  process.exit(0);
});

// 启动服务器
main().catch((error) => {
  console.error('❌ 服务器启动失败:', error);
  process.exit(1);
});
