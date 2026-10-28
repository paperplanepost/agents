# Paper Plane Post for ChatGPT and Codex

Start an unpaid postcard from an uploaded photo, a generated image, or a public HTTPS image URL. The inline **Finish your postcard** button opens Paper Plane Post for review, the remaining note and address fields, and payment. No Paper Plane Post account is required, and the tool never charges or mails anything.

This package contains `plugin.json`, `mcp.json`, `assets/icon.png`, and `LICENSE`. It points only to the production MCP endpoint at `https://api.paperplanepost.com/v1/mcp` with no authentication. Missing optional notes or address fields never block draft creation.

## Build

From the repository root, with Bun and `zip` installed:

```sh
bun chatgpt/docs/package.ts
```

The builder checks the manifest, icon, endpoint, and declared review cases. It writes `dist/chatgpt-plugin/paper-plane-post-1.0.0-draft.zip` and prints a source digest. It includes only those four package files.

A draft ZIP is not an approved directory listing. OpenAI's dashboard validation, developer verification, and review remain separate. The published portable MCP schema rejects server extensions, while OpenAI documents `extensions.com.openai.auth`; retain that declaration and verify it in the portal.

## Release evidence

Maintainers can pass `--release --evidence /path/to/evidence.json` after executing the declared review cases, verifying production behavior, and completing dashboard validation. The private JSON must have the printed `sourceDigest` and a `checks` object with `positive-1` through `positive-5`, `negative-1` through `negative-3`, `desktop`, `production`, and `dashboard`. Each check needs `passed: true` and a nonempty `receipt` for the actual observation. The builder checks the file's structure and package binding, not the truth of its claims.

Never publish customer draft links or private evidence. The evidence file doesn't enter the archive. Follow [OpenAI's submission documentation](https://developers.openai.com/plugins/deploy/submission) for directory approval.

[Support](https://paperplanepost.com/support) · [Privacy](https://paperplanepost.com/privacy) · [Terms](https://paperplanepost.com/terms)
