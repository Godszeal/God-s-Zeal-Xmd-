import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } from '@whiskeysockets/baileys'
import pino from 'pino'
import fs from 'fs'

const phone = (process.argv[2] || '').replace(/\D/g,'')

async function main() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const { version } = await fetchLatestBaileysVersion()
  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    browser: Browsers.ubuntu('Chrome'),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    }
  })
  sock.ev.on('creds.update', saveCreds)
  if (!sock.authState.creds.registered) {
    const code = await sock.requestPairingCode(phone)
    console.log('PAIR_CODE:', code)
    fs.mkdirSync('session', { recursive: true })
    fs.writeFileSync('session/pair_code.txt', String(code), 'utf8')
  } else {
    console.log('ALREADY_REGISTERED')
  }
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
