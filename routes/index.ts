import React, { memo, useEffect } from "react"
import { useRoutes, useNavigate } from "react-router-dom"
import { useRequest } from "ahooks"
import routes from "./config"
import { WalletStore } from "~store/WalletStore"

export const RenderRoutes = memo(() => {
  const nav = useNavigate()

  useEffect(() => {
    // 检查是否有钱包信息
    const wallet = localStorage.getItem("address")
    console.log("wallet", wallet)
    if (!wallet) {
      nav("/")
    } else {
      // 如果有钱包信息
      nav("/wallet")
    }
  }, [])

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