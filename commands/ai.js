const os   = require('os');
const Groq = require('groq-sdk');
const { saveDb } = require('../database');
const { resolveUser } = require('../utils/helpers');

module.exports = async function aiCmd(sock, msg, command, textWithoutPrefix, config, dbs, sender) {
    const from   = msg.key.remoteJid;
    const prompt = textWithoutPrefix.substring(command.length).trim();

    const groq = config.groqApiKey ? new Groq({ apiKey: config.groqApiKey }) : null;

    
    if (command === 'gemini') {
        if (!prompt) return await sock.sendMessage(from, { text: 'Mau tanya apa?' }, { quoted: msg });
        if (!groq)   return await sock.sendMessage(from, { text: 'API Key Groq belum dipasang.' });

        try {
            const statusMsg = await sock.sendMessage(from, { text: 'processing...' }, { quoted: msg });
            const res = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model:    'llama-3.1-8b-instant'
            });
            const text = res.choices[0]?.message?.content || 'Gagal memproses.';
            await sock.sendMessage(from, { text: 'done.', edit: statusMsg.key });
            return await sock.sendMessage(from, { text }, { quoted: msg });
        } catch (err) {
            return await sock.sendMessage(from, { text: `Error: ${err.message}` });
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

            if (!prompt) {
                return await sock.sendMessage(from, {
                    text: `Halo ${userName}! Noya di sini! Sini ngobrol sama Noya UwU`
                }, { quoted: msg });
            }

            
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

            const payload = [systemMsg, ...dbs.noyaHistoryDb[userUid], { role: 'user', content: prompt }];
            const res = await groq.chat.completions.create({
                messages: payload,
                model:    'llama-3.3-70b-versatile'
            });

            let noyaResp = res.choices[0]?.message?.content || 'Aduh Noya ngeblank nih...';

            // Extract & save new facts
            const factMatch = noyaResp.match(/\[FAKTA:\s*(.*?)\]/i);
            if (factMatch) {
                const newFact = factMatch[1].trim();
                if (!dbs.userFactsDb[userUid].some(f => f.toLowerCase() === newFact.toLowerCase())) {
                    dbs.userFactsDb[userUid].push(newFact);
                    await saveDb('userFactsDb');
                }
                noyaResp = noyaResp.replace(factMatch[0], '').trim();
            }

            _pushHistory(dbs.noyaHistoryDb[userUid], prompt, noyaResp);
            await saveDb('noyaHistoryDb');

            return await sock.sendMessage(from, { text: noyaResp }, { quoted: msg });

        } catch (err) {
            return await sock.sendMessage(from, {
                text: `Aduh, Noya pusing tiba-tiba 😵‍💫 (${err.message})`
            }, { quoted: msg });
        }
    }
};

// ── Helpers ─────────────────────────────────────────
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
