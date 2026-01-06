import { definePlugin } from 'mioki'

export default definePlugin({
  name: 'demo',
  version: '1.0.0',
  async setup(ctx) {
    ctx.logger.info('Demo 插件已加载')

    // ctx.bot.nickname;
    // ctx.bot.uin;
    // ctx.bot.api('xxx', params);

    // ctx.bot.sendGroupMsg(123456789, 'Hello Group!') // 发送群消息

    // const group = await ctx.bot.pickGroup(123456789) // 使用群号选择一个群实例
    // group?.sign() // 调用群实例方法

    // const friend = await ctx.bot.pickFriend(987654321) // 使用好友号选择一个好友实例
    // friend?.delete() // 调用好友实例方法

    // 处理所有消息：群、好友
    ctx.handle('message', async (e) => {
      // 收到 hello 消息时回复 world
      if (e.raw_message === 'hello') {
        // 第二个参数表示是否回复原消息
        e.reply('world', true)
      }

      // 收到 love 消息时回复"爱你哟"和一个爱心 QQ 表情
      if (e.raw_message === 'love') {
        // 复杂消息消息可以使用数组组合
        e.reply(['爱你哟 ', ctx.segment.face(66)])
      }

      // 收到 壁纸 消息时回复今天的 bing 壁纸
      if (e.raw_message === '壁纸') {
        e.reply(ctx.segment.image('https://60s.viki.moe/v2/bing?encoding=image'))
      }

      // 收到 一言 消息时回复一言
      if (e.raw_message === '一言') {
        const data = await (await fetch('https://v1.hitokoto.cn/')).json()
        e.reply(data.hitokoto, true)
      }
    })

    ctx.handle('message.group', (e) => {
      // 处理群消息
      // 调用消息实例上挂载的快速方法
      // e.reply('这是群消息的回复') // 回复消息
      // e.recall() // 撤回消息
      // e.getQuoteMsg() // 获取引用的消息
      // e.group.getInfo(); // 也可以通过群消息事件获取群实例，并调用群实例方法获取群信息
    })

    ctx.handle('message.private', (e) => {
      // 处理好友消息
    })

    // 处理所有请求：好友、群，添加好友、邀请入群等等
    ctx.handle('request', (e) => {
      // e.approve() // 同意请求
      // e.reject()  // 拒绝请求
    })

    // 处理所有通知，好友、群的数量增加与减少、戳一戳、撤回等等
    ctx.handle('notice', (e) => {
      ctx.logger.info('Notice', e)
    })

    // 注册定时任务
    ctx.cron('*/3 * * * * *', async (ctx, task) => {
      ctx.logger.info('Cron', task)
    })

    return () => {
      ctx.logger.info('Demo 插件已卸载')
    }
  },
})
