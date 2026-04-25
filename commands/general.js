const os = require('os');
const { saveDb } = require('../database');
const { resolveUser, ensureUser, getLevelFromXp, xpProgressInLevel, cleanJid } = require('../utils/helpers');

module.exports = async function generalCmd(sock, msg, command, isOwner, dbs, prefix, args, sender) {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');

    await ensureUser(dbs, saveDb, sender, msg.pushName);
    const getUser = (key) => resolveUser(dbs.usersDb, key);

    if (command === 'tes') {
        return await sock.sendMessage(from, { text: 'noya was here.' });
    }

    if (command === 'cekjam') {
        const timeInfo = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'full', timeStyle: 'medium' });
        return await sock.sendMessage(from, { text: `${timeInfo} WIB` });
    }

    if (command === 'ping') {
        const latency = Date.now() - (msg.messageTimestamp ? msg.messageTimestamp * 1000 : Date.now());
        const ramTotal = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const ramFree = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
        const ramUsed = (ramTotal - ramFree).toFixed(2);
        const uptime = process.uptime();
        const h = Math.floor(uptime / 3600), m = Math.floor((uptime % 3600) / 60), s = Math.floor(uptime % 60);
        return await sock.sendMessage(from, {
            text: `PONG!\n\nLatency : ${latency} ms\nOS      : ${os.type()} ${os.release()}\nRAM     : ${ramUsed} / ${ramTotal} GB\nUptime  : ${h}h ${m}m ${s}s`
        }, { quoted: msg });
    }

    if (command === 'setname') {
        const user = getUser(sender);
        const newName = args.join(' ');
        if (!newName) return await sock.sendMessage(from, { text: `Ketik ${prefix}setname nama_baru` }, { quoted: msg });
        user.name = newName;
        dbs.usersDb[user.uid] = user;
        await saveDb('usersDb');
        return await sock.sendMessage(from, { text: `Nama diubah menjadi *${newName}*` }, { quoted: msg });
    }

    if (['profile', 'my', 'me'].includes(command)) {
        let targetJid = sender;

        const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const quotedParticipant = msg.message.extendedTextMessage?.contextInfo?.participant;
        if (mentioned.length > 0) targetJid = cleanJid(mentioned[0]);
        else if (quotedParticipant) targetJid = cleanJid(quotedParticipant);

        if (!dbs.usersDb[targetJid]) {
            await ensureUser(dbs, saveDb, targetJid, dbs.contactDb[targetJid] || targetJid.split('@')[0]);
        }

        const targetUser = getUser(targetJid);
        if (!targetUser) {
            return await sock.sendMessage(from, {
                text: 'Pengguna tidak ditemukan. Minta dia kirim pesan dulu agar terdaftar.'
            }, { quoted: msg });
        }

        const xp = typeof targetUser.xp === 'number' ? targetUser.xp : 0;
        const level = getLevelFromXp(xp);
        const prog = xpProgressInLevel(xp);
        const msgCnt = typeof targetUser.messageCount === 'number' ? targetUser.messageCount : 0;

        const BAR_LEN = 10;
        const filled = Math.round((prog.current / prog.needed) * BAR_LEN);
        const xpBar = '█'.repeat(filled) + '░'.repeat(BAR_LEN - filled);

        let ppBuffer = null;
        try {
            const axios = require('axios');
            const ppUrl = await sock.profilePictureUrl(targetJid, 'image');
            const res = await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 8000 });
            ppBuffer = Buffer.from(res.data);
        } catch { }

        const isSelf = targetJid === sender;
        const label = isSelf ? 'PROFILE KAMU' : `PROFILE @${targetJid.split('@')[0]}`;

        const profileText = `┌─── ${label}\n│\n│  Nama    : ${targetUser.name}\n│  UID     : ${targetUser.uid}\n│  Daftar  : ${targetUser.date}\n│\n│  Level   : ${level}\n│  XP      : ${xp} XP\n│  Progress: [${xpBar}] ${prog.current}/${prog.needed}\n│  Pesan   : ${msgCnt}\n│\n└──────────────────────`;

        const mentions = !isSelf ? [targetJid] : [];
        if (ppBuffer) {
            return await sock.sendMessage(from, { image: ppBuffer, caption: profileText, mentions }, { quoted: msg });
        }
        return await sock.sendMessage(from, { text: profileText, mentions }, { quoted: msg });
    }

    if (command === 'afk') {
        if (!dbs.afkDb) dbs.afkDb = {};
        if (dbs.afkDb[sender]) return await sock.sendMessage(from, { text: 'Kamu sudah dalam mode AFK.' }, { quoted: msg });
        const reason = args.join(' ') || 'Tanpa alasan';
        const userProf = getUser(sender);
        dbs.afkDb[sender] = { reason, time: Date.now(), name: userProf?.name || msg.pushName || 'User' };
        await saveDb('afkDb');
        return await sock.sendMessage(from, { text: `AFK success` }, { quoted: msg });
    }

    if (['welcome', 'setwelcome', 'delwelcome'].includes(command)) {
        if (!isGroup) return await sock.sendMessage(from, { text: 'Fitur ini hanya untuk grup.' }, { quoted: msg });
        const gm = await sock.groupMetadata(from);
        const sd = gm.participants.find(p => p.id === sender);
        const isAdmin = isOwner || (sd && (sd.admin === 'admin' || sd.admin === 'superadmin'));
        if (!isAdmin) return await sock.sendMessage(from, { text: 'Fitur ini khusus admin grup.' }, { quoted: msg });
        if (!dbs.groupDb[from]) dbs.groupDb[from] = {};

        if (command === 'welcome') {
            const act = args[0]?.toLowerCase();
            if (act === 'on') { dbs.groupDb[from].welcome = true; await saveDb('groupDb'); return await sock.sendMessage(from, { text: 'Welcome aktif.' }, { quoted: msg }); }
            if (act === 'off') { dbs.groupDb[from].welcome = false; await saveDb('groupDb'); return await sock.sendMessage(from, { text: 'Welcome dimatikan.' }, { quoted: msg }); }
            return await sock.sendMessage(from, { text: `${prefix}welcome on / off` }, { quoted: msg });
        }
        if (command === 'setwelcome') {
            const t = args.join(' ');
            if (!t) return await sock.sendMessage(from, { text: `Variabel: @user @group @desc\nContoh: ${prefix}setwelcome Halo @user!` }, { quoted: msg });
            dbs.groupDb[from].welcomeText = t;
            await saveDb('groupDb');
            return await sock.sendMessage(from, { text: 'Teks welcome disimpan.' }, { quoted: msg });
        }
        if (command === 'delwelcome') {
            delete dbs.groupDb[from].welcomeText;
            await saveDb('groupDb');
            return await sock.sendMessage(from, { text: 'Teks welcome dihapus.' }, { quoted: msg });
        }
    }

    if (command === 'gcs') {
    if (!isGroup) return;

    const gm = await sock.groupMetadata(from);
    const sd = gm.participants.find(p => p.id === sender);
    const isAdmin = isOwner || (sd && (sd.admin === 'admin' || sd.admin === 'superadmin'));
    if (!isAdmin) return;

    const { downloadMediaMessage } = require('@phrolovaa/baileys');

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
        || msg.message?.imageMessage?.contextInfo
        || msg.message?.videoMessage?.contextInfo
        || msg.message?.audioMessage?.contextInfo;

    const quotedMsg = contextInfo?.quotedMessage;
    const isQuotedTxt = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text;
    const textInput = args.length > 0 ? args.join(' ') : (isQuotedTxt || '');

    try {
        let mediaMsg = null, mediaType = '';

        if (msg.message.imageMessage) {
            mediaMsg = msg;
            mediaType = 'image';
        } else if (quotedMsg?.imageMessage) {
            mediaMsg = {
                key: {
                    remoteJid: from,
                    id: contextInfo?.stanzaId,
                    participant: contextInfo?.participant || undefined,
                    fromMe: false,
                },
                message: quotedMsg,
            };
            mediaType = 'image';
        } else if (msg.message.videoMessage) {
            mediaMsg = msg;
            mediaType = 'video';
        } else if (quotedMsg?.videoMessage) {
            mediaMsg = {
                key: {
                    remoteJid: from,
                    id: contextInfo?.stanzaId,
                    participant: contextInfo?.participant || undefined,
                    fromMe: false,
                },
                message: quotedMsg,
            };
            mediaType = 'video';
        } else if (msg.message.audioMessage) {
            mediaMsg = msg;
            mediaType = 'audio';
        } else if (quotedMsg?.audioMessage) {
            mediaMsg = {
                key: {
                    remoteJid: from,
                    id: contextInfo?.stanzaId,
                    participant: contextInfo?.participant || undefined,
                    fromMe: false,
                },
                message: quotedMsg,
            };
            mediaType = 'audio';
        }

        if (mediaMsg) {
            const buf = await downloadMediaMessage(mediaMsg, 'buffer', {});
            if (mediaType === 'image') {
                await sock.sendMessage([from], {
                    image: buf,
                    caption: textInput || '',
                    groupStatus: true,
                });
            } else if (mediaType === 'video') {
                await sock.sendMessage([from], {
                    video: buf,
                    caption: textInput || '',
                    groupStatus: true,
                });
            } else if (mediaType === 'audio') {
                await sock.sendMessage([from], {
                    audio: buf,
                    ptt: true,
                    groupStatus: true,
                });
            }
            return;
        }

        if (textInput) {
            await sock.sendMessage([from], {
                text: textInput,
                groupStatus: true,
            }, {
                backgroundColor: '#000000',
                font: 1,
            });
            return;
        }

        await sock.sendMessage(from, { text: 'Kirim atau reply gambar/video/audio, atau tulis teks.' }, { quoted: msg });

    } catch (e) {
        console.error('GCS Error:', e);
        await sock.sendMessage(from, { text: 'Gagal kirim group status: ' + e.message }, { quoted: msg });
    }
}

        if (['fakereply', 'freply', 'fr'].includes(command)) {
    const textArgs = args.join(' ');
    if (!textArgs) {
        return await sock.sendMessage(from, { text: `Format salah!\nPenggunaan: ${prefix}${command} 628xxxx | pesan | balasan` }, { quoted: msg });
    }

    let parts = textArgs.split('|');
    if (parts.length < 3) {
        return await sock.sendMessage(from, { text: `Format tidak lengkap!\nContoh: ${prefix}${command} 628xxxxx | pesan | balasan` }, { quoted: msg });
    }

    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    let manualMentions = [];
    let regex = /@([0-9]{10,20})/g;
    let match;
    
    while ((match = regex.exec(textArgs)) !== null) {
        let extractedId = match[1];
        manualMentions.push(extractedId + '@s.whatsapp.net');
        manualMentions.push(extractedId + '@lid');
    }
    
    let allMentions = [...new Set([...mentioned, ...manualMentions])];

    let nomorTarget = '';
    let arg0 = parts[0].trim();

    if (arg0.startsWith('@') && allMentions.length > 0) {
        let numTarget = arg0.replace(/[^0-9]/g, '');
        nomorTarget = numTarget.length > 14 ? numTarget + '@lid' : numTarget + '@s.whatsapp.net';
    } else {
        let rawNum = arg0.replace(/[^0-9]/g, '');
        nomorTarget = arg0.includes('@lid') ? rawNum + '@lid' : rawNum + '@s.whatsapp.net';
    }

    
    let pesanPalsu = parts[1].trim();
    pesanPalsu = pesanPalsu.replace(/@[0-9]{14,20}/g, '@User');

    let pesanBalasan = parts[2].trim();

    const fakeQuoted = { 
        key: { 
            remoteJid: from,
            fromMe: false, 
            id: msg.key.id, 
            participant: nomorTarget 
        }, 
        message: { 
            extendedTextMessage: { 
                text: pesanPalsu,
                contextInfo: {
                    mentionedJid: allMentions 
                }
            } 
        } 
    };

    return await sock.sendMessage(from, { 
        text: pesanBalasan,
        mentions: allMentions
    }, { 
        quoted: fakeQuoted 
    });
}







    if (command === 'menu') {
        const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'short', timeStyle: 'short' });
        const user = getUser(sender);
        const uName = user?.name || msg.pushName || 'User';

        const headerText = `╔══════════════════════╗\n║  ⋆. 𐙚˚࿔ *Noya AI* 𝜗𝜚˚⋆  ║ ˙ . ꒷ 🍰 . 𖦹˙\n╚══════════════════════╝\n\n◌ Halo, *${uName}!*\n◌ ${now} WIB\n◌ Prefix: *${prefix}*\n\n· · ────────────── · ·\n\nPilih kategori menu di bawah ini 🌸`;

        const { generateWAMessageFromContent, proto } = require('@phrolovaa/baileys');

        let sections = [
            {
                title: "✧ Kategori Menu",
                rows: [
                    { title: "Menu Grup", description: "Fitur moderasi & manajemen grup", id: `${prefix}menugroup` },
                    { title: "Mini Game", description: "Mainkan game tebak-tebakan & Werewolf", id: `${prefix}menugame` },
                    { title: "Menu Umum", description: "Fitur utilitas, downloader, & AI", id: `${prefix}menugeneral` }
                ]
            }
        ];

        if (isOwner) {
            sections.push({
                title: "Owner Access",
                rows: [
                    { title: "Menu Owner", description: "Manajemen bot, evaluasi, & broadcast", id: `${prefix}menuowner` }
                ]
            });
        }

        const listMessage = {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.create({
                        body: proto.Message.InteractiveMessage.Body.create({ text: headerText }),
                        footer: proto.Message.InteractiveMessage.Footer.create({ text: '> 🍁 _Powered by Noya Company_ 𖹭.ᐟ' }),
                        header: proto.Message.InteractiveMessage.Header.create({ title: "", subtitle: "", hasMediaAttachment: false }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                            buttons: [
                                {
                                    name: "single_select",
                                    buttonParamsJson: JSON.stringify({
                                        title: "Pilih Menu",
                                        sections: sections
                                    })
                                }
                            ]
                        })
                    })
                }
            }
        };

        const msgContent = generateWAMessageFromContent(from, listMessage, { quoted: msg });
        return await sock.relayMessage(from, msgContent.message, { messageId: msgContent.key.id });
    }

    if (command === 'menugroup') {
        const menuText = `╔══════════════════════╗\n║  ⋆. 𐙚˚࿔ *MENU GRUP* 𝜗𝜚˚⋆  ║\n╚══════════════════════╝\n\n· · ────────────── · ·\n\n✿ *WELCOME & PESAN*\n┌─────────────────────\n│ ﹒${prefix}welcome _[on/off]_\n│ ﹒${prefix}setwelcome _[teks]_\n│ ﹒${prefix}delwelcome\n└─────────────────────\n\n✿ *MANAJEMEN GRUP*\n┌─────────────────────\n│ ﹒${prefix}open / ${prefix}close\n│ ﹒${prefix}setopen _[teks]_\n│ ﹒${prefix}setclose _[teks]_\n│ ﹒${prefix}delopen / ${prefix}delclose\n│ ﹒${prefix}kick @member\n│ ﹒${prefix}warn @member\n│ ﹒${prefix}promote @member\n│ ﹒${prefix}demote @member\n│ ﹒${prefix}hidetag _[teks]_\n│ ﹒${prefix}gcs\n└─────────────────────\n\n✿ *LIST*\n┌─────────────────────\n│ ﹒${prefix}list\n│ ﹒${prefix}olist\n└─────────────────────\n\n· · ────────────── · ·\n> 🍁 _Powered by Noya Company_ 𖹭.ᐟ\n· · ────────────── · ·`;
        return await sock.sendMessage(from, { text: menuText.trim() }, { quoted: msg });
    }

    if (command === 'menugame') {
        const menuText = `╔══════════════════════╗\n║  ⋆. 𐙚˚࿔ *MINI GAME* 𝜗𝜚˚⋆   ║\n╚══════════════════════╝\n\n· · ────────────── · ·\n\n✿ *TEBAK-TEBAKAN*\n┌─────────────────────\n│ ﹒${prefix}tb / ${prefix}tebakbendera\n│ ﹒${prefix}math _[easy/medium/hard]_\n│ ﹒${prefix}nyerah  _(menyerah)_\n│ ﹒${prefix}stopgame  _(hentikan game)_\n└─────────────────────\n\n✿ *TICTACTOE*\n┌─────────────────────\n│ ﹒${prefix}ttt @lawan\n│ ﹒${prefix}tttwr  _(win rate)_\n└─────────────────────\n\n✿ *WEREWOLF* 🐺\n┌─────────────────────\n│ ﹒${prefix}ww _[5/7/9]_\n│ ﹒${prefix}wwjoin\n│ ﹒${prefix}wwstart\n│ ﹒${prefix}wwvote @pemain\n│ ﹒${prefix}wwend\n│ ﹒${prefix}wwdawn\n│ ﹒${prefix}wwwr  _(win rate)_\n└─────────────────────\n\n✿ *EKONOMI*\n┌─────────────────────\n│ ﹒${prefix}balance / ${prefix}b\n│ ﹒${prefix}daily\n│ ﹒${prefix}weekly\n│ ﹒${prefix}monthly\n└─────────────────────\n\n· · ────────────── · ·\n> 🍁 _Powered by Noya Company_ 𖹭.ᐟ\n· · ────────────── · ·`;
        return await sock.sendMessage(from, { text: menuText.trim() }, { quoted: msg });
    }

    if (command === 'menugeneral') {
        const menuText = `╔══════════════════════╗\n║  ⋆. 𐙚˚࿔ *GENERAL* 𝜗𝜚˚⋆   ║\n╚══════════════════════╝\n\n· · ────────────── · ·\n\n✿ *DOWNLOADER*\n┌─────────────────────\n│ ﹒${prefix}tt _[url]_\n│ ﹒${prefix}ig _[url]_\n└─────────────────────\n\n✿ *AI & CHAT*\n┌─────────────────────\n│ ﹒${prefix}gemini _[tanya]_\n│ ﹒${prefix}noya _[ngobrol]_\n└─────────────────────\n\n✿ *PROFIL & AKUN*\n┌─────────────────────\n│ ﹒${prefix}profile / ${prefix}my / ${prefix}me\n│ ﹒${prefix}setname _[nama]_\n│ ﹒${prefix}afk _[alasan]_\n└─────────────────────\n\n✿ *UTILITAS*\n┌─────────────────────\n│ ﹒${prefix}ping\n│ ﹒${prefix}cekjam\n│ ﹒${prefix}tes\n│ ﹒${prefix}qc\n│ ﹒${prefix}fakereply\n└─────────────────────\n\n✿ *FEEDBACK*\n┌─────────────────────\n│ ﹒${prefix}saran _[pesanmu]_\n│ ﹒${prefix}report _[laporanmu]_\n└─────────────────────\n\n· · ────────────── · ·\n> 🍁 _Powered by Noya Company_ 𖹭.ᐟ\n· · ────────────── · ·`;
        return await sock.sendMessage(from, { text: menuText.trim() }, { quoted: msg });
    }

    if (command === 'menuowner') {
        if (!isOwner) return;
        const menuText = `╔══════════════════════╗\n║  ⋆. 𐙚˚࿔ *MENU OWNER* 𝜗𝜚˚⋆  ║\n╚══════════════════════╝\n\n· · ────────────── · ·\n\n✦ *MANAJEMEN BOT*\n┌─────────────────────\n│ ﹒${prefix}setprefix _[prefix]_\n│ ﹒${prefix}addowner @user\n│ ﹒${prefix}delowner @user\n│ ﹒${prefix}listowner\n│ ﹒${prefix}broadcast _[id | pesan]_\n│ ﹒${prefix}limitig _[angka]_\n│ ﹒> / =>  _(exec)_\n└─────────────────────\n\n✦ *LIST & RESPON*\n┌─────────────────────\n│ ﹒${prefix}addlist _[nama | isi]_\n│ ﹒${prefix}addolist _[nama | isi]_\n│ ﹒${prefix}updatelist _[nama | isi]_\n│ ﹒${prefix}delist _[nama]_\n│ ﹒${prefix}olist\n│ ﹒${prefix}addrespon\n│ ﹒${prefix}delrespon\n└─────────────────────\n\n✦ *GRUP & MODERASI*\n┌─────────────────────\n│ ﹒${prefix}listgroup\n│ ﹒${prefix}getidgc / ${prefix}cekid\n│ ﹒${prefix}bancmd _[command]_\n│ ﹒${prefix}unbancmd _[command]_\n└─────────────────────\n\n✦ *JADWAL OTOMATIS*\n┌─────────────────────\n│ ﹒${prefix}setpagi _[teks]_\n│ ﹒${prefix}setmalam _[teks]_\n│ ﹒${prefix}setopen _[teks]_\n│ ﹒${prefix}setclose _[teks]_\n│ ﹒${prefix}delopen / ${prefix}delclose\n└─────────────────────\n\n✦ *TOOLS*\n┌─────────────────────\n│ ﹒${prefix}ceksaluran _[link]_\n│ ﹒${prefix}getlid\n└─────────────────────\n\n· · ────────────── · ·\n> 🍁 _Powered by Noya Company_ 𖹭.ᐟ\n· · ────────────── · ·`;
        return await sock.sendMessage(from, { text: menuText.trim() }, { quoted: msg });
    }

    if (command === 'list' || command === 'olist') {
        if (command === 'olist' && !isOwner) return;
        const items = [];
        for (const key in dbs.listDb) {
            const isO = dbs.listDb[key].isOwnerOnly;
            if ((command === 'list' && !isO) || (command === 'olist' && isO)) items.push(key);
        }
        const title = command === 'list' ? '✿ *LIST*' : '✦ *OWNER LIST*';
        let txt = `· · ────────────── · ·\n${title}\n· · ────────────── · ·\n\n`;
        if (items.length === 0) {
            txt += '┌─────────────────────\n│ ﹒_Belum ada list._\n└─────────────────────';
        } else {
            txt += '┌─────────────────────\n';
            items.forEach(k => { txt += `│ ﹒${k}\n`; });
            txt += '└─────────────────────';
        }
        txt += `\n\n· · ────────────── · ·\n> _Ketik nama list untuk melihat isinya_ ✦`;
        return await sock.sendMessage(from, { text: txt.trim() });
    }

    if (command === 'saran') {
        const config = require('../config');
        const ownerJid = config.ownerNumbers[0];
        const saranText = args.join(' ');

        if (!saranText) {
            return await sock.sendMessage(from, {
                text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *SARAN* 𝜗𝜚˚⋆     ║\n╚══════════════════════╝\n\n✿ *CARA KIRIM SARAN*\n┌─────────────────────\n│ ﹒Ketik: *' + prefix + 'saran [pesanmu]*\n│ ﹒Contoh: ' + prefix + 'saran tambah fitur X\n└─────────────────────\n\n· · ────────────── · ·\n> _Saranmu akan diteruskan ke owner bot_ ✦'
            }, { quoted: msg });
        }

        const senderName = msg.pushName || sender.split('@')[0];

        let groupName = '';
        if (isGroup) {
            try {
                const gm = await sock.groupMetadata(from);
                groupName = gm.subject;
            } catch (e) {
                groupName = from.split('@')[0];
            }
        }

        const groupInfo = isGroup ? `\n│ ﹒🏠 Grup   : ${groupName}` : '\n│ ﹒💬 Private Chat';
        const senderNumber = sender.split('@')[0];

        const ownerMsg = '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *SARAN MASUK* 𝜗𝜚˚⋆ ║\n╚══════════════════════╝\n\n✿ *DETAIL*\n┌─────────────────────\n│ ﹒👤 Dari   : ' + senderName + '\n│ ﹒📱 Nomor  : @' + senderNumber + groupInfo + '\n└─────────────────────\n\n✿ *ISI SARAN*\n┌─────────────────────\n│ ﹒💡 ' + saranText + '\n└─────────────────────\n\n· · ────────────── · ·\n> 🍁 _Powered by Noya Company_ 𖹭.ᐟ\n· · ────────────── · ·';

        try {
            await sock.sendMessage(ownerJid, { text: ownerMsg, mentions: [sender] });
        } catch (e) {}

        return await sock.sendMessage(from, {
            text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *SARAN* 𝜗𝜚˚⋆     ║\n╚══════════════════════╝\n\n✿ *BERHASIL TERKIRIM!*\n┌─────────────────────\n│ ﹒✅ Saranmu sudah diteruskan ke owner!\n│ ﹒💡 Terima kasih atas masukannya~\n└─────────────────────\n\n· · ────────────── · ·\n> 🍁 _Powered by Noya Company_ 𖹭.ᐟ\n· · ────────────── · ·'
        }, { quoted: msg });
    }

    if (command === 'report') {
        const config = require('../config');
        const ownerJid = config.ownerNumbers[0];
        const reportText = args.join(' ');

        if (!reportText) {
            return await sock.sendMessage(from, {
                text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *REPORT* 𝜗𝜚˚⋆    ║\n╚══════════════════════╝\n\n✿ *CARA REPORT*\n┌─────────────────────\n│ ﹒Ketik: *' + prefix + 'report [laporanmu]*\n│ ﹒Contoh: ' + prefix + 'report bot tidak merespons\n└─────────────────────\n\n· · ────────────── · ·\n> _Laporanmu akan diteruskan ke owner bot_ ✦'
            }, { quoted: msg });
        }

        const senderName = msg.pushName || sender.split('@')[0];

        let groupName = '';
        if (isGroup) {
            try {
                const gm = await sock.groupMetadata(from);
                groupName = gm.subject;
            } catch (e) {
                groupName = from.split('@')[0];
            }
        }

        const groupInfo = isGroup ? `\n│ ﹒🏠 Grup   : ${groupName}` : '\n│ ﹒💬 Private Chat';
        const senderNumber = sender.split('@')[0];

        const ownerMsg = '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *REPORT MASUK* 𝜗𝜚˚⋆ ║\n╚══════════════════════╝\n\n✿ *DETAIL*\n┌─────────────────────\n│ ﹒👤 Dari   : ' + senderName + '\n│ ﹒📱 Nomor  : @' + senderNumber + groupInfo + '\n└─────────────────────\n\n✿ *ISI REPORT*\n┌─────────────────────\n│ ﹒⚠️ ' + reportText + '\n└─────────────────────\n\n· · ────────────── · ·\n> 🍁 _Powered by Noya Company_ 𖹭.ᐟ\n· · ────────────── · ·';

        try {
            await sock.sendMessage(ownerJid, { text: ownerMsg, mentions: [sender] });
        } catch (e) {}

        return await sock.sendMessage(from, {
            text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *REPORT* 𝜗𝜚˚⋆    ║\n╚══════════════════════╝\n\n✿ *BERHASIL TERKIRIM!*\n┌─────────────────────\n│ ﹒✅ Laporanmu sudah diteruskan ke owner untuk diperiksa!\n└─────────────────────\n\n· · ────────────── · ·\n> 🍁 _Powered by Noya Company_ 𖹭.ᐟ\n· · ────────────── · ·'
        }, { quoted: msg });
    }
        if (command === 'enc') {
        const textToEnc = args.join(' ');
        if (!textToEnc) return await sock.sendMessage(from, { text: 'Masukkan teksnya!' }, { quoted: msg });

        const hexResult = Buffer.from(textToEnc, 'utf-8').toString('hex');
        return await sock.sendMessage(from, { text: hexResult }, { quoted: msg });
    }

    if (command === 'dec') {
        const hexToDec = args.join(' ');
        if (!hexToDec) return await sock.sendMessage(from, { text: 'Masukkan kode hexnya!' }, { quoted: msg });

        const textResult = Buffer.from(hexToDec, 'hex').toString('utf-8');
        return await sock.sendMessage(from, { text: textResult }, { quoted: msg });
    }

}
