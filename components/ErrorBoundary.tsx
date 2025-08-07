import React from 'react'
import { Button, Result, message } from 'antd'

class ErrorBoundary extends React.Component {
  state = { hasError: false }
  static getDerivedStateFromError(error: any) {
    return { hasError: true }
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="系统异常"
          subTitle="系统异常，请稍后重试"
          extra={[
            <Button type="primary" onClick={() => { message.success("上报成功") }}>
              上报错误
            </Button>,
            <Button key="buy" onClick={() => {
              window.location.reload()
            }}>刷新重试</Button>
          ]}>
        </Result>
      )
    }
    // @ts-ignore    
    return this.props.children
  }
}

export default ErrorBoundary