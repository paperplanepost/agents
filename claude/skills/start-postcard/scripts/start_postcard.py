#!/usr/bin/env python3
"""Transfer an uploaded image's actual bytes to the installed plugin's MCP server."""

import argparse
import base64
import json
from pathlib import Path
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def json_object(value):
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError as error:
        raise argparse.ArgumentTypeError("Expected a JSON object") from error
    if not isinstance(parsed, dict):
        raise argparse.ArgumentTypeError("Expected a JSON object")
    return parsed


def endpoint():
    plugin_root = Path(__file__).resolve().parents[3]
    config = json.loads((plugin_root / ".mcp.json").read_text())
    servers = config["mcpServers"]
    if len(servers) != 1:
        raise ValueError("The installed plugin must configure exactly one MCP server")
    url = next(iter(servers.values()))["url"]
    if url not in {
        "https://api.paperplanepost.com/v1/mcp",
        "https://plugin.dev.paperplanepost.com/v1/mcp",
    }:
        raise ValueError("The installed plugin's MCP endpoint is not a Paper Plane Post endpoint")
    return url


def response_message(body, content_type):
    if "text/event-stream" not in content_type:
        return json.loads(body)
    # SSE can contain notifications before the response, with multiple data lines per event.
    for event in re.split(r"\r?\n\r?\n", body):
        data = "\n".join(line[5:].lstrip(" ") for line in event.splitlines() if line.startswith("data:"))
        if data:
            message = json.loads(data)
            if message.get("id") == 1:
                return message
    raise ValueError("The MCP stream ended without a tool response")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", type=Path, help="The uploaded image file, read without resizing")
    parser.add_argument("--note")
    parser.add_argument("--recipient", type=json_object)
    parser.add_argument("--is-ai-generated", action="store_true")
    parser.add_argument("--challenge", type=json_object, help="The tool's challenge id and solved answers")
    args = parser.parse_args()
    url = endpoint()
    arguments = {"photo_base64": base64.b64encode(args.image.read_bytes()).decode("ascii")}
    if args.note is not None:
        arguments["note"] = args.note
    if args.recipient is not None:
        arguments["recipient"] = args.recipient
    if args.is_ai_generated:
        arguments["is_ai_generated"] = True
    if args.challenge is not None:
        arguments["challenge"] = args.challenge
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {"name": "start_postcard", "arguments": arguments},
    }
    request = Request(
        url,
        data=json.dumps(payload, separators=(",", ":")).encode(),
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            "User-Agent": "PaperPlanePost-Claude/1.0",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=210) as response:
            message = response_message(response.read().decode(), response.headers.get("Content-Type", ""))
    except HTTPError as error:
        # Never print an HTTP response body: a gateway could echo the uploaded request.
        raise ValueError(f"MCP request failed: HTTP {error.code} {error.reason}") from error
    except URLError as error:
        raise ValueError(f"MCP connection failed: {error.reason}") from error
    if message.get("error"):
        error = message["error"]
        raise ValueError(f"MCP error {error.get('code')}: {error.get('message')}")
    result = message["result"]
    if result.get("isError"):
        # Tool failures include the actual challenge instructions; keep them without image arguments.
        details = "\n".join(item["text"] for item in result.get("content", []) if item.get("type") == "text")
        raise ValueError(details or "The postcard tool returned an error")
    draft_url = result.get("structuredContent", {}).get("url")
    if not isinstance(draft_url, str) or not draft_url:
        raise ValueError("The postcard tool returned no draft URL")
    print(draft_url)


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
