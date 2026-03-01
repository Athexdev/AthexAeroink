const video = document.getElementById('webcam');
const canvas = document.getElementById('sketchCanvas');
const ctx = canvas.getContext('2d');
let currentColor = "#00ffcc";
let isEraser = false; // Eraser state

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

    // --- DRAW THE TIP POINT (Cursor) ---
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const indexTip = landmarks[8];

        // Change cursor color based on mode
        ctx.fillStyle = isEraser ? '#ff4757' : '#FF0000'; 
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(indexTip.x * canvas.width, indexTip.y * canvas.height, 8, 0, 2 * Math.PI);
        ctx.fill();
    }
    ctx.restore(); 

    // 2. Draw your persistent artwork
    ctx.drawImage(inkCanvas, 0, 0);

    // 3. Drawing/Eraser Logic
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const indexTip = landmarks[8];
        const indexPip = landmarks[6];
        
        // Detect if all fingers are open for Eraser
        const thumbTip = landmarks[4];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];
        
        const thumbIp = landmarks[2];
        const middlePip = landmarks[10];
        const ringPip = landmarks[14];
        const pinkyPip = landmarks[18];

        // Logic: All tips are above their respective PIP joints (finger is straight up)
        const allFingersOpen = indexTip.y < indexPip.y && 
                               middleTip.y < middlePip.y && 
                               ringTip.y < ringPip.y && 
                               pinkyTip.y < pinkyPip.y;

        isEraser = allFingersOpen;

        const rawX = (1 - indexTip.x) * canvas.width;
        const rawY = indexTip.y * canvas.height;

        if (!smoothX) { smoothX = rawX; smoothY = rawY; }
        smoothX = smoothX + (rawX - smoothX) * STRENGTH;
        smoothY = smoothY + (rawY - smoothY) * STRENGTH;

        // Draw or Erase if Index Finger is up
        if (indexTip.y < indexPip.y) {
            if (lastX && lastY) {
                if (isEraser) {
                    // Eraser settings
                    inkCtx.globalCompositeOperation = 'destination-out';
                    inkCtx.lineWidth = 40; // Thick eraser
                } else {
                    // Pen settings
                    inkCtx.globalCompositeOperation = 'source-over';
                    inkCtx.strokeStyle = currentColor;
                    inkCtx.lineWidth = 8;
                }
                
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

        // Color selector check (Now updated for TOP placement)
        if (smoothY < 100) checkColorHover(smoothX);
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

// Updated to check hover against the top-toolbar
function checkColorHover(x) {
    const toolbar = document.querySelector('.top-toolbar');
    const options = document.querySelectorAll('.color-option');
    
    options.forEach((opt) => {
        const rect = opt.getBoundingClientRect();
        // Check if cursor X is within the color bubble horizontal bounds
        if (x > rect.left && x < rect.right && toolbar.getBoundingClientRect().top < 100) {
            pickColor(opt.style.backgroundColor, opt);
        }
    });
}

function clearCanvas() { inkCtx.clearRect(0, 0, inkCanvas.width, inkCanvas.height); }

async function saveSketch() {
    const data = inkCanvas.toDataURL('image/png');
    const fd = new FormData();
    fd.append('image', data);
    // Note: ensure CSRF token is handled if using Django for the fetch request
    const response = await fetch('/save/', { method: 'POST', body: fd });
    if(response.ok) alert("Art Saved, Vro! 🚀");
}
