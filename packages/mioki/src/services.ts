import { logger } from './logger'

import type { MiokiCoreServiceContrib } from './builtins/core'

export interface MiokiServices extends Record<string, unknown>, MiokiCoreServiceContrib {}

const USER_SERVICE: MiokiServices = {} as MiokiServices

/**
 * 服务，由其他插件贡献的方法、数据等
 */
export const services: MiokiServices = USER_SERVICE

/**
 * 给 `Mioki` 添加公共服务，可用于插件间通信和共享数据
 *
 * 请注意合理设置插件的 `priority` 属性，以确保服务的正确加载顺序，`priority` 默认为 100，越小越先加载
 *
 * 建议需要调用 `addService` 的插件设置 `priority` 为 `10`
 */
export function addService(name: string, service: any, cover: boolean = true): () => void {
  logger.debug(`添加 mioki 服务: ${name} (覆盖: ${cover ? '是' : '否'})`)

  if (cover || !USER_SERVICE[name]) {
    USER_SERVICE[name] = service
  }

  return () => {
    logger.debug(`移除 mioki 服务: ${name}`)

    USER_SERVICE[name] = undefined
  }
}
