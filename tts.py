import sys
import asyncio
import edge_tts

async def main():
    text_file = sys.argv[1]  
    voice = sys.argv[2] 
    output_file = sys.argv[3]
    
    # Deschidem fișierul generat de serverul Node și citim textul EXACT cum a fost scris
    with open(text_file, 'r', encoding='utf-8') as f:
        text = f.read()
    
    # Generăm magia audio
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_file)

if __name__ == "__main__":
    asyncio.run(main())