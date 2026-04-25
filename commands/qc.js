const axios = require('axios');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { resolveUser, ensureUser } = require('../utils/helpers');

const DEFAULT_PP = 'https://i.ibb.co/S36j9mX/avatar-contact.png';

module.exports = async function qcCmd(sock, msg, dbs, cleanSenderJid, saveDb) {
    const from = msg.key.remoteJid;

    const quoted = msg.message.extendedTextMessage?.contextInfo;
    if (!quoted?.quotedMessage) {
        return await sock.sendMessage(from, { text: 'Balas pesan yang ingin di qc.' }, { quoted: msg });
    }

    const qm = quoted.quotedMessage;
    let text = qm.conversation || qm.extendedTextMessage?.text || qm.imageMessage?.caption || qm.videoMessage?.caption || '';

    if (qm.stickerMessage) {
        text = ' ';
    }

    if (!text) return;

    const quotedSender = quoted.participant || quoted.remoteJid;
    const cleanQuoted = quotedSender?.includes(':')
        ? quotedSender.split(':')[0] + '@' + quotedSender.split('@')[1]
        : quotedSender;

    const fallbackName = dbs.contactDb?.[cleanQuoted] || cleanQuoted?.split('@')[0] || 'User';
    await ensureUser(dbs, saveDb, cleanQuoted, fallbackName);
    const quotedUserData = resolveUser(dbs.usersDb, cleanQuoted);
    let displayName = quotedUserData?.name || fallbackName;

    const senderUser = resolveUser(dbs.usersDb, cleanSenderJid);
    if (displayName === 'User' && dbs.contactDb?.[cleanQuoted]) {
        const contactName = dbs.contactDb[cleanQuoted];
        let matched = false;
        for (const uid in dbs.usersDb) {
            if (!dbs.usersDb[uid].isLink && dbs.usersDb[uid].waName === contactName) {
                displayName = dbs.usersDb[uid].name;
                matched = true;
                break;
            }
        }
        if (!matched) displayName = contactName;
    } else if (displayName === 'User' && cleanQuoted === cleanSenderJid) {
        displayName = senderUser?.name || msg.pushName || 'User';
    } else if (displayName === 'User' && cleanQuoted?.includes('@s.whatsapp.net')) {
        displayName = cleanQuoted.split('@')[0];
    } else if (displayName === 'User' && cleanQuoted?.includes('@lid')) {
        displayName = 'Member Grup';
    }

    let pp = DEFAULT_PP;
    const tryGetPP = async (jid) => {
        try {
            const url = await sock.profilePictureUrl(jid, 'image');
            const chk = await axios.head(url, { timeout: 5000 });
            return chk.status === 200 ? url : null;
        } catch { return null; }
    };

    let ppUrl = await tryGetPP(cleanQuoted);
    if (!ppUrl && cleanQuoted?.includes('@lid') && cleanSenderJid?.includes('@s.whatsapp.net')) {
        ppUrl = await tryGetPP(cleanSenderJid);
    }
    if (!ppUrl && cleanQuoted === cleanSenderJid) {
        ppUrl = await tryGetPP(cleanSenderJid);
    }

    if (ppUrl) {
        try {
            const res = await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 10000 });
            pp = `data:image/jpeg;base64,${Buffer.from(res.data).toString('base64')}`;
        } catch { pp = ppUrl; }
    }

    const payload = {
        type: 'quote',
        format: 'png',
        backgroundColor: '#1b1429',
        width: 512, height: 512, scale: 2,
        messages: [{
            entities: [],
            avatar: true,
            from: { id: 1, name: displayName, photo: { url: pp } },
            text,
            replyMessage: {}
        }]
    };

    try {
        const res = await axios.post('https://bot.lyo.su/quote/generate', payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 20000
        });

        if (res.data?.result?.image) {
            const sticker = new Sticker(Buffer.from(res.data.result.image, 'base64'), {
                pack: 'Meow',
                author: 'Noya',
                type: StickerTypes.FULL,
                quality: 100
            });
            await sock.sendMessage(from, { sticker: await sticker.toBuffer() }, { quoted: msg });
        }
    } catch (e) {
        console.error(e.message);
    }
};