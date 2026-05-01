const { saveDb } = require('../database');

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;
const BOT_FOOTER = global.botFooter || '🍁 _Powered by Noya Company_ 𖹭.ᐟ';

const REWARDS = {
    daily: 5000,
    weekly: 30000,
    monthly: 150000
};

const CASTES = [
    { limit: 0, name: '♙ Nameless ♙' },
    { limit: 50000, name: '⚚ Wanderer ⚚' },
    { limit: 150000, name: '⚔ Awakened ⚔' },
    { limit: 500000, name: '♆ Ascendant ♆' },
    { limit: 1000000, name: '⚜ Sovereign ⚜' },
    { limit: 5000000, name: '✠ Monarch ✠' },
    { limit: 15000000, name: '♛ Overlord ♛' },
    { limit: 50000000, name: '♔ Emperor ♔' },
    { limit: 150000000, name: '❈ Demigod ❈' },
    { limit: 500000000, name: '❂ Celestial ❂' },
    { limit: 2000000000, name: '✧ Primordial ✧' },
    { limit: 10000000000, name: '⍟ Archon ⍟' },
    { limit: 50000000000, name: '✵ Pantheon ✵' },
    { limit: 1000000000000, name: '♾ Deus ♾' },
    { limit: 10000000000000, name: '⚶ Aeon ⚶' },
    { limit: 50000000000000, name: '۞ The Absolute ۞' },
    { limit: 100000000000000, name: 'Ω Apeiron Ω' },
    { limit: 500000000000000, name: '𖤍 The Origin 𖤍' },
    { limit: 1000000000000000, name: '𓁿 Omniscien 𓁿t' },
    { limit: 9999999999999999, name: '∅ The Void ∅' }
];

function getCaste(balance) {
    let currentCaste = CASTES[0].name;
    for (let i = 0; i < CASTES.length; i++) {
        if (balance >= CASTES[i].limit) {
            currentCaste = CASTES[i].name;
        } else {
            break;
        }
    }
    return currentCaste;
}

function msToTime(duration) {
    const days = Math.floor(duration / DAY_MS);
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((duration / 1000 / 60) % 60);
    if (days > 0) return `${days} Hari ${hours} Jam`;
    if (hours > 0) return `${hours} Jam ${minutes} Menit`;
    return `${minutes} Menit`;
}

module.exports = async function ecoCmd(sock, msg, command, args, dbs, sender) {
    const from = msg.key.remoteJid;

    if (!dbs.ecoDb) dbs.ecoDb = {};
    if (!dbs.ecoDb[sender]) dbs.ecoDb[sender] = { balance: 0, lastDaily: 0, lastWeekly: 0, lastMonthly: 0 };

    const userEco = dbs.ecoDb[sender];
    const now = Date.now();

if (command === 'b' || command === 'balance') {
        const kasta = getCaste(userEco.balance);
        const teksWallet = 
`╔══════════════════════╗
║            ⋆. 𐙚˚࿔ *WALLET* 𝜗𝜚˚⋆                ║
╚══════════════════════╝

✿ *ACCOUNT DETAILS*
┌─────────────────────
│ ﹒⟡ *Balance* : *Rp${userEco.balance.toLocaleString('id-ID')}*
│ ﹒❖ *Tier*    : *${kasta}*
└─────────────────────

· · ────────────── · ·
> ${BOT_FOOTER}
· · ────────────── · ·`;

        return await sock.sendMessage(from, { 
            text: teksWallet.trim() 
        }, { quoted: msg });
    }
    
    if (command === 'daily') {
        if (now - userEco.lastDaily < DAY_MS) {
            const timeLeft = DAY_MS - (now - userEco.lastDaily);
            return await sock.sendMessage(from, { text: `⏳ Klaim harian belum tersedia.\nWaktu tersisa: *${msToTime(timeLeft)}*` }, { quoted: msg });
        }
        userEco.balance += REWARDS.daily;
        userEco.lastDaily = now;
        await saveDb('ecoDb');
        return await sock.sendMessage(from, { text: `✅ Klaim Harian Berhasil\n+ Rp${REWARDS.daily.toLocaleString('id-ID')}\n\n💳 Total Saldo: Rp${userEco.balance.toLocaleString('id-ID')}` }, { quoted: msg });
    }

    if (command === 'weekly') {
        if (now - userEco.lastWeekly < WEEK_MS) {
            const timeLeft = WEEK_MS - (now - userEco.lastWeekly);
            return await sock.sendMessage(from, { text: `⏳ Klaim mingguan belum tersedia.\nWaktu tersisa: *${msToTime(timeLeft)}*` }, { quoted: msg });
        }
        userEco.balance += REWARDS.weekly;
        userEco.lastWeekly = now;
        await saveDb('ecoDb');
        return await sock.sendMessage(from, { text: `✅ Klaim Mingguan Berhasil\n+ Rp${REWARDS.weekly.toLocaleString('id-ID')}\n\n💳 Total Saldo: Rp${userEco.balance.toLocaleString('id-ID')}` }, { quoted: msg });
    }

    if (command === 'monthly') {
        if (now - userEco.lastMonthly < MONTH_MS) {
            const timeLeft = MONTH_MS - (now - userEco.lastMonthly);
            return await sock.sendMessage(from, { text: `⏳ Klaim bulanan belum tersedia.\nWaktu tersisa: *${msToTime(timeLeft)}*` }, { quoted: msg });
        }
        userEco.balance += REWARDS.monthly;
        userEco.lastMonthly = now;
        await saveDb('ecoDb');
        return await sock.sendMessage(from, { text: `✅ Klaim Bulanan Berhasil\n+ Rp${REWARDS.monthly.toLocaleString('id-ID')}\n\n💳 Total Saldo: Rp${userEco.balance.toLocaleString('id-ID')}` }, { quoted: msg });
    }
};