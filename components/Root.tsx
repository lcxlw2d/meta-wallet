import React, { memo } from "react"
import { HashRouter } from "react-router-dom"
import { RenderRoutes } from "../routes"
import { Nested } from "./Nested"
import ErrorBoundary from "./ErrorBoundary"
import { walletProviders } from "~store"

export const Root = memo(() => {
  return (
    <Nested components={walletProviders}>
      <HashRouter>
        <ErrorBoundary>
          <RenderRoutes />
        </ErrorBoundary>
      </HashRouter>
    </Nested>
  )
})