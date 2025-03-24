import type { PlasmoMessaging } from "@plasmohq/messaging"

// 监听图标点击事件
chrome.action.onClicked.addListener((tab) => {
  // 确保tab.id存在
  if (tab.id) {
    // 向当前标签页发送消息，打开侧边栏
    chrome.tabs.sendMessage(tab.id, { action: "toggleSidebar" })
  }
})

// 在背景脚本中添加错误处理
try {
  // 如果有类似的连接代码，添加适当的错误处理
  if (chrome.runtime && chrome.runtime.connect) {
    // 确保在调用 disconnect 前检查连接是否存在
    const connection = chrome.runtime.connect({ name: "evelyn-connection" });
    
    // 添加错误处理
    connection.onDisconnect.addListener(() => {
      console.log("连接已断开");
    });
  }
} catch (error) {
  console.error("连接错误:", error);
}