# Paper Plane Post for Claude

Create and send an AI-illustrated postcard anywhere in the world.

Turn a supplied photo into an unpaid postcard draft from Claude. Open **Finish your postcard** to review the image, complete the note and mailing address, and pay on Paper Plane Post. Creating a draft never charges you or mails a postcard, and you don't need a Paper Plane Post account.

This package contains the Claude manifest, a remote MCP connection, a postcard skill, and a `/paper-plane-post:postcard` command. The server exposes `create_mail_order` to create an unpaid order and read-only `get_mail_order` to display an existing order's link and inline button. The production endpoint is `https://api.paperplanepost.com/v1/mcp`, with no authentication.

## Install

In Claude Code:

```sh
/plugin install paper-plane-post --marketplace paperplanepost/agents
```

Then ask Claude to turn a photo into a postcard, or run `/paper-plane-post:postcard` with a photo attached or a public image URL.

## Build and upload

From the repository root, with Bun and `zip` installed:

```sh
bun tools/claude-package.ts
claude plugin validate claude --strict
```

The builder writes `dist/claude-plugin/paper-plane-post-<version>.zip` and prints its source digest. It includes only the manifest, icon, MCP configuration, this README, the license, the command, and the skill. Packaging tools, environment files, and test evidence stay outside the archive.

In a Claude client that supports private plugin uploads, open **Customize > Plugins > Add > Upload plugin** and choose the ZIP. Connect Paper Plane Post without authentication. Client menus and upload availability can differ. Keep one installation for the endpoint. A valid archive doesn't establish live-client compatibility or directory approval.

## Uploaded photos

The plugin makes postcards from public image URLs. For a photo uploaded to the chat, the skill points the person to https://paperplanepost.com to add it there. Creating a draft never charges or mails anything.

## Verify changes

Test a public image URL in a fresh Claude chat, and check that an uploaded photo is pointed to the website. Verify the website shows the supplied photo, exact note, and partial recipient fields without inventing missing details. Verify that the button opens the matching draft. Stop before payment and keep evidence private.

Without an image, ask for one without creating a draft. Requests for automatic charges or mailing must explain website checkout, and order-history requests must explain that lookup is unsupported.

Maintainers can build with `--dev` for the separately configured development endpoint. That artifact is named `paper-plane-post-dev`; it is not a production release.

[Plugin documentation](https://claude.com/docs/plugins/build) · [Support](https://paperplanepost.com/support) · [Privacy](https://paperplanepost.com/privacy) · [Terms](https://paperplanepost.com/terms)
