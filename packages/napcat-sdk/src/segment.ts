import type { ExtractByType } from './types'
import type { NormalizedElement as Element } from './onebot'

function createSegment<T extends string, D>(type: T, data: D) {
  return { type, ...data }
}

/**
 * 消息片段构造器
 */
export const segment = {
  /** 创建一个文本消息片段 */
  text: (text: string): Element => createSegment('text', { text }),
  /** 创建一个艾特消息片段 */
  at: (qq: 'all' | (string & {})): Element => createSegment('at', { qq }),
  /** 创建一个 QQ 表情消息片段 */
  face: (id: number): Element => createSegment('face', { id }),
  /** 创建一个回复消息片段 */
  reply: (id: string): Element => createSegment('reply', { id }),
  /** 创建一个图片消息片段 */
  image: (file: string, options?: Omit<ExtractByType<Element, 'image'>, 'type' | 'file'>): Element =>
    createSegment('image', { file, ...options }),
  /** 创建一个语音消息片段 */
  record: (file: string, options?: Omit<ExtractByType<Element, 'record'>, 'type' | 'file'>): Element =>
    createSegment('record', { file, ...options }),
  /** 创建一个视频消息片段 */
  video: (file: string, options?: Omit<ExtractByType<Element, 'video'>, 'type' | 'file'>): Element =>
    createSegment('video', { file, ...options }),
}
