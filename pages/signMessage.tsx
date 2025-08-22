import React, { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom";
import { WalletStore } from "../store/WalletStore"

type PendingSign = {
  requestId: number
  method: string
  origin?: string
  address?: string
  chainId?: string
  data: string
}

function isHex(s: string) {
  return /^0x[0-9a-fA-F]*$/.test((s || "").trim())
}

// 尽力把数据转为 UTF-8 文本
function toUtf8(s: string) {
  try {
    if (isHex(s)) {
      // 简单解码：按字节->utf8 字符串
      const bytes = new Uint8Array(
        s
          .slice(2)
          .match(/.{1,2}/g)
          ?.map((h) => parseInt(h, 16)) || []
      )
      return new TextDecoder().decode(bytes)
    }
    return s
  } catch {
    return s
  }
}

function prettyJson(s: string) {
  try {
    return JSON.stringify(JSON.parse(s), null, 2)
  } catch {
    return s
  }
}

export default function SignMessage() {
  const [req, setReq] = useState<PendingSign | null>(null)
  const [mode, setMode] = useState<"auto" | "utf8" | "hex" | "json">("auto")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isSigned, setIsSigned } = WalletStore.useContainer()

  const isTyped =
    req?.method === "eth_signTypedData" ||
    req?.method === "eth_signTypedData_v3" ||
    req?.method === "eth_signTypedData_v4"

  useEffect(() => {
    ; (async () => {
      const msg = searchParams.get("message")
      if (msg) {
        setReq({
          requestId: Date.now(),
          method: "eth_sign",
          data: msg
        })
      }
    })()
    return setBusy(false);
  }, [navigate])

  const view = useMemo(() => {
    if (!req) return null
    if (isTyped || mode === "json") {
      return (
        <pre style={preStyle}>{prettyJson(req.data)}</pre>
      )
    }
    if (mode === "hex") {
      return <pre style={preStyle}>{req.data}</pre>
    }
    // auto / utf8
    return (
      <div style={boxStyle}>{toUtf8(req.data)}</div>
    )
  }, [req, mode, isTyped])

  async function decide(approved: boolean) {
    if (!req) return
    setBusy(true)
    setError(null)
    const tabId = searchParams.get("tabId")
    chrome.runtime.sendMessage({
      type: "WALLET_SIGN_MESSAGE_RESPONSE",
      source: "myWallet",
      message: req.data,
      tabId: tabId,
      approved,
      timestamp: Date.now()
    })
    // setBusy(false)
    setTimeout(() => {
      setBusy(false)
      window.close() // 关闭弹窗
    }, 1000)
  }

  return (
    <div style={{ width: 360, maxWidth: "100vw", padding: 12, fontFamily: "system-ui, sans-serif" }}>
      {!req ? (
        <div style={{ padding: 12 }}>
          <h3 style={{ margin: "8px 0" }}>没有待处理的签名</h3>
          <div style={{ fontSize: 12, color: "#666" }}>当站点请求签名时，这里会显示确认内容。</div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 10, background: "#22c55e" }} />
            <div style={{ fontWeight: 600 }}>签名请求</div>
          </div>

          <div style={{ marginBottom: 8, fontSize: 12, color: "#555" }}>
            来源：<span style={{ fontFamily: "ui-monospace, monospace" }}>{req.origin || "未知"}</span>
          </div>
          <div style={{ marginBottom: 8, fontSize: 12, color: "#555" }}>
            账户：<span style={{ fontFamily: "ui-monospace, monospace" }}>{req.address || "-"}</span>
          </div>
          <div style={{ marginBottom: 8, fontSize: 12, color: "#555" }}>
            方法：
            <code style={{ padding: "1px 6px", borderRadius: 6, background: "#f1f5f9", marginLeft: 6 }}>
              {req.method}
            </code>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
            <button onClick={() => setMode(isTyped ? "json" : "auto")} disabled={(isTyped && mode === "json") || (!isTyped && mode === "auto")} style={tabBtnStyle((isTyped && mode === "json") || (!isTyped && mode === "auto"))}>
              {isTyped ? "JSON" : "自动"}
            </button>
            {!isTyped && (
              <>
                <button onClick={() => setMode("utf8")} disabled={mode === "utf8"} style={tabBtnStyle(mode === "utf8")}>UTF-8</button>
                <button onClick={() => setMode("hex")} disabled={mode === "hex"} style={tabBtnStyle(mode === "hex")}>Hex</button>
                <button onClick={() => setMode("json")} disabled={mode === "json"} style={tabBtnStyle(mode === "json")}>JSON</button>
              </>
            )}
          </div>

          {view}

          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", borderRadius: 8, padding: 8, fontSize: 12, marginTop: 8 }}>
            '仅在信任的网站上签名。签名可能用于授权或订单，请确认内容与来源。'
          </div>

          {error && (
            <div style={{ background: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: 8, padding: 8, fontSize: 12, marginTop: 8 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
            <button onClick={() => decide(false)} disabled={busy} style={btn(false)}>拒绝</button>
            <button onClick={() => decide(true)} disabled={busy} style={btn(true)}>{busy ? "签名中..." : "确认签名"}</button>
          </div>
        </>
      )}
    </div>
  )
}

const preStyle: React.CSSProperties = {
  margin: 0,
  padding: 8,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  maxHeight: 240,
  overflow: "auto",
  fontSize: 12,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  lineHeight: 1.5
}

const boxStyle: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 8,
  maxHeight: 240,
  overflow: "auto",
  fontSize: 13,
  lineHeight: 1.6
}

function tabBtnStyle(active: boolean): React.CSSProperties {
  return {
    appearance: "none",
    cursor: active ? "default" : "pointer",
    padding: "4px 8px",
    borderRadius: 8,
    border: active ? "1px solid #0ea5e9" : "1px solid #e2e8f0",
    background: active ? "#e0f2fe" : "#f8fafc",
    color: "#0f172a",
    fontSize: 12
  }
}

function btn(primary: boolean): React.CSSProperties {
  return {
    appearance: "none",
    cursor: "pointer",
    padding: "8px 12px",
    borderRadius: 8,
    border: "none",
    color: primary ? "white" : "#0f172a",
    background: primary ? "linear-gradient(135deg,#22c55e,#06b6d4)" : "#e2e8f0",
    fontWeight: 600
  }
}