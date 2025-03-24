import { useEffect } from "react"

const Popup = () => {
  useEffect(() => {
    // 立即关闭弹出窗口
    window.close();
    
    // 向当前标签页发送消息，打开侧边栏
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "toggleSidebar" });
      }
    });
  }, []);
  
  return null; // 不渲染任何内容
}

export default Popup