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

// 统一处理API请求的函数
const handleApiRequest = (url: string, method: string, headers: any, body: any, sendResponse: Function) => {
  fetch(url, {
    method: method,
    headers: headers,
    body: body ? JSON.stringify(body) : undefined,
    mode: "cors",
    credentials: "omit"
  })
  .then(response => response.json())
  .then(data => {
    sendResponse({success: true, data});
  })
  .catch(error => {
    console.error("API请求失败:", error);
    sendResponse({success: false, error: error.message});
  });
};

// 添加消息监听器来处理所有API请求
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 基础URL
  const baseUrl = "http://127.0.0.1:5000";
  
  // 根据消息类型处理不同的API请求
  switch (message.type) {
    case 'login':
      handleApiRequest(
        `${baseUrl}/api/auth/login`,
        "POST",
        {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        message.data,
        sendResponse
      );
      break;
      
    case 'getUserPaths':
      handleApiRequest(
        `${baseUrl}/api/learning-path`,
        "GET",
        {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${message.token}`
        },
        null,
        sendResponse
      );
      break;
      
    case 'createLearningPath':
      handleApiRequest(
        `${baseUrl}/api/learning-path`,
        "POST",
        {
          "Content-Type": "application/json",
          "Authorization": message.token ? `Bearer ${message.token}` : undefined
        },
        message.data,
        sendResponse
      );
      break;
      
    case 'getLearningPath':
      handleApiRequest(
        `${baseUrl}/api/learning-path/${message.pathId}`,
        "GET",
        {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${message.token}`
        },
        null,
        sendResponse
      );
      break;
      
    case 'updatePathCompletion':
      handleApiRequest(
        `${baseUrl}/api/learning-path/${message.pathId}/completion`,
        "PUT",
        {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${message.token}`
        },
        { completion_rate: message.completionRate },
        sendResponse
      );
      break;
      
    case 'recordBehavior':
      handleApiRequest(
        `${baseUrl}/api/user-behavior`,
        "POST",
        {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${message.token}`
        },
        message.data,
        sendResponse
      );
      break;
      
    case 'getUserBehaviorStats':
      handleApiRequest(
        `${baseUrl}/api/user-behavior-stats`,
        "GET",
        {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${message.token}`
        },
        null,
        sendResponse
      );
      break;
      
    case 'getNeedAnalysis':
      handleApiRequest(
        `${baseUrl}/api/need-analysis`,
        "POST",
        {
          "Content-Type": "application/json"
        },
        { goal: message.goal },
        sendResponse
      );
      break;
      
    case 'getLearningStats':
      handleApiRequest(
        `${baseUrl}/api/user-behavior-stats/stats`,
        "GET",
        {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${message.token}`
        },
        null,
        sendResponse
      );
      break;
      
    case 'getResources':
      handleApiRequest(
        `${baseUrl}/api/resources`,
        "GET",
        {
          "Content-Type": "application/json",
          "Authorization": message.token ? `Bearer ${message.token}` : undefined
        },
        null,
        sendResponse
      );
      break;
      
    // 在 switch 语句中添加新的 case
    case 'getCurrentTabInfo':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          sendResponse({
            url: tabs[0].url,
            title: tabs[0].title
          });
        } else {
          sendResponse({ error: "无法获取当前标签页信息" });
        }
      });
      return true; // 保持消息通道开放，以便异步发送响应
    case 'recordUserBehavior':
      handleApiRequest(
        `${baseUrl}/api/user-behavior`,
        "POST",
        {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${message.token}`
        },
        message.data,
        sendResponse
      );
      break;
  }
  
  // 返回true表示将异步发送响应
  return true;
});