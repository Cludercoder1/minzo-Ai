This is a small Python-based image generation service used by MinzoAI.

Usage

1. Create a Python venv and install dependencies:

```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

2. Run:

```bash
uvicorn main:app --host 0.0.0.0 --port 5001
```

3. Make a POST request to `/generate` with JSON body:

```json
{ "prompt": "A photograph of a futuristic city at sunset", "width": 1024, "height": 1024 }
```

It returns JSON `{ success: true, image: "data:image/png;base64,...." }`.

Provider configuration

Set environment variables for the services you want to use, e.g. for StabilityAI:

- `MINZO_IMG_PROVIDER=stability`
- `STABILITY_API_KEY=your_api_key_goes_here`
- `STABILITY_MODEL=stable-diffusion-xl-beta-v2-2-2` (optional)

If a provider is configured and supported the service will attempt to use it. Otherwise it will return a placeholder image.
