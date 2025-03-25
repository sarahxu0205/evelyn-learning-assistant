import { useState, useEffect } from "react"
import { Tabs, Divider, message, Button, List, Card, Empty } from "antd"
import { LearningPathInput } from "../components/LearningPathInput"
import { NeedAnalysis } from "../components/NeedAnalysis"
import { LearningPathDisplay } from "../components/LearningPathDisplay"
import { AuthModal } from "../components/AuthModal"

const { TabPane } = Tabs

const LearningPathPage = () => {
  const [loading, setLoading] = useState(false)
  const [goal, setGoal] = useState("")
  const [path, setPath] = useState(null)
  const [authModalVisible, setAuthModalVisible] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userPaths, setUserPaths] = useState([])
  const [loadingPaths, setLoadingPaths] = useState(false)
  const [activeKey, setActiveKey] = useState("create")
  
  // 检查用户是否已登录
  useEffect(() => {
    chrome.storage.local.get(['userToken', 'userId'], (result) => {
      const loggedIn = !!(result.userToken && result.userId);
      setIsLoggedIn(loggedIn);
      
      if (loggedIn && activeKey === "my-paths") {
        // 如果已登录且当前是"我的学习路径"标签，加载用户的学习路径
        //fetchUserPaths(result.userId, result.userToken);
      }
    });
  }, [activeKey]);
  
  // 获取用户的学习路径
  const fetchUserPaths = async (userId: string, token: string) => {
    setLoadingPaths(true);
    try {
      // 使用消息传递方式发送请求
      chrome.runtime.sendMessage(
        {
          type: 'getUserPaths',
          token: token
        },
        (response) => {
          if (response && response.success) {
            console.log("获取学习路径成功:", response.data);
            setUserPaths(response.data || []);
          } else {
            console.error("获取学习路径失败", response?.error);
            message.error("获取学习路径失败，请稍后重试");
          }
          setLoadingPaths(false);
        }
      );
    } catch (error) {
      console.error("获取学习路径失败", error);
      message.error("获取学习路径失败，请稍后重试");
      setLoadingPaths(false);
    }
  };
  
  const handleSubmit = async (inputGoal: string) => {
    setGoal(inputGoal)
    setLoading(true)
    
    try {
      // 获取用户令牌（如果已登录）
      chrome.storage.local.get(['userToken'], (result) => {
        // 使用消息传递方式发送请求
        chrome.runtime.sendMessage(
          {
            type: 'createLearningPath',
            data: { goal: inputGoal },
            token: result.userToken // 如果用户已登录，传递令牌
          },
          (response) => {
            if (response && response.success) {
              setPath(response.data);
            } else {
              console.error("生成学习路径失败", response?.error);
              message.error("生成学习路径失败，请稍后重试");
            }
            setLoading(false);
          }
        );
      });
    } catch (error) {
      console.error("生成学习路径失败", error);
      message.error("生成学习路径失败，请稍后重试");
      setLoading(false);
    }
  }
  
  const showLoginModal = () => {
    setAuthModalVisible(true)
  }
  
  const handleLogin = (success: boolean) => {
    if (success) {
      setAuthModalVisible(false);
      setIsLoggedIn(true);
      // 登录成功后加载用户的学习路径
      chrome.storage.local.get(['userId', 'userToken'], (result) => {
        if (result.userId && result.userToken) {
          fetchUserPaths(result.userId, result.userToken);
        }
      });
    }
  }
  
  // 渲染用户的学习路径列表
  const renderUserPaths = () => {
    if (loadingPaths) {
      return <div style={{ textAlign: 'center', padding: '50px 0' }}>加载中...</div>;
    }
    
    if (userPaths.length === 0) {
      return <Empty description="暂无学习路径" />;
    }
    
    return (
      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={userPaths}
        renderItem={(item: any) => {
          // 确保path_data是对象而不是字符串
          const pathData = typeof item.path_data === 'string' 
            ? JSON.parse(item.path_data) 
            : item.path_data;
          
          // 提取主要信息
          const description = pathData?.description || "暂无描述";
          const estimatedTime = pathData?.estimated_time || "未知";
          const title = item.title || item.goal;
          
          return (
            <List.Item>
              <Card 
                title={title}
                hoverable
                style={{ marginBottom: 16 }}
                headStyle={{ textAlign: 'left', fontWeight: 'bold', fontSize: '16px' }}
                bodyStyle={{ padding: '16px', textAlign: 'left' }}
              >
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', marginBottom: 8 }}>
                    <div style={{ width: 100, fontWeight: 'bold' }}>学习目标:</div>
                    <div style={{ flex: 1 }}>{item.goal}</div>
                  </div>
                  <div style={{ display: 'flex', marginBottom: 8 }}>
                    <div style={{ width: 100, fontWeight: 'bold' }}>描述:</div>
                    <div style={{ flex: 1 }}>{description}</div>
                  </div>
                  <div style={{ display: 'flex', marginBottom: 8 }}>
                    <div style={{ width: 100, fontWeight: 'bold' }}>预计时间:</div>
                    <div style={{ flex: 1 }}>{estimatedTime}</div>
                  </div>
                  <div style={{ display: 'flex', marginBottom: 8 }}>
                    <div style={{ width: 100, fontWeight: 'bold' }}>创建时间:</div>
                    <div style={{ flex: 1 }}>{new Date(item.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Button 
                    type="primary" 
                    onClick={() => {
                      // 构建完整的路径对象
                      const fullPath = {
                        ...item,
                        ...pathData,
                        id: item.id,
                        goal: item.goal,
                        created_at: item.created_at
                      };
                      
                      console.log("查看详情，路径数据:", fullPath);
                      setPath(fullPath);
                      // 切换到创建标签页以显示详情
                      setActiveKey("create");
                    }}
                  >
                    查看详情
                  </Button>
                </div>
              </Card>
            </List.Item>
          );
        }}
      />
    );
  };
  
  // 处理Tab切换
  const handleTabChange = (key: string) => {
    setActiveKey(key);
    
    if (key === "my-paths" && isLoggedIn) {
      // 如果切换到"我的学习路径"标签且已登录，重新加载数据
      chrome.storage.local.get(['userId', 'userToken'], (result) => {
        if (result.userId && result.userToken) {
          fetchUserPaths(result.userId, result.userToken);
        }
      });
    }
  };
  
  return (
    <div className="learning-path-page" style={{ padding: 16 }}>
      <Tabs defaultActiveKey="create" activeKey={activeKey} onChange={handleTabChange}>
        <TabPane tab="创建学习路径" key="create">
          <LearningPathInput onSubmit={handleSubmit} loading={loading} />
          
          {goal && !loading && (
            <>
              <Divider />
              <NeedAnalysis goal={goal} />
            </>
          )}
          
          {path && !loading && (
            <>
              <Divider />
              <LearningPathDisplay path={path} />
            </>
          )}
        </TabPane>
        
        <TabPane tab="我的学习路径" key="my-paths">
          {isLoggedIn ? (
            renderUserPaths()
          ) : (
            <div style={{ padding: "50px 0", textAlign: "center" }}>
              <p>请先登录查看您的学习路径</p>
              <Button 
                type="primary" 
                onClick={showLoginModal}
                style={{
                  marginTop: 16
                }}
              >
                登录/注册
              </Button>
            </div>
          )}
        </TabPane>
      </Tabs>
      
      <AuthModal 
        visible={authModalVisible} 
        onClose={() => setAuthModalVisible(false)} 
        onLogin={handleLogin} 
      />
    </div>
  )
}

export default LearningPathPage