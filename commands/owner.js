const fs = require('fs');
const { dbs, saveDb } = require('../database');
const { downloadMediaMessage } = require('@phrolovaa/baileys');
const BOT_FOOTER = global.botFooter || '🍁 _Powered by Noya Company_ 𖹭.ᐟ';

const SUPER_OWNERS = ['628989262387', '236111565738195'];

module.exports = async function ownerCmd(sock, msg, command, args, fullText, rawSenderJid, isOwner, prefix) {
    if (!isOwner) return;

    const { authorizedUsers, ownerUsers, schedDb, listDb, settingsDb, warnDb, groupDb } = dbs;
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const quoted = msg.message.extendedTextMessage?.contextInfo;
    const target = quoted?.participant ||
                   msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
                   (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

    const getExecutor = () => {
        let ex = msg.key.participant || msg.key.remoteJid || '';
        if (msg.key.fromMe && sock.user?.id) ex = sock.user.id;
        return ex;
    };

    const isSuperOwner = () => {
        const ex = getExecutor();
        return SUPER_OWNERS.some(n => ex.includes(n));
    };

    if (command === 'setprefix') {
        if (!args[0]) return await sock.sendMessage(from, { text: `Contoh: ${prefix}setprefix !` });
        settingsDb.prefix = args[0];
        await saveDb('settingsDb');
        return await sock.sendMessage(from, { text: `Prefix diubah menjadi: ${args[0]}` });
    }

    if (['hidetag', 'h', 'ht'].includes(command)) {
        if (!isGroup) return await sock.sendMessage(from, { text: 'Hanya di dalam grup.' }, { quoted: msg });
        const gm = await sock.groupMetadata(from);
        const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text || '';
        const text = args.length > 0 ? args.join(' ') : quotedText;
        if (!text) return await sock.sendMessage(from, { text: `${prefix}${command} [teks] atau reply pesan.` }, { quoted: msg });
        return await sock.sendMessage(from, { text, mentions: gm.participants.map(v => v.id) });
    }
    
if (command === 'ceksaluran') {
    // Asumsi 'args' adalah array dari teks setelah command, misal: !ceksaluran https://...
    // Kalau di kodemu cara ambil teksnya beda (misal pakai 'text' atau 'q'), sesuaikan ya.
    const link = args[0]; 
    
    if (!link || !link.includes('whatsapp.com/channel/')) {
        return await sock.sendMessage(from, { text: '❌ Kirim link salurannya!\n\n*Contoh:* !ceksaluran https://whatsapp.com/channel/xxx' }, { quoted: msg });
    }

    try {
      
        const inviteCode = link.split('channel/')[1];
        
     
        const channelData = await sock.newsletterMetadata("invite", inviteCode);
        
        const channelId = channelData.id;
        const channelName = channelData.name;
        
        return await sock.sendMessage(from, { 
            text: `✅ **Berhasil Mengambil Data!**\n\n*Nama:* ${channelName}\n*ID:* ${channelId}` 
        }, { quoted: msg });
        
    } catch (error) {
        console.error("Error cek saluran:", error);
        return await sock.sendMessage(from, { text: '⚠️ Gagal mengambil info saluran. Pastikan link valid atau bot tidak diblokir.' }, { quoted: msg });
    }
}

    if (command === 'broadcast') {
    const input = fullText.substring(command.length + 1).trim();
    if (!input.includes('|')) return await sock.sendMessage(from, { text: `Format: ${prefix}broadcast ID_GRUP | PESAN` });
    
    const [groupId, bcText] = input.split('|').map(v => v.trim());
    if (!groupId || !bcText) return await sock.sendMessage(from, { text: 'ID grup atau pesan tidak boleh kosong.' });

    await sock.sendMessage(from, { text: 'Broadcast dimulai...' });
    
   
    const parseSpintax = (text) => {
    return text.replace(/\{([^}]+)\}/g, (match, p1) => {
    
        const options = p1.split('|').map(v => v.trim()); 
        return options[Math.floor(Math.random() * options.length)];
    });
};

    try {
        const gm = await sock.groupMetadata(groupId);
        let botId = sock.user.id;
        if (botId.includes(':')) botId = botId.split(':')[0] + '@s.whatsapp.net';
        
        let count = 0;
        for (const mem of gm.participants) {
            if (mem.id === botId) continue;
            
            try { 
                const finalMessage = parseSpintax(bcText);
                await sock.sendMessage(mem.id, { text: finalMessage }); 
                count++; 
            } catch { }
            
         
            const randomDelay = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
            await new Promise(r => setTimeout(r, randomDelay));
        }
        return await sock.sendMessage(from, { text: `Broadcast selesai. Terkirim ke ${count} anggota.` });
    } catch {
        return await sock.sendMessage(from, { text: 'Gagal broadcast. Periksa ID grup.' });
    }
}

    if (command === 'getidgc' || command === 'cekid') {
        const input = args[0];
        if (!input) return await sock.sendMessage(from, { text: `${prefix}${command} link_grup / ID_grup` }, { quoted: msg });
        try {
            let info;
            if (input.includes('chat.whatsapp.com')) {
                const m = input.match(/([0-9A-Za-z]{20,24})/);
                if (!m) return await sock.sendMessage(from, { text: 'Format link tidak valid.' }, { quoted: msg });
                info = await sock.groupGetInviteInfo(m[1]);
            } else if (input.endsWith('@g.us')) {
                info = await sock.groupMetadata(input);
                info.size = info.participants.length;
            } else {
                return await sock.sendMessage(from, { text: 'Masukkan link atau ID grup yang valid.' }, { quoted: msg });
            }
            const text =
                `*GROUP INFO*\n\n` +
                `Nama  : ${info.subject}\n` +
                `ID    : ${info.id}\n` +
                `Owner : ${info.owner || 'Tidak diketahui'}\n` +
                `Member: ${info.size || info.participants?.length || '-'}\n` +
                `Desc  : ${info.desc || 'Tidak ada'}`;
            return await sock.sendMessage(from, { text }, { quoted: msg });
        } catch (e) {
            console.error(e);
            return await sock.sendMessage(from, { text: 'Gagal mengambil info grup.' }, { quoted: msg });
        }
    }
    
        if (command === 'kill') {
        if (!isOwner) return;
        await sock.sendMessage(from, { text: 'Mematikan bot...' }, { quoted: msg });
        process.exit(0);
    }

    if (command === 'restart') {
        if (!isOwner) return;
        await sock.sendMessage(from, { text: 'Merestart bot...' }, { quoted: msg });
        process.exit(1);
    }


    if (command === 'addowner') {
        if (!isSuperOwner()) return await sock.sendMessage(from, { text: 'Lau sape mpruy?' }, { quoted: msg });
        const mentionedJid = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const quotedParticipant = msg.message.extendedTextMessage?.contextInfo?.participant;
        let targetJid = '', targetNumber = '';
        if (mentionedJid.length > 0) { targetJid = mentionedJid[0]; targetNumber = targetJid.split('@')[0]; }
        else if (quotedParticipant) { targetJid = quotedParticipant; targetNumber = targetJid.split('@')[0]; }
        else if (args[0]) {
            targetNumber = args[0].replace(/[^0-9]/g, '');
            if (targetNumber.startsWith('08')) targetNumber = '628' + targetNumber.slice(2);
            targetJid = targetNumber + '@s.whatsapp.net';
        } else {
            return await sock.sendMessage(from, { text: `${prefix}addowner nomor / tag / reply` }, { quoted: msg });
        }
        let added = false;
        if (!dbs.ownerUsers.includes(targetNumber)) { dbs.ownerUsers.push(targetNumber); added = true; }
        if (!dbs.ownerUsers.includes(targetJid)) { dbs.ownerUsers.push(targetJid); added = true; }
        if (added) { await saveDb('ownerUsers'); return await sock.sendMessage(from, { text: `@${targetNumber} ditambahkan sebagai owner.`, mentions: [targetJid] }, { quoted: msg }); }
        return await sock.sendMessage(from, { text: 'Sudah terdaftar sebagai owner.' }, { quoted: msg });
    }

    if (command === 'delowner') {
        if (!isSuperOwner()) return await sock.sendMessage(from, { text: 'Akses ditolak.' }, { quoted: msg });
        const mentionedJid = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const quotedParticipant = msg.message.extendedTextMessage?.contextInfo?.participant;
        let targetJid = '', targetNumber = '';
        if (mentionedJid.length > 0) { targetJid = mentionedJid[0]; targetNumber = targetJid.split('@')[0]; }
        else if (quotedParticipant) { targetJid = quotedParticipant; targetNumber = targetJid.split('@')[0]; }
        else if (args[0]) {
            targetNumber = args[0].replace(/[^0-9]/g, '');
            if (targetNumber.startsWith('08')) targetNumber = '628' + targetNumber.slice(2);
            targetJid = targetNumber + '@s.whatsapp.net';
        } else {
            return await sock.sendMessage(from, { text: `${prefix}delowner nomor / tag / reply` }, { quoted: msg });
        }
        if (SUPER_OWNERS.some(n => targetNumber.includes(n))) {
            return await sock.sendMessage(from, { text: 'Lau sape mpruy?' }, { quoted: msg });
        }
        let deleted = false;
        const iNum = dbs.ownerUsers.indexOf(targetNumber);
        if (iNum !== -1) { dbs.ownerUsers.splice(iNum, 1); deleted = true; }
        const iJid = dbs.ownerUsers.indexOf(targetJid);
        if (iJid !== -1) { dbs.ownerUsers.splice(iJid, 1); deleted = true; }
        if (deleted) { await saveDb('ownerUsers'); return await sock.sendMessage(from, { text: `@${targetNumber} dihapus dari owner.`, mentions: [targetJid] }, { quoted: msg }); }
        return await sock.sendMessage(from, { text: 'Nomor tidak ditemukan di daftar owner.' }, { quoted: msg });
    }

    if (command === 'promote' && isGroup && target) {
        await sock.groupParticipantsUpdate(from, [target], 'promote');
        return await sock.sendMessage(from, { text: 'Done.' });
    }
    if (command === 'demote' && isGroup && target) {
        await sock.groupParticipantsUpdate(from, [target], 'demote');
        return await sock.sendMessage(from, { text: 'Done.' });
    }
    if (command === 'kick' && isGroup && target) {
        await sock.groupParticipantsUpdate(from, [target], 'remove');
        return await sock.sendMessage(from, { text: 'Done.' });
    }
    if (command === 'open' && isGroup) {
        await sock.groupSettingUpdate(from, 'not_announcement');
        return await sock.sendMessage(from, { text: 'Grup dibuka.' });
    }
    if (command === 'close' && isGroup) {
        await sock.groupSettingUpdate(from, 'announcement');
        return await sock.sendMessage(from, { text: 'Grup ditutup.' });
    }

    if (command === 'warn' && isGroup && target) {
        if (!warnDb[from]) warnDb[from] = {};
        warnDb[from][target] = (warnDb[from][target] || 0) + 1;
        await saveDb('warnDb');
        if (warnDb[from][target] >= 3) {
            await sock.groupParticipantsUpdate(from, [target], 'remove');
            delete warnDb[from][target];
            await saveDb('warnDb');
            return await sock.sendMessage(from, { text: 'Dikick karena warn 3x.' });
        }
        return await sock.sendMessage(from, { text: `Warn: ${warnDb[from][target]}/3` });
    }

    if ((command === 'setopen' || command === 'setclose') && isGroup) {
        if (!args[0]) return;
        if (!groupDb[from]) groupDb[from] = {};
        const type = command === 'setopen' ? 'open' : 'close';
        groupDb[from][type] = args[0];
        await saveDb('groupDb');
        return await sock.sendMessage(from, { text: `Jadwal ${type} diatur: ${args[0]}` });
    }
    if ((command === 'delopen' || command === 'delclose') && isGroup) {
        if (!groupDb[from]) return;
        const type = command === 'delopen' ? 'open' : 'close';
        delete groupDb[from][type];
        await saveDb('groupDb');
        return await sock.sendMessage(from, { text: `Jadwal ${type} dihapus.` });
    }

    if (command === 'getlid') {
        const t = target || rawSenderJid;
        const clean = t.includes(':') ? t.split(':')[0] + '@' + t.split('@')[1] : t;
        const isLid = clean.includes('@lid');
        return await sock.sendMessage(from, {
            text: `Nomor : ${isLid ? '-' : clean.split('@')[0] + '@s.whatsapp.net'}\nLID   : ${isLid ? clean : '-'}`
        });
    }

    if (command === 'setpagi' || command === 'setmalam') {
        const type = command.replace('set', '');
        if (args[0] === 'target') {
            schedDb[type].target = target || from;
            schedDb[type].enabled = true;
            await saveDb('schedDb');
            return await sock.sendMessage(from, { text: `Target ${type}: ${schedDb[type].target}` });
        }
        const txt = fullText.split('|')[1]?.trim();
        if (!txt) return;
        schedDb[type].texts.push(txt);
        schedDb[type].enabled = true;
        await saveDb('schedDb');
        return await sock.sendMessage(from, { text: 'Done.' });
    }

    if (command === 'addlist' || command === 'addolist') {
        const input = fullText.substring(command.length + 1).trim();
        if (!input.includes('|')) return await sock.sendMessage(from, { text: `Format: ${prefix}${command} nama | isi` }, { quoted: msg });
        const [namaRaw, ...isiParts] = input.split('|');
        const key = namaRaw.trim().toLowerCase();
        const resp = isiParts.join('|').trim();
        if (!key || !resp) return await sock.sendMessage(from, { text: 'Nama atau isi tidak boleh kosong.' }, { quoted: msg });
        if (listDb[key]) return await sock.sendMessage(from, { text: `List *${key}* sudah ada. Gunakan ${prefix}updatelist untuk mengubah.` }, { quoted: msg });

        const isImg = msg.message?.imageMessage || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
        let imagePath = null;
        if (isImg) {
            const msgDl = msg.message?.imageMessage ? msg : { key: msg.key, message: msg.message.extendedTextMessage.contextInfo.quotedMessage };
            const buf = await downloadMediaMessage(msgDl, 'buffer', {});
            if (!fs.existsSync('./media')) fs.mkdirSync('./media');
            imagePath = `./media/${key}.jpg`;
            fs.writeFileSync(imagePath, buf);
        }
        listDb[key] = { text: resp, isOwnerOnly: command === 'addolist', image: imagePath };
        await saveDb('listDb');
        return await sock.sendMessage(from, { text: `List *${key}* ditambahkan${command === 'addolist' ? ' (owner only)' : ''}.` }, { quoted: msg });
    }

    if (command === 'updatelist') {
        const input = fullText.substring(command.length + 1).trim();
        if (!input.includes('|')) return await sock.sendMessage(from, { text: `Format: ${prefix}updatelist nama | isi_baru` }, { quoted: msg });
        const [namaRaw, ...isiParts] = input.split('|');
        const key = namaRaw.trim().toLowerCase();
        const resp = isiParts.join('|').trim();
        if (!listDb[key]) return await sock.sendMessage(from, { text: `List *${key}* tidak ditemukan.` }, { quoted: msg });

        const isImg = msg.message?.imageMessage || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
        let imagePath = listDb[key].image || null;
        if (isImg) {
            const msgDl = msg.message?.imageMessage ? msg : { key: msg.key, message: msg.message.extendedTextMessage.contextInfo.quotedMessage };
            const buf = await downloadMediaMessage(msgDl, 'buffer', {});
            if (!fs.existsSync('./media')) fs.mkdirSync('./media');
            imagePath = `./media/${key}.jpg`;
            fs.writeFileSync(imagePath, buf);
        }
        listDb[key].text = resp;
        listDb[key].image = imagePath;
        await saveDb('listDb');
        return await sock.sendMessage(from, { text: `List *${key}* diperbarui.` }, { quoted: msg });
    }

    if (command === 'delist') {
        const key = args[0]?.toLowerCase();
        if (!key) return await sock.sendMessage(from, { text: `Format: ${prefix}delist nama` }, { quoted: msg });
        if (!listDb[key]) return await sock.sendMessage(from, { text: `List *${key}* tidak ditemukan.` }, { quoted: msg });
        if (listDb[key].image && fs.existsSync(listDb[key].image)) fs.unlinkSync(listDb[key].image);
        delete listDb[key];
        await saveDb('listDb');
        return await sock.sendMessage(from, { text: `List *${key}* dihapus.` }, { quoted: msg });
    }

    if (command === 'addrespon' || command === 'delrespon') {
        let finalTarget = target;
        if (args[0]) {
            const argLow = args[0].toLowerCase();
            if (argLow === 'gc' || argLow === 'grup') {
                if (!isGroup) return await sock.sendMessage(from, { text: 'Perintah ini hanya bisa digunakan di dalam grup.' }, { quoted: msg });
                finalTarget = from;
            } else if (args[0].endsWith('@g.us')) {
                finalTarget = args[0];
            }
        } else if (!target && isGroup) {
            // Default ke grup jika tidak ada argumen dan tidak me-reply siapa-siapa
            finalTarget = from;
        }

        if (!finalTarget || finalTarget === '@s.whatsapp.net') {
            return await sock.sendMessage(from, { text: `Kirim ${prefix}${command} (di dalam grup), ID grup, atau tag/reply user.` }, { quoted: msg });
        }

        const isTargetGroup = finalTarget.endsWith('@g.us');

        if (isTargetGroup) {
            if (command === 'addrespon') {
                if (!authorizedUsers.includes(finalTarget)) authorizedUsers.push(finalTarget);
            } else {
                const idx = authorizedUsers.indexOf(finalTarget);
                if (idx !== -1) authorizedUsers.splice(idx, 1);
            }
        } else {
            const cleanTarget = finalTarget.includes(':') ? finalTarget.split(':')[0] + '@' + finalTarget.split('@')[1] : finalTarget;
            const targetNum = cleanTarget.replace(/[^0-9]/g, '');
            if (command === 'addrespon') {
                const alreadyIn = authorizedUsers.some(e => e.replace(/[^0-9]/g, '') === targetNum);
                if (!alreadyIn) authorizedUsers.push(cleanTarget);
            } else {
                for (let i = authorizedUsers.length - 1; i >= 0; i--) {
                    if (!authorizedUsers[i].endsWith('@g.us') && authorizedUsers[i].replace(/[^0-9]/g, '') === targetNum) {
                        authorizedUsers.splice(i, 1);
                    }
                }
            }
        }

        await saveDb('authorizedUsers');
        return await sock.sendMessage(from, { text: `Done. ${isTargetGroup ? 'Grup' : 'User'} berhasil di-${command === 'addrespon' ? 'tambahkan ke' : 'hapus dari'} list respons.` });
    }

    if (command === 'listgroup') {
        const groups = await sock.groupFetchAllParticipating();
        let txt = '*DAFTAR GRUP*\n\n';
        for (const id in groups) txt += `• ${groups[id].subject}\n  ID: ${id}\n\n`;
        return await sock.sendMessage(from, { text: txt.trim() });
    }

    if (command === 'listowner') {
        let txt = '*DAFTAR OWNER*\n\n';
        dbs.ownerUsers.forEach((o, i) => { txt += `${i + 1}. ${o}\n`; });
        return await sock.sendMessage(from, { text: txt }, { quoted: msg });
    }

    if (command === 'bancmd') {
        const input = fullText.substring(command.length + 1).trim();
        if (!input.includes('|')) {
            return await sock.sendMessage(from, {
                text: `╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *INFO FORMAT* 𝜗𝜚˚⋆ ║\n╚══════════════════════╝\n\n✿ *CARA PENGGUNAAN*\n┌─────────────────────\n│ ﹒Ketik: *${prefix}bancmd cmd | alasan*\n│ ﹒Contoh: ${prefix}bancmd ping | Sedang perbaikan\n└─────────────────────\n\n· · ────────────── · ·\n> ${BOT_FOOTER}`
            }, { quoted: msg });
        }

        const [cmdToBan, ...reasonArr] = input.split('|');
        const targetCmd = cmdToBan.trim().toLowerCase();
        const reason = reasonArr.join('|').trim() || 'Tanpa alasan';

        if (!dbs.bannedCmdsDb) dbs.bannedCmdsDb = {};
        dbs.bannedCmdsDb[targetCmd] = reason;
        await saveDb('bannedCmdsDb'); 

        return await sock.sendMessage(from, {
            text: `╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *COMMAND BANNED* 𝜗𝜚˚⋆ ║\n╚══════════════════════╝\n\n✿ *DETAIL*\n┌─────────────────────\n│ ﹒🚫 Command : *${targetCmd}*\n│ ﹒💬 Alasan  : ${reason}\n└─────────────────────\n\n· · ────────────── · ·\n> ${BOT_FOOTER}`
        }, { quoted: msg });
    }

    if (command === 'unbancmd') {
        const targetCmd = args[0]?.toLowerCase();
        if (!targetCmd) {
            return await sock.sendMessage(from, { text: `Ketik: *${prefix}unbancmd nama_cmd*` }, { quoted: msg });
        }

        if (dbs.bannedCmdsDb && dbs.bannedCmdsDb[targetCmd]) {
            delete dbs.bannedCmdsDb[targetCmd];
            await saveDb('bannedCmdsDb');
            return await sock.sendMessage(from, { text: `✅ Command *${targetCmd}* berhasil diaktifkan kembali.` }, { quoted: msg });
        } else {
            return await sock.sendMessage(from, { text: `Command *${targetCmd}* tidak ada dalam daftar ban.` }, { quoted: msg });
        }
    }
};