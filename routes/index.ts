import React, { memo } from "react"
import { useRoutes, useNavigate } from "react-router-dom"
import { useRequest } from "ahooks"
import routes from "./config"

export const RenderRoutes = memo(() => {
  // const nav = useNavigate()
  // useRequest(() => wallet.getAllWallets(), {
  //   onSuccess: (data) => {
  //     if (data?.length > 0) {
  //       nav("/home")
  //     }
  //   }
  // })
  const Route = useRoutes(routes)
  return Route
})