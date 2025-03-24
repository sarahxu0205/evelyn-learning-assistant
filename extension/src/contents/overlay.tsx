import { useState, useEffect } from "react"
import { Button, Drawer } from "antd"
import { CloseOutlined, MenuOutlined } from "@ant-design/icons"
import Popup from "../popup"
import type { PlasmoCSConfig } from "plasmo"

// 配置内容脚本
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false
}

// 创建样式
export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = `
    #evelyn-overlay-container {
      position: fixed;
      top: 0;
      right: 0;
      z-index: 9999;
    }
    
    .evelyn-toggle-button {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    
    .evelyn-drawer {
      position: fixed;
      z-index: 10001;
    }
    
    .evelyn-drawer .ant-drawer-content-wrapper {
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
      width: 400px !important;
      height: 100vh !important;
    }
    
    .evelyn-drawer .ant-drawer-body {
      padding: 0;
      height: 100%;
      overflow: hidden;
    }
    
    .evelyn-drawer .ant-drawer-content {
      height: 100%;
    }
  `
  return style
}

const EvelynOverlay = () => {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentUrl, setCurrentUrl] = useState("")
  const [currentTitle, setCurrentTitle] = useState("")
  const [startTime, setStartTime] = useState(0)
  
  useEffect(() => {
    // 获取当前页面信息
    setCurrentUrl(window.location.href)
    setCurrentTitle(document.title)
    setStartTime(Date.now())
    
    // 监听来自后台脚本的消息
    const handleMessage = (message: { action: string }, sender: any, sendResponse: any) => {
      if (message.action === "toggleSidebar") {
        setVisible(prev => !prev)
      }
      return true
    }
    
    chrome.runtime.onMessage.addListener(handleMessage)
    
    // 监听页面关闭事件
    const handleBeforeUnload = () => {
      recordBehavior()
    }
    
    window.addEventListener("beforeunload", handleBeforeUnload)
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      chrome.runtime.onMessage.removeListener(handleMessage)
      recordBehavior()
    }
  }, [])
  
  // 记录用户行为
  const recordBehavior = async () => {
    try {
      // 计算停留时间（秒）
      const duration = Math.floor((Date.now() - startTime) / 1000)
      
      // 如果停留时间小于5秒，不记录
      if (duration < 5) {
        return
      }
      
      // 获取搜索查询（如果有）
      let searchQuery = ""
      const url = new URL(currentUrl)
      
      // 检查常见搜索引擎
      if (url.hostname.includes("google.com")) {
        searchQuery = url.searchParams.get("q") || ""
      } else if (url.hostname.includes("bing.com")) {
        searchQuery = url.searchParams.get("q") || ""
      } else if (url.hostname.includes("baidu.com")) {
        searchQuery = url.searchParams.get("wd") || ""
      }
      
      // 获取用户Token
      const result = await new Promise<{userToken?: string}>((resolve) => {
        chrome.storage.local.get(["userToken"], resolve)
      })
      
      // 如果用户未登录，不记录
      if (!result.userToken) {
        return
      }
      
      // 发送请求
      await fetch("http://localhost:5000/api/user-behavior", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${result.userToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: currentUrl,
          title: currentTitle,
          search_query: searchQuery,
          duration
        })
      })
    } catch (error) {
      console.error("记录用户行为失败", error)
    }
  }
  
  const showDrawer = () => {
    setVisible(true)
  }
  
  const closeDrawer = () => {
    setVisible(false)
  }
  
  return (
    <>
      {/* 侧边栏抽屉 */}
      <Drawer
        title={null}
        placement="right"
        onClose={closeDrawer}
        open={visible}
        width={400}
        className="evelyn-drawer"
        closable={false}
        bodyStyle={{ padding: 0 }}
        mask={false}
        getContainer={false}
      >
        <Popup />
      </Drawer>
      
      {/* 悬浮按钮 */}
      <Button
        className="evelyn-toggle-button"
        type="primary"
        shape="circle"
        icon={<MenuOutlined />}
        onClick={showDrawer}
      />
    </>
  )
}

export default EvelynOverlay