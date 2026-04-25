const os   = require('os');
const fs   = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@phrolovaa/baileys');
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { saveDb } = require('../database');
const { resolveUser } = require('../utils/helpers');

module.exports = async function aiCmd(sock, msg, command, textWithoutPrefix, config, dbs, sender) {
    const from   = msg.key.remoteJid;
    let prompt   = textWithoutPrefix.substring(command.length).trim();

    const groq = config.groqApiKey ? new Groq({ apiKey: config.groqApiKey }) : null;

    if (command === 'gemini') {
        if (!prompt) return await sock.sendMessage(from, { text: 'Mau tanya apa?' }, { quoted: msg });
        if (!process.env.GEMINI_API_KEY) return await sock.sendMessage(from, { text: 'API Key Gemini belum dipasang di .env.' });

        try {
            const statusMsg = await sock.sendMessage(from, { text: 'processing...' }, { quoted: msg });
            
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 
            
            const result = await model.generateContent(prompt);
            const text = result.response.text() || 'Gagal memproses.';
            
            await sock.sendMessage(from, { text: 'done.', edit: statusMsg.key });
            return await sock.sendMessage(from, { text }, { quoted: msg });
        } catch (err) {
            return await sock.sendMessage(from, { text: `Error Gemini: ${err.message}` });
        }
    }

    if (command === 'noya') {
        try {
            const userProfile = resolveUser(dbs.usersDb, sender);

            if (!userProfile?.name) {
                return await sock.sendMessage(from, {
                    text: 'Eh, kamu siapa? Ketik .profile dulu biar Noya kenal!'
                }, { quoted: msg });
            }

            const userName = userProfile.name;
            const userUid  = userProfile.uid;

            if (!dbs.noyaBrainDb)             dbs.noyaBrainDb   = {};
            if (!dbs.noyaHistoryDb)           dbs.noyaHistoryDb = {};
            if (!dbs.noyaHistoryDb[userUid])  dbs.noyaHistoryDb[userUid] = [];
            if (!dbs.userFactsDb)             dbs.userFactsDb   = {};
            if (!dbs.userFactsDb[userUid])    dbs.userFactsDb[userUid]   = [];

            if (prompt.toLowerCase().startsWith('ajarin')) {
                const ajarinText = prompt.substring(6).trim();
                if (!ajarinText.includes('|')) {
                    return await sock.sendMessage(from, {
                        text: 'Format:\n*.noya ajarin pertanyaan | jawaban*\nContoh: .noya ajarin siapa namamu | Aku Noya!'
                    }, { quoted: msg });
                }
                const [rawKey, ...rawVal] = ajarinText.split('|');
                const keyword = rawKey.trim().toLowerCase();
                const answer  = rawVal.join('|').trim();
                if (!Array.isArray(dbs.noyaBrainDb[keyword])) dbs.noyaBrainDb[keyword] = [];
                dbs.noyaBrainDb[keyword].push(answer);
                await saveDb('noyaBrainDb');
                return await sock.sendMessage(from, {
                    text: `Oke! Kalau ada yang tanya "${keyword}", Noya bakal jawab gitu. Makasih ${userName}!`
                }, { quoted: msg });
            }

            const userWords = prompt.toLowerCase();
            let foundAnswers = [];
            if (Array.isArray(dbs.noyaBrainDb[userWords])) {
                foundAnswers = dbs.noyaBrainDb[userWords];
            } else {
                for (const key in dbs.noyaBrainDb) {
                    if (key.length > 3 && userWords.includes(key) && Array.isArray(dbs.noyaBrainDb[key])) {
                        foundAnswers = foundAnswers.concat(dbs.noyaBrainDb[key]);
                    }
                }
            }

            if (foundAnswers.length > 0) {
                const answer = foundAnswers[Math.floor(Math.random() * foundAnswers.length)];
                _pushHistory(dbs.noyaHistoryDb[userUid], prompt, answer);
                await saveDb('noyaHistoryDb');
                return await sock.sendMessage(from, { text: answer }, { quoted: msg });
            }

            if (!groq) return await sock.sendMessage(from, { text: 'Noya lagi pusing, apikey Groq belum dipasang :(' });

            const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
            const quotedMsg = contextInfo?.quotedMessage;
            const quotedType = quotedMsg ? Object.keys(quotedMsg)[0] : null;

            const mediaType = quotedType || Object.keys(msg.message || {})[0];
            const mediaMessage = quotedMsg ? quotedMsg[quotedType] : msg.message[mediaType];

            let base64Image = null;

            if (quotedType === 'conversation' || quotedType === 'extendedTextMessage') {
                const repliedText = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text;
                if (repliedText) prompt += `\n\n[Pesan yang di-reply: ${repliedText}]`;
            }

            const getMediaBuffer = async (type, messageData) => {
                const stream = await downloadContentFromMessage(messageData, type.replace('Message', ''));
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                return buffer;
            };

            if (['imageMessage', 'audioMessage', 'videoMessage'].includes(mediaType)) {
                await sock.sendMessage(from, { react: { text: "👀", key: msg.key } });

                if (mediaType === 'imageMessage') {
                    const buffer = await getMediaBuffer('image', mediaMessage);
                    base64Image = buffer.toString('base64');
                }
                
                else if (mediaType === 'audioMessage' || mediaType === 'videoMessage') {
                    try {
                        const buffer = await getMediaBuffer(mediaType, mediaMessage);
                        const ext = mediaType === 'videoMessage' ? 'mp4' : 'ogg';
                        const tmpFile = path.join(os.tmpdir(), `noya_media_${Date.now()}.${ext}`);
                        fs.writeFileSync(tmpFile, buffer);

                        const transcription = await groq.audio.transcriptions.create({
                            file: fs.createReadStream(tmpFile),
                            model: 'whisper-large-v3'
                        });

                        fs.unlinkSync(tmpFile);

                        if (transcription.text) {
                            prompt += `\n\n[Transkripsi dari ${mediaType === 'videoMessage' ? 'Video' : 'Voice Note/Audio'}: "${transcription.text}"]`;
                        }
                    } catch (err) {
                        prompt += `\n\n[Gagal mengenali suara dari media: ${err.message}]`;
                    }
                }
            }

            if (!prompt && !base64Image) {
                return await sock.sendMessage(from, {
                    text: `Halo ${userName}! Noya di sini! Sini ngobrol sama Noya UwU`
                }, { quoted: msg });
            }

            const { timeNow, dateNow } = _getWibTime();
            const ramTotal  = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
            const ramUsed   = ((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2);
            const uptime    = process.uptime();
            const h = Math.floor(uptime / 3600), m = Math.floor((uptime % 3600) / 60);
            const totalUsers = Object.keys(dbs.usersDb || {}).length;
            const statusUser = dbs.ownerUsers?.includes(sender) ? 'Owner Bot' : 'User';
            const botPrefix  = dbs.settingsDb?.prefix || '.';

            let faktaStr = '';
            if (dbs.userFactsDb[userUid].length > 0) {
                faktaStr = `\n\nFAKTA TENTANG ${userName.toUpperCase()}:\n- ` +
                           dbs.userFactsDb[userUid].join('\n- ') +
                           '\nGunakan fakta ini dalam percakapan.';
            }

            const systemMsg = {
                role: 'system',
                content:
                    `Kamu adalah Noya, gadis virtual imut dan asik. Gunakan 'aku/kamu' atau 'Noya'. ` +
                    `Lawan bicaramu: ${userName}. Jawab santai kayak chat WA.\n\n` +
                    `[DATA REAL-TIME]\n` +
                    `- Jam    : ${timeNow} WIB\n` +
                    `- Tanggal: ${dateNow}\n` +
                    `- CPU    : ${os.cpus()[0]?.model || '-'}\n` +
                    `- RAM    : ${ramUsed} GB / ${ramTotal} GB\n` +
                    `- Uptime : ${h} jam ${m} menit\n` +
                    `- Users  : ${totalUsers}\n` +
                    `- Status : ${statusUser}\n` +
                    `- Prefix : ${botPrefix}` +
                    faktaStr +
                    `\n\nTUGAS RAHASIA: Jika ada fakta baru tentang user, awali balasan dengan tag [FAKTA: informasi].`
            };

            let modelToUse = 'meta-llama/llama-4-scout-17b-16e-instruct'; 
            let userMessageContent = prompt || 'Apa yang kamu lihat di gambar ini?';

            if (base64Image) {
                modelToUse = 'meta-llama/llama-4-scout-17b-16e-instruct';
                userMessageContent = [
                    { type: 'text', text: userMessageContent },
                    { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                ];
            }

            const payload = [systemMsg, ...dbs.noyaHistoryDb[userUid], { role: 'user', content: userMessageContent }];
            
            const res = await groq.chat.completions.create({
                messages: payload,
                model:    modelToUse
            });

            let noyaResp = res.choices[0]?.message?.content || 'Aduh Noya ngeblank nih...';

            const factMatch = noyaResp.match(/\[FAKTA:\s*(.*?)\]/i);
            if (factMatch) {
                const newFact = factMatch[1].trim();
                if (!dbs.userFactsDb[userUid].some(f => f.toLowerCase() === newFact.toLowerCase())) {
                    dbs.userFactsDb[userUid].push(newFact);
                    await saveDb('userFactsDb');
                }
                noyaResp = noyaResp.replace(factMatch[0], '').trim();
            }

            const historyPrompt = typeof userMessageContent === 'string' ? prompt : (prompt || '[Kirim Gambar]');
            _pushHistory(dbs.noyaHistoryDb[userUid], historyPrompt, noyaResp);
            await saveDb('noyaHistoryDb');

            return await sock.sendMessage(from, { text: noyaResp }, { quoted: msg });

        } catch (err) {
            return await sock.sendMessage(from, {
                text: `Aduh, Noya pusing tiba-tiba 😵‍💫 (${err.message})`
            }, { quoted: msg });
        }
    }
};

function _pushHistory(arr, userMsg, botMsg) {
    arr.push({ role: 'user',      content: userMsg });
    arr.push({ role: 'assistant', content: botMsg  });
    if (arr.length > 20) arr.splice(0, arr.length - 20);
}

function _getWibTime() {
    const opts = { timeZone: 'Asia/Jakarta', hour12: false };
    return {
        timeNow: new Date().toLocaleTimeString('id-ID', opts),
        dateNow: new Date().toLocaleDateString('id-ID', { ...opts, dateStyle: 'full' })
    };
}
