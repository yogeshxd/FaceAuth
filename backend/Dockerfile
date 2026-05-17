FROM anaconda/miniconda

WORKDIR /app

RUN conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/main
RUN conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/r
RUN conda install -c conda-forge dlib -y
RUN apt-get update && apt-get install -y git

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install git+https://github.com/ageitgey/face_recognition_models

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]