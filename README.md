# 🎬 Caption Remover v2
### Node.js + Python/OpenCV — captions hardcoded (arse pe imagine)

---

## Structura proiectului

```
caption-remover/
├── server.js          ← Backend Express (upload, job tracking, download)
├── inpaint.py         ← Script Python (detectare text + inpainting OpenCV)
├── setup.js           ← Script verificare + instalare automată dependențe
├── package.json
├── public/
│   └── index.html     ← Frontend web (drag & drop, progress live, config)
└── tmp/               ← Creat automat
    ├── uploads/       ← Fișiere primite (șterse după 15 min)
    └── outputs/       ← Fișiere procesate (șterse după 15 min)
```

---

## Instalare și pornire

### Pasul 1 — Cerințe sistem
- **Node.js** v18+ → https://nodejs.org
- **Python** 3.8+ → https://www.python.org/downloads/
  - Pe Windows: bifează **"Add Python to PATH"** la instalare!

### Pasul 2 — Instalează dependențele
```bash
cd caption-remover
npm install
node setup.js
```

`setup.js` face automat:
- ✔ Verifică Python și pip
- ✔ Instalează `opencv-python` și `numpy`
- ✔ Verifică `ffmpeg-static`
- ✔ Creează folderele `tmp/`
- ✔ Salvează comanda Python detectată în `.python_cmd`

### Pasul 3 — Pornește serverul
```bash
npm start
```

Deschide browserul la: **http://localhost:3000**

---

## Cum funcționează

```
Browser  ──(upload video)──►  server.js
                                  │
                          spawn(python3 inpaint.py)
                                  │
                          inpaint.py procesează:
                          1. Deschide video cu OpenCV
                          2. Pentru fiecare frame:
                             - Detectează pixeli albi (text)
                             - Dilată masca (acoperă contur negru)
                             - Filtrează zgomot (min blob area)
                             - cv2.inpaint() TELEA pe zona textului
                          3. Scrie video fără audio
                          4. ffmpeg remux audio înapoi
                                  │
                          server.js trimite progress via SSE
                                  │
Browser  ◄──(download)──  fișier curat gata
```

---

## Parametrii inpainting (Setări Avansate în UI)

| Parametru | Default | Descriere |
|-----------|---------|-----------|
| `zone_top_pct` | 72% | Unde începe căutarea textului (% din înălțime) |
| `zone_bot_pct` | 92% | Unde se termină zona de căutare |
| `white_threshold` | 200 | Prag detectare alb (0-255). Coboară dacă textul e gri |
| `min_blob_area` | 400 | Aria minimă pixel pentru blob valid (evită zgomot) |
| `inpaint_radius` | 6 | Raza reconstrucție OpenCV — mai mare = calitate mai bună dar mai lent |
| `dilate_iters` | 2 | Câte iterații de dilatare pentru masca textului |

---

## Tipuri de captions suportate

| Tip | Suportat | Note |
|-----|----------|------|
| TikTok/Reels captions (alb + contur negru) | ✅ | Detectare automată excelentă |
| YouTube subtitles embedded | ✅ | Soft captions, fără inpainting |
| Captions galbene/colorate | ⚠️ | Ajustează `white_threshold` |
| Watermark logo | ⚠️ | Setează zona manual în config |
| Captions cu fundal semitransparent | ❌ | Necesită model AI (Replicate etc.) |

---

## Ajustare pentru alte videoclipuri

Dacă captionele nu se detectează corect, ajustează din **Setări Avansate**:

**Captions în altă parte (nu jos):**
- Schimbă `zone_top_pct` și `zone_bot_pct`
- Ex: captions la mijloc → `top=40`, `bot=65`

**Text gri sau semi-transparent:**
- Coboară `white_threshold` la 160-180

**Detecție prea agresivă (șterge și altceva):**
- Crește `min_blob_area` la 800-1200

---

## Variabile de mediu

```bash
PORT=8080 npm start    # schimbă portul (default: 3000)
```

---

## Performanță estimată

| Durată video | Timp procesare (estimat) |
|-------------|--------------------------|
| 30 secunde  | ~2-3 minute              |
| 1 minut     | ~4-6 minute              |
| 5 minute    | ~20-30 minute            |

> Procesarea se face frame cu frame. Un CPU mai rapid = timp mai scurt.
