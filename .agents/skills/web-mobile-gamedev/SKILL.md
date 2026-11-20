---
name: web-mobile-gamedev
description: >-
  Comprehensive guide and patterns for developing high-performance 2D/3D games that run seamlessly
  in both modern web browsers (HTML5/Canvas/WebGL) and Android mobile devices (WebView, PWA, Capacitor).
  Use this skill whenever designing, building, optimizing, or packaging games for web and Android.
---

# Cross-Platform Web & Android Mobile Game Development

This skill provides architecture patterns, performance guidelines, input handlers, audio management, and Android packaging workflows for building games that run at 60 FPS across desktop web browsers and Android smartphones.

---

## 1. Engine & Rendering Choices

| Game Type | Best Technology | Why |
| :--- | :--- | :--- |
| **Puzzle, Word, Card, Board Games** | **HTML5 DOM + CSS Grid/Flexbox** | Crisp vector text, native accessibility, ultra-lightweight (<500 KB), buttery smooth CSS transitions. |
| **Fast 2D Action, Arcade, Platformer** | **HTML5 Canvas 2D or Pixi.js** | Millions of pixels per second, sprite batching, particle systems, simple math. |
| **Rich 2D / 2.5D Games** | **Phaser 3** | Physics engines (Arcade/Matter), tilemaps, camera systems, scene managers. |
| **3D Mobile Games** | **Three.js / WebGL / WebGPU** | 3D models (glTF), PBR lighting, shaders, camera rigs. |

---

## 2. Touch & Gesture Controls (Web & Mobile)

### 2.1 Prevent Mobile Browser Interference
In CSS, prevent browser gestures (pull-to-refresh, double-tap zoom, pinch-zoom, text selection):
```css
* {
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
}

canvas, .game-board, .interactive-area {
    touch-action: none; /* Prevents scroll, pinch-zoom, and swipe gestures */
}
```

In HTML `<head>`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
```

### 2.2 Unified Pointer Events & Touch Handling
Use `PointerEvents` when possible, or handle `touchstart`, `touchmove`, `touchend`:
```javascript
// Efficient touch drag tracking over grid elements
board.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    const tile = targetElement ? targetElement.closest('.tile') : null;
    if (tile) {
        handleTileHover(tile);
    }
}, { passive: false });
```

---

## 3. Responsive Scaling & Safe Areas

### 3.1 Device Notches & Cutouts
Support edge-to-edge screens with notch safe areas:
```css
body {
    padding-top: env(safe-area-inset-top, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    padding-left: env(safe-area-inset-left, 0px);
    padding-right: env(safe-area-inset-right, 0px);
}
```

### 3.2 Canvas Auto-Scaling (Letterbox vs Adaptive)
For Canvas games, maintain logical resolution while scaling to fit device aspect ratios:
```javascript
function resizeCanvas(canvas, logicalWidth, logicalHeight) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const scale = Math.min(windowWidth / logicalWidth, windowHeight / logicalHeight);

    canvas.style.width = `${logicalWidth * scale}px`;
    canvas.style.height = `${logicalHeight * scale}px`;
}
```

---

## 4. Mobile Audio Engine (Web Audio API)

Mobile browsers and Android WebViews suspend AudioContext until user interaction. Always implement an unlocked Audio Manager:

```javascript
class MobileSoundManager {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Synthesize procedural SFX without loading MP3s (0ms latency, zero bandwidth)
    playTone(frequency, type = 'sine', duration = 0.1) {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
    }
}
```

---

## 5. Performance & 60 FPS Optimization

1. **Avoid Garbage Collection Spikes:**
   - Pre-allocate arrays and objects. Never create `{ x: 0, y: 0 }` inside the render or update loop.
   - Use object pooling for particles, bullets, tiles.
2. **Delta Time in Game Loops:**
   ```javascript
   let lastTime = performance.now();
   function gameLoop(currentTime) {
       const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
       lastTime = currentTime;
       update(deltaTime);
       render();
       requestAnimationFrame(gameLoop);
   }
   requestAnimationFrame(gameLoop);
   ```
3. **DOM Games:** Use `transform: translate3d()` and `opacity` for hardware-accelerated animations on the GPU. Avoid animating `top`, `left`, `width`, `height`.

---

## 6. Android Packaging & Google Play Store Pipeline

### 6.1 Modern Android WebView Architecture
Google requires target SDK compliance (Target SDK 34/35/36+). Use `androidx.webkit.WebViewAssetLoader` to serve local game files from `assets/` via a secure HTTPS origin (`https://appassets.androidplatform.net/assets/index.html`):
- Eliminates `file://` CORS restrictions.
- Enables Service Workers, LocalStorage, and Web Audio.
- 100% offline gameplay without needing remote hosting.

### 6.2 Key Build Configurations (`app/build.gradle.kts`)
- `compileSdk = 36` (or latest mandated by Google Play)
- `targetSdk = 36`
- `minSdk = 24` (Android 7.0+, covering >99% of devices)
- `isMinifyEnabled = false` for initial releases to prevent ProGuard reflection breakages.

### 6.3 Google Play Asset Checklist
- **App Bundle (`.aab`):** Signed with keystore (`keytool -genkeypair`).
- **Icon:** 512x512 PNG (32-bit color, no transparency).
- **Feature Graphic:** 1024x500 PNG/JPEG.
- **Privacy Policy:** Required public URL stating data collection practices (even if offline).
