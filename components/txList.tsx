import React, { useEffect, useMemo, useState } from "react"
import type { AnyTx, Erc20Tx, NetworkKey, TxCategory } from "~lib/scan-api"
import { fetchErc20TxPage, fetchNormalTxPage, formatNative, formatToken, mergeAndSort } from "~lib/scan-api"
import * as Storage from "../utils/storage"

const NETS: NetworkKey[] = [
  "ethereum",
  "sepolia",
  // "arbitrum",
  // "optimism",
  // "polygon",
  // "bsc",
  // "base"
]

export default function TxList() {
  const [address, setAddress] = useState("")
  const [net, setNet] = useState<NetworkKey>("sepolia")
  const [cat, setCat] = useState<TxCategory>("all")

  const [pageNative, setPageNative] = useState(1)
  const [pageToken, setPageToken] = useState(1)

  const [nativeRows, setNativeRows] = useState<AnyTx[]>([])
  const [tokenRows, setTokenRows] = useState<AnyTx[]>([])
  const [merged, setMerged] = useState<AnyTx[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMoreNative, setHasMoreNative] = useState(true)
  const [hasMoreToken, setHasMoreToken] = useState(true)

  // 重置
  function reset() {
    setPageNative(1)
    setPageToken(1)
    setNativeRows([])
    setTokenRows([])
    setMerged([])
    setHasMoreNative(true)
    setHasMoreToken(true)
    setError(null)
  }

  async function load(pageN = 1, pageT = 1) {
    if (!address) return
    setLoading(true)
    setError(null)
    try {
      const tasks: Promise<any>[] = []
      if (cat !== "erc20" && hasMoreNative) {
        tasks.push(fetchNormalTxPage(net, address, pageN, 25, "desc"))
      }
      if (cat !== "native" && hasMoreToken) {
        tasks.push(fetchErc20TxPage(net, address, pageT, 25, "desc"))
      }
      const results = await Promise.all(tasks)
      let newNative = nativeRows
      let newToken = tokenRows

      if (cat !== "erc20" && hasMoreNative) {
        const list = (results.shift() || []) as AnyTx[]
        setHasMoreNative(list.length > 0)
        newNative = [...nativeRows, ...list]
        setNativeRows(newNative)
      }
      if (cat !== "native" && hasMoreToken) {
        const list = (results.shift() || []) as AnyTx[]
        setHasMoreToken(list.length > 0)
        newToken = [...tokenRows, ...list]
        setTokenRows(newToken)
      }

      const mergedList =
        cat === "native" ? newNative : cat === "erc20" ? newToken : mergeAndSort(newNative, newToken)
      setMerged(mergedList)
    } catch (e: any) {
      setError(e?.message || "加载失败")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    ; (async () => {
      const currentNetwork = await Storage.getCurrentNetwork();
      if (currentNetwork) {
        setNet(currentNetwork as NetworkKey)
      }
    })()
  }, [])
  // 网络/地址/类型变化时重载
  useEffect(() => {
    reset()
    const _address = localStorage.getItem("address");
    if (_address) {
      setAddress(_address);
      load(1, 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, net, cat])

  const canLoadMore =
    (cat !== "erc20" && hasMoreNative) || (cat !== "native" && hasMoreToken)

  function loadMore() {
    const nextN = cat !== "erc20" && hasMoreNative ? pageNative + 1 : pageNative
    const nextT = cat !== "native" && hasMoreToken ? pageToken + 1 : pageToken
    setPageNative(nextN)
    setPageToken(nextT)
    load(nextN, nextT)
  }

  return (
    <div style={{ width: 460, maxWidth: "100%", padding: 0, fontFamily: "system-ui, sans-serif" }}>
      <h3 style={{ margin: "6px 0 10px" }}>交易记录</h3>

      {/* <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <select value={net} onChange={(e) => setNet(e.target.value as NetworkKey)}>
          {NETS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div> */}

      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: 8, padding: 8, fontSize: 12, marginBottom: 8 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gap: 8 }}>
        {merged.map((tx) => (
          <TxRow key={`${tx.hash}-${tx.type}`} tx={tx} />
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        {loading ? (
          <button disabled style={btnStyle(true)}>加载中...</button>
        ) : canLoadMore ? (
          <button onClick={loadMore} style={btnStyle(false)}>加载更多</button>
        ) : (
          <div style={{ fontSize: 12, color: "#666" }}>没有更多了</div>
        )}
      </div>
    </div>
  )
}

function TxRow({ tx }: { tx: AnyTx }) {
  const time = new Date(tx.time * 1000).toLocaleString()
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "#475569" }}>{time}</span>
        <span style={{ fontSize: 12, color: "#64748b" }}>#{tx.blockNumber}</span>
        <span style={{ marginLeft: "auto", fontSize: 12, padding: "2px 6px", borderRadius: 6, background: "#f1f5f9" }}>
          {tx.type === "native" ? "原生" : "ERC-20"}
        </span>
      </div>
      <KV k="TxHash" v={<Mono text={tx.hash} short />} />
      <KV k="From" v={<Mono text={tx.from} short />} />
      <KV k="To" v={<Mono text={tx.to} short />} />
      {"valueWei" in tx ? (
        <KV k="Value" v={`${formatNative(tx.valueWei)} ETH`} />
      ) : (
        <KV
          k="Value"
          v={`${formatToken((tx as Erc20Tx).valueRaw, (tx as Erc20Tx).token.decimals)} ${(tx as Erc20Tx).token.symbol || "TOKEN"}`}
        />
      )}
      {"status" in tx && (
        <KV
          k="Status"
          v={<span style={{ color: tx.status === "success" ? "#16a34a" : "#dc2626" }}>{tx.status}</span>}
        />
      )}
    </div>
  )
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 8, fontSize: 12, marginTop: 2 }}>
      <div style={{ width: 64, color: "#64748b" }}>{k}</div>
      <div style={{ flex: 1, wordBreak: "break-all" }}>{v}</div>
    </div>
  )
}

function Mono({ text, short = false }: { text: string; short?: boolean }) {
  const s = short && text.length > 18 ? `${text.slice(0, 10)}...${text.slice(-8)}` : text
  return <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>{s}</span>
}

function btnStyle(primary: boolean): React.CSSProperties {
  return {
    appearance: "none",
    cursor: "pointer",
    background: primary ? "#0ea5e9" : "#e2e8f0",
    color: primary ? "white" : "#0f172a",
    border: "none",
    borderRadius: 8,
    padding: "8px 12px",
  }
}