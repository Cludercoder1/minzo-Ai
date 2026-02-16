try:
    from fastapi import FastAPI, HTTPException
    from pydantic import BaseModel
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import FileResponse
    from typing import Optional
    import os
    import io
    import base64
    from PIL import Image, ImageDraw, ImageFont
    import requests
    import tempfile
    from TTS.api import TTS
    DEPENDENCIES_OK = True
except Exception as e:
    DEPENDENCIES_OK = False
    missing_import_error = str(e)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if DEPENDENCIES_OK:
    class GenerateRequest(BaseModel):
        prompt: str
        width: Optional[int] = 1024
        height: Optional[int] = 1024
        mode: Optional[str] = 'placeholder'  # 'placeholder' or provider key like 'stability'
        provider: Optional[str] = None

    class TTSRequest(BaseModel):
        text: str
        language: Optional[str] = "hi"  # Language code (Hindi)

    # Initialize TTS model (downloads on first use)
    tts_model = None
    
    def get_tts_model():
        global tts_model
        if tts_model is None:
            try:
                tts_model = TTS(model_name="tts_models/hi/css10/vits", gpu=False)
            except Exception as e:
                print(f"TTS model initialization error: {e}")
                tts_model = None
        return tts_model
else:
    # Minimal placeholder so import doesn't fail if pydantic is missing
    class GenerateRequest:
        def __init__(self, **kwargs):
            self.prompt = kwargs.get('prompt', '')
            self.width = kwargs.get('width', 1024)
            self.height = kwargs.get('height', 1024)
            self.mode = kwargs.get('mode', 'placeholder')
            self.provider = kwargs.get('provider', None)

    class TTSRequest:
        def __init__(self, **kwargs):
            self.text = kwargs.get('text', '')
            self.language = kwargs.get('language', 'hi')


@app.get("/health")
async def health():
    if not DEPENDENCIES_OK:
        return {"status": "degraded", "error": "Missing python dependencies: " + missing_import_error}
    return {"status": "ok"}


@app.post('/generate')
async def generate_image(req: GenerateRequest):
    if not DEPENDENCIES_OK:
        raise HTTPException(status_code=503, detail='Missing Python dependencies, install using requirements.txt')

    prompt = req.prompt or ''
    width = req.width if req.width else 1024
    height = req.height if req.height else 1024
    mode = req.mode or 'placeholder'
    provider = (req.provider or os.environ.get('MINZO_IMG_PROVIDER') or '').lower()

    # If a provider is set and recognized, try provider-based generation
    if provider == 'stability' and os.environ.get('STABILITY_API_KEY'):
        # this is optional: call Stability if configured
        try:
            api_key = os.environ.get('STABILITY_API_KEY')
            model = os.environ.get('STABILITY_MODEL') or 'stable-diffusion-xl-beta-v2-2-2'  # fallback name
            # Stability REST API (v1/generation endpoint) usage - this may vary with your account
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
            payload = {
                "text_prompts": [{"text": prompt}],
                "cfg_scale": 7,
                "clip_guidance_preset": "NONE",
                "height": height,
                "width": width,
                "samples": 1,
                "steps": 30
            }
            url = f"https://api.stability.ai/v1/generation/{model}/text-to-image"
            r = requests.post(url, headers=headers, json=payload, timeout=120)
            r.raise_for_status()
            data = r.json()
            # data may contain base64 images depending on provider
            if 'artifacts' in data and len(data['artifacts']) > 0 and 'base64' in data['artifacts'][0]:
                b64 = data['artifacts'][0]['base64']
                return { 'success': True, 'image': 'data:image/png;base64,' + b64 }
            # Otherwise, try to parse and return
            return { 'success': False, 'error': 'Provider returned no image artifact', 'raw': data }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # Default fallback: create a placeholder image with prompt text using PIL
    try:
        # Create image
        img = Image.new('RGB', (width, height), color=(30, 30, 30))
        d = ImageDraw.Draw(img)
        font_size = max(20, width // 24)
        try:
            font = ImageFont.truetype('arial.ttf', font_size)
        except Exception:
            font = ImageFont.load_default()

        # Wrap text
        text = prompt[:400]
        margin = 40
        offset = margin
        lines = []
        # naive wrap
        words = text.split(' ')
        cur = ''
        for w in words:
            test = (cur + ' ' + w).strip()
            if font.getsize(test)[0] < (width - margin * 2):
                cur = test
            else:
                lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)

        for line in lines:
            d.text((margin, offset), line, font=font, fill=(235, 235, 235))
            offset += font.getsize(line)[1] + 8

        # Draw a subtle border
        d.rectangle([2, 2, width-3, height-3], outline=(70, 70, 70))

        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        encoded = base64.b64encode(buffer.read()).decode('utf-8')
        return { 'success': True, 'image': 'data:image/png;base64,' + encoded }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/tts')
async def text_to_speech(req: TTSRequest):
    """Convert text to speech using Tacotron2 model"""
    if not DEPENDENCIES_OK:
        raise HTTPException(status_code=503, detail='Missing Python dependencies, install using requirements.txt')

    try:
        text = req.text.strip()
        if not text:
            raise HTTPException(status_code=400, detail='Text cannot be empty')

        # Get TTS model
        tts = get_tts_model()
        if tts is None:
            raise HTTPException(status_code=503, detail='TTS model failed to initialize')

        # Create temporary file for audio
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
            tmp_path = tmp_file.name

        try:
            # Generate speech
            tts.tts_to_file(text=text, file_path=tmp_path)

            # Read file and encode to base64
            with open(tmp_path, 'rb') as audio_file:
                audio_data = audio_file.read()
                encoded_audio = base64.b64encode(audio_data).decode('utf-8')

            # Return audio as base64
            return {
                'success': True,
                'audio': 'data:audio/wav;base64,' + encoded_audio,
                'text': text
            }
        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'TTS generation error: {str(e)}')


@app.post('/tts/file')
async def text_to_speech_file(req: TTSRequest):
    """Convert text to speech and return as file"""
    if not DEPENDENCIES_OK:
        raise HTTPException(status_code=503, detail='Missing Python dependencies, install using requirements.txt')

    try:
        text = req.text.strip()
        if not text:
            raise HTTPException(status_code=400, detail='Text cannot be empty')

        # Get TTS model
        tts = get_tts_model()
        if tts is None:
            raise HTTPException(status_code=503, detail='TTS model failed to initialize')

        # Create temporary file for audio
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
            tmp_path = tmp_file.name

        # Generate speech
        tts.tts_to_file(text=text, file_path=tmp_path)

        # Return file
        return FileResponse(tmp_path, media_type='audio/wav', filename='speech.wav')

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'TTS generation error: {str(e)}')

