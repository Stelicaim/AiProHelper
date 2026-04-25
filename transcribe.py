import sys
import os
folder_curent = os.path.dirname(os.path.abspath(__file__))
os.environ["PATH"] += os.pathsep + folder_curent

import whisper
from deep_translator import GoogleTranslator

def asculta_si_tradu(audio_path):
    print("1. Se incarca modelul AI Whisper...")
    model = whisper.load_model("base")

    print("2. AI-ul asculta si scrie textul original...")
    result = model.transcribe(audio_path)
    text_original = result["text"].strip()

    cale_rezultat = os.path.join(folder_curent, "rezultat_traducere.txt")

    if not text_original:
        with open(cale_rezultat, "w", encoding="utf-8") as f:
            f.write("⚠️ EROARE: AI-ul nu a detectat nicio voce în acest videoclip. Asigură-te că videoclipul are vorbire clară și nu doar muzică.")
        print("Fara voce detectata. Ne oprim aici.")
        return

    print("3. Traducem automat in limba Romana...")
    try:
        translator = GoogleTranslator(source='auto', target='ro')
        bucati = [text_original[i:i+4900] for i in range(0, len(text_original), 4900)]
        text_romana = ""
        for bucata in bucati:
            text_romana += translator.translate(bucata) + " "

        with open(cale_rezultat, "w", encoding="utf-8") as f:
            f.write(text_romana)
            
    except Exception as e:
        print("Eroare la traducere. Afisam originalul.")
        with open(cale_rezultat, "w", encoding="utf-8") as f:
            f.write(f"⚠️ EROARE TRADUCERE: Google a blocat temporar traducerea. Iată textul original generat de AI:\n\n{text_original}")

    print("Transcrierea a fost finalizata cu succes!")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Eroare: Nu ai dat fisierul audio!")
        sys.exit(1)
    
    asculta_si_tradu(sys.argv[1])