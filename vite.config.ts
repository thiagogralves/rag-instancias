import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import { handleState } from "./api/state.js"

function readBody(req: NodeJS.ReadableStream) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    req.on("error", reject)
  })
}

function ragApi(): Plugin {
  return {
    name: "rag-api",
    configureServer(server) {
      server.middlewares.use("/api/state", (req, res) => {
        void (async () => {
          try {
            const raw = req.method === "GET" || req.method === "HEAD" ? "" : await readBody(req)
            let body: unknown = {}
            if (raw) {
              try {
                body = JSON.parse(raw)
              } catch {
                res.statusCode = 400
                res.setHeader("content-type", "application/json")
                res.end(JSON.stringify({ error: "json" }))
                return
              }
            }
            const header = req.headers["x-user-email"]
            const email = Array.isArray(header) ? header[0] : header
            const result = await handleState(req.method || "GET", email, body)
            res.statusCode = result.status
            res.setHeader("content-type", "application/json; charset=utf-8")
            res.setHeader("cache-control", "no-store")
            res.end(JSON.stringify(result.data))
          } catch {
            res.statusCode = 500
            res.setHeader("content-type", "application/json")
            res.end(JSON.stringify({ error: "fail" }))
          }
        })()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), ragApi()],
  server: {
    host: true,
    port: 5173,
    watch: {
      ignored: ["**/public/art/CREDITS.txt", "**/data/**"],
    },
  },
})
