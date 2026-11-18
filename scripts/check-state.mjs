import fs from "node:fs/promises"
import { handleState } from "../api/state.js"

const thiago = "thiagogralves@gmail.com"
const rafael = "raphaelgralves@gmail.com"

const denied = await handleState("GET", "outra@gmail.com", {})
if (denied.status !== 401) throw new Error("email estranho entrou")

let res = await handleState("POST", thiago, { op: "timerStart", instanceId: "inst_50" })
if (!res.data.state.active.inst_50 || res.data.state.active.inst_50.user !== "thiago") {
  throw new Error("timer não iniciou")
}

res = await handleState("POST", rafael, { op: "timerStop", instanceId: "inst_50" })
if (res.data.state.active.inst_50) throw new Error("timer não parou")
if (res.data.state.runs.at(-1)?.user !== "thiago") throw new Error("tempo foi para a pessoa errada")

res = await handleState("POST", rafael, { op: "toggleDone", instanceId: "inst_50" })
if (!res.data.state.completions.inst_50?.rafael) throw new Error("selo do Rafael falhou")

res = await handleState("POST", thiago, { op: "setPrice", dropId: "ira-deus-mar", price: 1500000 })
if (res.data.state.prices["ira-deus-mar"] !== 1500000) throw new Error("preço não gravou")

res = await handleState("POST", "thiagogralves@gmail.com ", { op: "toggleWatch", instanceId: "inst_1" })
if (!res.data.state.watch.thiago.includes("inst_1")) throw new Error("quero fazer falhou")

await fs.rm("data/state.json", { force: true })
console.log("ok")
