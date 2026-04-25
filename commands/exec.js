const util = require('util');
const { exec } = require('child_process');
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
        let lastUpdate = Date.now();

        const child = exec(cmd, { cwd: currentDir, maxBuffer: 1024 * 1024 * 10 });

        const updateMessage = async (isFinal = false) => {
            const now = Date.now();
            if (isFinal || now - lastUpdate > 1500) {
                lastUpdate = now;
                
                let textToSend = output.length > 3000 ? output.slice(-3000) : output;
                
                if (!textToSend.trim()) {
                    textToSend = isFinal ? 'The command was executed successfully (no output)' : '⏳ Processing...';
                }

                let finalMsg = `\`\`\`${textToSend.trim()}\`\`\``;
                if (isFinal) {
                    const execTime = Date.now() - startTime;
                    finalMsg += `\n\nExecuted in ${execTime} ms`;
                }

                await sock.sendMessage(msg.key.remoteJid, { text: finalMsg, edit: msgKey }).catch(() => {});
            }
        };

        child.stdout.on('data', (data) => {
            output += data;
            updateMessage();
        });

        child.stderr.on('data', (data) => {
            output += data;
            updateMessage();
        });

        child.on('close', () => {
            updateMessage(true);
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
