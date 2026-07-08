from pathlib import Path
from uuid import UUID

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .models import Project, ProjectCreate, RenderJob
from .render import build_render_commands, command_preview

ROOT_DIR = Path(__file__).resolve().parents[3]
UPLOAD_DIR = ROOT_DIR / "storage" / "uploads"
EXPORT_DIR = ROOT_DIR / "storage" / "exports"

app = FastAPI(title="Video Editor MVP API", version="0.1.0")

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


@app.get("/health")
def health():
    return {"status": "ok"}


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
