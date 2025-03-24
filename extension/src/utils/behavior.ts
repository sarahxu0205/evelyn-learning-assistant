// ... 现有代码 ...

// 记录用户行为的函数
export const recordBehavior = async (type: string, content: string, url?: string) => {
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
        validUrl = window.location.href;
      }
    } else {
      // 如果没有提供 URL，使用当前标签的 URL
      validUrl = window.location.href;
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

    // 发送请求记录行为
    const response = await fetch('http://127.0.0.1:5000/api/user-behavior', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        user_id: userId,
        behavior_type: type,
        content: content,
        url: validUrl
      })
    });

    if (!response.ok) {
      throw new Error(`记录行为失败: ${response.status}`);
    }

    console.log('行为记录成功:', type);
  } catch (error) {
    console.error('记录用户行为失败', error);
  }
};

// ... 现有代码 ...