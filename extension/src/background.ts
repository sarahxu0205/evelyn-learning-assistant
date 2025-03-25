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

// 添加一个消息监听器来处理登录请求
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'login') {
    fetch(`http://127.0.0.1:5000/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(message.data),
      mode: "cors",
      credentials: "omit"
    })
    .then(response => response.json())
    .then(data => {
      sendResponse({success: true, data});
    })
    .catch(error => {
      sendResponse({success: false, error: error.message});
    });
    return true; // 保持消息通道开放
  }
});