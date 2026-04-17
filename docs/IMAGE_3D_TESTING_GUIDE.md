# 🧪 Image & 3D Model Pipeline Testing Guide

## ✅ Implementation Status

### Backend APIs
- ✅ **image_gen.py** - FLUX.1-dev via HuggingFace Router
- ✅ **model_gen.py** - Tripo3D image-to-3D conversion
- ✅ All API keys configured in `.env`

### Frontend
- ✅ **DesignMode.tsx** - Image generation UI
- ✅ **imageGenService.ts** - Gemini + Pollinations fallback
- ✅ 3D conversion button integrated

### API Keys Verified
- ✅ `HF_TOKEN` - HuggingFace (FLUX.1-dev)
- ✅ `TRIPO_API_KEY` - Tripo3D (3D generation)
- ✅ `GEMINI_API_KEY` - Gemini Vision & Image Gen
- ✅ `GROQ_API_KEY` - Jarvis AI

---

## 🚀 Testing Workflow

### Step 1: Start the Application

```bash
cd "frontend UI"
npm run dev
```

This will automatically start:
- **Backend** on `http://localhost:8001`
- **Frontend** on `http://localhost:5173`

### Step 2: Access Design Mode

1. Open browser: `http://localhost:5173`
2. Complete the standby/scanning sequence
3. Click **"Design"** tab in the control panel (right side)
4. You should see the AI Design Studio interface

---

## 🎨 Test Case 1: Image Generation (Gemini)

### Test Steps:
1. In Design Mode, enter prompt: **"futuristic arc reactor"**
2. Select style: **"Holographic"**
3. Select AI Model: **"Gemini 2.5 Flash Image"** (default)
4. Click **"GENERATE"**

### Expected Results:
- ✅ Loading indicator appears: "AI RENDERING"
- ✅ After 5-10 seconds, image appears
- ✅ Bottom bar shows: "HOLOGRAPHIC · ⚡ GEMINI AI"
- ✅ Image has holographic blue neon style

### Troubleshooting:
- **Error: "No image in response"** → Gemini returned text only, try different prompt
- **Error: "API key invalid"** → Check `VITE_GEMINI_API_KEY` in `frontend UI/.env.local`
- **Fallback to Pollinations** → Normal behavior if Gemini fails

---

## 🌐 Test Case 2: Image Generation (Pollinations Fallback)

### Test Steps:
1. Select AI Model: **"Pollinations: Flux Core"**
2. Enter prompt: **"robotic arm blueprint"**
3. Select style: **"Blueprint"**
4. Click **"GENERATE"**

### Expected Results:
- ✅ Image loads instantly (direct URL)
- ✅ Bottom bar shows: "BLUEPRINT · 🌐 POLLINATIONS.AI"
- ✅ Image has technical blueprint style

---

## 🔷 Test Case 3: Backend Image Generation (FLUX.1-dev)

### Test Steps:
1. Open new terminal
2. Test backend API directly:

```bash
curl -X POST http://localhost:8001/api/generate-image \
  -H "Content-Type: application/json" \
  -d "{\"prompt\": \"holographic cube\", \"style\": \"holographic\"}"
```

### Expected Results:
```json
{
  "success": true,
  "image_url": "/static/generated/flux_abc12345.png",
  "prompt_used": "holographic cube, holographic 3D render...",
  "engine": "flux-dev"
}
```

### Verify Image:
- Open: `http://localhost:8001/static/generated/flux_abc12345.png`
- Image should be visible

### Troubleshooting:
- **503 Error: "Model loading"** → Wait 20 seconds, retry
- **502 Error** → Check `HF_TOKEN` in `holomat-backend/.env`
- **Image not found** → Check `holomat-backend/static/generated/` folder exists

---

## 🎯 Test Case 4: 3D Model Generation (Full Pipeline)

### Test Steps:
1. In Design Mode, generate an image (any method)
2. Wait for image to appear
3. Click **"TO 3D"** button (floating button on image)
4. Wait for 3D generation (30-60 seconds)

### Expected Results:
- ✅ Loading indicator: "BUILDING 3D MESH"
- ✅ Progress message: "~5s. Fast 3D Mesh Generation..."
- ✅ Auto-switches to **Home** mode
- ✅ 3D model appears in hologram viewer
- ✅ Can rotate/zoom the 3D model

### Backend Logs to Watch:
```
[3D Gen] Uploading image: flux_abc12345.png
[3D Gen] Image uploaded → token: xxx...
[3D Gen] Creating image_to_model task...
[3D Gen] Task created → task_abc123
[3D Gen] Polling task task_abc123...
[3D Gen] Status: running | Progress: 50%
[3D Gen] Status: success | Progress: 100%
[3D Gen] ✅ Model ready: https://...
[3D Gen] Downloading GLB → model_tripo_xyz.glb
[3D Gen] ✅ GLB saved (1234567 bytes)
```

### Verify 3D Model:
- Check folder: `holomat-backend/static/models/`
- File: `model_tripo_xyz.glb` should exist
- Open: `http://localhost:8001/static/models/model_tripo_xyz.glb`

### Troubleshooting:
- **Error: "Image not found"** → Backend image wasn't saved properly
- **Timeout after 5 min** → Tripo3D API might be slow, check backend logs
- **Task failed** → Check `TRIPO_API_KEY` in backend `.env`

---

## 🧪 Test Case 5: Voice Command Integration

### Test Steps:
1. Click **🎤 Voice** icon
2. Say: **"Generate a holographic Iron Man helmet"**
3. Wait for Jarvis to respond

### Expected Results:
- ✅ Jarvis says: "Initiating Gemini image generation..."
- ✅ Auto-switches to **Design** mode
- ✅ Prompt auto-fills: "Iron Man helmet"
- ✅ Style auto-selects: "holographic"
- ✅ Image generates automatically

---

## 📊 Test Case 6: Canvas Mode Integration

### Test Steps:
1. Click **Canvas** tab
2. Draw a simple shape (e.g., circle with lines)
3. Click **"SEND TO AI"**
4. Wait for AI analysis

### Expected Results:
- ✅ Gemini Vision analyzes sketch
- ✅ Generates detailed prompt
- ✅ Creates image via Pollinations
- ✅ Preview modal shows result

---

## 🔍 Verification Checklist

### Frontend
- [ ] Design Mode loads without errors
- [ ] All 5 styles are selectable
- [ ] AI model dropdown shows all options
- [ ] Prompt input accepts text
- [ ] Generate button works
- [ ] Loading states display correctly
- [ ] Images render properly
- [ ] "TO 3D" button appears on images
- [ ] Download button works
- [ ] Error messages display when needed

### Backend
- [ ] `/api/generate-image` endpoint responds
- [ ] Images save to `/static/generated/`
- [ ] `/api/generate-3d` endpoint responds
- [ ] 3D models save to `/static/models/`
- [ ] Logs show proper status updates
- [ ] No Python errors in console

### Integration
- [ ] Voice commands trigger image generation
- [ ] Canvas drawings convert to images
- [ ] 3D models load in hologram viewer
- [ ] Mode switching works correctly
- [ ] All API keys are valid

---

## 🐛 Common Issues & Solutions

### Issue: "Model loading" (503 Error)
**Solution:** FLUX.1-dev is cold-starting. Wait 20 seconds and retry.

### Issue: Gemini returns text only
**Solution:** Prompt might not be image-friendly. Try more descriptive prompts like "3D render of..."

### Issue: 3D generation times out
**Solution:** Tripo3D can take 2-5 minutes for complex images. Check backend logs for progress.

### Issue: Images don't display
**Solution:** 
- Check browser console for CORS errors
- Verify backend is serving `/static/` correctly
- Try accessing image URL directly

### Issue: "API key invalid"
**Solution:**
- Frontend: Check `frontend UI/.env.local`
- Backend: Check `holomat-backend/.env`
- Restart both servers after changing .env

---

## 📈 Performance Benchmarks

### Image Generation Times:
- **Gemini 2.5 Flash**: 5-10 seconds
- **Pollinations Flux**: Instant (direct URL)
- **FLUX.1-dev (Backend)**: 15-30 seconds (first run: +20s cold start)

### 3D Generation Times:
- **Tripo3D**: 30-90 seconds
- **File sizes**: 500KB - 5MB GLB files

---

## ✅ Success Criteria

All tests pass if:
1. ✅ Images generate via Gemini OR Pollinations
2. ✅ Backend FLUX.1-dev generates images
3. ✅ 3D models generate from images
4. ✅ 3D models display in hologram viewer
5. ✅ Voice commands work
6. ✅ Canvas mode works
7. ✅ No critical errors in console

---

## 🎉 Next Steps After Testing

If all tests pass:
1. Document any issues found
2. Test with different prompts/styles
3. Verify API rate limits
4. Test on different browsers
5. Deploy to production

If tests fail:
1. Check API keys
2. Review backend logs
3. Verify network connectivity
4. Check file permissions
5. Restart servers
