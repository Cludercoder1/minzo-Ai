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