# 🚀 Athex AeroInk

**Athex AeroInk** is an innovative web application that allows you to draw in mid-air using hand gestures, powered by MediaPipe and TensorFlow.js. No physical mouse or stylus required—just your webcam!

## ✨ Features

* **Gesture-Based Drawing:** Use your index finger to draw in the air.
* **Gestural Eraser:** Open your hand completely (all fingers up) to switch to eraser mode.
* **Air-Controlled Color Palette:** Hover over the top-middle toolbar to change colors without clicking.
* **Persistent Canvas:** Your drawings stay on screen while you move your hand.
* **Save Artwork:** Save your digital masterpiece directly from the browser.

## 🛠️ Technology Stack

* **Frontend:** HTML5, CSS3, JavaScript
* **AI/Computer Vision:** MediaPipe Hands, TensorFlow.js
* **Backend:** Python (Django) - *Used for saving image data*

## 🚀 How to Run

1.  Clone this repository.
2.  Install dependencies: `pip install -r requirements.txt` (if using Django).
3.  Run the development server: `python manage.py runserver`.
4.  Open your browser and navigate to `http://127.0.0.1:8000/`.
5.  Allow camera access and start sketching!

## 🤝 Gestures

| Action | Gesture |
| :--- | :--- |
| **Draw** | Extend only index finger. |
| **Erase** | Open entire hand (all fingers extended). |
| **Change Color** | Hover index finger over the top color bar. |

---

need python 3.12 version

py -3.12 -m venv venv

then activate it
