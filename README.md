# 🤖 Noya Bot — WhatsApp Bot Documentation

> Baca seluruh dokumen ini sebelum memodifikasi kode. README ini adalah sumber kebenaran tunggal tentang arsitektur, alur data, konvensi, dan fitur bot. Jangan mengasumsikan sesuatu yang tidak tertulis di sini.

---

## 📌 Ringkasan Proyek

**Noya Bot** adalah WhatsApp bot berbasis Node.js yang dibangun menggunakan library [@phrolovaa/baileys](https://github.com/phrolovaa/baileys) (fork dari Baileys/WhiskeySockets). Bot ini berjalan sebagai proses Node.js mandiri, terhubung ke WhatsApp via pairing code (bukan QR code), dan menyimpan semua data ke **MongoDB Atlas**.

Bot memiliki persona bernama **"Noya"** — gadis virtual AI yang berjalan di atas Groq API (model Llama 4). Selain itu, bot menyediakan fitur: game interaktif, ekonomi virtual, downloader media, sticker maker, manajemen grup, dan sistem owner.

---

## 🗂️ Struktur File

```
noya-bot-main/
├── index.js             # Entry point: koneksi WA, scheduler, event listeners
├── handler.js           # Message router: parsing pesan, otorisasi, dispatch ke commands
├── config.js            # Konfigurasi global (owner, template pagi/malam, API keys)
├── database.js          # Koneksi MongoDB + semua koleksi DB dimuat ke memory (dbs object)
├── package.json         # Dependensi npm
├── .env                 # Environment variables (JANGAN di-commit)
│
├── commands/
│   ├── ai.js            # Perintah: .gemini dan .noya (AI chat)
│   ├── general.js       # Perintah umum: menu, profile, afk, welcome, saran, dll
│   ├── games.js         # Game: tebak bendera, TicTacToe, math, werewolf
│   ├── economy.js       # Ekonomi virtual: balance, daily, weekly, monthly
│   ├── owner.js         # Perintah owner: kick, warn, broadcast, list, schedule, dll
│   ├── download.js      # Downloader: TikTok, Instagram, YouTube, Twitter
│   ├── sticker.js       # Sticker maker & konversi stiker ke gambar
│   ├── exec.js          # Eksekusi kode JS/shell langsung (owner only)
│   └── qc.js            # Quick command
│
├── utils/
│   └── helpers.js       # Fungsi utilitas: cleanJid, ensureUser, awardXp, levelUtils
│
├── media/
│   └── donate.jpg       # Gambar untuk fitur donasi
│
└── bot_session/         # Folder sesi Baileys (auto-generated, JANGAN dihapus saat bot running)
    └── creds.json       # Kredensial WhatsApp (sensitif, sudah di .gitignore)
```

---

## ⚙️ Konfigurasi & Environment Variables

### File `.env`
```env
MONGO_URL=<MongoDB Atlas connection string>
GEMINI_API_KEY=<Google Gemini API key>
GROQ_API_KEY=<Groq API key>
TIKTOK_API=https://www.tikwm.com/api/
```

### File `config.js`
- **`ownerNumbers`** — Array JID WhatsApp owner (format: `628xxx@s.whatsapp.net`). Owner otomatis masuk ke `authorizedUsers` dan `ownerUsers`.
- **`templatePagi`** / **`templateMalam`** — Array pesan jadwal pagi (03:00 WIB) & malam (23:00 WIB) yang dikirim acak ke target yang dikonfigurasi.

### Prefix default: `.` (titik), bisa diubah via perintah `.setprefix`

---

## 🗄️ Database & Struktur Data

Semua data disimpan di MongoDB dengan skema fleksibel (`Mixed`). Saat boot, semua dokumen dimuat ke **object `dbs` di memory** (`database.js`). Setiap perubahan harus dipersist menggunakan `saveDb(key)`.

### Koleksi Database (`dbs` object)

| Key | Tipe | Isi |
|-----|------|-----|
| `authorizedUsers` | `Array<string>` | JID user/grup yang boleh pakai bot |
| `ownerUsers` | `Array<string>` | JID owner (subset dari authorized) |
| `contactDb` | `{ [jid]: pushName }` | Cache nama WA per JID |
| `listDb` | `{ [keyword]: { text, isOwnerOnly, image? } }` | Custom list/command |
| `schedDb` | `{ pagi: { texts, target, enabled }, malam: ... }` | Jadwal pesan otomatis |
| `settingsDb` | `{ prefix: string }` | Pengaturan global bot |
| `warnDb` | `{ [jid]: count }` | Hitungan peringatan user di grup |
| `groupDb` | `{ [groupJid]: { welcome, welcomeText, open, close } }` | Pengaturan per grup |
| `blockDb` | `Array<string>` | JID yang diblokir dari bot |
| `usersDb` | `{ [jid]: UserObject \| LinkObject }` | Profil pengguna + XP/level |
| `noyaBrainDb` | `{ [keyword]: Array<string> }` | Database otak custom Noya |
| `noyaHistoryDb` | `{ [uid]: Array<message> }` | Riwayat chat Noya per user (max 20 item) |
| `userFactsDb` | `{ [uid]: Array<string> }` | Fakta tentang user yang diingat Noya |
| `afkDb` | `{ [jid]: { name, reason, time, hasReason } }` | Status AFK user |
| `gameDb` | `{ [chatId]: GameState }` | State game aktif (TebakBendera, Math, Werewolf) |
| `ecoDb` | `{ [jid]: { balance, lastDaily, lastWeekly, lastMonthly } }` | Saldo ekonomi |
| `tttStatDb` | `{ [jid]: { win, lose, draw } }` | Statistik TicTacToe |
| `bannedCmdsDb` | `{ [command]: reason }` | Perintah yang dinonaktifkan |

### Struktur `usersDb`

Ada dua tipe entry:
1. **UserObject** (data asli, key = UID seperti `"000001"`):
   ```json
   { "uid": "000001", "name": "...", "waName": "...", "date": "...", "xp": 0, "level": 1, "messageCount": 0 }
   ```
2. **LinkObject** (alias, key = JID WA):
   ```json
   { "isLink": true, "targetUid": "000001" }
   ```

Gunakan `resolveUser(dbs.usersDb, senderJid)` untuk selalu mendapat UserObject — JANGAN akses `usersDb[jid]` langsung tanpa resolve.

---

## 🔄 Alur Pemrosesan Pesan (`handler.js`)

```
Pesan Masuk (messages.upsert)
  │
  ├─ Cek duplikat (processedMessages Set, max 200)
  ├─ Ekstrak: sender JID, from (chat), teks pesan
  ├─ Cek blockDb → return jika diblokir
  ├─ Update contactDb
  ├─ ensureUser() → buat profil jika baru
  ├─ Cek AFK: jika sender AFK dan kirim pesan → unset AFK
  ├─ Cek mention AFK → notifikasi
  ├─ handleGameAnswer() → tangani jawaban game aktif
  ├─ handleWWNightAction() → aksi malam werewolf (DM only)
  ├─ Owner reply saran/report → forward balik ke user
  ├─ Cek custom listDb → kirim respons list
  ├─ Cek >, =>, $ → execCmd (eval JS / shell)
  ├─ Cek prefix → return jika tidak ada prefix
  ├─ Cek isAuthorized → return jika tidak berwenang
  ├─ Parse command & args
  ├─ Cek bannedCmdsDb → tolak jika command dinonaktifkan
  └─ Dispatch ke command module yang sesuai
```

### Otorisasi

- **Owner** (`isOwner`): JID ada di `ownerUsers` — bisa semua perintah
- **Authorized User** (`isAuthorizedUser`): JID ada di `authorizedUsers` (individual)
- **Authorized Group** (`isAuthorizedGroup`): JID grup ada di `authorizedUsers`
- Bot TIDAK merespons user/grup yang tidak terotorisasi (kecuali beberapa event sistem)

---

## 🤖 Fitur AI (`commands/ai.js`)

### `.gemini <pertanyaan>`
- Menggunakan **Google Gemini 2.5 Flash**
- Stateless (tidak ada riwayat percakapan)
- Kirim "processing..." lalu edit jadi "done." setelah selesai

### `.noya <pesan>`
- Persona: gadis virtual bernama **Noya**, bahasa santai Indonesia
- Model: **Groq — meta-llama/llama-4-scout-17b-16e-instruct**
- **Stateful**: menyimpan riwayat 20 pesan terakhir per user (`noyaHistoryDb`)
- **Memory fakta**: Noya mengekstrak fakta dari percakapan via tag `[FAKTA: ...]` dan menyimpannya di `userFactsDb`
- **Custom brain**: jawaban bisa diajarkan via `.noya ajarin pertanyaan | jawaban`
- **Multimodal**: bisa reply ke gambar, voice note, atau video untuk dianalisis/ditranskrip
- **Konteks real-time**: jam WIB, tanggal, RAM, uptime, jumlah user dikirim ke system prompt
- **Syarat**: user harus punya profil (`.setname`) sebelum bisa pakai `.noya`

---

## 🎮 Fitur Game (`commands/games.js`)

| Perintah | Deskripsi |
|----------|-----------|
| `.tb` / `.tebakbendera` | Tebak bendera negara, ada timer per soal |
| `.ttt` / `.tictactoe` | TicTacToe vs bot, ada statistik win/lose/draw |
| `.tttwr` | Lihat win rate TicTacToe |
| `.math` | Soal matematika dengan timer |
| `.nyerah` | Menyerah dari game yang sedang berlangsung |
| `.stopgame` | Stop semua game di chat (owner) |
| `.ww` / `.werewolf` | Mulai game Werewolf multiplayer |
| `.wwjoin` | Bergabung ke game Werewolf |
| `.wwstart` | Mulai game Werewolf yang sudah terkumpul |
| `.wwvote @user` | Vote eliminasi di siang hari |
| `.wwend` | Akhiri game paksa |
| `.wwdawn` | Aksi malam Werewolf (kirim via DM ke bot) |
| `.wwwr` / `.werewolfwinrate` | Statistik Werewolf |

State game aktif disimpan di `dbs.gameDb[chatId]`.

---

## 💰 Fitur Ekonomi (`commands/economy.js`)

| Perintah | Reward |
|----------|--------|
| `.b` / `.balance` | Lihat saldo & tier |
| `.daily` | Rp 5.000 (cooldown 24 jam) |
| `.weekly` | Rp 30.000 (cooldown 7 hari) |
| `.monthly` | Rp 150.000 (cooldown 30 hari) |

Sistem tier/kasta ada 20 level: dari *Nameless* (Rp 0) hingga *The Void* (Rp 50T+). Tier ditentukan otomatis dari saldo.

---

## 📥 Fitur Download (`commands/download.js`)

| Perintah | Fungsi |
|----------|--------|
| `.tt <url>` | Download video TikTok (via tikwm.com API) |
| `.ig <url>` | Download media Instagram |
| `.yt <url>` | Download YouTube (audio/video via interactive button) |
| `.twitter <url>` | Download media Twitter/X |
| `.limitig` | Cek limit download Instagram |

---

## 🎭 Fitur Sticker (`commands/sticker.js`)

| Perintah | Fungsi |
|----------|--------|
| `.s` / `.stiker` | Buat sticker dari gambar/video yang direply |
| `.swm` / `.stikerwm` | Sticker dengan watermark |
| `.toimg` | Konversi sticker ke gambar |

---

## 🛠️ Fitur General (`commands/general.js`)

| Perintah | Fungsi |
|----------|--------|
| `.tes` | Test bot aktif |
| `.cekjam` | Tampilkan jam WIB |
| `.ping` | Cek latensi bot |
| `.setname <nama>` | Set nama profil di bot |
| `.profile` / `.my` / `.me` | Lihat profil user (XP, level, dll) |
| `.afk [alasan]` | Set status AFK |
| `.welcome on/off` | Toggle sistem welcome grup |
| `.setwelcome <teks>` | Set teks welcome (variabel: @user, @group, @desc) |
| `.delwelcome` | Hapus teks welcome kustom |
| `.gcs` | Get contact info dari vCard yang direply |
| `.saran <teks>` | Kirim saran ke owner |
| `.report <teks>` | Kirim laporan ke owner |
| `.fakereply` / `.fr` | Buat fake reply |
| `.enc <teks>` | Enkripsi teks (Base64) |
| `.dec <teks>` | Dekripsi teks (Base64) |
| `.menu` | Tampilkan menu utama |
| `.menugroup`, `.menugame`, `.menugeneral`, `.menuowner` | Sub-menu |
| `.list` | Lihat list tersedia |
| `.olist` | Lihat owner list (owner only) |

---

## 👑 Fitur Owner (`commands/owner.js`)

| Perintah | Fungsi |
|----------|--------|
| `.addlist <key>\|<value>` | Tambah custom list |
| `.addolist <key>\|<value>` | Tambah owner-only list |
| `.updatelist <key>\|<value>` | Update list |
| `.delist <key>` | Hapus list |
| `.addrespon` / `.delrespon` | Tambah/hapus user/grup dari authorized |
| `.listgroup` | Lihat semua grup terdaftar |
| `.listowner` | Lihat semua owner |
| `.addowner @user` | Tambah owner baru |
| `.delowner @user` | Hapus owner |
| `.setprefix <char>` | Ganti prefix bot |
| `.broadcast <teks>` | Broadcast ke semua user/grup authorized |
| `.kick @user` | Keluarkan member dari grup |
| `.warn @user` | Beri peringatan (3x → auto kick) |
| `.promote @user` | Jadikan admin grup |
| `.demote @user` | Turunkan admin grup |
| `.open` / `.close` | Buka/tutup grup |
| `.setopen <HH:MM>` | Jadwal buka grup otomatis |
| `.setclose <HH:MM>` | Jadwal tutup grup otomatis |
| `.delopen` / `.delclose` | Hapus jadwal buka/tutup |
| `.setpagi <target>` | Set target penerima pesan pagi |
| `.setmalam <target>` | Set target penerima pesan malam |
| `.delpagi` / `.delmalam` | Hapus jadwal pagi/malam |
| `.bancmd <cmd> [alasan]` | Nonaktifkan perintah |
| `.unbancmd <cmd>` | Aktifkan kembali perintah |
| `.hidetag` / `.h` / `.ht` | Tag semua member tersembunyi |
| `.getidgc` / `.cekid` | Get ID grup |
| `.getlid` | Get LID (Link Identity) user |
| `.ceksaluran` | Cek info saluran WA |
| `.addblock @user` / `.delblock @user` | Block/unblock dari bot |
| `.kill` | Matikan proses bot |
| `.restart` | Restart bot |

---

## ⏰ Fitur Otomatis (Scheduler)

Berjalan setiap 60 detik di `index.js`:

1. **Pesan Pagi** — Dikirim jam `03:00 WIB` ke target yang dikonfigurasi (acak dari `schedDb.pagi.texts`)
2. **Pesan Malam** — Dikirim jam `23:00 WIB` ke target yang dikonfigurasi (acak dari `schedDb.malam.texts`)
3. **Auto Open/Close Grup** — Setiap grup yang punya jadwal `open`/`close` di `groupDb` akan otomatis dibuka/ditutup

---

## 🔒 Fitur Keamanan

- **Auto reject & block panggilan masuk** — Semua incoming call otomatis ditolak dan penelepon diblokir
- **Blocklist** — User di `blockDb` tidak dapat berinteraksi dengan bot sama sekali
- **Dedup pesan** — `processedMessages` Set mencegah pesan diproses dua kali (max 200 entry, FIFO)
- **Auto-reconnect** — Jika koneksi putus (bukan logout), bot otomatis reconnect setelah 3 detik

---

## 📦 Dependensi Utama

| Package | Versi | Fungsi |
|---------|-------|--------|
| `@phrolovaa/baileys` | latest | WhatsApp Web API (Baileys fork) |
| `@google/generative-ai` | ^0.24.1 | Google Gemini API |
| `groq-sdk` | latest | Groq API (Llama 4) |
| `mongoose` | ^9.4.1 | MongoDB ODM |
| `mongodb` | ^7.1.1 | MongoDB driver |
| `btch-downloader` | latest | Media downloader (IG, YT, dll) |
| `wa-sticker-formatter` | ^4.4.4 | Sticker creator |
| `axios` | ^1.15.2 | HTTP client |
| `cheerio` | ^1.2.0 | HTML scraper |
| `node-webpmux` | ^3.2.1 | WebP manipulation |
| `pino` | ^8.16.0 | Logger (level: silent) |
| `dotenv` | ^16.4.5 | Env file loader |

---

## 🚀 Cara Menjalankan

```bash
# Install dependensi
npm install

# Jalankan bot
npm start
# atau
node index.js
```

Saat pertama kali (belum ada `bot_session/creds.json`):
1. Bot akan meminta nomor WA
2. Bot mengirim pairing code — masukkan di WhatsApp → Perangkat Tertaut → Tautkan dengan nomor telepon

---

## 🧠 Konvensi Kode Penting untuk AI

### 1. Selalu gunakan `resolveUser()` saat akses profil user
```js
// ✅ BENAR
const user = resolveUser(dbs.usersDb, senderJid);

// ❌ SALAH
const user = dbs.usersDb[senderJid]; // mungkin berupa LinkObject!
```

### 2. Selalu `saveDb(key)` setelah modifikasi data
```js
dbs.ecoDb[sender].balance += 1000;
await saveDb('ecoDb'); // WAJIB
```

### 3. Gunakan `cleanJid()` untuk membersihkan JID
JID WhatsApp kadang mengandung `:` (misalnya `628xxx:1@s.whatsapp.net`) — selalu gunakan `cleanJid()` sebelum dibandingkan atau disimpan.

### 4. Format JID
- User: `628xxx@s.whatsapp.net`
- Grup: `xxxxx@g.us`
- LID: `xxxxxxxx@lid`

### 5. Menambah command baru
1. Buat fungsi di file command yang sesuai atau buat file baru di `commands/`
2. Daftarkan nama command ke Set yang sesuai di `handler.js` (misal: `GENERAL_CMDS`)
3. Tambahkan dispatch di blok `if` yang sesuai di `handler.js`

### 6. `dbs` adalah in-memory store
Seluruh data dibaca dari MongoDB saat boot dan disimpan di `dbs`. Perubahan runtime harus selalu di-persist via `saveDb()`. Jika bot restart tanpa `saveDb()`, data akan hilang.

### 7. Semua pesan dalam Bahasa Indonesia
Bot ini ditujukan untuk pengguna Indonesia. Semua respons, pesan error, dan teks UI menggunakan Bahasa Indonesia informal/santai.

---

## 📁 File yang Diabaikan Git

File berikut ada di `.gitignore` dan TIDAK boleh di-commit:
- `bot_session/` — Sesi WhatsApp sensitif
- `.env` — API keys dan credentials
- `node_modules/`
- File media sementara

---

## ⚠️ Catatan Penting

- **Bot ini bersifat privat** — hanya user/grup yang sudah di-authorize oleh owner yang bisa menggunakannya
- **Owner numbers** hardcoded di `config.js` — ubah sesuai nomor owner yang benar
- **Timezone**: semua waktu menggunakan `Asia/Jakarta` (WIB, UTC+7)
- **Exec command** (`>`, `=>`, `$`) sangat berbahaya — hanya owner yang bisa menggunakannya karena bisa menjalankan kode JS/shell sembarang
