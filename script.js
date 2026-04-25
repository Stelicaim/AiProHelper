const urlInput = document.getElementById('videoUrl');
const videoUpload = document.getElementById('videoUpload');
const statusMsg = document.getElementById('statusMessage');
const transcriptArea = document.getElementById('transcriptArea');
const transcriptText = document.getElementById('transcriptText');

function showStatus(msg, isError = false) {
    statusMsg.innerHTML = msg;
    statusMsg.className = `status ${isError ? 'error' : 'success'}`;
    statusMsg.classList.remove('hidden');
}

// 1. Descărcare Video
document.getElementById('btnDownload').addEventListener('click', async () => {
    const url = urlInput.value;
    const quality = document.getElementById('quality').value;
    if (!url) return showStatus('❌ Introdu un link valid!', true);

    showStatus('⏳ Se descarcă ultra-rapid... Așteaptă să apară descărcarea!');
    try {
       
        const res = await fetch('https://aiprohelper.onrender.com/api/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, quality })
        });
        if (!res.ok) throw new Error('Eroare');
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `YouTube_Video.mp4`; 
        document.body.appendChild(a);
        a.click(); 
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
        showStatus('✅ Descărcare finalizată!');
    } catch (err) {
        showStatus('❌ Eroare la descărcare.', true);
    }
});

// 2. Transcript YouTube
document.getElementById('btnTranslate').addEventListener('click', async () => {
    const url = urlInput.value;
    if (!url) return showStatus('❌ Introdu un link valid!', true);
    
    transcriptArea.classList.add('hidden');
    transcriptText.innerHTML = "";
    showStatus('⏳ Se extrage textul și se traduce... Așteaptă câteva secunde!');

    try {
       
        const res = await fetch('https://aiprohelper.onrender.com/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        const data = await res.json();
        if (data.success) {
            showStatus(`✅ Succes!`);
            transcriptArea.classList.remove('hidden');
            transcriptText.innerHTML = data.text;
        } else {
            showStatus(`❌ Eroare: ${data.error}`, true);
        }
    } catch (err) {
        showStatus('❌ Eroare de conectare la Server.', true);
    }
});

// 3. Upload și Blurare
document.getElementById('btnBlur').addEventListener('click', async () => {
    const file = videoUpload.files[0];
    if (!file) return showStatus('❌ Te rog să alegi un fișier video din PC!', true);

    showStatus(`⏳ Se încarcă și se blurează... Poate dura câteva minute!`);

    const formData = new FormData();
    formData.append('videoFile', file); 

    try {
        // MODIFICAT: S-a lăsat doar ruta relativă
        const res = await fetch('https://aiprohelper.onrender.com/api/blur', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Eroare la procesarea AI');

        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `BLURAT_${file.name}`; 
        document.body.appendChild(a);
        a.click(); 
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
        
        showStatus('✅ Videoclipul a fost blurat cu succes!');
        videoUpload.value = ""; 
    } catch (err) {
        showStatus(`❌ Eroare: ${err.message}`, true);
    }
});

// 4. Generare Voce AI (Text to Speech)
document.getElementById('btnTTS').addEventListener('click', async () => {
    const text = document.getElementById('ttsText').value;
    const voice = document.getElementById('ttsVoice').value;
    
    if (!text) return showStatus('❌ Scrie un text!', true);

    showStatus('⏳ AI-ul generează vocea...');

    try {
        // MODIFICAT: S-a lăsat doar ruta relativă
        const res = await fetch('https://aiprohelper.onrender.com/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, voice: voice })
        });

        if (!res.ok) throw new Error('Eroare la generarea vocii');

        const blob = await res.blob();
        const audioUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = audioUrl;
        // Am simplificat numele descărcării pentru a evita erori de caractere
        a.download = `Voce_AI.mp3`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(audioUrl);
        document.body.removeChild(a);

        showStatus('✅ Fișierul audio a fost generat și descărcat!');
    } catch (err) {
        showStatus(`❌ Eroare: ${err.message}`, true);
    }
});