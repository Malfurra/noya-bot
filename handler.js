const fs = require('fs');
const config = require('./config');
const { dbs, saveDb } = require('./database');
const { cleanJid, ensureUser, durationString, awardXp } = require('./utils/helpers');
const execCmd = require('./commands/exec');
const qcCmd = require('./commands/qc');
const generalCmd = require('./commands/general');
const ownerCmd = require('./commands/owner');
const aiCmd = require('./commands/ai');
const downloadCmd = require('./commands/download');
const ecoCmd = require('./commands/economy');
const { gameCmd, handleGameAnswer, handleWWNightAction } = require('./commands/games');

const processedMessages = new Set();
const GENERAL_CMDS = new Set(['tes','cekjam','menu','menugroup','menugame','menugeneral','menuowner','list','olist','ping','setname','profile','my','me','afk','welcome','setwelcome','delwelcome','gcs','saran','report', 'fakereply', 'freply','fr', 'enc', 'dec']);
const DOWNLOAD_CMDS = new Set(['tt','ig','yt','twitter','limitig']);
const AI_CMDS = new Set(['gemini','noya']);
const GAME_CMDS = new Set(['tb','tebakbendera','ttt','tictactoe','stopgame','tttwr','math','nyerah','ww','werewolf','wwjoin','wwstart','wwvote','wwend','wwdawn','wwwr','werewolfwinrate']);
const ECO_CMDS = new Set(['b','balance','daily','weekly','monthly']);
const OWNER_CMDS = new Set([
    'addlist','addolist','updatelist','delist','addrespon','delrespon','getlid','listgroup','bancmd', 'unbancmd','ceksaluran',
    'setpagi','setmalam','delpagi','delmalam','setprefix','delopen','delclose',
    'kick','warn','promote','demote','open','close','setopen','setclose',
    'addblock','delblock','broadcast','getidgc','cekid','listowner','addowner','delowner',
    'hidetag','h','ht','kill','restart'
]);

module.exports = async function messageHandler(sock, m) {
    try {
        if (m.type !== 'notify') return;
        
        const msg = m.messages[0];
        if (!msg || !msg.message || !msg.key.id) return;

        const msgId = msg.key.id;
        if (processedMessages.has(msgId)) return;
        processedMessages.add(msgId);
        
        if (processedMessages.size > 200) {
            processedMessages.delete(processedMessages.values().next().value);
        }

        const { authorizedUsers, ownerUsers, listDb, settingsDb, blockDb } = dbs;
        const prefix = settingsDb.prefix || '.';

        let rawSenderJid = msg.key.participant || msg.participant || msg.key.remoteJid;
        if (msg.key.fromMe && sock.user?.id) rawSenderJid = cleanJid(sock.user.id);
        const sender = cleanJid(rawSenderJid);
        const from = msg.key.remoteJid;

        if (blockDb?.includes(sender)) return;

        if (msg.pushName && dbs.contactDb[sender] !== msg.pushName) {
            dbs.contactDb[sender] = msg.pushName;
            await saveDb('contactDb');
        }

        await ensureUser(dbs, saveDb, sender, msg.pushName);

        const messageText =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            msg.message.videoMessage?.caption ||
            msg.message.buttonsResponseMessage?.selectedButtonId ||
            msg.message.templateButtonReplyMessage?.selectedId ||
            (msg.message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson 
                ? JSON.parse(msg.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id 
                : '') || '';
        
        if (!messageText) return;

        const fullText = messageText.trim();
        const senderNumber = sender.replace(/[^0-9]/g, '');

        const isOwner = ownerUsers.some(entry => {
            const entryNum = entry.toString().replace(/[^0-9]/g, '');
            return entryNum.length > 5 && senderNumber === entryNum;
        });
        
        const isAuthorizedUser = authorizedUsers.some(entry => {
            if (entry.toString().endsWith('@g.us')) return false;
            const entryNum = entry.toString().replace(/[^0-9]/g, '');
            return entryNum.length > 5 && senderNumber === entryNum;
        });

        const isAuthorizedGroup = from.endsWith('@g.us') && authorizedUsers.includes(from);
        const isAuthorized = isOwner || isAuthorizedUser || isAuthorizedGroup;

        if (!dbs.afkDb) dbs.afkDb = {};
        if (dbs.afkDb[sender] && !fullText.startsWith(prefix) && fullText.toLowerCase() !== 'prefix') {
            const afk = dbs.afkDb[sender];
            const dur = durationString(Date.now() - afk.time);
            delete dbs.afkDb[sender];
            await saveDb('afkDb');

            let replyText = '';
            if (afk.reason === 'Tanpa alasan' || afk.hasReason === false) {
                replyText = `*${afk.name}* berhenti AFK setelah ${dur}`;
            } else {
                replyText = `*${afk.name}* telah kembali dari *${afk.reason}* selama ${dur}`;
            }

            await sock.sendMessage(from, { text: replyText }, { quoted: msg });
        }

        const mentionedJids = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        for (const target of mentionedJids) {
            if (dbs.afkDb[target]) {
                const afk = dbs.afkDb[target];
                const dur = durationString(Date.now() - afk.time);
                await sock.sendMessage(from, {
                    text: `*Sedang AFK*\n\nNama     : ${afk.name}\nAlasan   : ${afk.reason}\nDurasi   : ${dur}`
                }, { quoted: msg });
            }
        }

        const isGameAnswer = await handleGameAnswer(sock, msg, fullText, sender, from, dbs);
        if (isGameAnswer) return;

        if (!from.endsWith('@g.us')) {
            const isWWAction = await handleWWNightAction(sock, msg, fullText, sender, from, dbs);
            if (isWWAction) return;
        }
        
        if (isOwner) {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            const quotedText = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text || '';
            
            if (quotedText.includes('SARAN MASUK') || quotedText.includes('REPORT MASUK')) {
                let targetJid = quotedMsg?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
                
                if (!targetJid) {
                    const match = quotedText.match(/Nomor\s*:\s*@([0-9]+)/);
                    if (match && match[1]) {
                        targetJid = match[1].length >= 15 ? match[1] + '@lid' : match[1] + '@s.whatsapp.net';
                    }
                }

                if (targetJid) {
                    const replyText = fullText;
                    const typeInfo = quotedText.includes('SARAN') ? 'Saran' : 'Laporan';
                    
                    const sendText = `╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *BALASAN OWNER* 𝜗𝜚˚⋆ ║\n╚══════════════════════╝\n\n✿ *Terkait ${typeInfo} Kamu:*\n┌─────────────────────\n│ ﹒💬 ${replyText}\n└─────────────────────\n\n· · ────────────── · ·\n> 🍁 _Powered by Noya Company_ 𖹭.ᐟ\n· · ────────────── · ·`;
                    
                    try {
                        await sock.sendMessage(targetJid, { text: sendText });
                        const dispName = targetJid.split('@')[0];
                        return await sock.sendMessage(from, { text: `✅ Balasan berhasil dikirim ke @${dispName}`, mentions: [targetJid] }, { quoted: msg });
                    } catch (e) {
                        return await sock.sendMessage(from, { text: `❌ Gagal mengirim balasan.` }, { quoted: msg });
                    }
                }
            }
        }

        if (fullText.startsWith('getaudio|')) {
            return await downloadCmd(sock, msg, 'choice', [], from, fullText, '', isOwner);
        }

        if (listDb[fullText.toLowerCase()]) {
            if (!isAuthorized) return;
            const item = listDb[fullText.toLowerCase()];
            if (item.isOwnerOnly && !isOwner) return;
            if (item.image && fs.existsSync(item.image)) {
                return await sock.sendMessage(from, { image: fs.readFileSync(item.image), caption: item.text });
            }
            return await sock.sendMessage(from, { text: item.text });
        }

        if (fullText.startsWith('>') || fullText.startsWith('=>') || fullText.startsWith('$')) {
            return await execCmd(sock, msg, fullText, isOwner);
        }

        if (!fullText.startsWith(prefix)) return;
        if (!isAuthorized) return;

        const textWithoutPrefix = fullText.slice(prefix.length).trim();
        const command = textWithoutPrefix.split(' ')[0].toLowerCase();
        const args = textWithoutPrefix.split(' ').slice(1);
        
        if (dbs.bannedCmdsDb && dbs.bannedCmdsDb[command] && !isOwner) {
            return await sock.sendMessage(from, {
                text: `╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *MAINTENANCE* 𝜗𝜚˚⋆ ║\n╚══════════════════════╝\n\n✿ *PEMBERITAHUAN*\n┌─────────────────────\n│ ﹒🚫 Fitur *${command}* sedang dinonaktifkan.\n│ ﹒💬 Alasan : ${dbs.bannedCmdsDb[command]}\n└─────────────────────\n\n· · ────────────── · ·\n> 🍁 _Powered by Noya Company_ 𖹭.ᐟ\n· · ────────────── · ·`
            }, { quoted: msg });
        }

        if (command === 'qc') {
            return await qcCmd(sock, msg, dbs, sender, saveDb);
        }

        if (DOWNLOAD_CMDS.has(command)) {
            return await downloadCmd(sock, msg, command, args, from, fullText, '', isOwner);
        }

        if (GENERAL_CMDS.has(command)) {
            await awardXp(dbs, saveDb, sender, 2);
            return await generalCmd(sock, msg, command, isOwner, dbs, prefix, args, sender);
        }

        if (GAME_CMDS.has(command)) {
            return await gameCmd(sock, msg, command, args, dbs, sender, prefix);
        }

        if (ECO_CMDS.has(command)) {
            return await ecoCmd(sock, msg, command, args, dbs, sender);
        }

        if (AI_CMDS.has(command)) {
            return await aiCmd(sock, msg, command, textWithoutPrefix, config, dbs, sender);
        }

        if (OWNER_CMDS.has(command)) {
            return await ownerCmd(sock, msg, command, args, fullText, rawSenderJid, isOwner, prefix);
        }

    } catch (err) {
        console.error('[Handler Error]', err);
    }
};
