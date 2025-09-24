# Notion Lite

A lightweight, fast, and open-source alternative to Notion, built with FastAPI and React. This project was developed as a full-stack learning exercise to gain a deeper understanding of modern web development, from backend API design to frontend state management.

## Tech Stack

*   **Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL, Passlib, python-jose
*   **Frontend:** TypeScript, React, Vite, React Router, React Context
*   **Database:** SQLite (for local development), PostgreSQL (for production)

## How to Run Locally

### Prerequisites

*   Python 3.10+
*   Node.js 18+

### 1. Backend Setup

```bash
# From the project root directory
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows, use `.\venv\Scripts\activate`

# Install dependencies
pip install -r requirements.txt

# Create a .env file from the example and fill in your details
# (You'll need to generate a SECRET_KEY using `openssl rand -hex 32`)
cp .env.example .env

# Run the server
uvicorn app.main:app --reload
```
*The backend server will be running on `http://127.0.0.1:8000`.*

### 2. Frontend Setup

```bash
# From the project root directory
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```
*The frontend will be running on `http://localhost:5173`.*