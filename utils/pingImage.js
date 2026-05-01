const puppeteer = require('puppeteer-core');
const os = require('os');

async function generatePingImage(latency) {
    const ramTotal = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const ramFree = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const ramUsed = (ramTotal - ramFree).toFixed(2);
    const ramPercent = Math.round((ramUsed / ramTotal) * 100);

    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const h = Math.floor((uptime % 86400) / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const uptimeStr = `${days}d ${h}h ${m}m`;

    const osName = os.platform();
    const osRelease = os.release();
    const osStr = `${osName} ${osRelease.length > 12 ? osRelease.substring(0, 12) + '..' : osRelease}`;

    let speedColor = '#3fb950'; // Green
    if (latency > 500) speedColor = '#f85149'; // Red
    else if (latency > 200) speedColor = '#d29922'; // Orange
    else if (latency > 100) speedColor = '#58a6ff'; // Blue

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                margin: 0;
                padding: 0;
                background-color: transparent;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
            }
            .dashboard {
                background-color: #161618;
                border-radius: 16px;
                padding: 30px;
                width: 540px;
                font-family: 'Consolas', 'Courier New', monospace;
            }
            .header {
                font-size: 14px;
                color: #8b949e;
                margin-bottom: 24px;
                margin-left: 8px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
            }
            .card {
                background-color: #1e1e20;
                border: 1px solid #2d2d30;
                border-radius: 16px;
                padding: 24px 20px;
                display: flex;
                align-items: center;
                gap: 20px;
            }
            .icon-wrapper {
                display: flex;
                justify-content: center;
                align-items: center;
                flex-shrink: 0;
            }
            .info {
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            .label {
                font-size: 14px;
                color: #8b949e;
                margin-bottom: 8px;
            }
            .value {
                font-size: 20px;
                font-weight: bold;
                color: #ffffff;
                line-height: 1.2;
            }
            .value-os {
                font-size: 18px;
                font-weight: bold;
                color: #ffffff;
                line-height: 1.4;
            }
        </style>
    </head>
    <body>
        <div class="dashboard" id="capture">
            <div class="header">SYSTEM INFO</div>
            <div class="grid">
                <!-- Latency -->
                <div class="card">
                    <div class="icon-wrapper">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                    </div>
                    <div class="info">
                        <div class="label">Latency</div>
                        <div class="value">${latency}ms</div>
                    </div>
                </div>

                <!-- RAM -->
                <div class="card">
                    <div class="icon-wrapper">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bc8cff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                            <rect x="9" y="9" width="6" height="6"></rect>
                            <line x1="9" y1="1" x2="9" y2="4"></line>
                            <line x1="15" y1="1" x2="15" y2="4"></line>
                            <line x1="9" y1="20" x2="9" y2="23"></line>
                            <line x1="15" y1="20" x2="15" y2="23"></line>
                            <line x1="20" y1="9" x2="23" y2="9"></line>
                            <line x1="20" y1="14" x2="23" y2="14"></line>
                            <line x1="1" y1="9" x2="4" y2="9"></line>
                            <line x1="1" y1="14" x2="4" y2="14"></line>
                        </svg>
                    </div>
                    <div class="info">
                        <div class="label">RAM Usage</div>
                        <div class="value">${ramUsed}GB</div>
                    </div>
                </div>

                <!-- Uptime -->
                <div class="card">
                    <div class="icon-wrapper">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f0883e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </div>
                    <div class="info">
                        <div class="label">Uptime</div>
                        <div class="value">${uptimeStr}</div>
                    </div>
                </div>

                <!-- OS -->
                <div class="card">
                    <div class="icon-wrapper">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8b949e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="2" y="4" width="20" height="7" rx="2" ry="2"></rect>
                            <rect x="2" y="13" width="20" height="7" rx="2" ry="2"></rect>
                            <circle cx="6" cy="7.5" r="1"></circle>
                            <circle cx="6" cy="16.5" r="1"></circle>
                        </svg>
                    </div>
                    <div class="info">
                        <div class="label">System OS</div>
                        <div class="value-os">${osName}<br>${osRelease.length > 8 ? osRelease.substring(0, 8) + '...' : osRelease}</div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    const browserPath = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ].find(p => require('fs').existsSync(p));

    const browser = await puppeteer.launch({
        executablePath: browserPath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 2 });
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const element = await page.$('#capture');
    const buffer = await element.screenshot({ type: 'png', omitBackground: true });

    await browser.close();
    return buffer;
}

module.exports = { generatePingImage };
