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
    try {
      // 使用多种方式尝试获取当前URL
      const url = window.location.href || document.URL || document.documentURI || "";
      console.log("当前页面URL:", url);
      setCurrentUrl(url);
      setCurrentTitle(document.title || "");
      setStartTime(Date.now());
    } catch (error) {
      console.error("获取页面信息失败:", error);
      // 如果无法获取URL，可以尝试通过chrome API获取
      chrome.runtime.sendMessage(
        { type: "getCurrentTabInfo" },
        (response) => {
          if (response && response.url) {
            console.log("通过API获取的URL:", response.url);
            setCurrentUrl(response.url);
            setCurrentTitle(response.title || "");
          }
        }
      );
    }
    
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
      recordPageView()
    }
    
    window.addEventListener("beforeunload", handleBeforeUnload)
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      chrome.runtime.onMessage.removeListener(handleMessage)
      recordPageView()
    }
  }, [])
  
  // 记录页面访问
  const recordPageView = async () => {
    try {
      // 计算停留时间（秒）
      const duration = Math.floor((Date.now() - startTime) / 1000)
      
      // 如果停留时间小于5秒，不记录
      if (duration < 5) {
        return
      }
      
      // 获取搜索查询（如果有）
      let searchQuery = ""
      
      // 验证URL是否有效
      if (!currentUrl || typeof currentUrl !== 'string') {
        console.warn('当前URL无效:', currentUrl);
        return;
      } 
      
      try {
        const url = new URL(currentUrl);
        
        // 检查常见搜索引擎
        if (url.hostname.includes("google.com")) {
          searchQuery = url.searchParams.get("q") || ""
        } else if (url.hostname.includes("bing.com")) {
          searchQuery = url.searchParams.get("q") || ""
        } else if (url.hostname.includes("baidu.com")) {
          searchQuery = url.searchParams.get("wd") || ""
        }
      } catch (urlError) {
        console.error('URL解析失败:', urlError);
        return;
      }
      
      // 调用通用的记录行为函数
      recordBehavior('page_view', currentTitle, currentUrl);
    } catch (error) {
      console.error("记录页面访问失败", error)
    }
  }
  
  // 记录用户行为
  const recordBehavior = async (type: string, content: string, url?: string) => {
    try {
      // 检查 URL 是否有效
      let validUrl = '';
      if (url) {
        try {
          // 尝试构造 URL 对象来验证 URL 是否有效
          new URL(url);
          validUrl = url;
        } catch (e) {
          console.warn('无效的 URL:', url);
          // 如果 URL 无效，使用当前标签的 URL
          validUrl = currentUrl || window.location.href;
        }
      } else {
        // 如果没有提供 URL，使用当前标签的 URL
        validUrl = currentUrl || window.location.href;
      }
  
      // 获取用户令牌和 ID
      const { userToken, userId } = await new Promise<{userToken?: string, userId?: number}>((resolve) => {
        chrome.storage.local.get(['userToken', 'userId'], (result) => {
          resolve(result as {userToken?: string, userId?: number});
        });
      });
  
      if (!userToken || !userId) {
        console.warn('用户未登录，无法记录行为');
        return;
      }
  
      // 使用消息传递方式发送请求
      chrome.runtime.sendMessage(
        {
          type: 'recordUserBehavior',
          token: userToken,
          data: {
            user_id: userId,
            behavior_type: type,
            content: content,
            url: validUrl
          }
        },
        (response) => {
          if (response && response.success) {
            console.log('行为记录成功:', type);
          } else {
            console.error('记录行为失败:', response?.error);
          }
        }
      );
    } catch (error) {
      console.error('记录用户行为失败', error);
    }
  };
  
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