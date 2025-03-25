import { useState, useEffect } from "react"
import { Input, Button, Typography, Card, Spin, message } from "antd"

const { TextArea } = Input
const { Title, Paragraph, Text } = Typography

interface LearningPathInputProps {
  onSubmit: (goal: string) => void
  loading: boolean
}

export const LearningPathInput = ({ onSubmit, loading }: LearningPathInputProps) => {
  const [goal, setGoal] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  // 检查用户是否已登录
  useEffect(() => {
    chrome.storage.local.get(["userToken"], (result) => {
      setIsLoggedIn(!!result.userToken)
    })
  }, [])
  
  const handleSubmit = () => {
    if (!goal.trim()) {
      return
    }
    
    // 检查用户是否已登录
    if (!isLoggedIn) {
      message.warning("请先登录后再生成学习路径")
      // 触发显示登录模态框
      const event = new CustomEvent("evelyn:show-login")
      window.dispatchEvent(event)
      return
    }
    
    // 清理输入内容，确保不包含特殊字符
    const cleanedGoal = goal.trim().replace(/[\r\n]+/g, ' ').replace(/"/g, "'");
    console.log("提交学习目标:", cleanedGoal);
    
    // 提交处理
    try {
      onSubmit(cleanedGoal);
    } catch (error) {
      console.error("提交学习目标时出错:", error);
      message.error("生成学习路径失败，请稍后重试");
    }
  }
  
  const examples = [
    "如何用6个月通过PMP认证",
    "零基础转行前端开发，预算5000元",
    "工作三年想转金融分析，预算2000元，每天能学1小时"
  ]
  
  return (
    <div className="learning-path-input" style={{ textAlign: 'left' }}>
      <Title level={4} style={{ textAlign: 'left', margin: '0 0 8px 0' }}>输入你的学习目标</Title>
      
      <Paragraph style={{ textAlign: 'left', margin: '0 0 16px 0' }}>
        请描述你想学习的内容、学习时间、预算等，AI将为你定制学习路径。
      </Paragraph>
      
      <TextArea
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="例如：零基础学习Python编程，每周能投入10小时，预算2000元"
        autoSize={{ minRows: 4, maxRows: 8 }}
        style={{ marginBottom: 16 }}
      />
      
      {/* 将Card替换为普通的灰色文本提示 */}
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">提示：包含预算信息可获得更精准的推荐哦~</Text>
        {/* 
        <div style={{ marginTop: 8 }}>
          <Text type="secondary">试试输入：</Text>
          <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
            {examples.map((example, index) => (
              <li key={index}>
                <Text type="secondary">{example}</Text>
              </li>
            ))}
          </ul>
        </div>
        */}
      </div>
      
      <Button 
        type="primary" 
        onClick={handleSubmit} 
        loading={loading}
        disabled={!goal.trim() || loading}
        block
      >
        {loading ? "生成学习路径中..." : "生成学习路径"}
      </Button>
    </div>
  )
}