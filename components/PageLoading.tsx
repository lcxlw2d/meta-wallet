import { Skeleton } from "antd-mobile";
import React from "react"
import { memo } from "react"
export const PageLoading = memo(() => {
  return (
    <>
      <Skeleton.Title animated />
      <Skeleton.Paragraph lineCount={5} animated />
    </>
  )
})