import { useState, useEffect } from "react"
import { Tabs, message,Button } from "antd"
import { LearningStats } from "../components/LearningStats"
import { AuthModal } from "../components/AuthModal"

const { TabPane } = Tabs

const LearningStatsPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authModalVisible, setAuthModalVisible] = useState(false)
  
  useEffect(() => {
    // 检查用户是否已登录
    chrome.storage.local.get(["userToken"], (result) => {
      setIsLoggedIn(!!result.userToken)
    })
  }, [])
  
  const handleLogin = (success: boolean) => {
    if (success) {
      setIsLoggedIn(true)
      setAuthModalVisible(false)
    }
  }
  
  const showLoginModal = () => {
    setAuthModalVisible(true)
  }
  
  return (
    <div className="learning-stats-page" style={{ padding: 16 }}>
      <Tabs defaultActiveKey="stats">
        <TabPane tab="学习统计" key="stats">
          {isLoggedIn ? (
            <LearningStats />
          ) : (
            <div style={{ padding: "50px 0", textAlign: "center" }}>
              <p>请先登录查看您的学习统计</p>
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

export default LearningStatsPage