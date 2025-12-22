import { ChromeUA, definePlugin } from 'mioki'

declare module 'mioki' {
  export interface MiokiServices {
    /** 统一扫码登录服务 */
    login: {
      /** 扫码登录常量类型 */
      QRLogin: typeof QRLogin
      /** 扫码登录 */
      qrLogin: typeof qrLogin
      /** 小程序扫码登录 */
      loginMiniProgram: typeof loginMiniProgram
      /** 将 cookie 对象转换为字符串 */
      stringifyCookie: typeof stringifyCookie
      /** iOS QQ User-Agent */
      UA_IOS_QQ: string
    }
  }
}

const UA_IOS_QQ = 'QQ/9.1.25.607 CFNetwork/1568.300.101 Darwin/24.2.0'

export default definePlugin({
  name: 'qr-login',
  description: '统一扫码登录服务',
  version: '1.0.0',
  priority: 10,
  setup(ctx) {
    ctx.logger.info('加载插件 qr-login')

    ctx.addService('login', {
      QRLogin,
      qrLogin,
      loginMiniProgram,
      stringifyCookie,
      UA_IOS_QQ,
    })
  },
})

interface QRLoginItem {
  aid: string
  daid: string
  redirectUri: string
  referrer?: string
  ptThirdAid?: string
  responseType?: string
  openapi?: string
}

export const QRLogin: Record<'vip' | 'qzone' | 'music' | 'wegame' | (string & {}), QRLoginItem> = {
  vip: {
    aid: '8000201',
    daid: '18',
    redirectUri: 'https://vip.qq.com/loginsuccess.html',
    referrer:
      'https://xui.ptlogin2.qq.com/cgi-bin/xlogin?appid=8000201&style=20&s_url=https%3A%2F%2Fvip.qq.com%2Floginsuccess.html&maskOpacity=60&daid=18&target=self',
  },
  qzone: {
    aid: '549000912',
    daid: '5',
    redirectUri: 'https://qzs.qzone.qq.com/qzone/v5/loginsucc.html?para=izone',
    referrer: 'https://qzone.qq.com/',
  },
  music: {
    aid: '716027609',
    daid: '383',
    redirectUri: 'https://y.qq.com/portal/wx_redirect.html?login_type=1&surl=https%3A%2F%2Fy.qq.com%2F',
    ptThirdAid: '100497308',
    responseType: 'code',
    openapi: '1010_1030',
  },
  wegame: {
    aid: '1600001063',
    daid: '733',
    redirectUri: 'https://www.wegame.com.cn/middle/login/third_callback.html',
    referrer: 'https://www.wegame.com.cn/',
  },
  val: {
    aid: '716027609',
    daid: '383',
    redirectUri:
      'https://val.qq.com/comm-htdocs/login/qc_redirect.html?parent_domain=https%3A%2F%2Fval.qq.com&isMiloSDK=1&isPc=1',
    ptThirdAid: '102059301',
    responseType: 'code',
    openapi: '1010_1030',
  },
}

export interface CheckRes {
  ret: string
  extret: string
  jumpUrl: string
  redirect: string
  msg: string
  nickname?: string
}

export interface QRLoginOptions {
  onQRcode?: (qrcode: Buffer) => any
  onPending?: (res: CheckRes) => any
  onScanned?: (res: CheckRes) => any
  onRefused?: (res: CheckRes) => any
  onExpired?: (res: CheckRes) => any
  onSuccess?: (res: CheckRes) => any
  afterOath2?: (cookie: Record<string, string>, res: CheckRes) => any
  /**
   * 超时时间，不超过 120 秒，因为二维码有效期为 120 秒
   */
  waitTimeout?: number
  onTimeout?: () => any
  checkInterval?: number
}

export async function qrLogin(item: QRLoginItem, options: QRLoginOptions = {}): Promise<string> {
  const {
    waitTimeout = 120_000,
    checkInterval = 1_000,
    onTimeout = () => {},
    onQRcode = () => {},
    onPending = () => {},
    onScanned = () => {},
    onRefused = () => {},
    onExpired = () => {},
    onSuccess = () => {},
    afterOath2 = () => {},
  } = options

  const { qrsig, qrcode } = await requestQrsig(item)

  await onQRcode(qrcode)

  await new Promise((resolve) => setTimeout(resolve, 1_000))

  return new Promise((resolve, reject) => {
    const timeoutTimer = setTimeout(() => {
      clearInterval(intervalTimer)
      onTimeout()
      reject(new Error('timeout'))
    }, waitTimeout)

    let preStatus = 'none'

    const clear = () => {
      clearInterval(intervalTimer)
      clearTimeout(timeoutTimer)
    }

    const intervalTimer = setInterval(async () => {
      try {
        const res = await checkQRLogin(item, qrsig)

        switch (res.ret) {
          case '66': {
            if (preStatus !== '66') {
              onPending(res)
            }
            break
          }

          case '67': {
            if (preStatus !== '67') {
              onScanned(res)
            }
            break
          }

          case '65': {
            clear()
            onExpired(res)
            break
          }

          case '68': {
            clear()
            onRefused(res)
            break
          }

          case '0': {
            clear()
            onSuccess(res)

            const res1 = await fetch(res.jumpUrl, { redirect: 'manual' })
            const location = res1.headers.get('location') || ''
            const cookie = parseSetCookie(res1.headers.get('set-cookie') || '') || {}

            const isThird = location?.includes('graph.qq.com/oauth2.0')

            if (isThird) {
              resolve(await afterOath2?.(cookie, res))
              return
            }

            cookie.p_uin = cookie.uin || ''
            resolve(stringifyCookie(cookie))
            break
          }

          default: {
            clear()
            reject(new Error('unknown status'))
          }
        }

        preStatus = res.ret
      } catch (e) {
        clear()
        reject(e)
      }
    }, checkInterval)
  })
}

export async function requestQrsig(item: QRLoginItem) {
  const params = new URLSearchParams()

  params.set('appid', String(item.aid))
  params.set('e', '2')
  params.set('l', 'M')
  params.set('s', '3')
  params.set('d', '72')
  params.set('v', '4')
  params.set('t', String(Math.random()))
  params.set('daid', String(item.daid))

  // https://ssl.ptlogin2.qq.com/ptqrshow?appid=716027609&e=2&l=M&s=3&d=72&v=4&t=0.2707776950115788&daid=383&pt_3rd_aid=100497308&u1=https%3A%2F%2Fgraph.qq.com%2Foauth2.0%2Flogin_jump

  if ('ptThirdAid' in item) {
    params.set('pt_3rd_aid', String(item.ptThirdAid))
    params.set('u1', 'https://graph.qq.com/oauth2.0/login_jump')
  } else {
    params.set('u1', item.redirectUri)
  }

  // https://xui.ptlogin2.qq.com/ssl/ptqrshow
  const url = `https://ssl.ptlogin2.qq.com/ptqrshow?${params.toString()}`

  const response = await fetch(url, {
    headers: {
      referer: `https://xui.ptlogin2.qq.com/cgi-bin/xlogin?appid=${item.aid}&style=20&s_url=${params.get('u1')}&maskOpacity=60&daid=${params.get('daid')}&target=self`,
      'user-agent': ChromeUA,
    },
  })

  const qrsig = /qrsig=(.*?);/.exec(response.headers.get('set-cookie') || '')?.[1]?.trim() || ''
  const qrcode = Buffer.from(await response.arrayBuffer())

  return {
    qrsig,
    qrcode,
  }
}

export async function checkQRLogin(item: QRLoginItem, qrsig: string) {
  const params = new URLSearchParams()

  params.set('ptqrtoken', String(hash(qrsig)))
  params.set('from_ui', '1')
  params.set('aid', String(item.aid))
  params.set('daid', String(item.daid))

  if ('ptThirdAid' in item) {
    params.set('pt_3rd_aid', String(item.ptThirdAid))
    params.set('u1', 'https://graph.qq.com/oauth2.0/login_jump')
  } else {
    params.set('u1', item.redirectUri)
  }

  const api = `https://ssl.ptlogin2.qq.com/ptqrlogin?${params.toString()}`

  // ptuiCB('66','0','','0','二维码未失效。', '')
  // ptuiCB('67','0','','0','二维码认证中。', '')
  // ptuiCB('65','0','','0','二维码已失效。', '')
  // ptuiCB('68','0','','0','本次登录已被拒绝', '')
  // ptuiCB('0', '0', 'https://ptlogin2.vip.qq.com/check_sig?pttype=1&uin=1141284758&service=ptqrlogin&nodirect=0&ptsigx=a9c52c0f105bd076e1be5f864b4fc1f548beda984f1d418d18e239ca07e7d56ee153ca5f57e81e55a7a92868f0e05ff4200f9b2a73898d6092273656c0f8cd602a3e271b46f8ca95&s_url=https%3A%2F%2Fvip.qq.com%2Floginsuccess.html&f_url=&ptlang=2052&ptredirect=100&aid=8000201&daid=18&j_later=0&low_login_hour=0&regmaster=0&pt_login_type=3&pt_aid=0&pt_aaid=16&pt_light=0&pt_3rd_aid=0', '0', '登录成功！', 'Viki ', '')

  // ret 0 extret 1  redirect 3 Mmsg 4

  const response = await fetch(api, {
    headers: {
      cookie: `qrsig=${qrsig}`,
      referer: `https://xui.ptlogin2.qq.com/cgi-bin/xlogin?appid=${item.aid}&style=20&s_url=${encodeURIComponent(item.redirectUri)}&maskOpacity=60&daid=18&target=self`,
      'user-agent': ChromeUA,
    },
  })

  const res = await response.text()

  const [ret, extret, jumpUrl, redirect, msg, nickname, _] = res
    .replace('ptuiCB(', '')
    .replace(')', '')
    .split(',')
    .map((v) => v.trim().replace(/^'(.*)?'$/, '$1'))

  if (!ret) {
    throw new Error('checkQRLogin failed')
  }

  return {
    /**
     * 66: 二维码未失效
     * 67: 二维码认证中
     * 65: 二维码已失效
     * 68: 本次登录已被拒绝
     * 0: 登录成功
     */
    ret,
    extret,
    jumpUrl,
    redirect,
    msg,
    nickname,
  }
}

export function hash(t: string) {
  let e = 0
  for (let n = 0, o = t.length; n < o; ++n) {
    e += (e << 5) + t.charCodeAt(n)
  }
  return 2147483647 & e
}

export function getGTk(pskey: string) {
  let gkt = 5381
  for (let i = 0, len = pskey.length; i < len; ++i) {
    gkt += (gkt << 5) + pskey.charCodeAt(i)
  }
  return gkt & 0x7fffffff
}

export function parseCookie(cookie: string) {
  return cookie
    .split(';')
    .map((item) => item.split('='))
    .reduce(
      (acc, [key, value]) => {
        acc[key.trim()] = value.trim()
        return acc
      },
      {} as Record<string, string>,
    )
}

export function parseSetCookie(setCookieHeader: string) {
  const cookies: Record<string, string> = {}

  const cookieEntries = setCookieHeader
    .split(',')
    .map((item, index, array) => {
      if (item.includes('Expires=') && index > 0) return `${array[index - 1]},${item}`
      return item
    })
    .filter((item, index, array) => {
      return !item.includes('Expires=') || index === array.findIndex((i) => i === item)
    })

  for (const entry of cookieEntries) {
    const parts = entry.split(';')
    const [keyValue] = parts
    if (keyValue) {
      const [name, value] = keyValue.split('=')
      if (name && value !== undefined) {
        cookies[name.trim()] = value.trim()
      }
    }
  }

  return cookies
}

function stringifyCookie(cookie: Record<string, string>) {
  return Object.entries(cookie)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')
}

export function transformSetCookie(cookie: string | Record<string, string>) {
  const cookies = typeof cookie === 'string' ? parseSetCookie(cookie) : cookie
  return stringifyCookie(cookies)
}

interface MiniProgramLoginOptions {
  onLink?(link: string): void
  onRefused?(): void
  onExpired?(): void
  onSuccess?(): void
  onTimeout?(): void
  onPending?(): void
  onScanned?(): void
  afterScan?(cookie: Record<string, string>): any
  /**
   * 超时时间，不超过 120 秒，因为二维码有效期为 120 秒
   */
  waitTimeout?: number
  checkInterval?: number
}

export async function loginMiniProgram(
  appid: number | string,
  options: MiniProgramLoginOptions,
): Promise<{ ticket: string; code: string }> {
  const {
    waitTimeout = 120_000,
    checkInterval = 1_000,
    onTimeout = () => {},
    onLink = () => {},
    onRefused = () => {},
    onExpired = () => {},
    onSuccess = () => {},
    onPending = () => {},
  } = options

  const { url, code } = await requestLoginViaDevTools()

  onLink(url)

  return new Promise((resolve, reject) => {
    const timeoutTimer = setTimeout(() => {
      clearInterval(intervalTimer)
      onTimeout()
      reject(new Error('timeout'))
    }, waitTimeout)

    let preStatus = 'none'

    const clear = () => {
      clearInterval(intervalTimer)
      clearTimeout(timeoutTimer)
    }

    const intervalTimer = setInterval(async () => {
      try {
        const res = await queryDevToolsLoginStatus(code)

        switch (res.status) {
          case 'Wait': {
            if (preStatus !== 'Wait') {
              onPending()
            }
            break
          }

          case 'OK': {
            clear()
            onSuccess()
            const { ticket = '' } = res

            const code = await getAuthCodeViaTicket(ticket, appid)

            resolve({
              ticket,
              code,
            })
            break
          }

          case 'Expired': {
            clear()
            onExpired()
            break
          }

          case 'Used': {
            clear()
            onRefused()
            break
          }

          case 'Error': {
            clear()
            reject(new Error('unknown status'))
            break
          }
        }

        preStatus = res.status
      } catch (e) {
        clear()
        reject(e)
      }
    }, checkInterval)
  })
}

export async function requestLoginViaDevTools() {
  const response = await fetch('https://q.qq.com/ide/devtoolAuth/GetLoginCode', {
    method: 'GET',
    headers: {
      qua: 'V1_HT5_QDT_0.70.2209190_x64_0_DEV_D',
      host: 'q.qq.com',
      accept: 'application/json',
      'content-type': 'application/json',
    },
  })

  const { code, data } = await response.json()

  if (+code !== 0) throw new Error('requestLoginViaDevTools failed')

  return {
    code: data.code ?? '',
    url: `https://h5.qzone.qq.com/qqq/code/${data.code}?_proxy=1&from=ide`,
  }
}

/**
 * 获取开发者工具登录结果
 */
export async function queryDevToolsLoginStatus(code: string): Promise<{
  status: 'OK' | 'Wait' | 'Expired' | 'Used' | 'Error'
  ticket?: string
}> {
  const response = await fetch(`https://q.qq.com/ide/devtoolAuth/syncScanSateGetTicket?code=${code}`, {
    method: 'GET',
    headers: {
      qua: 'V1_HT5_QDT_0.70.2209190_x64_0_DEV_D',
      host: 'q.qq.com',
      accept: 'application/json',
      'content-type': 'application/json',
    },
  })

  if (!response.ok) return { status: 'Error' }

  // OK: { "code": 0, "data": { "code": "xxx", "ticket": "xxx", "ok": 1, "uin": "xxx" }, "message": "" }
  // Wait: { "code": 0, "data": { "code": "xxx" }, "message": "" }
  // Expired: { "code": 0, "data": { "code": "xxx" }, "message": "" }
  // Used: { "code": "-10003", "message": "process fail" }

  const { code: resCode, data } = await response.json()

  if (+resCode === 0) {
    if (+data.ok !== 1) return { status: 'Wait' }

    return {
      status: 'OK',
      ticket: data.ticket,
    }
  }

  if (+resCode === -10003) return { status: 'Used' }

  return { status: 'Error' }
}

/**
 * 通过开发者工具登录获取 AuthCode
 */
export async function getAuthCodeViaTicket(ticket: string, appid: number | string): Promise<string> {
  const response = await fetch('https://q.qq.com/ide/login', {
    method: 'POST',
    headers: {
      qua: 'V1_HT5_QDT_0.70.2209190_x64_0_DEV_D',
      host: 'q.qq.com',
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ appid, ticket }),
  })

  if (!response.ok) return ''

  const { code } = await response.json()

  return code || ''
}
