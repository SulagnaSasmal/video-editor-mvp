from uuid import uuid4

from app.models import Clip, Timeline
from app.render import build_render_commands, command_preview


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

    assert len(commands) == 2
    assert "-ss 2.000" in preview[0]
    assert "-t 16.000" in preview[0]
    assert "drawtext" in preview[0]
    assert "concat:" in preview[1]
