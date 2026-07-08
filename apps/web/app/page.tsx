"use client";

import { useMemo, useState } from "react";
import { Clapperboard, Download, Loader2 } from "lucide-react";
import { ClipList } from "@/components/clip-list";
import { createProject, createRenderJob } from "@/lib/api";
import type { ProjectPayload, RenderJob, Timeline } from "@/lib/types";

const initialTimeline: Timeline = {
  clips: [
    {
      id: "clip-1",
      file: "clip1.mp4",
      order: 1,
      trimStart: 2,
      trimEnd: 18,
      zoom: [
        {
          start: 4,
          end: 8,
          scale: 1.3,
          x: 0.5,
          y: 0.4,
        },
      ],
      caption: "This is the intro section",
    },
  ],
  output: {
    resolution: "1920x1080",
    fps: 30,
    format: "mp4",
  },
};

export default function Home() {
  const [projectName, setProjectName] = useState("First MVP render");
  const [timeline, setTimeline] = useState<Timeline>(initialTimeline);
  const [job, setJob] = useState<RenderJob | null>(null);
  const [error, setError] = useState("");
  const [isRendering, setIsRendering] = useState(false);

  const payload = useMemo<ProjectPayload>(
    () => ({
      name: projectName,
      timeline,
    }),
    [projectName, timeline],
  );

  async function previewRender() {
    setIsRendering(true);
    setError("");
    setJob(null);

    try {
      const project = await createProject(payload);
      const nextJob = await createRenderJob(project.id);
      setJob(nextJob);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Render failed");
    } finally {
      setIsRendering(false);
    }
  }

  return (
    <main className="workspace">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <Clapperboard size={22} />
          </span>
          <div>
            <h1>Video Editor MVP</h1>
            <p>Manual timeline now, AI instruction layer later</p>
          </div>
        </div>
        <button
          className="primary-button"
          type="button"
          disabled={isRendering}
          onClick={previewRender}
        >
          {isRendering ? <Loader2 className="spin" size={18} /> : <Download size={18} />}
          Export preview
        </button>
      </header>

      <section className="settings-bar">
        <label>
          <span>Project</span>
          <input
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
          />
        </label>
        <label>
          <span>Resolution</span>
          <select
            value={timeline.output.resolution}
            onChange={(event) =>
              setTimeline({
                ...timeline,
                output: { ...timeline.output, resolution: event.target.value },
              })
            }
          >
            <option value="1920x1080">1920x1080</option>
            <option value="1080x1920">1080x1920</option>
            <option value="1280x720">1280x720</option>
          </select>
        </label>
        <label>
          <span>FPS</span>
          <input
            min="24"
            max="60"
            type="number"
            value={timeline.output.fps}
            onChange={(event) =>
              setTimeline({
                ...timeline,
                output: { ...timeline.output, fps: Number(event.target.value) },
              })
            }
          />
        </label>
      </section>

      <div className="grid">
        <ClipList
          clips={timeline.clips}
          onChange={(clips) => setTimeline({ ...timeline, clips })}
        />

        <aside className="panel inspector">
          <div className="panel-heading">
            <div>
              <h2>Edit JSON</h2>
              <p>Backend contract</p>
            </div>
          </div>
          <pre>{JSON.stringify(payload, null, 2)}</pre>
        </aside>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {job ? (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>FFmpeg Preview</h2>
              <p>{job.status}</p>
            </div>
          </div>
          <div className="command-list">
            {job.commandPreview.map((command) => (
              <code key={command}>{command}</code>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
