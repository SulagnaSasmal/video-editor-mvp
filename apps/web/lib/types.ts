export type ZoomKeyframe = {
  start: number;
  end: number;
  scale: number;
  x: number;
  y: number;
};

export type Clip = {
  id: string;
  file: string;
  order: number;
  trimStart: number;
  trimEnd: number;
  zoom: ZoomKeyframe[];
  caption: string;
};

export type Timeline = {
  clips: Clip[];
  output: {
    resolution: string;
    fps: number;
    format: "mp4";
  };
};

export type ProjectPayload = {
  name: string;
  timeline: Timeline;
};

export type RenderJob = {
  id: string;
  projectId: string;
  status: "queued" | "running" | "completed" | "failed";
  outputFile: string | null;
  commandPreview: string[];
  error: string | null;
};

export type UploadedVideo = {
  file: string;
  originalName: string;
  contentType: string;
  size: number;
};
