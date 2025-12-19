import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'mioki',
  lang: 'zh-CN',
  description: '💓 基于 NapCat 的插件式 OneBot 机器人框架，KiviBot 的精神继承者。',
  head: [
    ['link', { rel: 'preconnect', href: 'https://unpkg.com' }],
    ['link', { rel: 'dns-prefetch', href: 'https://unpkg.com' }],
    // ['link', { rel: 'icon', type: 'image/png', href: '/mioki.png' }]
  ],
  markdown: {
    theme: 'one-dark-pro',
  },
  lastUpdated: true,
  themeConfig: {
    logo: '/dimo.png',
    nav: [
      { text: '文档', link: '/intro' },
      { text: '插件', link: '/plugin/list' },
      {
        text: '开发',
        link: '/develop/prerequisite',
      },
      {
        text: '支持',
        link: '/reward',
      },
    ],
    sidebar: [
      {
        items: [
          { text: '简介', link: '/intro' },
          {
            text: '安装',
            items: [
              { text: 'Linux', link: '/guide/start/linux' },
              { text: 'Windows', link: '/guide/start/win' },
              { text: 'Android (Termux)', link: '/guide/start/android' },
              { text: '其他平台', link: '/guide/start/other' },
            ],
          },
          {
            text: '基础知识',
            link: '/guide/basic',
          },
          {
            text: '命令',
            items: [
              { text: '消息指令', link: '/guide/cmd/msg' },
              { text: 'CLI 命令', link: '/guide/cmd/cli' },
            ],
          },
          {
            text: '配置文件',
            link: '/guide/config',
          },
          {
            text: '常见问题',
            link: '/guide/faq',
          },
        ],
      },
      {
        items: [
          { text: '插件说明', link: '/plugin/note' },
          { text: '安装插件', link: '/plugin/install' },
          { text: '官方插件', link: '/plugin/official' },
          { text: '插件列表', link: '/plugin/list' },
        ],
      },
      {
        items: [
          { text: '前置知识', link: '/develop/prerequisite' },
          { text: '开发指引', link: '/develop/guide' },
          { text: '开发技巧', link: '/develop/tricks' },
          { text: '插件示例', link: '/develop/examples' },
          { text: '生命周期', link: '/develop/lifecycle' },
        ],
      },
      {
        items: [
          { text: 'KiviPlugin API', link: '/api/plugin' },
          { text: 'oicq v2 API', link: '/api/oicq' },
          { text: 'Utils API', link: '/api/utils' },
          { text: 'KiviBot 标准事件', link: '/api/kivi_events' },
          { text: 'oicq v2 标准事件', link: '/api/oicq_events' },
        ],
      },
    ],
    outline: 2,
    outlineTitle: '大纲',
    lastUpdatedText: '上次更新',
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-present Viki',
    },
  },
})
