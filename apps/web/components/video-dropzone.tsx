"use client";

import { useRef, useState } from "react";
import { Film, UploadCloud } from "lucide-react";
import { uploadVideos } from "@/lib/api";
import type { UploadedVideo } from "@/lib/types";

type VideoDropzoneProps = {
  onUploaded: (videos: UploadedVideo[]) => void;
};

export function VideoDropzone({ onUploaded }: VideoDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(files: FileList | File[]) {
    const videos = Array.from(files).filter((file) =>
      file.type.startsWith("video/"),
    );

    if (!videos.length) {
      setError("Choose MP4, MOV, M4V, or WebM files.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const uploaded = await uploadVideos(videos);
      onUploaded(uploaded);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <section
      className={`dropzone ${isDragging ? "is-dragging" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        void upload(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        accept="video/mp4,video/quicktime,video/x-m4v,video/webm"
        className="visually-hidden"
        multiple
        type="file"
        onChange={(event) => {
          if (event.target.files) {
            void upload(event.target.files);
          }
        }}
      />

      <button
        className="dropzone-button"
        type="button"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        <span className="dropzone-icon">
          {isUploading ? <UploadCloud size={24} /> : <Film size={24} />}
        </span>
        <span>
          <strong>{isUploading ? "Uploading..." : "Drop videos or browse"}</strong>
          <small>MP4, MOV, M4V, WebM</small>
        </span>
      </button>

      {error ? <p className="dropzone-error">{error}</p> : null}
    </section>
  );
}
