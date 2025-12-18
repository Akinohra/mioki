import pino, { type LevelWithSilentOrString } from 'pino'

import type { Logger } from 'napcat-sdk'

export const getMiokiLogger = (level: LevelWithSilentOrString): Logger => {
  return pino({
    level: level,
    name: 'mioki',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  })
}
