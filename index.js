const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@phrolovaa/baileys');
const pino = require('pino');
const fs = require('fs');
const readline = require('readline'); 
const { Boom } = require('@hapi/boom'); 

const { connectDb, dbs } = require('./database');
const messageHandler = require('./handler'); 

process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);


let scheduleInterval = null;

async function startBot() {
    console.log('Menghubungkan ke Database...');
    await connectDb();

    connectToWhatsApp();
}

async function connectToWhatsApp() {
    const isRegistered = fs.existsSync('./bot_session/creds.json');
    let phoneNumber = '';

    if (!isRegistered) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const question = (text) => new Promise((resolve) => rl.question(text, resolve));
        const input = await question('Masukkan nomor WhatsApp Bot: ');
        phoneNumber = input.replace(/[^0-9]/g, ''); 
        rl.close();
    }

    const { state, saveCreds } = await useMultiFileAuthState('bot_session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version, 
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['Mac OS', 'Safari', '10.15.7'],
        printQRInTerminal: false
    });

    if (!isRegistered && phoneNumber) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(`KODE PAIRING ANDA: ${code}`);
            } catch (err) {}
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

  
    if (scheduleInterval) clearInterval(scheduleInterval);

    scheduleInterval = setInterval(async () => {
        const nowStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta', hour12: false });
        const now = new Date(nowStr);
        const hour = now.getHours().toString().padStart(2, '0');
        const minute = now.getMinutes().toString().padStart(2, '0');
        const timeStr = `${hour}:${minute}`;

        if (timeStr === "03:00" && dbs.schedDb.pagi.enabled && dbs.schedDb.pagi.target) {
            const randomMsg = dbs.schedDb.pagi.texts[Math.floor(Math.random() * dbs.schedDb.pagi.texts.length)];
            await sock.sendMessage(dbs.schedDb.pagi.target, { text: randomMsg }).catch(() => null);
        }
        if (timeStr === "23:00" && dbs.schedDb.malam.enabled && dbs.schedDb.malam.target) {
            const randomMsg = dbs.schedDb.malam.texts[Math.floor(Math.random() * dbs.schedDb.malam.texts.length)];
            await sock.sendMessage(dbs.schedDb.malam.target, { text: randomMsg }).catch(() => null);
        }

        for (let jid in dbs.groupDb) {
            const g = dbs.groupDb[jid];
            if (g.open === timeStr) {
                await sock.groupSettingUpdate(jid, 'not_announcement').catch(() => null);
                await sock.sendMessage(jid, { text: `Grup telah dibuka.` }).catch(() => null);
            }
            if (g.close === timeStr) {
                await sock.groupSettingUpdate(jid, 'announcement').catch(() => null);
                await sock.sendMessage(jid, { text: `Grup telah ditutup.` }).catch(() => null);
            }
        }
    }, 60000);


    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const error = lastDisconnect?.error;
            const statusCode = (error instanceof Boom) ? error.output?.statusCode : error?.statusCode;
            
 
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            console.log(`[KONEKSI] Terputus. Alasan: ${statusCode}. Auto-reconnect: ${shouldReconnect}`);

            if (shouldReconnect) {
                console.log('[KONEKSI] Mencoba menghubungkan ulang dalam 3 detik...');
  
                setTimeout(connectToWhatsApp, 3000);
            } else {
                console.log('[KONEKSI] Sesi telah di-logout dari HP. Silakan hapus folder bot_session dan daftar ulang.');
            }
        } else if (connection === 'connecting') {
            console.log('[KONEKSI] Sedang menyambungkan...');
        } else if (connection === 'open') {
            console.log('[KONEKSI] Bot Online dan Siap Digunakan!');
        }
    });

    sock.ev.on('call', async (calls) => {
        for (const call of calls) {
            if (call.status === 'offer') {
                try {
                    let callerId = call.from;
                    let cleanCallerId = callerId.includes(':') ? callerId.split(':')[0] + '@' + callerId.split('@')[1] : callerId;

                    await sock.rejectCall(call.id, callerId);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    try {
                        await sock.updateBlockStatus(cleanCallerId, 'block');
                    } catch (blockErr) {}
                } catch (e) {}
            }
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        await messageHandler(sock, m);
    });

    sock.ev.on('group-participants.update', async (update) => {
        const { id, participants, action } = update;
        if (action !== 'add') return;

        if (!dbs.groupDb || !dbs.groupDb[id] || !dbs.groupDb[id].welcome) return;

        try {
            const groupMetadata = await sock.groupMetadata(id);
            const groupName = groupMetadata.subject;
            const groupDesc = groupMetadata.desc ? groupMetadata.desc.toString() : '';

            for (let num of participants) {
                let welcomeText = dbs.groupDb[id].welcomeText || `Halo @user, selamat datang di grup @group!`;
                let userJid = typeof num === 'string' ? num : num.id;
                
                welcomeText = welcomeText.replace('@user', `@${userJid.split('@')[0]}`)
                                         .replace('@group', groupName)
                                         .replace('@desc', groupDesc);

                await sock.sendMessage(id, { 
                    text: welcomeText,
                    mentions: [userJid]
                });
            }
        } catch (err) {
            console.error('Error Welcome:', err);
        }
    });
}

startBot();