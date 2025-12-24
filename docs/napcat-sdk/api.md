# NapCat SDK API {#api}

本文档详细介绍 NapCat SDK 提供的所有 API。

## NapCat 实例属性 {#properties}

### uin

机器人 QQ 号。

```ts
napcat.uin // number
```

### nickname

机器人昵称。

```ts
napcat.nickname // string
```

### stat

统计数据，包括收发消息数量。

```ts
napcat.stat
// {
//   start_time: number,      // 启动时间（毫秒时间戳）
//   recv: { group: number, private: number },  // 接收消息数
//   send: { group: number, private: number },  // 发送消息数
// }
```

### segment {#napcat-segment}

消息段构造器，用于构造各种类型的消息。

```ts
napcat.segment.text('文本')
napcat.segment.at(123456789)
napcat.segment.image('https://...')
// ... 更多消息段
```

### ws

WebSocket 实例（内部使用）。

```ts
napcat.ws // WebSocket
```

## 连接管理 {#connection}

### run()

启动 NapCat SDK，建立 WebSocket 连接。

```ts
await napcat.run(): Promise<void>
```

**示例：**

```ts
const napcat = new NapCat({ token: 'xxx' })
await napcat.run()
console.log('已连接')
```

### close()

关闭 WebSocket 连接，销毁实例。

```ts
napcat.close(): void
```

**示例：**

```ts
napcat.close()
console.log('连接已关闭')
```

### isOnline()

检查机器人是否在线。

```ts
napcat.isOnline(): boolean
```

**示例：**

```ts
if (napcat.isOnline()) {
  console.log('机器人在线')
}
```

## 事件处理 {#events}

### on()

注册事件监听器。

```ts
napcat.on<T extends keyof EventMap>(
  type: T,
  handler: (event: EventMap[T]) => void
): void
```

**示例：**

```ts
napcat.on('message', (event) => {
  console.log(event.raw_message)
})

napcat.on('message.group', (event) => {
  console.log(`群消息：${event.raw_message}`)
})
```

### once()

注册一次性事件监听器，触发后自动移除。

```ts
napcat.once<T extends keyof EventMap>(
  type: T,
  handler: (event: EventMap[T]) => void
): void
```

**示例：**

```ts
napcat.once('napcat.connected', (info) => {
  console.log(`首次连接：${info.nickname}`)
})
```

### off()

移除事件监听器。

```ts
napcat.off<T extends keyof EventMap>(
  type: T,
  handler: (event: EventMap[T]) => void
): void
```

**示例：**

```ts
const handler = (event) => console.log(event)
napcat.on('message', handler)
// 稍后移除
napcat.off('message', handler)
```

## 消息发送 {#send-message}

### sendGroupMsg()

发送群消息。

```ts
napcat.sendGroupMsg(
  group_id: number,
  sendable: Arrayable<Sendable>
): Promise<{ message_id: number }>
```

**参数：**

| 参数       | 类型                  | 说明     |
| ---------- | --------------------- | -------- |
| `group_id` | `number`              | 群号     |
| `sendable` | `Arrayable<Sendable>` | 消息内容 |

**示例：**

```ts
// 发送文本
await napcat.sendGroupMsg(123456789, 'Hello!')

// 发送复合消息
await napcat.sendGroupMsg(123456789, [
  segment.at(111222333),
  segment.text(' 你好！'),
])
```

### sendPrivateMsg()

发送私聊消息。

```ts
napcat.sendPrivateMsg(
  user_id: number,
  sendable: Arrayable<Sendable>
): Promise<{ message_id: number }>
```

**参数：**

| 参数       | 类型                  | 说明       |
| ---------- | --------------------- | ---------- |
| `user_id`  | `number`              | 对方 QQ 号 |
| `sendable` | `Arrayable<Sendable>` | 消息内容   |

**示例：**

```ts
await napcat.sendPrivateMsg(987654321, 'Hello!')
```

### sendLike()

给好友点赞。

```ts
napcat.sendLike(user_id: number, times?: number): Promise<void>
```

**参数：**

| 参数      | 类型     | 默认值 | 说明             |
| --------- | -------- | ------ | ---------------- |
| `user_id` | `number` | -      | 对方 QQ 号       |
| `times`   | `number` | 1      | 点赞次数（1-10） |

**示例：**

```ts
await napcat.sendLike(123456789, 10)
```

## 消息操作 {#message-actions}

### recallMsg()

撤回消息。

```ts
napcat.recallMsg(message_id: number): Promise<void>
```

**示例：**

```ts
const { message_id } = await napcat.sendGroupMsg(123, 'test')
// 5秒后撤回
setTimeout(() => napcat.recallMsg(message_id), 5000)
```

### getMsg()

获取消息详情。

```ts
napcat.getMsg(message_id: number | string): Promise<MessageEvent | null>
```

**示例：**

```ts
const msg = await napcat.getMsg(12345)
if (msg) {
  console.log(msg.raw_message)
}
```

### addReaction()

给消息添加表态（Emoji 回应）。

```ts
napcat.addReaction(message_id: number, emoji_id: string): Promise<void>
```

**参数：**

| 参数         | 类型     | 说明    |
| ------------ | -------- | ------- |
| `message_id` | `number` | 消息 ID |
| `emoji_id`   | `string` | 表情 ID |

**示例：**

```ts
await napcat.addReaction(12345, '66') // 点赞表情
```

### delReaction()

移除消息表态。

```ts
napcat.delReaction(message_id: number, emoji_id: string): Promise<void>
```

### setEssenceMsg()

设置精华消息。

```ts
napcat.setEssenceMsg(message_id: number): Promise<void>
```

### deleteEssenceMsg()

移除精华消息。

```ts
napcat.deleteEssenceMsg(message_id: number): Promise<void>
```

## 群操作 {#group-actions}

### pickGroup()

获取群对象，可用于执行群相关操作。

```ts
napcat.pickGroup(group_id: number): Promise<GroupWithInfo | null>
```

**返回的群对象包含以下方法：**

| 方法                       | 说明           |
| -------------------------- | -------------- |
| `sendMsg(msg)`             | 发送群消息     |
| `getInfo()`                | 获取群信息     |
| `getMemberList()`          | 获取群成员列表 |
| `getMemberInfo(user_id)`   | 获取群成员信息 |
| `setCard(user_id, card)`   | 设置群名片     |
| `setTitle(user_id, title)` | 设置群头衔     |
| `ban(user_id, duration)`   | 禁言成员       |
| `sign()`                   | 群签到         |
| `recall(message_id)`       | 撤回消息       |
| `setEssence(message_id)`   | 设置精华       |
| `delEssence(message_id)`   | 移除精华       |

**示例：**

```ts
const group = await napcat.pickGroup(123456789)
if (group) {
  await group.sendMsg('Hello!')
  const info = await group.getInfo()
  console.log(`群名：${info.group_name}，成员数：${info.member_count}`)
}
```

### getGroupList()

获取群列表。

```ts
napcat.getGroupList(): Promise<Group[]>
```

### getGroupInfo()

获取群信息。

```ts
napcat.getGroupInfo(group_id: number): Promise<GroupInfo>
```

### getGroupMemberList()

获取群成员列表。

```ts
napcat.getGroupMemberList(group_id: number): Promise<GroupMemberInfo[]>
```

### getGroupMemberInfo()

获取群成员信息。

```ts
napcat.getGroupMemberInfo(group_id: number, user_id: number): Promise<GroupMemberInfo>
```

### setGroupBan()

禁言群成员。

```ts
napcat.setGroupBan(group_id: number, user_id: number, duration: number): Promise<void>
```

**参数：**

| 参数       | 类型     | 说明                           |
| ---------- | -------- | ------------------------------ |
| `group_id` | `number` | 群号                           |
| `user_id`  | `number` | 成员 QQ 号                     |
| `duration` | `number` | 禁言时长（秒），0 表示解除禁言 |

### setGroupCard()

设置群成员名片。

```ts
napcat.setGroupCard(group_id: number, user_id: number, card: string): Promise<void>
```

### setGroupSpecialTitle()

设置群成员专属头衔。

```ts
napcat.setGroupSpecialTitle(group_id: number, user_id: number, title: string): Promise<void>
```

### setGroupSign()

群签到。

```ts
napcat.setGroupSign(group_id: number): Promise<void>
```

## 好友操作 {#friend-actions}

### pickFriend()

获取好友对象，可用于执行好友相关操作。

```ts
napcat.pickFriend(user_id: number): Promise<FriendWithInfo | null>
```

**返回的好友对象包含以下方法：**

| 方法                    | 说明             |
| ----------------------- | ---------------- |
| `sendMsg(msg)`          | 发送私聊消息     |
| `getInfo()`             | 获取好友详细信息 |
| `delete(block?, both?)` | 删除好友         |

**示例：**

```ts
const friend = await napcat.pickFriend(987654321)
if (friend) {
  await friend.sendMsg('Hello!')
  const info = await friend.getInfo()
  console.log(`昵称：${info.nickname}`)
}
```

### getFriendList()

获取好友列表。

```ts
napcat.getFriendList(): Promise<Friend[]>
```

### getStrangerInfo()

获取陌生人信息。

```ts
napcat.getStrangerInfo(user_id: number): Promise<StrangerInfo>
```

### deleteFriend()

删除好友。

```ts
napcat.deleteFriend(user_id: number, block?: boolean, both?: boolean): Promise<void>
```

**参数：**

| 参数      | 类型      | 默认值  | 说明         |
| --------- | --------- | ------- | ------------ |
| `user_id` | `number`  | -       | 好友 QQ 号   |
| `block`   | `boolean` | `false` | 是否拉黑     |
| `both`    | `boolean` | `false` | 是否双向删除 |

## Cookie 相关 {#cookie}

### getCookie()

获取指定域名的 Cookie 信息。

```ts
napcat.getCookie(domain: string): Promise<{
  uin: number
  pskey: string
  skey: string
  gtk: string
  bkn: string
  cookie: string
  legacyCookie: string
}>
```

**示例：**

```ts
const { cookie, bkn } = await napcat.getCookie('qzone.qq.com')
console.log(`Cookie: ${cookie}`)
console.log(`BKN: ${bkn}`)
```

### getPskey()

获取指定域名的 Pskey。

```ts
napcat.getPskey(domain: string): Promise<string>
```

### getBkn()

获取 BKN 值。

```ts
napcat.getBkn(): Promise<string>
```

## 系统信息 {#system}

### getVersionInfo()

获取版本信息。

```ts
napcat.getVersionInfo(): Promise<{
  app_name: string
  protocol_version: string
  app_version: string
}>
```

### getLoginInfo()

获取登录信息。

```ts
napcat.getLoginInfo(): Promise<{
  user_id: number
  nickname: string
}>
```

## 通用 API 调用 {#napcat-api}

### api()

调用任意 OneBot API 或 NapCat 扩展 API。

```ts
napcat.api<T>(action: string, params?: Record<string, any>): Promise<T>
```

**示例：**

```ts
// 调用 OneBot 标准 API
const status = await napcat.api('get_status')

// 调用 NapCat 扩展 API
const result = await napcat.api('set_group_sign', { group_id: 123456789 })

// 获取群公告
const notices = await napcat.api('_get_group_notice', { group_id: 123456789 })
```

## 消息段构造器 {#segment}

`segment` 对象提供了便捷的消息段构造方法：

### segment.text()

创建文本消息段。

```ts
segment.text(text: string): SendElement
```

### segment.at()

创建 @消息段。

```ts
segment.at(qq: number | 'all'): SendElement

// @某人
segment.at(123456789)

// @全体成员
segment.at('all')
```

### segment.face()

创建 QQ 表情消息段。

```ts
segment.face(id: number): SendElement

segment.face(66) // 爱心
segment.face(21) // 大哭
```

### segment.image()

创建图片消息段。

```ts
segment.image(file: string, options?: ImageOptions): SendElement

// URL
segment.image('https://example.com/image.png')

// 本地文件
segment.image('file:///path/to/image.png')

// Base64
segment.image('base64://...')
```

### segment.record()

创建语音消息段。

```ts
segment.record(file: string, options?: RecordOptions): SendElement
```

### segment.video()

创建视频消息段。

```ts
segment.video(file: string, options?: VideoOptions): SendElement
```

### segment.reply()

创建回复消息段（引用回复）。

```ts
segment.reply(id: string): SendElement
```

### segment.json()

创建 JSON 卡片消息段。

```ts
segment.json(data: string): SendElement
```

### segment.forward()

创建合并转发消息段。

```ts
segment.forward(id: string): SendElement
```

### segment.node()

创建转发节点消息段。

```ts
segment.node(options: {
  user_id?: string
  nickname?: string
  content?: SendElement[]
  id?: string
}): SendElement
```

### segment.music()

创建音乐分享消息段。

```ts
// 平台音乐
segment.music(platform: 'qq' | '163' | 'kugou' | 'migu' | 'kuwo', id: string): SendElement

// 自定义音乐
segment.musicCustom(title: string, audio: string, url: string, options?: {
  image?: string
  singer?: string
}): SendElement
```

### segment.contact()

创建推荐联系人/群消息段。

```ts
segment.contact(type: 'qq' | 'group', id: string): SendElement
```

### segment.poke()

创建戳一戳消息段。

```ts
segment.poke(): SendElement
```

### segment.file()

创建文件消息段。

```ts
segment.file(file: string, options?: FileOptions): SendElement
```

## 下一步 {#next-steps}

- 阅读 [事件文档](/napcat-sdk/event) 了解所有事件类型
- 回到 [NapCat SDK 概览](/napcat-sdk/) 查看更多示例
