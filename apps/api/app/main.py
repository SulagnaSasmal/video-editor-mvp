import html
import os
from pathlib import Path
from shutil import copyfileobj
from uuid import UUID, uuid4

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .models import EnhancedRecording, EnhanceRequest, Project, ProjectCreate, RenderJob, UploadedVideo
from .render import build_render_commands, command_preview

ROOT_DIR = Path(__file__).resolve().parents[3]
UPLOAD_DIR = ROOT_DIR / "storage" / "uploads"
EXPORT_DIR = ROOT_DIR / "storage" / "exports"
load_dotenv(ROOT_DIR / ".env")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
EXPORT_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Video Editor MVP API", version="0.1.0")
app.mount("/media/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

projects: dict[UUID, Project] = {}
jobs: dict[UUID, RenderJob] = {}


def build_ai_script(original_name: str) -> str:
    title = Path(original_name or "screen recording").stem.replace("-", " ").replace("_", " ")
    return (
        f"This walkthrough demonstrates {title}. "
        "First, follow the action on screen. Next, notice each key decision point and the result it produces. "
        "Finally, review the completed flow so the process can be repeated confidently."
    )


def choose_tts_provider(requested: str | None) -> str:
    provider = (requested or os.environ.get("TTS_PROVIDER") or "").strip().lower()
    if provider in {"none", "off", "disabled"}:
        return "none"
    if provider in {"elevenlabs", "11labs", "eleven"}:
        return "elevenlabs"
    if provider == "azure":
        return "azure"
    if os.environ.get("AZURE_TTS_KEY") and os.environ.get("AZURE_TTS_REGION"):
        return "azure"
    if os.environ.get("ELEVENLABS_API_KEY"):
        return "elevenlabs"
    return "none"


def synthesize_azure(script: str, output_path: Path) -> None:
    key = os.environ.get("AZURE_TTS_KEY")
    region = os.environ.get("AZURE_TTS_REGION")
    if not key or not region:
        raise RuntimeError("Azure TTS credentials are not configured")

    endpoint = f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1"
    ssml = (
        "<speak version='1.0' xml:lang='en-US'>"
        "<voice xml:lang='en-US' xml:gender='Female' name='en-US-JennyNeural'>"
        f"{html.escape(script)}"
        "</voice></speak>"
    )
    response = httpx.post(
        endpoint,
        headers={
            "Ocp-Apim-Subscription-Key": key,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
            "User-Agent": "video-editor-mvp",
        },
        content=ssml.encode("utf-8"),
        timeout=30,
    )
    response.raise_for_status()
    output_path.write_bytes(response.content)


def synthesize_elevenlabs(script: str, output_path: Path) -> None:
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        raise RuntimeError("ElevenLabs credentials are not configured")

    voice_id = os.environ.get("ELEVENLABS_VOICE_ID") or "JBFqnCBsd6RMkjVDRZzb"
    model_id = os.environ.get("ELEVENLABS_MODEL") or "eleven_multilingual_v2"
    response = httpx.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        headers={
            "xi-api-key": key,
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
        },
        json={
            "text": script,
            "model_id": model_id,
            "voice_settings": {"stability": 0.55, "similarity_boost": 0.75},
        },
        timeout=45,
    )
    response.raise_for_status()
    output_path.write_bytes(response.content)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/uploads", response_model=list[UploadedVideo])
def upload_videos(files: list[UploadFile] = File(...)):
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    uploaded: list[UploadedVideo] = []

    for file in files:
        if not file.filename:
            raise HTTPException(status_code=400, detail="missing filename")

        suffix = Path(file.filename).suffix.lower()
        if suffix not in {".mp4", ".mov", ".m4v", ".webm"}:
            raise HTTPException(status_code=400, detail=f"{file.filename} is not a supported video")

        stem = "".join(
            char if char.isalnum() or char in {"-", "_"} else "-"
            for char in Path(file.filename).stem
        ).strip("-") or "clip"
        stored_name = f"{stem[:80]}-{uuid4().hex[:8]}{suffix}"
        target = UPLOAD_DIR / stored_name

        with target.open("wb") as output:
            copyfileobj(file.file, output)

        uploaded.append(
            UploadedVideo(
                file=stored_name,
                originalName=file.filename,
                contentType=file.content_type or "video/mp4",
                size=target.stat().st_size,
            )
        )

    return uploaded


@app.post("/ai/enhance", response_model=EnhancedRecording)
def enhance_recording(payload: EnhanceRequest):
    source = UPLOAD_DIR / payload.file
    if not source.exists():
        raise HTTPException(status_code=404, detail="recording not found")

    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    script = build_ai_script(payload.originalName or payload.file)
    provider = choose_tts_provider(payload.ttsProvider)
    steps = [
        "Screen recording uploaded",
        "Video cleanup plan prepared",
        "AI narration script generated",
    ]
    warning: str | None = None
    voiceover_file: str | None = None

    if provider != "none":
        output_name = f"{Path(payload.file).stem}-voiceover.mp3"
        output_path = EXPORT_DIR / output_name
        try:
            if provider == "azure":
                synthesize_azure(script, output_path)
            else:
                synthesize_elevenlabs(script, output_path)
            voiceover_file = output_name
            steps.append(f"{provider} TTS voiceover generated")
        except Exception as exc:
            warning = f"TTS generation skipped: {exc}"
            steps.append("TTS voiceover needs attention")
    else:
        warning = "No TTS provider credentials are configured"
        steps.append("TTS voiceover needs credentials")

    return EnhancedRecording(
        file=payload.file,
        script=script,
        ttsProvider=provider,
        voiceoverFile=voiceover_file,
        steps=steps,
        warning=warning,
    )


@app.post("/projects", response_model=Project)
def create_project(payload: ProjectCreate):
    project = Project(**payload.model_dump())
    projects[project.id] = project
    return project


@app.get("/projects/{project_id}", response_model=Project)
def get_project(project_id: UUID):
    project = projects.get(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="project not found")
    return project


@app.post("/projects/{project_id}/render", response_model=RenderJob)
def create_render_job(project_id: UUID):
    project = projects.get(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="project not found")

    commands = build_render_commands(project.id, project.timeline, UPLOAD_DIR, EXPORT_DIR)
    job = RenderJob(
        projectId=project.id,
        outputFile=str(EXPORT_DIR / f"{project.id}.{project.timeline.output.format}"),
        commandPreview=command_preview(commands),
    )
    jobs[job.id] = job
    return job


@app.get("/jobs/{job_id}", response_model=RenderJob)
def get_render_job(job_id: UUID):
    job = jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job not found")
    return job
