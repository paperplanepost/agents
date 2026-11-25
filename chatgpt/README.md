# Paper Plane Post for ChatGPT and Codex

Send postcards and letters anywhere in the world.

Three tools on one MCP server:

- `create_postcard` makes an unpaid order of photo postcards (4×6 to 194 countries, 6×9 within the US) from an uploaded photo, a generated image, or a public HTTPS image URL, for one recipient or up to 50, each with an optional note.
- `create_letter` makes an unpaid order of printed letters from text, optionally with a photo, and within the US as USPS Certified Mail with or without a return receipt.
- `get_order` reads an existing order from its link: its pieces, total, and whether it was paid and mailed. It creates nothing.

The inline card's **Review and pay** button opens Paper Plane Post, where the person checks every piece and address and pays. No Paper Plane Post account is required, and no tool ever charges or mails anything.

This package contains `plugin.json`, `mcp.json`, `assets/icon.png`, and `LICENSE`. It points only to the production MCP endpoint at `https://api.paperplanepost.com/v1/mcp` with no authentication. Missing notes or address fields never block an order.

## Build

From the repository root, with Bun and `zip` installed:

```sh
bun chatgpt/docs/package.ts
```

The builder checks the manifest, icon, endpoint, and declared review cases. It writes `dist/chatgpt-plugin/paper-plane-post-<version>-draft.zip` and prints a source digest. It includes only those four package files.

A draft ZIP is not an approved directory listing. OpenAI's dashboard validation, developer verification, and review remain separate. The published portable MCP schema rejects server extensions, while OpenAI documents `extensions.com.openai.auth`; retain that declaration and verify it in the portal.

## Release evidence

Maintainers can pass `--release --evidence /path/to/evidence.json` after executing the declared review cases, verifying production behavior, and completing dashboard validation. The private JSON must have the printed `sourceDigest` and a `checks` object with `positive-1` through `positive-5`, `negative-1` through `negative-3`, `desktop`, `production`, and `dashboard`. Each check needs `passed: true` and a nonempty `receipt` for the actual observation. The builder checks the file's structure and package binding, not the truth of its claims.

Never publish customer draft links or private evidence. The evidence file doesn't enter the archive. Follow [OpenAI's submission documentation](https://developers.openai.com/plugins/deploy/submission) for directory approval.

[Support](https://paperplanepost.com/support) · [Privacy](https://paperplanepost.com/privacy) · [Terms](https://paperplanepost.com/terms)
