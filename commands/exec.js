const util = require('util');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let currentDir = process.cwd();

module.exports = async function execCmd(sock, msg, fullText, isOwner) {
    if (!isOwner) return;

    if (fullText.startsWith('$ ')) {
        const cmd = fullText.slice(2).trim();
        if (!cmd) return await sock.sendMessage(msg.key.remoteJid, { text: 'Masukkan command terminal!' });

        if (cmd.startsWith('cd ')) {
            const targetDir = cmd.replace('cd ', '').trim();
            const newDir = path.resolve(currentDir, targetDir);

            if (fs.existsSync(newDir) && fs.statSync(newDir).isDirectory()) {
                currentDir = newDir;
                return await sock.sendMessage(msg.key.remoteJid, { text: `\`\`\`${currentDir}\`\`\`` });
            } else {
                return await sock.sendMessage(msg.key.remoteJid, { text: `❌ Direktori tidak ditemukan:\n\`\`\`${targetDir}\`\`\`` });
            }
        }

        const sentMsg = await sock.sendMessage(msg.key.remoteJid, { text: `⏳ *Executing...*\n\`\`\`${cmd}\`\`\`` });
        const msgKey = sentMsg.key;

        const startTime = Date.now();
        let output = '';
        
        const child = spawn(cmd, { shell: true, cwd: currentDir });

        let lastEditTime = 0;
        let editTimeout = null;
        const EDIT_DELAY = 2000;

        const sendUpdate = async (isFinal = false) => {
            let textToSend = output.length > 50000 ? output.slice(-50000) : output;
            
            textToSend = textToSend.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

            if (!textToSend.trim()) {
                textToSend = isFinal ? 'The command was executed successfully (no output)' : '⏳ Processing...';
            }

            let finalMsg = `\`\`\`${textToSend.trim()}\`\`\``;
            if (isFinal) {
                const execTime = Date.now() - startTime;
                finalMsg += `\n\nExecuted in ${execTime} ms`;
            }

            try {
                await sock.sendMessage(msg.key.remoteJid, { text: finalMsg, edit: msgKey });
                lastEditTime = Date.now();
            } catch (err) {}
        };

        const scheduleUpdate = (isFinal = false) => {
            if (isFinal) {
                if (editTimeout) clearTimeout(editTimeout);
                sendUpdate(true);
                return;
            }

            const now = Date.now();
            if (now - lastEditTime >= EDIT_DELAY) {
                if (editTimeout) clearTimeout(editTimeout);
                sendUpdate();
            } else if (!editTimeout) {
                editTimeout = setTimeout(() => {
                    sendUpdate();
                    editTimeout = null;
                }, EDIT_DELAY - (now - lastEditTime));
            }
        };

        child.stdout.on('data', (data) => {
            output += data.toString();
            scheduleUpdate();
        });

        child.stderr.on('data', (data) => {
            output += data.toString();
            scheduleUpdate();
        });

        child.on('close', () => {
            scheduleUpdate(true);
        });
        
        return;
    }

    const isReturn = fullText.startsWith('=>');
    const code = isReturn ? fullText.slice(2).trim() : fullText.slice(1).trim();

    try {
        let result = isReturn
            ? await eval(`(async () => { return ${code} })()`)
            : await eval(`(async () => { ${code} })()`);

        if (typeof result !== 'string') result = util.inspect(result, { depth: 2 });
        await sock.sendMessage(msg.key.remoteJid, { text: String(result) });
    } catch (err) {
        await sock.sendMessage(msg.key.remoteJid, { text: util.format(err) });
    }
};
