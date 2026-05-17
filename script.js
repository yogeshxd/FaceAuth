const video = document.getElementById('video');
const registerBtn = document.getElementById('registerBtn');
const clearBtn = document.getElementById('clearBtn');
const usernameInput = document.getElementById('username');
const statusMsg = document.getElementById('statusMsg');

let labeledFaceDescriptors = [];
let faceMatcher = null;

// 1. Load Models from the /models directory
Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
]).then(startSystem);

function startSystem() {
    statusMsg.innerText = "Starting Webcam...";
    statusMsg.style.color = "blue";
    loadDatabase();
    startVideo();
}

// 2. Start Webcam
function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
            video.srcObject = stream;
            registerBtn.disabled = false;
            clearBtn.disabled = false;
            statusMsg.innerText = "System Active";
            statusMsg.style.color = "green";
        })
        .catch(err => {
            console.error(err);
            statusMsg.innerText = "Webcam access denied.";
            statusMsg.style.color = "red";
        });
}

// 3. Main Video Loop (Runs continuously to scan faces)
video.addEventListener('play', () => {
    const canvas = document.getElementById('overlay');
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        // Detect faces
        const detections = await faceapi.detectAllFaces(video)
            .withFaceLandmarks()
            .withFaceDescriptors();
            
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

        // If we have registered users, try to recognize
        if (faceMatcher && resizedDetections.length > 0) {
            const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));
            
            results.forEach((result, i) => {
                const box = resizedDetections[i].detection.box;
                const text = result.toString();
                const drawBox = new faceapi.draw.DrawBox(box, { 
                    label: text, 
                    boxColor: result.label === "unknown" ? 'red' : 'green' 
                });
                drawBox.draw(canvas);
            });
        } else {
            // Just draw standard boxes if no one is registered yet
            faceapi.draw.drawDetections(canvas, resizedDetections);
        }
    }, 100);
});

// 4. Register a New User
registerBtn.addEventListener('click', async () => {
    const label = usernameInput.value.trim();
    if (!label) return alert("Please enter a name first.");

    statusMsg.innerText = "Scanning face for registration...";
    
    // Get single face descriptor
    const detection = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();
    
    if (!detection) {
        statusMsg.innerText = "No face detected. Please face the camera.";
        return;
    }

    // Save to runtime array
    const newDescriptor = new faceapi.LabeledFaceDescriptors(label, [detection.descriptor]);
    labeledFaceDescriptors.push(newDescriptor);
    
    // Re-initialize matcher with new data
    faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
    
    saveDatabase();
    
    usernameInput.value = '';
    statusMsg.innerText = `Successfully registered: ${label}`;
    setTimeout(() => statusMsg.innerText = "System Active", 3000);
});

// 5. Database Logic (Using Local Storage)
function saveDatabase() {
    // face-api descriptors are Float32Arrays. JSON can't stringify them natively.
    // We must convert them to standard arrays first.
    const dataToStore = labeledFaceDescriptors.map(lfd => ({
        label: lfd.label,
        descriptors: lfd.descriptors.map(d => Array.from(d))
    }));
    localStorage.setItem('faceDatabase', JSON.stringify(dataToStore));
}

function loadDatabase() {
    const storedData = localStorage.getItem('faceDatabase');
    if (!storedData) return;

    const parsedData = JSON.parse(storedData);
    
    // Convert standard arrays back to Float32Arrays for face-api
    labeledFaceDescriptors = parsedData.map(data => {
        const descriptors = data.descriptors.map(d => new Float32Array(d));
        return new faceapi.LabeledFaceDescriptors(data.label, descriptors);
    });

    if (labeledFaceDescriptors.length > 0) {
        faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
    }
}

clearBtn.addEventListener('click', () => {
    localStorage.removeItem('faceDatabase');
    labeledFaceDescriptors = [];
    faceMatcher = null;
    statusMsg.innerText = "Database Cleared.";
    setTimeout(() => statusMsg.innerText = "System Active", 3000);
});