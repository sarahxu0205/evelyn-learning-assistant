import { useState, useEffect } from "react"
import { Typography, Card, Spin, Empty, Tag, Descriptions } from "antd"
import { UserOutlined, ClockCircleOutlined, DollarOutlined, AimOutlined, BulbOutlined } from "@ant-design/icons"

const { Title, Paragraph } = Typography

interface NeedAnalysisData {
  domain: string
  learning_type: string
  base_level: string
  learning_time: string
  budget: string
  target_job: string
  implicit_needs: string
}

interface NeedAnalysisProps {
  goal: string
}

export const NeedAnalysis = ({ goal }: NeedAnalysisProps) => {
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState<NeedAnalysisData | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        // 使用消息传递方式发送请求
        chrome.runtime.sendMessage(
          {
            type: 'getNeedAnalysis',
            goal: goal
          },
          (response) => {
            if (response && response.success) {
              setAnalysis(response.data);
            } else {
              console.error("分析学习需求失败", response?.error);
              setError("分析学习需求失败，请稍后重试");
            }
            setLoading(false);
          }
        );
      } catch (error) {
        console.error("分析学习需求失败", error);
        setError("分析学习需求失败，请稍后重试");
        setLoading(false);
      }
    }
    
    if (goal) {
      fetchAnalysis();
    }
  }, [goal]);
  
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Spin size="large" tip="分析中..." />
      </div>
    )
  }
  
  if (error || !analysis) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Empty description={error || "暂无分析结果"} />
      </div>
    )
  }
  
  return (
    <div className="need-analysis">
      <Title level={4}>需求分析</Title>
      
      <Paragraph>
        根据您的学习目标，我们分析出以下信息：
      </Paragraph>
      
      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item 
            label={<span><UserOutlined /> 学习领域</span>}
            labelStyle={{ fontWeight: 'bold' }}
          >
            <Tag color="blue">{analysis.domain}</Tag>
          </Descriptions.Item>
          
          <Descriptions.Item 
            label={<span><UserOutlined /> 学习类型</span>}
            labelStyle={{ fontWeight: 'bold' }}
          >
            <Tag color="green">{analysis.learning_type}</Tag>
          </Descriptions.Item>
          
          <Descriptions.Item 
            label={<span><UserOutlined /> 基础水平</span>}
            labelStyle={{ fontWeight: 'bold' }}
          >
            <Tag color="orange">{analysis.base_level}</Tag>
          </Descriptions.Item>
          
          {analysis.learning_time && (
            <Descriptions.Item 
              label={<span><ClockCircleOutlined /> 学习时间</span>}
              labelStyle={{ fontWeight: 'bold' }}
            >
              {analysis.learning_time}
            </Descriptions.Item>
          )}
          
          {analysis.budget && (
            <Descriptions.Item 
              label={<span><DollarOutlined /> 学习预算</span>}
              labelStyle={{ fontWeight: 'bold' }}
            >
              {analysis.budget}
            </Descriptions.Item>
          )}
          
          {analysis.target_job && (
            <Descriptions.Item 
              label={<span><AimOutlined /> 目标岗位</span>}
              labelStyle={{ fontWeight: 'bold' }}
            >
              {analysis.target_job}
            </Descriptions.Item>
          )}
          
          {analysis.implicit_needs && (
            <Descriptions.Item 
              label={<span><BulbOutlined /> 隐性需求</span>}
              labelStyle={{ fontWeight: 'bold' }}
            >
              {analysis.implicit_needs}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    </div>
  )
}