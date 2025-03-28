//import type { PlasmoMessaging } from "@plasmohq/messaging"

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
  console.log(`发送请求到: ${url}`, { method, headers, body });
  
  fetch(url, {
    method: method,
    headers: headers,
    body: body ? JSON.stringify(body) : undefined,
    mode: "cors",
    credentials: "omit"
  })
  .then(response => {
    console.log(`收到响应: ${response.status} ${response.statusText}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.text().then(text => {
      if (!text) {
        console.log('响应内容为空');
        return {};
      }
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('JSON解析错误:', e, '原始响应:', text);
        throw new Error('无效的JSON响应');
      }
    });
  })
  .then(data => {
    console.log('API请求成功:', data);
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
      
    // 添加 getLearningPathDetail 处理
    case 'getLearningPathDetail':
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
      break; // 保持消息通道开放，以便异步发送响应

    case 'recordUserBehavior':
    case 'recordUserBehaviorRetry':
      console.log('收到记录用户行为请求:', message.data);
      fetch(`${baseUrl}/api/user-behavior`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${message.token}`
        },
        body: JSON.stringify(message.data),
        mode: "cors",
        credentials: "omit"
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('行为记录API响应:', data);
        sendResponse({success: true, data});
      })
      .catch(error => {
        console.error("记录用户行为API请求失败:", error);
        sendResponse({success: false, error: error.message});
      });
      
      return true; // 保持消息通道开放，以便异步发送响应
      break;
      
      case 'getCurrentTabInfo':
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0]) {
            sendResponse({ 
              url: tabs[0].url, 
              title: tabs[0].title 
            });
          } else {
            sendResponse({ url: "", title: "" });
          }
        });
      break;

      case 'getUserProfile':
        const { userId, token } = message;
      
        // 发起API请求获取用户画像
        fetch(`${baseUrl}/api/user/${userId}/profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`获取用户画像失败: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          sendResponse({ success: true, data });
        })
        .catch(error => {
          console.error("获取用户画像出错:", error);
          sendResponse({ success: false, error: error.message });
        });
      break;

      case 'updateUserProfile':
        // 处理更新用户画像的消息   
        fetch(`${baseUrl}/api/user/${message.userId}/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${message.token}`
          },
          body: JSON.stringify(message.data)
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`更新用户画像失败: ${response.status}`);
           }
          return response.json();
        })
        .then(data => {
          sendResponse({ success: true, data });
        })
        .catch(error => {
          console.error('更新用户画像出错:', error);
          sendResponse({ success: false, error: error.message });
        });
      break;

      case 'updateLearningPathCompletion':
        // 处理更新学习路径完成率
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

      case 'detectFrustration':
        // 处理检测挫折的请求
        fetch(`${baseUrl}/api/learning-path/${message.pathId}/detect-frustration`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${message.token}`
          }
        })
        .then(response => response.json())
        .then(data => {
          sendResponse({ success: true, data });
        })
        .catch(error => {
          console.error('检测挫折失败:', error);
          sendResponse({ success: false, error: error.message || '检测挫折失败' });
        });
      break;

      case 'generateAlternativePath':
        // 处理生成备选路径的请求
        fetch(`${baseUrl}/api/learning-path/${message.pathId}/generate-alternative`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${message.token}`
          }
        })
        .then(response => response.json())
        .then(data => {
          sendResponse({ success: true, data });
        })
        .catch(error => {
          console.error('生成备选路径失败:', error);
          sendResponse({ success: false, error: error.message || '生成备选路径失败' });
        });
      break;

      case 'saveLearningPath':
        // 处理保存备选学习路径的请求
        fetch(`${baseUrl}/api/learning-path/${message.pathId}/save-alternative`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${message.token}`
          },
          body: JSON.stringify({ alternative_path_data: message.pathData })
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`保存备选路径失败: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('备选路径保存成功:', data);
          sendResponse({ success: true, data });
        })
        .catch(error => {
          console.error('保存备选路径失败:', error);
          sendResponse({ success: false, error: error.message || '保存备选路径失败' });
        });
      break;
  }
  
 
});

// 当标签页更新时，向内容脚本发送URL更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    chrome.tabs.sendMessage(tabId, {
      type: "updateCurrentUrl",
      url: changeInfo.url,
      title: tab.title || ""
    }).catch(() => {
      // 忽略错误，可能是内容脚本尚未加载
    });
  }
});