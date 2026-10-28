import { createHash } from "node:crypto"
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { parseArgs } from "node:util"

import sourceManifest from "../.claude-plugin/plugin.json"
import sourceMCP from "../.mcp.json"

const { values } = parseArgs({
  options: { dev: { default: false, type: "boolean" } },
  strict: true,
})
const pluginRoot = path.resolve(import.meta.dir, "..")
const root = process.cwd()
const output = path.resolve(root, "dist/claude-plugin")
const name = values.dev ? "paper-plane-post-dev" : sourceManifest.name
const manifest = {
  ...sourceManifest,
  displayName: values.dev ? "Paper Plane Post Dev" : sourceManifest.displayName,
  name,
}
const endpoint = values.dev
  ? "https://plugin.dev.paperplanepost.com/v1/mcp"
  : "https://api.paperplanepost.com/v1/mcp"
const server = sourceMCP.mcpServers["paper-plane-post"]
if (server.type !== "http" || server.url !== "https://api.paperplanepost.com/v1/mcp") {
  throw new Error("The checked-in MCP configuration must use production HTTP without credentials")
}
if (Object.keys(server).toSorted().join(",") !== "type,url") {
  throw new Error("Do not package MCP headers, credentials, or extra server settings")
}
if (Object.keys(sourceMCP.mcpServers).length !== 1) {
  throw new Error("The plugin must contain exactly one MCP server")
}
const mcp = { mcpServers: { [name]: { type: server.type, url: endpoint } } }
const files = [
  {
    bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`),
    filename: ".claude-plugin/plugin.json",
  },
  { bytes: Buffer.from(`${JSON.stringify(mcp, null, 2)}\n`), filename: ".mcp.json" },
  ...(await Promise.all(
    [
      "README.md",
      "skills/start-postcard/SKILL.md",
      "skills/start-postcard/scripts/start_postcard.py",
    ].map(async (filename) => ({
      bytes: await readFile(path.resolve(pluginRoot, filename)),
      filename,
    }))
  )),
]

// Build in an isolated directory; never ZIP the source tree recursively.
const staging = path.resolve(output, `${name}-${manifest.version}`)
await rm(staging, { force: true, recursive: true })
await mkdir(staging, { recursive: true })
const hash = createHash("sha256")
for (const { bytes, filename } of files) {
  hash.update(filename).update("\0").update(bytes)
}
await Promise.all(
  files.map(async ({ bytes, filename }) => {
    const destination = path.resolve(staging, filename)
    await mkdir(path.dirname(destination), { recursive: true })
    await writeFile(destination, bytes)
  })
)
const archive = `${staging}.zip`
await rm(archive, { force: true })
const result = Bun.spawnSync(
  ["zip", "-q", "-X", archive, ...files.map(({ filename }) => filename)],
  {
    cwd: staging,
  }
)
if (result.exitCode !== 0) {
  throw new Error(`ZIP failed: ${result.stderr.toString()}`)
}
console.log(`Package SHA-256: ${hash.digest("hex")}`)
console.log(`MCP endpoint: ${endpoint}`)
console.log(`Validation directory: ${staging}`)
console.log(`Private-test archive: ${archive}`)
console.log(
  "Validate the package and test it in Claude before claiming compatibility or readiness."
)
