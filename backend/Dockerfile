FROM python:3.9-slim

RUN apt-get update && apt-get install -y \
    cmake \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV CMAKE_BUILD_PARALLEL_LEVEL=1

RUN pip install --no-cache-dir setuptools wheel cmake
RUN pip install --no-cache-dir dlib

RUN pip install --no-cache-dir git+https://github.com/ageitgey/face_recognition_models

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]