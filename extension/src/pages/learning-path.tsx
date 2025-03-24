import { useState } from "react"
import { Tabs, Divider, message, Button } from "antd"
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
  
  const handleSubmit = async (inputGoal: string) => {
    setGoal(inputGoal)
    setLoading(true)
    
    try {
      const response = await fetch("http://127.0.0.1:5000/api/learning-path", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ goal: inputGoal })
      })
      
      if (!response.ok) {
        throw new Error("生成学习路径失败")
      }
      
      const data = await response.json()
      setPath(data)
    } catch (error) {
      console.error("生成学习路径失败", error)
      message.error("生成学习路径失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }
  
  const showLoginModal = () => {
    setAuthModalVisible(true)
  }
  
  const handleLogin = (success: boolean) => {
    if (success) {
      setAuthModalVisible(false)
      // 登录成功后可以加载用户的学习路径
    }
  }
  
  return (
    <div className="learning-path-page" style={{ padding: 16 }}>
      <Tabs defaultActiveKey="create">
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