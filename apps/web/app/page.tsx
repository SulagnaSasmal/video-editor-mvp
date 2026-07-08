"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Bot,
  Boxes,
  Clapperboard,
  Download,
  FileText,
  Gift,
  HelpCircle,
  Home as HomeIcon,
  Languages,
  LayoutTemplate,
  Loader2,
  Plus,
  Radio,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Video,
  Wand2,
} from "lucide-react";
import { ClipList } from "@/components/clip-list";
import { VideoDropzone } from "@/components/video-dropzone";
import { createProject, createRenderJob } from "@/lib/api";
import type {
  ProjectPayload,
  RenderJob,
  Timeline,
  UploadedVideo,
} from "@/lib/types";

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

const navItems = [
  { label: "Home", icon: HomeIcon, active: true },
  { label: "Ask AI", icon: Sparkles },
  { label: "Library", icon: Boxes },
  { label: "Skills", icon: ShieldCheck },
  { label: "Shared Pages", icon: BookOpen },
  { label: "Brand Kit", icon: LayoutTemplate },
  { label: "Knowledge Base", icon: Bot },
];

const featureCards = [
  {
    title: "Create a Video",
    body: "Create professional product videos with AI assistance",
    icon: Video,
    tone: "violet",
  },
  {
    title: "Create a Document",
    body: "Build how-to guides and step-by-step docs automatically",
    icon: FileText,
    tone: "pink",
  },
  {
    title: "Translate Content",
    body: "Translate videos and guides into multiple languages",
    icon: Languages,
    tone: "gold",
  },
];

const quickGuide = [
  {
    title: "Step 1",
    body: "Upload a screen recording or product walkthrough.",
    icon: Clapperboard,
    tone: "violet",
  },
  {
    title: "Step 2",
    body: "Trim, reorder, caption, and prepare the timeline.",
    icon: Radio,
    tone: "pink",
  },
  {
    title: "Step 3",
    body: "Generate narration, docs, and branded guides.",
    icon: Wand2,
    tone: "gold",
  },
  {
    title: "Step 4",
    body: "Export video and documentation packages.",
    icon: Download,
    tone: "blue",
  },
];

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

  function addUploadedVideos(videos: UploadedVideo[]) {
    setTimeline((current) => {
      const nextClips = videos.map((video, index) => ({
        id: crypto.randomUUID(),
        file: video.file,
        order: current.clips.length + index + 1,
        trimStart: 0,
        trimEnd: 10,
        zoom: [],
        caption: "",
      }));

      return {
        ...current,
        clips:
          current.clips.length === 1 && current.clips[0].file === "clip1.mp4"
            ? nextClips
            : [...current.clips, ...nextClips],
      };
    });
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-mark">
            <Clapperboard size={18} />
          </span>
          <span>Flow Studio</span>
        </div>

        <nav className="nav-list" aria-label="Primary navigation">
          {navItems.map((item) => (
            <button
              className={`nav-item ${item.active ? "is-active" : ""}`}
              key={item.label}
              type="button"
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="trial-card">
          <div className="trial-progress">
            <span>Get started</span>
            <strong>1/4</strong>
          </div>
          <div className="trial-meter">
            <span />
          </div>
          <div className="trial-plan">
            <Gift size={16} />
            <div>
              <strong>Official Demo</strong>
              <small>Documentation flows next</small>
            </div>
          </div>
          <dl>
            <div>
              <dt>AI minutes</dt>
              <dd>10m</dd>
            </div>
            <div>
              <dt>Video exports</dt>
              <dd>3</dd>
            </div>
          </dl>
          <button className="upgrade-button" type="button">
            Upgrade Plan
          </button>
        </div>

        <div className="account-row">
          <span>SU</span>
          <p>sulagna.sasmal@ust.com</p>
        </div>
      </aside>

      <section className="main-area">
        <header className="utility-bar">
          <button className="ghost-icon" type="button" aria-label="Help" title="Help">
            <HelpCircle size={18} />
          </button>
          <button className="ghost-icon" type="button" aria-label="Settings" title="Settings">
            <Settings size={18} />
          </button>
          <button className="create-button" type="button">
            <Plus size={17} />
            Create new
          </button>
        </header>

        <section className="welcome-section">
          <h1>Hi there, welcome to Flow Studio</h1>
          <p>How would you like to start?</p>

          <div className="start-actions">
            <button className="start-tile" type="button">
              <Plus size={22} />
              <span>Start Recording</span>
            </button>
            <VideoDropzone onUploaded={addUploadedVideos} />
          </div>
        </section>

        <section className="feature-section">
          <h2>Popular features</h2>
          <div className="feature-grid">
            {featureCards.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </div>
                <span className={`feature-icon ${feature.tone}`}>
                  <feature.icon size={26} />
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="feature-section">
          <h2>Quick guide</h2>
          <div className="guide-grid">
            {quickGuide.map((guide) => (
              <article className="guide-card" key={guide.title}>
                <span className={`guide-icon ${guide.tone}`}>
                  <guide.icon size={24} />
                </span>
                <div>
                  <h3>{guide.title}</h3>
                  <p>{guide.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="editor-workspace">
          <div className="editor-header">
            <div>
              <h2>Timeline workspace</h2>
              <p>Uploaded clips appear here for trimming, captions, and export preview.</p>
            </div>
            <button
              className="primary-button"
              type="button"
              disabled={isRendering}
              onClick={previewRender}
            >
              {isRendering ? (
                <Loader2 className="spin" size={18} />
              ) : (
                <Download size={18} />
              )}
              Export preview
            </button>
          </div>

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
                    output: {
                      ...timeline.output,
                      resolution: event.target.value,
                    },
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
                    output: {
                      ...timeline.output,
                      fps: Number(event.target.value),
                    },
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
        </section>

        <button className="floating-send" type="button" aria-label="Ask AI">
          <Send size={19} />
        </button>
      </section>
    </main>
  );
}
