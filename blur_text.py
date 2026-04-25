import cv2
import pytesseract
import sys
import numpy as np

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def blur_text_in_video(input_path, output_path):
    cap = cv2.VideoCapture(input_path)
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    print("Începe procesarea AI cadru cu cadru pentru blurare...")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        boxes = pytesseract.image_to_data(gray, output_type=pytesseract.Output.DICT)
        
        n_boxes = len(boxes['text'])
        for i in range(n_boxes):
            if int(boxes['conf'][i]) > 60: 
                (x, y, w, h) = (boxes['left'][i], boxes['top'][i], boxes['width'][i], boxes['height'][i])
                
                roi = frame[y:y+h, x:x+w]
                if roi.size != 0:
                   
                    blurred_roi = cv2.GaussianBlur(roi, (51, 51), 0)
                    frame[y:y+h, x:x+w] = blurred_roi

        out.write(frame)

    cap.release()
    out.release()
    print("Procesare blurare finalizată!")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Eroare: Lipsesc argumentele pentru input și output.")
        sys.exit(1)
    
    blur_text_in_video(sys.argv[1], sys.argv[2])