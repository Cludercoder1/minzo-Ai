Minzo Foundation Backend

Environment variables:
- `MINZO_API_KEY` - optional: API key for the Minzo/Deepseek API (text and image generation via Minzo).
- `MINZO_BASE_URL` - optional: base URL for Minzo API (defaults to https://api.deepseek.com/v1).
- `PYTHON_IMAGE_SERVICE_URL` or `IMAGE_SERVICE_URL` - optional: URL of a Python image-generation microservice (FastAPI). If set, the `/api/generate-image` route will prefer this service and accept `width`, `height` in the request payload.

Notes:
- If `MINZO_API_KEY` is not provided, the server will not exit — instead, it will try to use the `PYTHON_IMAGE_SERVICE_URL` for image generation and will warn at startup.
- The project contains `backend/python_image_service` as an optional FastAPI image-generation microservice which returns `image` as `data:image/png;base64,...`. The Node backend extracts the base64-portion and returns `imageBase64` to callers.
