import React, { memo, useEffect } from "react"
import { RenderRoutes } from "../routes"
import { Nested } from "./Nested"
import ErrorBoundary from "./ErrorBoundary"
import { walletProviders } from "~store"
import { HashRouter, Routes, Route, useNavigate } from "react-router-dom"

function BootstrapNavigator() {
  const navigate = useNavigate()
  useEffect(() => {
    chrome.storage.local.get("popupIntent").then(({ popupIntent }) => {
      console.log(popupIntent, '???')
      if (popupIntent?.route) {
        navigate(popupIntent.route + (popupIntent.search || ""))
        chrome.storage.local.remove("popupIntent")
      }
    })
  }, [navigate])
  return null
}

export const Root = memo(() => {
  return (
    <Nested components={walletProviders}>
      <HashRouter>
        <ErrorBoundary>
          <BootstrapNavigator />
          <RenderRoutes />
        </ErrorBoundary>
      </HashRouter>
    </Nested>
  )
})