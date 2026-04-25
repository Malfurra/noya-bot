const axios = require('axios');
const { igdl } = require('btch-downloader');

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function downloadBuffer(url) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.instagram.com/',
            'Accept': '*/*',
        },
        timeout: 60000,
        maxContentLength: 100 * 1024 * 1024,
    });
    const contentType = res.headers['content-type'] || '';
    return { buffer: Buffer.from(res.data, 'binary'), contentType };
}

async function getIgCaption(url) {
    try {
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
            },
            timeout: 10000,
        });
        const ogDesc = res.data.match(/<meta property="og:description" content="([^"]*?)"\s*\/?>/i);
        if (ogDesc && ogDesc[1]) {
            return ogDesc[1]
                .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
                .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#039;/g, "'")
                .replace(/^\d[\d,]*\s+likes?,\s+\d[\d,]*\s+comments?\s+-\s+\S+\s+on\s+[^:]+:\s*/, '')
                .replace(/^["']|["']\.*$/g, '')
                .trim();
        }
    } catch {}
    return '';
}

function isVideo(contentType, url) {
    if (contentType.includes('video')) return true;
    const cleanUrl = url.split('?')[0];
    if (cleanUrl.endsWith('.mp4')) return true;
    try {
        const tokenMatch = url.match(/token=([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)/);
        if (tokenMatch) {
            const payload = JSON.parse(Buffer.from(tokenMatch[1].split('.')[1], 'base64url').toString());
            if (payload.filename?.includes('.mp4')) return true;
            if (payload.url?.includes('.mp4')) return true;
        }
    } catch {}
    return false;
}

async function startProcessing(sock, from, msg) {
    const status = await sock.sendMessage(from, { text: 'Sedang memproses.' }, { quoted: msg });
    let active = true;
    const steps = ['Sedang memproses.', 'Sedang memproses..', 'Sedang memproses...', 'sedang memproses.', 'sedang memproses..', 'sedang memproses...'];
    let i = 0;
    const interval = setInterval(async () => {
        if (!active) return;
        await sock.sendMessage(from, { text: steps[i++ % steps.length], edit: status.key }).catch(() => {});
    }, 500);
    const stop = async (text = 'done.') => {
        active = false;
        clearInterval(interval);
        await delay(600);
        await sock.sendMessage(from, { text, edit: status.key }).catch(() => {});
    };
    return { statusKey: status.key, stop };
}

module.exports = async function downloadCmd(sock, msg, command, args, from, fullText, quotedText, isOwner) {

    if (command === 'limitig') {
        if (!isOwner) return await sock.sendMessage(from, { text: 'Fitur khusus owner.' }, { quoted: msg });
        return await sock.sendMessage(from, { text: 'Sisa limit API Instagram: UNLIMITED' }, { quoted: msg });
    }

    if (command === 'choice' || fullText.startsWith('getaudio|')) {
        const urlMatch = fullText.match(/(https?:\/\/[^\s]+)/) || quotedText?.match(/(https?:\/\/[^\s]+)/);
        if (!urlMatch) return;
        const url = urlMatch[0];
        const { stop } = await startProcessing(sock, from, msg);
        try {
            if (url.includes('tiktok.com')) {
                const { data } = await axios.get(`${process.env.TIKTOK_API}?url=${encodeURIComponent(url)}`);
                if (!data || data.code !== 0 || !data.data || !data.data.music) return await stop('Audio tidak ditemukan.');
                await stop();
                await sock.sendMessage(from, { audio: { url: data.data.music }, mimetype: 'audio/mpeg' }, { quoted: msg });
            } else if (url.includes('instagram.com')) {
                const dataList = await igdl(url);
                if (!dataList) return await stop('Data tidak ditemukan.');
                let raw = dataList.result || dataList.data || dataList;
                if (!Array.isArray(raw)) raw = [raw];
                const mediaUrls = raw
                    .map(m => (typeof m === 'object' && m !== null ? (m.url || m.video_url || m.link) : m))
                    .filter(m => typeof m === 'string' && m.startsWith('http'));
                if (mediaUrls.length === 0) return await stop('Gagal ambil audio.');
                await stop();
                try {
                    const { buffer } = await downloadBuffer(mediaUrls[0]);
                    await sock.sendMessage(from, { audio: buffer, mimetype: 'audio/mpeg' }, { quoted: msg });
                } catch {
                    await sock.sendMessage(from, { audio: { url: mediaUrls[0] }, mimetype: 'audio/mpeg' }, { quoted: msg });
                }
            }
        } catch {
            await stop('Kesalahan sistem audio.');
        }
        return;
    }

    if (command === 'tt') {
        if (!args[0]) return await sock.sendMessage(from, { text: 'Masukkan linknya.' }, { quoted: msg });
        const url = args[0];
        const { stop } = await startProcessing(sock, from, msg);
        try {
            const { data } = await axios.get(`${process.env.TIKTOK_API}?url=${encodeURIComponent(url)}`);
            if (!data || data.code !== 0 || !data.data) return await stop('Gagal ambil data TikTok.');
            await stop();
            const caption = `✦ *Download by Noya AI* ✨\n\n📝 ${data.data.title || '-'}\n\n· · ────────────── · ·\n> 🍁 _Powered by Noya AI_ 𖹭.ᐟ`;
            const audioButton = [{ buttonId: `getaudio|${url}`, buttonText: { displayText: '🎵 AUDIO / MP3' }, type: 1 }];
            if (data.data.images?.length > 0) {
                for (let i = 0; i < data.data.images.length; i++) {
                    if (i === 0) await sock.sendMessage(from, { image: { url: data.data.images[i] }, caption, buttons: audioButton, headerType: 4 }, { quoted: msg });
                    else await sock.sendMessage(from, { image: { url: data.data.images[i] } }, { quoted: msg });
                }
            } else {
                await sock.sendMessage(from, { video: { url: data.data.play || data.data.wmplay }, caption, buttons: audioButton, headerType: 5 }, { quoted: msg });
            }
        } catch {
            await stop('TikTok error.');
        }
    }

    if (command === 'ig') {
        if (!args[0]) return await sock.sendMessage(from, { text: 'Masukkan linknya.' }, { quoted: msg });
        const url = args[0];
        const { stop } = await startProcessing(sock, from, msg);
        try {
            const [dataList, igCaption] = await Promise.all([
                igdl(url),
                getIgCaption(url),
            ]);

            if (!dataList) return await stop('Gagal ambil data.');

            let raw = dataList.result || dataList.data || dataList;
            if (!Array.isArray(raw)) raw = [raw];

            const fallbackCaption = dataList.title || dataList.caption || dataList.desc || '';
            const rawCaption = igCaption || fallbackCaption || '-';
            const finalCaption = rawCaption.length > 200 ? rawCaption.slice(0, 200) + '...' : rawCaption;

            const mediaUrls = raw
                .map(m => (typeof m === 'object' && m !== null ? (m.url || m.video_url || m.link) : m))
                .filter(m => typeof m === 'string' && m.startsWith('http'));

            if (mediaUrls.length === 0) return await stop('Link tidak valid.');
            await stop();

            const textCaption = `✦ *Download by Noya AI* ✨\n\n📝 ${finalCaption}\n\n· · ────────────── · ·\n> 🍁 _Powered by Noya AI_ 𖹭.ᐟ\n`;
            const audioButton = [{ buttonId: `getaudio|${url}`, buttonText: { displayText: '🎵 AUDIO / MP3' }, type: 1 }];

            for (let i = 0; i < mediaUrls.length; i++) {
                const mediaUrl = mediaUrls[i];
                try {
                    const { buffer, contentType } = await downloadBuffer(mediaUrl);
                    const vid = isVideo(contentType, mediaUrl);
                    if (i === 0) {
                        if (vid) await sock.sendMessage(from, { video: buffer, caption: textCaption, mimetype: 'video/mp4', buttons: audioButton, headerType: 5 }, { quoted: msg });
                        else await sock.sendMessage(from, { image: buffer, caption: textCaption, mimetype: 'image/jpeg', buttons: audioButton, headerType: 4 }, { quoted: msg });
                    } else {
                        if (vid) await sock.sendMessage(from, { video: buffer, mimetype: 'video/mp4' }, { quoted: msg });
                        else await sock.sendMessage(from, { image: buffer, mimetype: 'image/jpeg' }, { quoted: msg });
                    }
                } catch {
                    if (i === 0) await sock.sendMessage(from, { text: `⚠️ Gagal kirim media ke-${i + 1}.` }, { quoted: msg });
                }
            }
        } catch {
            await stop('Instagram Error.');
        }
    }
};