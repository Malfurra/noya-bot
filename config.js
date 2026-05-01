require('dotenv').config();
require('./setting');

module.exports = {
    mongoUrl: process.env.MONGO_URL,
    ownerNumbers: global.ownerJid || [],
    geminiApiKey: global.geminiApiKey || process.env.GEMINI_API_KEY,
    groqApiKey: global.groqApiKey || process.env.GROQ_API_KEY,
    openaiApiKey: global.openaiApiKey || process.env.OPENAI_API_KEY,
    templatePagi: [
        "Pagi, Diana sayang! ☀️ Jangan lupa senyum hari ini ya, cantiknya kamu makin nambah lho kalau lagi senyum. 🥰",
        "Good morning Mala chan! 🌸 Udah pagi nih, semangat jalani harinya ya! Miss you already! 😘",
        "Selamat pagi Diana cintaku 💖. Semoga harimu selancar jalan tol dan seindah wajahmu. Have a great day! ✨",
        "Morning Mala chan sayangku 🦋. Jangan lupa sarapan ya, biar kuat ngadepin rindu dari aku eaa~ 🤭🍳",
        "Pagi dunia, pagi juga Diana ku sayang 🌻. Awali hari ini dengan doa dan senyuman manis dari kamu. Love u! 💌"
    ],
    templateMalam: [
        "Malam, Diana kesayanganku 🌙. Udah waktunya istirahat nih, jangan begadang terus ya. Nice dream! 😴💕",
        "Sleep tight Mala chan! 🌌 Makasih udah jadi alasan bahagiaku hari ini. See you in my dreams! 💋✨",
        "Malam Diana cantikku 🌠. Tutup matamu, tarik napas panjang, dan biarkan cintaku meluk kamu dari jauh. Selamat tidur sayang~ 🧸💖",
        "Good night Mala chan 🥀. Kalo mimpiin aku jangan lupa senyum ya besok pagi hehe. Sweet dreams, princess! 👑💤",
        "Udah malem nih Diana, waktunya charge energi kamu. Sleep well sayang, luv u to the moon and back! 🚀❤️"
    ]
};