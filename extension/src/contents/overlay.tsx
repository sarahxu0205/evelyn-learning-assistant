// 移除不必要的注释
// import { useState, useEffect } from "react"
import React, { useState, useEffect } from "react" // 添加 React 导入
import { Button, Drawer } from "antd"
import { CloseOutlined, MenuOutlined } from "@ant-design/icons"
import Popup from "../popup"
import type { PlasmoCSConfig } from "plasmo"

// 配置内容脚本
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false,
  run_at: "document_start" // 尽早运行内容脚本
}

// 使用 React.FC 明确定义组件类型
const EvelynOverlay: React.FC = () => {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentUrl, setCurrentUrl] = useState("")
  const [currentTitle, setCurrentTitle] = useState("")
  const [startTime, setStartTime] = useState(0)
  
  // 改进获取当前活动标签的URL方法
  const getCurrentTabInfo = () => {
    return new Promise<{url: string, title: string}>((resolve) => {
      try {
        // 尝试使用 chrome.tabs API (这在内容脚本中通常不可用，但我们可以通过消息传递)
        chrome.runtime.sendMessage(
          { type: "getCurrentTabInfo" },
          (response) => {
            if (response && response.url) {
              console.log("通过消息获取的URL:", response.url);
              resolve({
                url: response.url,
                title: response.title || ""
              });
            } else {
              // 如果消息方法失败，尝试直接获取
              const directUrl = window.location.href;
              console.log("直接获取的URL:", directUrl);
              resolve({
                url: directUrl || "",
                title: document.title || ""
              });
            }
          }
        );
      } catch (error) {
        console.error("获取标签信息失败:", error);
        // 出错时返回空值
        resolve({ url: "", title: "" });
      }
    });
  };
  
  useEffect(() => {
    // 修改URL获取逻辑
    const initPageInfo = async () => {
      try {
        console.log("开始获取页面信息");
        
        // 首先尝试直接获取
        let url = window.location.href;
        let title = document.title || "";
        
        console.log("直接获取的URL:", url);
        
        // 如果直接获取失败或为空或是扩展页面，使用消息传递
        if (!url || url === "about:blank" || url.startsWith("chrome-extension://")) {
          console.log("直接获取URL失败或是扩展页面，尝试使用消息传递");
          const tabInfo = await getCurrentTabInfo();
          url = tabInfo.url;
          title = tabInfo.title;
        }
        
        console.log("最终获取的URL:", url);
        
        if (url && url !== "") {
          setCurrentUrl(url);
          setCurrentTitle(title);
          setStartTime(Date.now());
          
          // 页面信息获取成功后立即记录一次访问
          setTimeout(() => {
            recordPageView('page_load');
          }, 1000); // 延迟1秒，确保状态已更新
        } else {
          console.warn("无法获取有效的URL");
        }
      } catch (error) {
        console.error("获取页面信息失败:", error);
      }
    };
    
    // 初始化页面信息
    initPageInfo();
    
    // 每次侧边栏打开时重新获取URL
    const handleVisibilityChange = () => {
      if (!document.hidden && visible) {
        console.log("页面可见性改变，重新获取URL");
        initPageInfo();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // 添加消息监听器，用于更新URL
    const handleUrlUpdate = (message: any) => {
      if (message.type === "updateCurrentUrl" && message.url) {
        console.log("收到URL更新:", message.url);
        setCurrentUrl(message.url);
        setCurrentTitle(message.title || "");
      }
    };
    
    chrome.runtime.onMessage.addListener(handleUrlUpdate);
    
    // 监听来自后台脚本的消息
    const handleMessage = (message: { action: string }, sender: any, sendResponse: any) => {
      if (message.action === "toggleSidebar") {
        setVisible(prev => !prev);
        // 当侧边栏打开时，重新获取URL
        initPageInfo();
      }
      return true;
    };
    
    chrome.runtime.onMessage.addListener(handleMessage);
    
    // 监听页面关闭事件
    const handleBeforeUnload = () => {
      recordPageView('page_exit');
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    // 添加定期记录页面访问的功能
    const recordInterval = setInterval(() => {
      // 每5分钟记录一次页面访问
      recordPageView('page_active');
    }, 5 * 60 * 1000);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      chrome.runtime.onMessage.removeListener(handleMessage);
      chrome.runtime.onMessage.removeListener(handleUrlUpdate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(recordInterval);
      recordPageView('page_exit');
    };
  }, [visible]); // 添加 visible 作为依赖项
  
  // 记录页面访问
  const recordPageView = async (action: string = 'page_view') => {
    try {
      // 计算停留时间（秒）
      const duration = Math.floor((Date.now() - startTime) / 1000)
      
      // 如果停留时间小于5秒且不是页面加载事件，不记录
      if (duration < 5 && action !== 'page_load') {
        return
      }
      
      // 验证URL是否有效
      if (!currentUrl || typeof currentUrl !== 'string') {
        console.warn('当前URL无效:', currentUrl);
        return;
      } 

      try {
        // 尝试解析URL，验证其有效性
        new URL(currentUrl);
        
        // 修复：确保参数类型与函数定义匹配
        recordBehavior(action, currentTitle, duration, currentUrl);
      } catch (urlError) {
        console.error('URL解析失败:', urlError);
        return;
      }
    } catch (error) {
      console.error("记录页面访问失败", error)
    }
  }
  
  // 记录用户行为
  // 修复：修正参数类型定义，确保与调用方式匹配
  const recordBehavior = async (type: string, title: string, duration: number, url?: string) => {
    try {
      // 检查 URL 是否有效
      let validUrl = '';
      let search_query = '';

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

      if (validUrl.includes('?')) {
        // 如果 URL 包含查询参数，提取查询字符串
        const urlParts = validUrl.split('?');
        search_query = urlParts[1];
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
      
      console.log('准备记录行为:', {
        type,
        title,
        duration,
        url: validUrl,
        search_query: search_query,
        userId
      });
  
      // 使用消息传递方式发送请求
      chrome.runtime.sendMessage(
        {
          type: 'recordUserBehavior',
          token: userToken,
          data: {
            user_id: userId,
            behavior_type: type,
            title: title,
            url: validUrl,
            search_query: search_query,
            duration: duration, // 添加停留时间,
            timestamp: new Date().toISOString() // 添加时间戳
          }
        },
        (response) => {
          if (response && response.success) {
            console.log('行为记录成功:', type);
          } else {
            console.error('记录行为失败:', response?.error || '未知错误');
            
            // 如果失败，尝试重新发送一次
            setTimeout(() => {
              console.log('尝试重新发送行为记录');
              chrome.runtime.sendMessage(
                {
                  type: 'recordUserBehavior',
                  token: userToken,
                  data: {
                    user_id: userId,
                    behavior_type: type,
                    title: title,
                    url: validUrl,
                    search_query: search_query,
                    duration: duration, // 添加停留时间,
                    timestamp: new Date().toISOString()
                  }
                },
                (retryResponse) => {
                  if (retryResponse && retryResponse.success) {
                    console.log('重试后行为记录成功:', type);
                  } else {
                    console.error('重试后记录行为仍然失败:', retryResponse?.error || '未知错误');
                  }
                }
              );
            }, 1000);
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
    <React.Fragment>
      {/* 侧边栏抽屉 */}
      <Drawer
        title={null}
        placement="right"
        onClose={closeDrawer}
        open={visible}
        width={400}
        className="evelyn-drawer"
        closable={false}
        styles={{ body: { padding: 0, height: '100%', overflow: 'hidden' } }}
        mask={false}
        getContainer={false}
      >
        <Popup />
      </Drawer>
      
      {/* 悬浮按钮 
      <Button
        className="evelyn-toggle-button"
        type="primary"
        shape="circle"
        icon={<MenuOutlined />}
        onClick={showDrawer}
      />
      */}
    </React.Fragment>
  )
}

// 确保正确导出组件
export default EvelynOverlay;