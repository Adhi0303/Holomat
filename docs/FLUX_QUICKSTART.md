# 🚀 FLUX.1-dev Quick Start Guide

## How to Use FLUX.1-dev Model

### Step 1: Start the Application
```bash
cd "frontend UI"
npm run dev
```

This starts both backend (port 8001) and frontend (port 5173).

### Step 2: Access Design Mode
1. Open browser: `http://localhost:5173`
2. Complete standby/scanning sequence
3. Click **"Design"** tab in control panel

### Step 3: Select FLUX.1-dev
1. Look for **"AI MODEL"** dropdown (top of Design Mode)
2. Click dropdown
3. Select: **"🔷 FLUX.1-dev (HuggingFace)"**

### Step 4: Generate Image
1. Enter prompt: e.g., "futuristic arc reactor"
2. Select style: "Holographic"
3. Click **"GENERATE"**
4. Wait 15-30 seconds (first run: +20s for model loading)

### Expected Result:
- ✅ Loading indicator: "AI RENDERING"
- ✅ After 15-30s, high-quality image appears
- ✅ Bottom bar shows: "🔷 FLUX.1-DEV"
- ✅ Image saved to `holomat-backend/static/generated/`

---

## 🎨 Model Comparison

| Model | Speed | Quality | Cost | Best For |
|-------|-------|---------|------|----------|
| **Gemini 2.5 Flash** | ⚡ Fast (5-10s) | Good | Free | Quick iterations |
| **FLUX.1-dev** | 🐢 Slow (15-30s) | Excellent | Free | Final renders |
| **Pollinations** | ⚡⚡ Instant | Good | Free | Fallback |

---

## 🔧 Troubleshooting

### Error: "Model loading" (503)
**Cause:** FLUX.1-dev is cold-starting on HuggingFace servers.
**Solution:** Wait 20 seconds and click "GENERATE" again.

### Error: "Backend error: 502"
**Cause:** HuggingFace API issue or invalid token.
**Solution:** 
1. Check `HF_TOKEN` in `holomat-backend/.env`
2. Verify token at: https://huggingface.co/settings/tokens
3. Restart backend

### Error: "Backend connection failed"
**Cause:** Backend not running.
**Solution:** 
```bash
cd holomat-backend
python -m uvicorn main:app --reload --port 8001
```

### Image doesn't display
**Cause:** CORS or file path issue.
**Solution:**
1. Check browser console for errors
2. Verify image exists: `holomat-backend/static/generated/`
3. Try accessing directly: `http://localhost:8001/static/generated/flux_xxx.png`

---

## 💡 Pro Tips

1. **First Generation:** Always takes longer (~50s) due to model loading
2. **Subsequent Generations:** Much faster (~15-20s)
3. **Best Prompts:** Detailed descriptions work best
   - ❌ "robot"
   - ✅ "futuristic humanoid robot with glowing blue circuits"
4. **Styles:** FLUX.1-dev works best with "realistic" and "holographic" styles
5. **3D Conversion:** FLUX.1-dev images produce better 3D models than other engines

---

## 📊 Example Prompts

### Good Prompts for FLUX.1-dev:
- "futuristic arc reactor with glowing blue energy core"
- "holographic Iron Man helmet with neon circuits"
- "robotic arm with metallic joints and LED indicators"
- "sci-fi spaceship with sleek aerodynamic design"

### Avoid:
- Too vague: "robot"
- Too complex: "entire city with millions of buildings"
- Multiple objects: "robot and spaceship and car"

---

## 🎯 Workflow: Image → 3D Model

1. Select **FLUX.1-dev** model
2. Generate high-quality image
3. Click **"TO 3D"** button
4. Wait 30-90 seconds
5. 3D model appears in hologram viewer

**Why FLUX.1-dev for 3D?**
- Higher detail = better 3D mesh
- Cleaner backgrounds = easier object extraction
- Better lighting = more accurate textures

---

## ✅ Success Checklist

- [ ] Backend running on port 8001
- [ ] Frontend running on port 5173
- [ ] FLUX.1-dev option visible in dropdown
- [ ] HF_TOKEN configured in backend .env
- [ ] First generation completes (even if slow)
- [ ] Image displays correctly
- [ ] Image saved to static/generated/

---

## 🆘 Still Having Issues?

1. Check backend logs for errors
2. Verify API key: `echo $HF_TOKEN` (Linux/Mac) or `echo %HF_TOKEN%` (Windows)
3. Test backend directly: `python test_pipeline.py`
4. Check HuggingFace status: https://status.huggingface.co/
