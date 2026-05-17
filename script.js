const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const registerBtn = document.getElementById('registerBtn');
const clearBtn = document.getElementById('clearBtn');
const usernameInput = document.getElementById('username');
const statusMsg = document.getElementById('statusMsg');

const BACKEND_URL = ""; 

let localDatabase = JSON.parse(localStorage.getItem('secureFaceDb')) || [];
let isRegistering = false;

navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
        registerBtn.disabled = false;
        statusMsg.innerText = "System Active";
        statusMsg.style.color = "green";
        startScanningLoop();
    })
    .catch(err => {
        statusMsg.innerText = "Webcam access denied.";
        statusMsg.style.color = "red";
    });

async function processFrame() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    tempCanvas.getContext('2d').drawImage(video, 0, 0);
    
    const blob = await new Promise(resolve => tempCanvas.toBlob(resolve, 'image/jpeg'));
    
    const formData = new FormData();
    formData.append('file', blob, 'frame.jpg');

    try {
        const response = await fetch(BACKEND_URL, { method: 'POST', body: formData });
        return await response.json();
    } catch (error) {
        console.error(error);
        return { faces: [] };
    }
}

function calculateDistance(vec1, vec2) {
    let sum = 0;
    for (let i = 0; i < vec1.length; i++) {
        sum += Math.pow(vec1[i] - vec2[i], 2);
    }
    return Math.sqrt(sum);
}

function findBestMatch(scannedEncoding) {
    let bestMatch = "Unknown";
    let lowestDistance = 0.6; 

    localDatabase.forEach(user => {
        const distance = calculateDistance(scannedEncoding, user.encoding);
        if (distance < lowestDistance) {
            lowestDistance = distance;
            bestMatch = user.name;
        }
    });
    return bestMatch;
}

async function startScanningLoop() {
    while (true) {
        if (!isRegistering) {
            const data = await processFrame();
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            data.faces.forEach(face => {
                const [top, right, bottom, left] = face.box;
                const matchName = findBestMatch(face.encoding);
                
                ctx.strokeStyle = matchName === "Unknown" ? "red" : "green";
                ctx.lineWidth = 3;
                ctx.strokeRect(left, top, right - left, bottom - top);
                
                ctx.fillStyle = matchName === "Unknown" ? "red" : "green";
                ctx.font = "20px Arial";
                ctx.fillText(matchName, left, top - 10);
            });
        }
        await new Promise(r => setTimeout(r, 300)); 
    }
}

registerBtn.addEventListener('click', async () => {
    const name = usernameInput.value.trim();
    if (!name) return alert("Enter a name.");
    
    isRegistering = true;
    statusMsg.innerText = "Extracting biometrics securely...";
    
    const data = await processFrame();
    
    if (data.faces.length === 0) {
        alert("No face detected. Try again.");
    } else if (data.faces.length > 1) {
        alert("Multiple faces detected. Please stand alone.");
    } else {
        const newEncoding = data.faces[0].encoding;
        localDatabase.push({ name: name, encoding: newEncoding });
        localStorage.setItem('secureFaceDb', JSON.stringify(localDatabase));
        
        usernameInput.value = '';
        statusMsg.innerText = `Registered: ${name}`;
        setTimeout(() => statusMsg.innerText = "System Active", 2000);
    }
    isRegistering = false;
});

clearBtn.addEventListener('click', () => {
    localStorage.removeItem('secureFaceDb');
    localDatabase = [];
    alert("Local database cleared.");
});