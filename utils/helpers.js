function cleanJid(jid) {
    if (!jid) return jid;
    return jid.includes(':') ? jid.split(':')[0] + '@' + jid.split('@')[1] : jid;
}

function resolveUser(usersDb, senderKey) {
    const data = usersDb[senderKey];
    if (!data) return null;
    if (data.isLink && data.targetUid) return usersDb[data.targetUid] || null;
    return data;
}

function durationString(ms) {
    if (ms >= 31536000000) return Math.floor(ms / 31536000000) + ' tahun';
    if (ms >= 2592000000)  return Math.floor(ms / 2592000000)  + ' bulan';
    if (ms >= 86400000)    return Math.floor(ms / 86400000)    + ' hari';
    if (ms >= 3600000)     return Math.floor(ms / 3600000)     + ' jam';
    if (ms >= 60000)       return Math.floor(ms / 60000)       + ' menit';
    return Math.floor(ms / 1000) + ' detik';
}

async function ensureUser(dbs, saveDb, senderJid, pushName) {
    const { usersDb } = dbs;
    if (usersDb[senderJid]) return resolveUser(usersDb, senderJid);

    const currentName = pushName || 'User';
    let foundMatch = false;

    if (currentName !== 'User') {
        for (const uid in usersDb) {
            const u = usersDb[uid];
            if (!u.isLink && u.waName === currentName) {
                usersDb[senderJid] = { isLink: true, targetUid: uid };
                foundMatch = true;
                break;
            }
        }
    }

    if (!foundMatch) {
        let maxNumber = 0;
        for (const key in usersDb) {
            const n = parseInt(key, 10);
            if (!isNaN(n) && n > maxNumber && !usersDb[key].isLink) maxNumber = n;
        }
        const newUid = String(maxNumber + 1).padStart(6, '0');
        usersDb[newUid] = {
            uid: newUid,
            name: currentName,
            waName: currentName,
            date: new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }),
            xp: 0,
            level: 1,
            messageCount: 0
        };
        usersDb[senderJid] = { isLink: true, targetUid: newUid };
    }

    await saveDb('usersDb');
    return resolveUser(usersDb, senderJid);
}

function xpForLevel(level) { return level * 100; }

function getLevelFromXp(xp) {
    let level = 1, accumulated = 0;
    while (true) {
        const needed = xpForLevel(level);
        if (accumulated + needed > xp) break;
        accumulated += needed;
        level++;
    }
    return level;
}

function xpProgressInLevel(xp) {
    let level = 1, accumulated = 0;
    while (true) {
        const needed = xpForLevel(level);
        if (accumulated + needed > xp) return { current: xp - accumulated, needed };
        accumulated += needed;
        level++;
    }
}

async function awardXp(dbs, saveDb, senderJid, amount) {
    const user = resolveUser(dbs.usersDb, senderJid);
    if (!user) return null;
    if (typeof user.xp !== 'number') user.xp = 0;
    if (typeof user.level !== 'number') user.level = 1;
    if (typeof user.messageCount !== 'number') user.messageCount = 0;
    const oldLevel = getLevelFromXp(user.xp);
    user.xp += amount;
    user.messageCount += 1;
    const newLevel = getLevelFromXp(user.xp);
    user.level = newLevel;
    dbs.usersDb[user.uid] = user;
    await saveDb('usersDb');
    if (newLevel > oldLevel) return { leveledUp: true, newLevel };
    return { leveledUp: false, newLevel };
}

module.exports = { cleanJid, resolveUser, durationString, ensureUser, xpForLevel, getLevelFromXp, xpProgressInLevel, awardXp };
