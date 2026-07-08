import type { ProjectPayload, RenderJob } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function createProject(payload: ProjectPayload) {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<ProjectPayload & { id: string }>;
}

export async function createRenderJob(projectId: string) {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/render`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<RenderJob>;
}
