const { downloadContentFromMessage } = require('@phrolovaa/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const FormData = require('form-data');
const cheerio = require('cheerio');
const webpmux = require('node-webpmux');

async function webp2mp4File(path) {
    return new Promise(async (resolve, reject) => {
        try {
            const form = new FormData();
            form.append('new-image-url', '');
            form.append('new-image', fs.createReadStream(path));
            
            const res = await axios({
                method: 'post',
                url: 'https://ezgif.com/webp-to-mp4',
                data: form,
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${form._boundary}`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            });
            
            const $ = cheerio.load(res.data);
            const file = $('input[name="file"]').attr('value');
            if (!file) throw new Error('File upload failed');
            
            const form2 = new FormData();
            form2.append('file', file);
            form2.append('convert', "Convert WebP to MP4!");
            
            const res2 = await axios({
                method: 'post',
                url: 'https://ezgif.com/webp-to-mp4/' + file,
                data: form2,
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${form2._boundary}`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            });
            
            const $2 = cheerio.load(res2.data);
            const src = $2('div#output > p.outfile > video > source').attr('src');
            if (!src) throw new Error('Conversion failed');
            
            resolve('https:' + src);
        } catch (err) {
            reject(err);
        }
    });
}

async function writeExif(media, packname, author) {
    const json = {
        "sticker-pack-id": "noya-baileys-id",
        "sticker-pack-name": packname,
        "sticker-pack-publisher": author,
        "emojis": ["🍁"]
    };
    const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
    const exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUIntLE(jsonBuff.length, 14, 4);

    const tmpFile = path.join(__dirname, `../temp/${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
    
    try {
        fs.writeFileSync(tmpFile, media);
        const img = new webpmux.Image();
        await img.load(tmpFile);
        img.exif = exif;
        await img.save(tmpFile);
        return fs.readFileSync(tmpFile);
    } finally {
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
}

async function downloadMedia(message, type) {
    const stream = await downloadContentFromMessage(message, type);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
}

function execPromise(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (err, stdout) => {
            if (err) reject(err);
            else resolve(stdout);
        });
    });
}

module.exports = async function stickerCmd(sock, msg, command, args, from, prefix) {
    const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
    const msgType = Object.keys(msg.message)[0];
    
    const isQuotedImage = quoted && quoted.imageMessage;
    const isQuotedVideo = quoted && quoted.videoMessage;
    const isQuotedSticker = quoted && quoted.stickerMessage;
    const isImage = msgType === 'imageMessage';
    const isVideo = msgType === 'videoMessage';

    const replyError = (text) => {
        const errorText = `╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *ERROR* 𝜗𝜚˚⋆ ║\n╚══════════════════════╝\n\n✿ *PEMBERITAHUAN*\n┌─────────────────────\n│ ﹒🚫 ${text}\n└─────────────────────\n\n· · ────────────── · ·\n> 🍁 _Powered by Noya Company_ 𖹭.ᐟ\n· · ────────────── · ·`;
        return sock.sendMessage(from, { text: errorText }, { quoted: msg });
    };

    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    let tempFiles = [];

    try {
        if (command === 's' || command === 'stiker' || command === 'swm' || command === 'stikerwm') {
            if (!isImage && !isVideo && !isQuotedImage && !isQuotedVideo && !isQuotedSticker) {
                return replyError(`Kirim/Balas gambar, video, atau stiker dengan caption *${prefix}${command}*`);
            }

            let stickerBuffer;
            const type = isQuotedSticker ? 'sticker' : ((isQuotedImage || isImage) ? 'image' : 'video');
            const mediaMessage = isQuotedImage || isQuotedVideo || isQuotedSticker ? quoted[Object.keys(quoted)[0]] : msg.message[msgType];

            if (type === 'video' && mediaMessage.seconds > 10) {
                return replyError('Durasi video maksimal 10 detik!');
            }

            const mediaBuffer = await downloadMedia(mediaMessage, type);

            if (type === 'sticker') {
                stickerBuffer = mediaBuffer;
            } else {
                const inputPath = path.join(tempDir, `${Date.now()}.${type === 'image' ? 'jpg' : 'mp4'}`);
                const outputPath = path.join(tempDir, `${Date.now()}.webp`);
                
                tempFiles.push(inputPath, outputPath);
                fs.writeFileSync(inputPath, mediaBuffer);

                if (type === 'image') {
                    await execPromise(`ffmpeg -i ${inputPath} -vcodec libwebp -vframes 1 -s 512:512 ${outputPath}`);
                } else {
                    await execPromise(`ffmpeg -i ${inputPath} -vcodec libwebp -filter:v fps=fps=15 -loop 0 -preset default -an -vsync 0 -s 512:512 ${outputPath}`);
                }

                stickerBuffer = fs.readFileSync(outputPath);
            }

            if (command === 'swm' || command === 'stikerwm') {
                let packname = "Noya Store";
                let author = "Bot";
                
                if (args.length > 0) {
                    const argStr = args.join(' ');
                    if (argStr.includes('|')) {
                        const split = argStr.split('|');
                        packname = split[0].trim();
                        author = split[1].trim();
                    } else {
                        packname = argStr;
                        author = "";
                    }
                }
                
                stickerBuffer = await writeExif(stickerBuffer, packname, author) || stickerBuffer;
            }

            await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });
        }

        if (command === 'toimg') {
            if (!isQuotedSticker) return replyError(`Balas stiker dengan caption *${prefix}${command}*`);
            
            const mediaMessage = quoted.stickerMessage;
            const mediaBuffer = await downloadMedia(mediaMessage, 'sticker');
            
            const isAnimated = mediaMessage.isAnimated || mediaBuffer.indexOf(Buffer.from('ANIM')) !== -1;
            
            const inputPath = path.join(tempDir, `${Date.now()}.webp`);
            tempFiles.push(inputPath);
            fs.writeFileSync(inputPath, mediaBuffer);

            try {
                const img = new webpmux.Image();
                await img.load(inputPath);
                let isModified = false;
                if (img.exif) {
                    img.exif = undefined;
                    isModified = true;
                }
                if (isModified) {
                    await img.save(inputPath);
                }
            } catch (e) {
            }

            if (isAnimated) {
                try {
                    const mp4Url = await webp2mp4File(inputPath);
                    const { data } = await axios.get(mp4Url, { responseType: 'arraybuffer' });
                    await sock.sendMessage(from, { video: data }, { quoted: msg });
                } catch (e) {
                    replyError('Gagal memproses konversi video animasi (Server Ezgif menolak permintaan).');
                }
            } else {
                const outputPath = path.join(tempDir, `${Date.now()}.jpg`);
                tempFiles.push(outputPath);
                
                try {
                    await execPromise(`ffmpeg -vcodec libwebp -i ${inputPath} -vframes 1 ${outputPath}`);
                } catch (e) {
                    await execPromise(`ffmpeg -i ${inputPath} -vframes 1 ${outputPath}`);
                }
                
                const imageBuffer = fs.readFileSync(outputPath);
                await sock.sendMessage(from, { image: imageBuffer }, { quoted: msg });
            }
        }

    } catch (err) {
        console.error(err);
        replyError('Terjadi kesalahan saat memproses media.');
    } finally {
        for (const file of tempFiles) {
            if (fs.existsSync(file)) {
                try {
                    fs.unlinkSync(file);
                } catch (e) {}
            }
        }
    }
};
