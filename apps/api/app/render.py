from pathlib import Path
from shlex import quote
from uuid import UUID

from .models import Clip, Timeline


def _clip_duration_arg(clip: Clip) -> list[str]:
    if clip.trimEnd is None:
        return []
    duration = clip.trimEnd - clip.trimStart
    return ["-t", f"{duration:.3f}"]


def _caption_filter(caption: str) -> str | None:
    if not caption.strip():
        return None
    escaped = caption.replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")
    return (
        "drawtext="
        "fontcolor=white:"
        "fontsize=42:"
        "box=1:"
        "boxcolor=black@0.55:"
        "boxborderw=24:"
        "x=(w-text_w)/2:"
        "y=h-text_h-96:"
        f"text='{escaped}'"
    )


def _zoom_filter(clip: Clip) -> str | None:
    if not clip.zoom:
        return None
    zoom = clip.zoom[0]
    # MVP keeps zoom intentionally simple: one crop window per clip, then scale back.
    crop_w = f"iw/{zoom.scale}"
    crop_h = f"ih/{zoom.scale}"
    crop_x = f"(iw-{crop_w})*{zoom.x}"
    crop_y = f"(ih-{crop_h})*{zoom.y}"
    return (
        f"crop=w='{crop_w}':h='{crop_h}':x='{crop_x}':y='{crop_y}',"
        "scale=iw:ih"
    )


def _video_filter(clip: Clip, resolution: str, fps: int) -> str:
    filters = [f"scale={resolution}:force_original_aspect_ratio=decrease"]
    filters.append(f"pad={resolution}:(ow-iw)/2:(oh-ih)/2")
    filters.append(f"fps={fps}")
    zoom_filter = _zoom_filter(clip)
    caption_filter = _caption_filter(clip.caption)
    if zoom_filter:
        filters.append(zoom_filter)
    if caption_filter:
        filters.append(caption_filter)
    return ",".join(filters)


def build_render_commands(
    project_id: UUID,
    timeline: Timeline,
    upload_dir: Path,
    export_dir: Path,
) -> list[list[str]]:
    export_dir.mkdir(parents=True, exist_ok=True)
    output = timeline.output
    normalized_files: list[Path] = []
    commands: list[list[str]] = []

    for index, clip in enumerate(timeline.clips):
        source = upload_dir / clip.file
        normalized = export_dir / f"{project_id}-{index:03d}.mp4"
        normalized_files.append(normalized)

        command = [
            "ffmpeg",
            "-y",
            "-ss",
            f"{clip.trimStart:.3f}",
            *_clip_duration_arg(clip),
            "-i",
            str(source),
            "-vf",
            _video_filter(clip, output.resolution, output.fps),
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "21",
            "-c:a",
            "aac",
            "-ar",
            "48000",
            "-ac",
            "2",
            str(normalized),
        ]
        commands.append(command)

    final_file = export_dir / f"{project_id}.{output.format}"
    concat_entries = "|".join(str(path) for path in normalized_files)
    commands.append(
        [
            "ffmpeg",
            "-y",
            "-i",
            f"concat:{concat_entries}",
            "-c",
            "copy",
            str(final_file),
        ]
    )
    return commands


def command_preview(commands: list[list[str]]) -> list[str]:
    return [" ".join(quote(part) for part in command) for command in commands]
