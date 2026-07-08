from uuid import uuid4

from app.models import Clip, Timeline
from app.render import build_render_commands, command_preview, timeline_duration


def test_build_render_commands_includes_trim_caption_and_concat(tmp_path):
    timeline = Timeline(
        clips=[
            Clip(
                file="clip1.mp4",
                order=1,
                trimStart=2,
                trimEnd=18,
                caption="Intro section",
            )
        ]
    )

    commands = build_render_commands(
        uuid4(),
        timeline,
        tmp_path / "uploads",
        tmp_path / "exports",
    )
    preview = command_preview(commands)

    assert len(commands) == 3
    assert "-ss 2.000" in preview[0]
    assert "-t 16.000" in preview[0]
    assert "drawtext" in preview[0]
    assert "-f concat" in preview[1]
    assert "-movflags +faststart" in preview[2]


def test_build_render_commands_mixes_voiceover(tmp_path):
    timeline = Timeline(
        clips=[
            Clip(
                file="clip1.mp4",
                order=1,
                trimStart=0,
                trimEnd=8,
                caption="Professional narration",
            )
        ]
    )
    voiceover = tmp_path / "exports" / "voiceover.mp3"

    commands = build_render_commands(
        uuid4(),
        timeline,
        tmp_path / "uploads",
        tmp_path / "exports",
        voiceover_path=voiceover,
    )
    preview = command_preview(commands)

    assert len(commands) == 3
    assert str(voiceover) in preview[2]
    assert "loudnorm" in preview[2]
    assert "alimiter" in preview[2]
    assert "-b:a 192k" in preview[2]
    assert timeline_duration(timeline) == 8
