import { NapCat } from 'napcat-sdk'

const napcat = new NapCat({
  // protocol: 'ws',
  // host: '127.0.0.1',
  port: 3333,
  // token: '',
  logger: {
    ...NapCat.ABSTRACT_LOGGER,
    info: NapCat.CONSOLE_LOGGER.info,
    error: NapCat.CONSOLE_LOGGER.error,
  },
})

const _off = napcat.on('message.group', async () => {})

await napcat.run()

// _off()
// napcat.close()
