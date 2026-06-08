# 💰 WangKu — App Pengurusan Kewangan Peribadi

App kewangan peribadi dengan AI Receipt Scanner, dibina dengan React + Firebase.

![WangKu](https://img.shields.io/badge/React-18-blue) ![Firebase](https://img.shields.io/badge/Firebase-10-orange) ![PWA](https://img.shields.io/badge/PWA-Ready-green)

## ✨ Ciri-ciri

- 📊 **Dashboard** — ringkasan baki, pendapatan & perbelanjaan
- ⇄ **Transaksi** — rekod & edit transaksi, tap untuk edit
- ◎ **Budget** — set budget setiap kategori, alert bila lebih
- ◉ **Goals** — sasaran kewangan dengan tracker & simulator
- 🧾 **Scanner** — imbas resit dengan Claude AI secara automatik
- ▦ **Laporan** — analisis & carta perbelanjaan bulanan
- ⚙️ **Tetapan** — edit profil, gaji, budget, bil — semua boleh diubah
- 📱 **PWA** — boleh Add to Home Screen (iOS & Android)
- ☁️ **Firebase** — data sync ke cloud (bila dikonfigurasi)

## 🚀 Quick Start

```bash
# 1. Clone repo
git clone https://github.com/USERNAME/wangku.git
cd wangku

# 2. Install
npm install

# 3. Salin .env.example → .env dan isi Firebase keys
cp .env.example .env

# 4. Jalankan
npm start
```

## 🔥 Setup Firebase

1. Pergi ke [Firebase Console](https://console.firebase.google.com)
2. Buat projek baru
3. Aktifkan **Firestore Database**
4. Pergi ke Project Settings → Your apps → Web app
5. Salin config ke `.env`
6. Dalam `src/App.jsx`, tukar `IS_FIREBASE_ENABLED = true`

## 🌐 Deploy

```bash
npm install -g firebase-tools
firebase login
firebase init hosting    # public dir: build, SPA: yes
npm run build
firebase deploy
```

App akan live di: `https://YOUR-PROJECT.web.app`

## 📱 Add to Home Screen

**Android:** Chrome menu → "Add to Home screen"  
**iPhone:** Safari Share → "Add to Home Screen"

## 📁 Struktur Projek

```
wangku/
├── public/
│   ├── index.html       ← HTML + PWA meta tags
│   ├── manifest.json    ← PWA manifest
│   ├── sw.js            ← Service Worker (offline)
│   └── icons/           ← App icons (192px & 512px)
├── src/
│   ├── App.jsx          ← App utama (semua komponen)
│   └── index.js         ← Entry point + SW registration
├── .github/workflows/   ← Auto-deploy ke Firebase
├── .env.example         ← Template environment variables
├── firebase.json        ← Firebase Hosting config
└── package.json
```

## 🛠 Tech Stack

- **Frontend:** React 18
- **Database:** Firebase Firestore
- **Hosting:** Firebase Hosting (Free tier)
- **AI:** Claude API (receipt scanner)
- **PWA:** Web App Manifest + Service Worker

---

*Dibina dengan ❤️ menggunakan React + Firebase + Claude AI*
