const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());

// Permite servirea fișierelor HTML, CSS și JS din folderul curent
app.use(express.static(__dirname)); 

const localDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(localDir)) fs.mkdirSync(localDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, localDir),
    filename: (req, file, cb) => cb(null, `upload_${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage: storage });

// --- FUNCȚII YOUTUBE ---
async function extrageTranscriptYouTube(videoUrl) {
    let videoId = "";
    if (videoUrl.includes("v=")) videoId = videoUrl.split("v=")[1].split("&")[0];
    else if (videoUrl.includes("youtu.be/")) videoId = videoUrl.split("youtu.be/")[1].split("?")[0];
    else if (videoUrl.includes("/shorts/")) videoId = videoUrl.split("/shorts/")[1].split("?")[0];
    else throw new Error("Link invalid.");

    const response = await fetch("https://www.youtube.com/youtubei/v1/player", {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14)" },
        body: JSON.stringify({ context: { client: { clientName: "ANDROID", clientVersion: "20.10.38" } }, videoId: videoId })
    });
    const data = await response.json();
    const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!tracks) throw new Error("Nu am găsit subtitrări.");
    const xmlRes = await fetch(tracks[0].baseUrl);
    return (await xmlRes.text()).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function traduInRomana(text) {
    const chunks = text.match(/.{1,1000}/g) || [];
    let result = "";
    for (let chunk of chunks) {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ro&dt=t&q=${encodeURIComponent(chunk)}`;
        const res = await fetch(url);
        const json = await res.json();
        result += json[0].map(item => item[0]).join('') + " ";
    }
    return result;
}

// --- RUTE API ---

// 1. Descărcare YouTube
app.post('/api/download', (req, res) => {
    let { url, quality } = req.body;
    if (url.includes('/shorts/')) url = url.replace('/shorts/', '/watch?v=');
    
    // Generăm un nume de fișier unic în folderul downloads
    const fileName = `youtube_${Date.now()}.mp4`;
    const tempFile = path.join(localDir, fileName);

    const cmd = `yt-dlp -f "bestvideo[ext=mp4][height<=${quality}]+bestaudio[ext=m4a]/best" --merge-output-format mp4 -o "${tempFile}" "${url}"`;
    
    exec(cmd, (err) => {
        if (err) return res.status(500).send("Eroare la descărcare.");
        
        // Trimitem fișierul prin Ngrok și îl ștergem după descărcare
        res.download(tempFile, "Video_YouTube.mp4", () => {
            if(fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        });
    });
});

// 2. Traducere Transcript
app.post('/api/translate', async (req, res) => {
    try {
        const raw = await extrageTranscriptYouTube(req.body.url);
        const tr = await traduInRomana(raw);
        res.json({ success: true, text: tr.replace(/\n/g, '<br>') });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. Blurare Video Local
app.post('/api/blur', upload.single('videoFile'), (req, res) => {
    if (!req.file) return res.status(400).send("No file");

    const inputPath = req.file.path;
    const outputPath = inputPath + "_blur.mp4";

    const cmd = `ffmpeg -i "${inputPath}" -vf "boxblur=10:1" "${outputPath}"`;

    exec(cmd, (err) => {
        if (err) return res.status(500).send("FFmpeg error");

        res.download(outputPath, () => {
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
        });
    });
});

// 4. Text to Speech (Hibrid)
app.post('/api/tts', async (req, res) => {
    const { text } = req.body;

    const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID", {
        method: "POST",
        headers: {
            "xi-api-key": process.env.ELEVEN_API_KEY,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            text: text,
            model_id: "eleven_multilingual_v2"
        })
    });

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(buffer));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server pornit pe portul ${PORT}.`));