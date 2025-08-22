export type NetworkKey =
  | "ethereum"
  | "sepolia"
  | "arbitrum"
  | "optimism"
  | "polygon"
  | "bsc"
  | "base"

const SCAN_BASE: Record<NetworkKey, string> = {
  ethereum: "https://api.etherscan.io/api",
  sepolia: "https://api-sepolia.etherscan.io/api",
  arbitrum: "https://api.arbiscan.io/api",
  optimism: "https://api-optimistic.etherscan.io/api",
  polygon: "https://api.polygonscan.com/api",
  bsc: "https://api.bscscan.com/api",
  base: "https://api.basescan.org/api"
}

// 填你自己的各链 API Key（同域名的 key）
const API_KEYS: Partial<Record<NetworkKey, string>> = {
  ethereum: "NGB5UXIC96PVTCPSVEHIE4ZNYM3WCFFJXE",
  sepolia: "NGB5UXIC96PVTCPSVEHIE4ZNYM3WCFFJXE",
  // arbitrum: "YOUR_ARBISCAN_KEY",
  // optimism: "YOUR_OPTIMISTIC_ETHERSCAN_KEY",
  // polygon: "YOUR_POLYGONSCAN_KEY",
  // bsc: "YOUR_BSCSCAN_KEY",
  // base: "YOUR_BASESCAN_KEY"
}

export type NormalTx = {
  type: "native"
  hash: string
  time: number
  from: string
  to: string
  valueWei: string
  blockNumber: number
  status: "success" | "failed" | "pending"
}

export type Erc20Tx = {
  type: "erc20"
  hash: string
  time: number
  from: string
  to: string
  token: { address: string; symbol: string; decimals: number }
  valueRaw: string // 未缩放的整数字符串
  blockNumber: number
}

export type AnyTx = NormalTx | Erc20Tx

export type TxCategory = "all" | "native" | "erc20"

export async function fetchNormalTxPage(
  net: NetworkKey,
  address: string,
  page = 1,
  offset = 25,
  sort: "asc" | "desc" = "desc"
): Promise<NormalTx[]> {
  const url = new URL(SCAN_BASE[net])
  url.searchParams.set("module", "account")
  url.searchParams.set("action", "txlist")
  url.searchParams.set("address", address)
  url.searchParams.set("startblock", "0")
  url.searchParams.set("endblock", "99999999")
  url.searchParams.set("page", String(page))
  url.searchParams.set("offset", String(offset))
  url.searchParams.set("sort", sort)
  if (API_KEYS[net]) url.searchParams.set("apikey", API_KEYS[net]!)

  const res = await fetch(url.toString())
  const json = await res.json()
  if (json.status === "0" && json.message !== "No transactions found") {
    throw new Error(json.result || "scan error")
  }
  const list: any[] = json.result || []
  return list.map((t) => ({
    type: "native",
    hash: t.hash,
    time: Number(t.timeStamp),
    from: t.from,
    to: t.to,
    valueWei: t.value, // wei string
    blockNumber: Number(t.blockNumber),
    status: t.isError === "1" ? "failed" : "success"
  }))
}

export async function fetchErc20TxPage(
  net: NetworkKey,
  address: string,
  page = 1,
  offset = 25,
  sort: "asc" | "desc" = "desc"
): Promise<Erc20Tx[]> {
  const url = new URL(SCAN_BASE[net])
  url.searchParams.set("module", "account")
  url.searchParams.set("action", "tokentx")
  url.searchParams.set("address", address)
  url.searchParams.set("page", String(page))
  url.searchParams.set("offset", String(offset))
  url.searchParams.set("sort", sort)
  if (API_KEYS[net]) url.searchParams.set("apikey", API_KEYS[net]!)

  const res = await fetch(url.toString())
  const json = await res.json()
  if (json.status === "0" && json.message !== "No transactions found") {
    throw new Error(json.result || "scan error")
  }
  const list: any[] = json.result || []
  return list.map((t) => ({
    type: "erc20",
    hash: t.hash,
    time: Number(t.timeStamp),
    from: t.from,
    to: t.to,
    token: {
      address: t.contractAddress,
      symbol: t.tokenSymbol,
      decimals: Number(t.tokenDecimal || "18")
    },
    valueRaw: t.value, // 未缩放
    blockNumber: Number(t.blockNumber)
  }))
}

// 合并并按时间倒序（同时间再按 blockNumber/hash）
export function mergeAndSort(a: AnyTx[], b: AnyTx[]): AnyTx[] {
  const all = [...a, ...b]
  all.sort((x, y) => {
    if (x.time !== y.time) return y.time - x.time
    if (x.blockNumber !== y.blockNumber) return y.blockNumber - x.blockNumber
    return x.hash.localeCompare(y.hash)
  })
  return all
}

// 辅助格式化
export function formatNative(wei: string, decimals = 18, precision = 6) {
  try {
    const neg = wei.startsWith("-")
    const s = neg ? wei.slice(1) : wei
    const pad = s.padStart(decimals + 1, "0")
    const i = pad.slice(0, -decimals)
    const f = pad.slice(-decimals).replace(/0+$/, "")
    const val = f ? `${i}.${f}` : i
    // 限制显示位数
    const [I, F = ""] = val.split(".")
    const fp = F.slice(0, precision)
    return (neg ? "-" : "") + (fp ? `${I}.${fp}` : I)
  } catch {
    return wei
  }
}

export function formatToken(valueRaw: string, decimals: number, precision = 6) {
  // 同上，按 decimals 缩放
  return formatNative(valueRaw, decimals, precision)
}