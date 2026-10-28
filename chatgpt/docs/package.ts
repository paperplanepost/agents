import { createHash } from "node:crypto"
import { mkdir, readFile, rm } from "node:fs/promises"
import path from "node:path"
import { parseArgs } from "node:util"

import mcp from "../mcp.json"
import manifest from "../plugin.json"

const pluginRoot = path.resolve(import.meta.dir, "..")
const root = process.cwd()
const files = ["plugin.json", "mcp.json", "assets/icon.png", "LICENSE"]
const requiredChecks = [
  "positive-1",
  "positive-2",
  "positive-3",
  "positive-4",
  "positive-5",
  "negative-1",
  "negative-2",
  "negative-3",
  "desktop",
  "production",
  "dashboard",
]

const { values } = parseArgs({
  options: {
    evidence: { type: "string" },
    release: { default: false, type: "boolean" },
  },
  strict: true,
})

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message)
  }
}

const isHTTPSURL = (value: string | undefined): boolean => {
  if (!value) {
    return false
  }
  try {
    const url = new URL(value)
    return url.protocol === "https:" && !url.username && !url.password
  } catch {
    return false
  }
}
type Evidence = {
  sourceDigest: string
  checks: Record<string, { passed: boolean; receipt: string }>
}
// This standalone CLI parses untrusted JSON at its file boundary without a runtime dependency.
/* oxlint-disable anti-slop/no-runtime-typeof */
const readEvidence = async (filename: string): Promise<Evidence> => {
  const value: unknown = await Bun.file(filename).json()
  if (
    !value ||
    typeof value !== "object" ||
    !("sourceDigest" in value) ||
    typeof value.sourceDigest !== "string" ||
    !("checks" in value) ||
    !value.checks ||
    typeof value.checks !== "object"
  ) {
    throw new Error("Evidence must contain sourceDigest and checks")
  }
  const checks: Evidence["checks"] = {}
  for (const [name, check] of Object.entries(value.checks)) {
    if (
      !check ||
      typeof check !== "object" ||
      !("passed" in check) ||
      typeof check.passed !== "boolean" ||
      !("receipt" in check) ||
      typeof check.receipt !== "string" ||
      !check.receipt.trim()
    ) {
      throw new Error(`Invalid evidence check: ${name}`)
    }
    checks[name] = { passed: check.passed, receipt: check.receipt }
  }
  return { checks, sourceDigest: value.sourceDigest }
}
/* oxlint-enable anti-slop/no-runtime-typeof */
type OpenAI = (typeof manifest.extensions)["com.openai"]
const listing: OpenAI["interface"] & {
  supportURL?: string
  termsOfServiceURL?: string
} = manifest.extensions["com.openai"].interface
const review: OpenAI["review"] & {
  demo_recording_url?: string
} = manifest.extensions["com.openai"].review
const blockers: string[] = []

assert(
  manifest.$schema === "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "Wrong plugin schema"
)
assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(manifest.name), "Invalid plugin name")
assert(/^\d+\.\d+\.\d+$/u.test(manifest.version), "Use an explicit release version")
assert(listing.displayName.length <= 30 && listing.displayName.length > 0, "Invalid display name")
assert(
  listing.shortDescription.length <= 30 && listing.shortDescription.length > 0,
  "Invalid subtitle"
)
assert(
  listing.longDescription.length <= 4000 && listing.longDescription.length > 0,
  "Invalid listing description"
)
assert(
  listing.developerName.length <= 80 && listing.developerName.length > 0,
  "Invalid developer name"
)
assert(listing.category.length > 0, "Missing category")
for (const key of ["websiteURL", "privacyPolicyURL"] as const) {
  assert(isHTTPSURL(listing[key]), `${key} must be HTTPS without credentials`)
}
for (const key of ["supportURL", "termsOfServiceURL"] as const) {
  if (!isHTTPSURL(listing[key])) {
    blockers.push(`Add a published, verified ${key} to plugin.json`)
  }
}
if (!isHTTPSURL(review.demo_recording_url)) {
  blockers.push("Add a reviewer-accessible video URL as review.demo_recording_url")
}
assert(
  mcp.$schema === "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "Wrong MCP schema"
)
assert(Object.keys(mcp.mcpServers).length === 1, "Submission must use one MCP server")
const server = mcp.mcpServers["paper-plane-post"]
assert(server.type === "streamable-http", "Use Streamable HTTP")
assert(
  server.url === "https://api.paperplanepost.com/v1/mcp",
  "Production package must use the production endpoint"
)
assert(
  server.extensions["com.openai"].auth.type === "none",
  "The server requires no authentication"
)
assert(!("headers" in server), "Do not package authentication headers")
assert(review.commerce === true, "Declare physical postcard commerce")
assert(review.test_cases.positive.length === 5, "Include exactly five positive cases")
assert(review.test_cases.negative.length === 3, "Include exactly three negative cases")
for (const testCase of review.test_cases.positive) {
  assert(
    Boolean(
      testCase.description &&
      testCase.prompt &&
      testCase.tools_triggered &&
      testCase.expected_behavior
    ),
    "Incomplete positive case"
  )
}
for (const testCase of review.test_cases.negative) {
  assert(
    Boolean(testCase.description && testCase.prompt && testCase.expected_behavior),
    "Incomplete negative case"
  )
}
assert(
  listing.logo === "./assets/icon.png" && listing.composerIcon === "./assets/icon.png",
  "Update the archive allowlist when changing assets"
)

const hash = createHash("sha256")
const contents = await Promise.all(
  files.map(async (filename) => ({
    bytes: await readFile(path.resolve(pluginRoot, filename)),
    filename,
  }))
)
for (const { filename, bytes } of contents) {
  hash.update(filename).update("\0").update(bytes)
  if (filename.endsWith(".png")) {
    assert(
      bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      "Invalid PNG signature"
    )
    const width = bytes.readUInt32BE(16)
    const height = bytes.readUInt32BE(20)
    assert(
      width === height && width >= 48 && width <= 4096,
      "Icon must be square, between 48 and 4096 pixels"
    )
    assert(bytes.length <= 5 * 1024 * 1024, "Icon exceeds 5 MiB")
  }
}
const sourceDigest = hash.digest("hex")
console.log(`Package source SHA-256: ${sourceDigest}`)

// Evidence is private release bookkeeping and never enters the archive.
if (values.evidence) {
  const evidence = await readEvidence(path.resolve(values.evidence))
  assert(evidence.sourceDigest === sourceDigest, "Evidence belongs to different package bytes")
  for (const name of requiredChecks) {
    if (!evidence.checks[name]?.passed) {
      blockers.push(`Missing passing evidence and receipt for ${name}`)
    }
  }
} else {
  blockers.push(
    "Supply --evidence with observed review-case, desktop, production, and dashboard receipts"
  )
}

console.log("Local package checks passed. These checks do not replace portal validation.")
console.log(
  "Schema caveat: the published portable MCP schema rejects server extensions; OpenAI requires extensions.com.openai.auth. Validate this declaration in the portal."
)
for (const blocker of blockers) {
  console.log(`BLOCKED: ${blocker}`)
}
if (values.release && blockers.length > 0) {
  throw new Error("Release archive refused: resolve the readiness blockers above")
}

const output = path.resolve(root, "dist/chatgpt-plugin")
await mkdir(output, { recursive: true })
const archive = path.resolve(
  output,
  `${manifest.name}-${manifest.version}${values.release ? "" : "-draft"}.zip`
)
await rm(archive, { force: true })
const result = Bun.spawnSync(["zip", "-q", "-X", archive, ...files], { cwd: pluginRoot })
assert(result.exitCode === 0, `ZIP failed: ${result.stderr.toString()}`)
console.log(`${values.release ? "Release" : "Draft"} archive: ${archive}`)
