const video = document.getElementById('webcam');
const canvas = document.getElementById('sketchCanvas');
const ctx = canvas.getContext('2d');
let currentColor = "#00ffcc";

// Stabilization
let lastX, lastY;
let smoothX, smoothY;
const STRENGTH = 0.25;

// Artwork Layer
let inkCanvas = document.createElement('canvas');
inkCanvas.width = window.innerWidth;
inkCanvas.height = window.innerHeight;
let inkCtx = inkCanvas.getContext('2d');

function onResults(results) {
    if (canvas.width !== window.innerWidth) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        inkCanvas.width = window.innerWidth;
        inkCanvas.height = window.innerHeight;
    }

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Flip for natural mirroring
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    
    // 1. Draw Background Video
    ctx.globalAlpha = 0.6;
    if (results.image) {
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    }

    // --- ONLY DRAW THE TOP TIP POINT ---
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const indexTip = landmarks[8]; // This is the "Top Point" aka First Point

        // Draw ONLY the single tip point
        ctx.fillStyle = '#FF0000'; // Red dot
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FF0000';
        ctx.beginPath();
        ctx.arc(indexTip.x * canvas.width, indexTip.y * canvas.height, 8, 0, 2 * Math.PI);
        ctx.fill();
    }
    ctx.restore(); 

    // 2. Draw your persistent artwork
    ctx.drawImage(inkCanvas, 0, 0);

    // 3. Drawing Logic
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const indexTip = landmarks[8];
        const indexPip = landmarks[6]; // Joint used to check if finger is "up"
        
        const rawX = (1 - indexTip.x) * canvas.width;
        const rawY = indexTip.y * canvas.height;

        if (!smoothX) { smoothX = rawX; smoothY = rawY; }
        smoothX = smoothX + (rawX - smoothX) * STRENGTH;
        smoothY = smoothY + (rawY - smoothY) * STRENGTH;

        // Draw if finger is pointing up
        if (indexTip.y < indexPip.y) {
            if (lastX && lastY) {
                inkCtx.strokeStyle = currentColor;
                inkCtx.lineWidth = 8;
                inkCtx.lineCap = "round";
                inkCtx.beginPath();
                inkCtx.moveTo(lastX, lastY);
                inkCtx.lineTo(smoothX, smoothY);
                inkCtx.stroke();
            }
            lastX = smoothX;
            lastY = smoothY;
        } else {
            lastX = null;
            lastY = null;
        }

        // Color selector check
        if (smoothX < 100) checkColorHover(smoothY);
    }
}

// Initialize AI
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);

// Start Camera
const camera = new Camera(video, {
    onFrame: async () => {
        await hands.send({image: video});
    },
    width: window.innerWidth,
    height: window.innerHeight
});
camera.start();

// UI Functions
function pickColor(color, el) {
    currentColor = color;
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
    el.classList.add('active');
}

function checkColorHover(y) {
    const options = document.querySelectorAll('.color-option');
    options.forEach((opt) => {
        const rect = opt.getBoundingClientRect();
        if (y > rect.top && y < rect.bottom) {
            currentColor = opt.style.backgroundColor;
            options.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
        }
    });
}

function clearCanvas() { inkCtx.clearRect(0, 0, inkCanvas.width, inkCanvas.height); }

async function saveSketch() {
    const data = inkCanvas.toDataURL('image/png');
    const fd = new FormData();
    fd.append('image', data);
    const response = await fetch('/save/', { method: 'POST', body: fd });
    if(response.ok) alert("Art Saved, Vro! 🚀");
}