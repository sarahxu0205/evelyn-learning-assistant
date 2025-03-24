import { useState, useEffect } from "react"
import { createRoot } from "react-dom/client"
import { Drawer } from "antd"
import Sidebar from "../sidebar"
import type { PlasmoCSConfig } from "plasmo"

// 配置内容脚本
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false,
  run_at: "document_idle"
}

// 检查是否已经存在侧边栏
const checkIfSidebarExists = () => {
  return !!document.querySelector('.evelyn-sidebar-container');
}

// 主要内容组件 - 确保正确导出
const SidebarContent = () => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    // 监听来自后台脚本的消息
    const handleMessage = (
      message: { action: string }, 
      sender: chrome.runtime.MessageSender, 
      sendResponse: (response?: any) => void
    ) => {
      if (message.action === "toggleSidebar") {
        setVisible(prev => !prev);
      }
      return true;
    }
    
    chrome.runtime.onMessage.addListener(handleMessage);
    
    // 清理函数
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);
  
  return (
    <Drawer
      title={null}
      placement="right"
      onClose={() => setVisible(false)}
      open={visible}
      width={450}
      className="evelyn-drawer"
      closable={false}
      mask={false}
      style={{ position: 'absolute' }}
    >
      <Sidebar />
    </Drawer>
  );
}

// 确保只有当侧边栏不存在时才创建
const init = () => {
  if (!checkIfSidebarExists()) {
    // 创建容器
    const container = document.createElement("div");
    container.className = "evelyn-sidebar-container";
    document.body.appendChild(container);
    
    // 渲染组件
    const root = createRoot(container);
    root.render(<SidebarContent />);
  }
}

// 确保DOM加载完成后初始化
if (document.readyState === "complete") {
  init();
} else {
  window.addEventListener("load", init);
}

// 导出组件以供Plasmo使用
export default SidebarContent;