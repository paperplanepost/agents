# Paper Plane Post for agents

Create and send an AI-illustrated postcard anywhere in the world.

Start an unpaid draft from your assistant, then open the returned link to review the photo, finish the note and address, and pay for printing and mailing on [Paper Plane Post](https://paperplanepost.com).

## Connect

Add this remote MCP server with Streamable HTTP:

```text
https://api.paperplanepost.com/v1/mcp
```

No account, API key, or authentication header is required. The root [`plugin.json`](plugin.json) and [`mcp.json`](mcp.json) form a portable [Agent Plugin](https://agent-plugins.org/) that Cursor Directory can discover from this repository URL. The MCP configuration is:

```json
{
  "mcpServers": {
    "paper-plane-post": {
      "type": "streamable-http",
      "url": "https://api.paperplanepost.com/v1/mcp"
    }
  }
}
```

`create_mail_order` takes `items`, each a postcard or a letter to one recipient. A postcard takes one photo source: a public HTTPS `photo_url`, actual file bytes encoded as `photo_base64`, or `photo_file`, the index of a file the host passed in `files`. A letter takes `content` text or a PDF (`pdf_url`, `pdf_base64` or `pdf_file`; US Letter, up to 11 pages). Include a `note` and any known `recipient` fields, or leave them for the website. `get_mail_order` shows an existing order from its link without creating another. Tool calls never charge money or mail anything. Order links expire after seven days.

Use actual file bytes, never base64 invented from an image. Missing note or address fields don't block a draft. The website handles review, payment, and mailing; order lookup is unavailable through this server.

## Packages

- [ChatGPT and Codex](chatgpt/): plugin manifest, MCP configuration, icon, and packaging helper.
- [Claude](claude/): plugin manifest, icon, MCP configuration, postcard skill and command. The packaging helper is [`tools/claude-package.ts`](tools/claude-package.ts), outside the plugin folder so the directory only sees plugin files. [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) makes this repository a Claude Code marketplace: `/plugin install paper-plane-post --marketplace paperplanepost/agents`.
- [`server.json`](server.json): official MCP Registry metadata for `com.paperplanepost/office`.

These are distribution sources. A package archive or registry listing does not imply approval in an AI app's directory. Build with [Bun](https://bun.sh/) and the system `zip` command. From this repository's root:

```sh
bun chatgpt/docs/package.ts
bun tools/claude-package.ts
```

Archives are written under `dist/` in the working directory. The builders use explicit file allowlists; environment files and review evidence aren't packaged.

[Connection guide](https://paperplanepost.com/for/agents) · [Support](https://paperplanepost.com/support) · [Privacy](https://paperplanepost.com/privacy) · [Terms](https://paperplanepost.com/terms)

## License

The files in this repository are MIT licensed. This license covers the published plugin and connection materials; the hosted service and its private implementation are separate. Using the service is subject to its terms, and printing and mailing require payment on the website.
