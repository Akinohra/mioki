import { NapCat, CONSOLE_LOGGER } from 'napcat-sdk'

const napcat = new NapCat({
  logger: CONSOLE_LOGGER,
  // token for local ws test, it's safe to expose in public
  token: 'cdc93b212524c0c0a0a162f1edec347a',
})

napcat.on('message.private', async (e) => {
  if (e.raw_message === 'hello') {
    const { message_id } = await e.reply(['Hello, Mioki!', napcat.segment.face(175)], true)
    console.log('message_id', message_id)
  }
})

await napcat.bootstrap()
