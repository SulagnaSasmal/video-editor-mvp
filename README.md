# Video Editor MVP

This scaffold starts the boring, reliable core first:

- A Next.js editor surface that creates timeline JSON.
- A FastAPI backend that validates project data.
- An FFmpeg command builder that trims, normalizes, captions, applies a simple zoom, and stitches clips.
- Local storage folders for uploaded source clips and exported MP4s.
- Docker Compose services for PostgreSQL and Redis, ready for the next persistence and queue pass.

## Current slice

The MVP currently creates a project in memory and returns an FFmpeg command preview. It does not execute render jobs yet. That keeps the first iteration fast to test while the API contract is still changing.

## Run the API

```powershell
cd video-editor-mvp\apps\api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

## Run the web app

```powershell
cd video-editor-mvp\apps\web
npm install
npm run dev
```

Open `http://localhost:3000`.

## Run checks

```powershell
cd video-editor-mvp\apps\api
pytest
```

```powershell
cd video-editor-mvp\apps\web
npm run build
```

## Next build steps

1. Replace in-memory project/job storage with PostgreSQL tables.
2. Add upload support, starting with local multipart upload, then TUS/resumable upload.
3. Execute FFmpeg jobs in a worker process.
4. Persist job status and downloadable export paths.
5. Add Whisper/TTS/AI instruction generation after the manual timeline works.
