from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import face_recognition
import cv2
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze_face")
async def analyze_face(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    locations = face_recognition.face_locations(rgb_img)
    encodings = face_recognition.face_encodings(rgb_img, locations)

    faces = []
    for loc, enc in zip(locations, encodings):
        faces.append({
            "box": loc,
            "encoding": enc.tolist()
        })
        
    return {"faces": faces}