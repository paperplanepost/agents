# Paper Plane Post for agents

Turn a photo into a real printed postcard. Start an unpaid draft from your assistant, then open the returned link to review the photo, finish the note and address, and pay for printing and mailing on [Paper Plane Post](https://paperplanepost.com).

## Connect

Add this remote MCP server with Streamable HTTP:

```text
https://api.paperplanepost.com/v1/mcp
```

No account, API key, or authentication header is required. For clients that read `mcp.json`:

```json
{
  "mcpServers": {
    "paper-plane-post": {
      "type": "http",
      "url": "https://api.paperplanepost.com/v1/mcp"
    }
  }
}
```

`start_postcard` accepts one photo source: a public HTTPS `photo_url`, actual file bytes encoded as `photo_base64`, or the host's supported file input. Include a `note` and any known `recipient` fields, or leave them for the website. `show_postcard` displays the handoff for an existing draft URL without creating another draft. Tool calls never charge money or mail a postcard. Draft links expire after seven days.

Use actual file bytes, never base64 invented from an image. Missing note or address fields don't block a draft. The website handles review, payment, and mailing; order lookup is unavailable through this server.

## Packages

- [ChatGPT and Codex](chatgpt/): plugin manifest, MCP configuration, icon, and packaging helper.
- [Claude](claude/): plugin manifest, MCP configuration, postcard skill, file-upload helper, and packaging helper.
- [`server.json`](server.json): official MCP Registry metadata for `com.paperplanepost/office`.

These are distribution sources. A package archive or registry listing does not imply approval in an AI app's directory. Build with [Bun](https://bun.sh/) and the system `zip` command. From this repository's root:

```sh
bun chatgpt/docs/package.ts
bun claude/docs/package.ts
```

Archives are written under `dist/` in the working directory. The builders use explicit file allowlists; environment files and review evidence aren't packaged.

[Connection guide](https://paperplanepost.com/for/agents) · [Support](https://paperplanepost.com/support) · [Privacy](https://paperplanepost.com/privacy) · [Terms](https://paperplanepost.com/terms)

## License

The files in this repository are MIT licensed. This license covers the published plugin and connection materials; the hosted service and its private implementation are separate. Using the service is subject to its terms, and printing and mailing require payment on the website.
