# FaceAuth

A high-accuracy facial recognition system that processes images on a FastAPI backend while keeping biometric data strictly on the user's device.

## Architecture

* **Frontend:** HTML/JS. Captures frames from the webcam and handles local storage mapping.
* **Backend:** FastAPI + dlib. Stateless Python server that receives frames, extracts 128-d face encodings, and returns the data without saving images.

## Deployment Instructions

### 1. Deploy the Backend (Hugging Face Spaces)
1. Create a new Docker Space on Hugging Face.
2. Upload `backend/main.py`, `backend/requirements.txt`, and `backend/Dockerfile`.
3. Wait for the build to complete and copy the Direct URL of your Space.

### 2. Deploy the Frontend (GitHub Pages)
1. In `frontend/script.js`, replace the `BACKEND_URL` variable with your Hugging Face Space URL.
2. Push the `frontend` directory to a GitHub repository.
3. Enable GitHub Pages from the repository settings.