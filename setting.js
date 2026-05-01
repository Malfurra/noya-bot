require('dotenv').config();

// Core bot identity
global.botName = 'Noya Bot';
global.ownerName = 'Noya Owner';

// Owner list (numeric + JID format)
global.owner = ['628989262387', '6281379143305'];
global.ownerJid = global.owner.map((num) => `${num}@s.whatsapp.net`);

// Sticker/package metadata
global.packname = 'Noya Bot';
global.author = 'Noya Company';
global.botFooter = '🍁 _Powered by Noya Company_ 𖹭.ᐟ';

// Default command prefix
global.prefa = ['.'];

// API keys from environment
global.geminiApiKey = process.env.GEMINI_API_KEY || '';
global.groqApiKey = process.env.GROQ_API_KEY || '';
global.openaiApiKey = process.env.OPENAI_API_KEY || '';

module.exports = global;
