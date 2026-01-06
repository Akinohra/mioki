import { definePlugin } from 'mioki'

interface TempUser {
  triedTimes: number
  verifyNumbers: [number, number, number]
  kickTimer: ReturnType<typeof setTimeout>
  remindTimer: ReturnType<typeof setTimeout> | null
}

const DEFAULT_CONFIG = {
  timeout: 3 * 60_000, // 验证超时时间，默认 3 分钟
  lastRemindTime: 60_000 as number | false, // 最后一次提醒时间，单位毫秒，设置为 false 则不提醒
  maxRetryTimes: 3, // 最大重试次数
  // 进群验证相关命令
  cmds: { on: '#开启验证', off: '#关闭验证', bypass: '#绕过验证', reverify: '#重新验证' },
  // 验证成功提示语，支持群号自定义
  tips: {
    fallback: '✅ 验证成功，欢迎入群，这个号是机器人，有问题请先查看群公告',
  } as Record<number | 'fallback', string>,
  // 开启进群验证的群号列表
  groups: [] as number[],
}

export default definePlugin({
  name: '进群验证',
  version: '1.0.2',
  priority: 10,
  description: '进群验证',
  setup: async (ctx) => {
    const tempUsers = new Map<string, TempUser>()
    const config = await ctx.createStore(DEFAULT_CONFIG, { __dirname })

    async function isBotCanBanUser(group_id: number, user_id: number) {
      const info = await ctx.bot.getGroupMemberInfo(group_id, ctx.bot.uin)
      if (info.role === 'member') return false
      if (info.role === 'owner') return true
      const targetInfo = await ctx.bot.getGroupMemberInfo(group_id, user_id)
      return targetInfo.role === 'member'
    }

    // 处理群消息中的验证相关命令
    ctx.handle('message.group', async (e) => {
      const text = ctx.text(e)
      const isMatchCmd = Object.values(config.data.cmds).includes(text)

      if (!isMatchCmd) return
      if (!ctx.hasRight(e)) return e.reply('不支持小处男使用')

      const mentionedUser = await ctx.getMentionedUserId(e)

      switch (text) {
        case config.data.cmds.on: {
          const info = await e.group.getMemberInfo(ctx.bot.uin)
          if (info.role === 'member') return e.reply('权限不足，请给我群主/管理员')
          config.update((c) => void (c.groups = ctx.unique([...c.groups, e.group_id])))
          return e.reply('✅ 已开启进群验证')
        }

        case config.data.cmds.off: {
          config.update((c) => {
            const idx = c.groups.indexOf(e.group_id)
            if (idx === -1) return e.reply('进群验证已经关闭')
            c.groups.splice(idx, 1)
            e.reply('✅ 已关闭进群验证')
          })
          return
        }
      }

      if (!mentionedUser) return e.reply('请 @ 需要操作的用户')

      if (!config.data.groups.includes(e.group.group_id))
        return e.reply(`请先发送「${config.data.cmds.on}」开启本群「进群验证」功能`)

      switch (text) {
        case config.data.cmds.bypass: {
          clearUser(e.group.group_id, mentionedUser)
          return e.reply(`✅ 已绕过验证，欢迎入群`)
        }

        case config.data.cmds.reverify: {
          if (ctx.bot.uin === mentionedUser) return e.reply('八嘎！！！')
          if (ctx.hasRight(mentionedUser)) return e.reply('不能对我的主人这么无礼')

          if (!(await isBotCanBanUser(e.group.group_id, mentionedUser))) {
            return e.reply('权限不足，请给我群主或者确保目标用户不是管理员/群主')
          }

          return startVerifyUser(e.group.group_id, mentionedUser)
        }
      }
    })

    // 处理用户进群事件
    ctx.handle('notice.group.increase', async (e) => {
      if (!config.data.groups.includes(e.group_id)) return
      if (ctx.hasRight(e)) return

      startVerifyUser(e.group_id, e.user_id)
    })

    // 处理用户退群事件
    ctx.handle('notice.group.decrease', async (e) => {
      if (!config.data.groups.includes(e.group_id)) return

      if (tempUsers.has(genVerifyKey(e.group_id, e.user_id))) {
        clearUser(e.group_id, e.user_id)
        await ctx.bot.sendGroupMsg(e.group_id, `${e.user_id} 溜掉了，验证流程结束了`)
      }
    })

    // 处理群消息中的答案消息
    ctx.handle('message.group.normal', async (e) => {
      const { group_id, sender } = e
      const { tips, groups, maxRetryTimes } = config.data

      if (!groups.includes(group_id) || ctx.hasRight(e)) return

      const user = tempUsers.get(genVerifyKey(group_id, sender.user_id))
      if (!user) return

      const [_m, _n, result] = user.verifyNumbers
      const text = ctx.text(e)

      if (+text === result) {
        ctx.bot.sendGroupMsg(group_id, tips[group_id] || tips.fallback)
        clearUser(group_id, sender.user_id)
      } else {
        user.triedTimes += 1
        if (user.triedTimes >= maxRetryTimes) {
          clearUser(group_id, sender.user_id)
          await e.reply([ctx.segment.at(sender.user_id), ` ❌ 验证失败，次数达上限了，请重新申请`])
          await e.group.kick(sender.user_id)
        } else {
          await ctx.bot.sendGroupMsg(group_id, [
            ctx.segment.at(sender.user_id),
            ` ❌ 回答错误，还剩 ${maxRetryTimes - user.triedTimes} 次机会`,
          ])
        }
      }
    })

    // 开始验证用户
    function startVerifyUser(group_id: number, user_id: number) {
      const user = tempUsers.get(genVerifyKey(group_id, user_id))
      if (user) clearUser(group_id, user_id)

      const { lastRemindTime, timeout } = config.data
      const [x, y] = [ctx.randomInt(10, 99), ctx.randomInt(10, 99)]
      const [m, n] = [Math.max(x, y), Math.min(x, y)]
      const operator = ctx.randomItem(['+', '-'])
      const isPlus = operator === '+'
      const verifyCode = isPlus ? m + n : m - n

      const kickTimer = setTimeout(async () => {
        clearUser(group_id, user_id)
        await ctx.bot.sendGroupMsg(group_id, [ctx.segment.at(user_id), `❌ 验证超时，请重新申请`])
        await ctx.bot.kickGroupMember(group_id, user_id)
      }, timeout)

      const remindTimer =
        lastRemindTime && lastRemindTime > 0
          ? setTimeout(() => {
              ctx.bot.sendGroupMsg(group_id, [
                ctx.segment.at(user_id),
                ` 进群验证还剩 ${lastRemindTime / 1000} 秒，请发送「${mathFormula}」的运算结果，不听话会被移出群聊`,
              ])
            }, timeout - lastRemindTime)
          : null

      tempUsers.set(genVerifyKey(group_id, user_id), {
        triedTimes: 0,
        verifyNumbers: [m, n, verifyCode],
        kickTimer,
        remindTimer,
      })

      const seconds = Math.round(timeout / 1000)
      const mathFormula = `${m}${operator}${n}`

      ctx.bot.sendGroupMsg(group_id, [
        ctx.segment.at(user_id),
        ` 请在「${seconds}」秒内发送「${mathFormula}」的运算结果，不听话会被移出群聊`,
      ])
    }

    // 清理用户验证状态
    function clearUser(group_id: number, user_id: number) {
      const mapKey = genVerifyKey(group_id, user_id)
      const user = tempUsers.get(mapKey)

      if (user) {
        user.kickTimer && clearTimeout(user.kickTimer)
        user.remindTimer && clearTimeout(user.remindTimer)
        tempUsers.delete(mapKey)
      }
    }

    // 生成用户验证的唯一 key
    function genVerifyKey(group_id: number, user_id: number) {
      return `${group_id}_${user_id}`
    }

    // 插件卸载时清理所有待验证用户
    return () => {
      for (const [key] of tempUsers) {
        const [group_id, user_id] = key.split('_').map(Number)
        clearUser(group_id, user_id)
      }
    }
  },
})
