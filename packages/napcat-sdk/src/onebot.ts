export interface MediaProps {
  url: string
  path: string
  file: (string & {}) | 'marketface'
  file_id: string
  file_size: string
  file_unique: string
}

export type MessageElement =
  | { type: 'text'; text: string }
  | { type: 'at'; qq: 'all' | (string & {}) }
  | { type: 'reply'; id: string }
  | { type: 'face'; id: number }
  | ({ type: 'image'; summary?: string; sub_type?: string } & MediaProps)
  | ({ type: 'record' } & MediaProps)
  | ({ type: 'video' } & MediaProps)

export type NormalizedElementToSend =
  | { type: 'text'; data: { text: string } }
  | { type: 'at'; data: { qq: 'all' | (string & {}) | number } }
  | { type: 'reply'; data: { id: string } }
  | { type: 'face'; data: { id: number } }
  | { type: 'bface'; data: { id: number } }
  | { type: 'image'; data: { file: string; name?: string; summary?: string; sub_type?: string } }
  | { type: 'video'; data: { file: string; name?: string; thumb?: string } }
  | { type: 'record'; data: { file: string; name?: string } }

type FlattenData<T extends { type: string }> = T extends { data: infer U } ? U & { type: T['type'] } : never

export type NormalizedElement = FlattenData<NormalizedElementToSend>

export type Sendable = string | NormalizedElement

export type PostType = 'meta_event' | 'message'
export type MetaEventType = 'heartbeat' | 'lifecycle'
export type MessageType = 'private' | 'group'

export type EventBase<T extends PostType, U extends object> = U & { time: number; self_id: number; post_type: T }

export type MetaEventBase<T extends MetaEventType, U extends object> = U &
  EventBase<'meta_event', { meta_event_type: T }>

export type MetaEvent =
  | MetaEventBase<'heartbeat', { status: { online: boolean; good: boolean }; interval: number }>
  | MetaEventBase<'lifecycle', { sub_type: 'connect' | 'disconnect' }>

type Reply = (sendable: Sendable | Sendable[], reply?: boolean) => Promise<{ message_id: string }>

export type MessageEventBase<T extends MessageType, U extends object> = U &
  EventBase<
    'message',
    {
      message_type: T
      message_seq: number
      real_id: number
      real_seq: number
      raw_message: string
      message: MessageElement[]
      reply: Reply
    }
  >

export type PrivateMessageEvent = MessageEventBase<
  'private',
  {
    user_id: number
    message: string
    sub_type: 'friend'
    target_id: number
    sender: {
      user_id: number
      nickname: string
    }
  }
>

export type GroupMessageEvent = MessageEventBase<
  'group',
  {
    group_id: number
    group_name: string
    user_id: number
    message: string
    sub_type: 'normal'
    sender: {
      user_id: number
      nickname: string
      card: string
      role: 'owner' | 'admin' | 'member'
    }
  }
>

export type MessageEvent = PrivateMessageEvent | GroupMessageEvent

export interface OneBotEventMap {
  meta_event: MetaEvent
  message: MessageEvent
  'message.private': PrivateMessageEvent
  'message.group': GroupMessageEvent
}
