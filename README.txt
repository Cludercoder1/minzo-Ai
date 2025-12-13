# MinzoAI Platform

A fully-featured generative AI platform for text generation, image creation, and embeddings.

## Features

- **Text Generation**: AI-powered content creation
- **Image Creation**: Generate visuals from text
- **AI Embeddings**: Text analysis and understanding
- **Modern UI**: Chat-like interface, responsive design
- **Secure**: Enterprise-grade security
- **Scalable**: Docker-ready deployment

## Quick Start

### Prerequisites
- Node.js 18+ (https://nodejs.org/)
- npm (comes with Node.js)
- (Optional) Docker & Docker Compose

### Local Development

#### 1. Clone the repository
```powershell
git clone <repository-url>
cd MinzoAI
```

#### 2. Install backend dependencies
```powershell
cd backend
npm install
```

#### 3. Start the backend server
```powershell
node server.js
```
The backend runs on [http://localhost:3001](http://localhost:3001)

#### 4. Install frontend dependencies
```powershell
cd ../client
npm install
```

#### 5. Start the frontend (if using React or Vite)
```powershell
npm start
```
The frontend runs on [http://localhost:3000](http://localhost:3000)

#### 6. Open the app
Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Windows quick dev start

- Use `start-dev.ps1` from the repo root to open separate PowerShell windows for backend, frontend, image microservice, and optional ngrok tunnels:
	- Run: `powershell -ExecutionPolicy Bypass -File start-dev.ps1`  # run with admin if required
	- Flags: `-Ngrok` to also start ngrok tunnels
	- Flags: `-NoPython` to skip launching the Python image service
	- The script will create `.env` files from templates if missing.

Prerequisites for Windows quick dev start:
- Node.js + npm (on PATH)
- Python 3.9+ (on PATH) for the `backend/python_image_service` venv and `uvicorn`
- ngrok (optional) added to PATH, or the script will skip tunnels if not present

---

## Docker Compose (Optional)

To run both backend and frontend with Docker Compose:

```powershell
docker-compose up --build
```

---

## Troubleshooting (Windows)

- If you see errors about missing modules (e.g., 'express'), run `npm install` in the `backend` or `client` folder as needed.
- If you see errors about native modules (like `better-sqlite3`), the backend will fall back to JSON file storage automatically.
- Always use PowerShell or Command Prompt, and avoid using folders with special characters in the path if possible.

---

## Project Structure

- `backend/` - Node.js Express backend
- `client/` - Frontend app (static HTML/JS or React)
- `docker-compose.yml` - Multi-container orchestration
- `docs/` - Architecture and guidelines

---

For more details, see `backend/README.md` and `client/README.md`.

## Configurable Frontend Backend URL
- The frontend reads the backend address from `window.MINZO_BACKEND_URL` at runtime. To configure this:
	- Locally: set `REACT_APP_BACKEND_URL` in `client/.env` or run the frontend dev server with `REACT_APP_BACKEND_URL=http://localhost:3001 npm start`.
	- In production: set the environment variable `REACT_APP_BACKEND_URL` during build, or inject `window.__MINZO_BACKEND_URL__` and/or the `meta` tag `minzo-backend` with the correct backend URL.
	- When using Docker Compose, the `REACT_APP_BACKEND_URL` is set to `http://minzo-backend:3001` by default in `docker-compose.yml`.
