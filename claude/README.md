# Paper Plane Post for Claude

Turn a supplied photo into an unpaid postcard draft from Claude. Open **Finish your postcard** to review the image, complete the note and mailing address, and pay on Paper Plane Post. Creating a draft never charges you or mails a postcard, and you don't need a Paper Plane Post account.

This package contains the Claude manifest, a remote MCP connection, and a postcard skill with a Python upload helper. The server exposes `start_postcard` to create an unpaid draft and read-only `show_postcard` to display its existing link and inline button. The production endpoint is `https://api.paperplanepost.com/v1/mcp`, with no authentication.

## Build and install

From the repository root, with Bun and `zip` installed:

```sh
bun claude/docs/package.ts
claude plugin validate claude --strict
```

The builder writes `dist/claude-plugin/paper-plane-post-1.0.0.zip` and prints its source digest. It includes only the manifest, MCP configuration, this README, the license, the skill, and its Python helper. Packaging tools, environment files, and test evidence stay outside the archive.

In a Claude client that supports private plugin uploads, open **Customize > Plugins > Add > Upload plugin** and choose the ZIP. Connect Paper Plane Post without authentication. Client menus and upload availability can differ. Keep one installation for the endpoint. A valid archive doesn't establish live-client compatibility or directory approval.

## Uploaded photos

The skill runs its bundled Python helper in Claude's code environment, reads the actual uploaded file, and transfers its bytes directly to `start_postcard`. It requires Python 3, file access, and network access to the configured server. Keep base64 inside the helper rather than copying it through model-generated arguments, which can truncate the file.

The helper reads the installed `.mcp.json`, accepts only the production or maintainer development endpoint, and prints the returned draft URL without image bytes. The skill passes that exact URL to the native connector's `show_postcard` tool, which renders the inline button without creating another draft. Public-image URL calls use native `start_postcard` directly. Neither path charges or mails anything.

## Verify changes

Test a public image URL and a real uploaded photo in fresh Claude chats. Repeat the uploaded-photo case after reopening Claude. Verify the website shows the supplied photo, exact note, and partial recipient fields without inventing missing details. Verify that the button opens the matching draft. Stop before payment and keep evidence private.

Without an image, ask for one without creating a draft. Requests for automatic charges or mailing must explain website checkout, and order-history requests must explain that lookup is unsupported. If a client can't read and transfer an attachment, report that limitation instead of substituting invented bytes.

Maintainers can build with `--dev` for the separately configured development endpoint. That artifact is named `paper-plane-post-dev`; it is not a production release.

[Plugin documentation](https://claude.com/docs/plugins/build) · [Support](https://paperplanepost.com/support) · [Privacy](https://paperplanepost.com/privacy) · [Terms](https://paperplanepost.com/terms)
