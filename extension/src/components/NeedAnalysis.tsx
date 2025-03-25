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
    <div className="need-analysis" style={{ padding: '0 16px' }}>
      <Title level={4} style={{ marginBottom: '16px', textAlign: 'center' }}>需求分析</Title>
      
      <Paragraph style={{ marginBottom: '16px', textAlign: 'center', color: '#666' }}>
        根据您的学习目标，我们分析出以下信息：
      </Paragraph>
      
      <Card 
        style={{ 
          marginBottom: 16, 
          borderRadius: '8px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)' 
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ 
                padding: '12px', 
                width: '120px', 
                fontWeight: 'bold',
                borderRight: '1px solid #f0f0f0',
                backgroundColor: '#fafafa',
                verticalAlign: 'middle'
              }}>
                <UserOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                学习领域
              </td>
              <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                <Tag color="blue" style={{ margin: 0, fontSize: '14px', padding: '4px 8px' }}>
                  {analysis.domain}
                </Tag>
              </td>
            </tr>
            
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ 
                padding: '12px', 
                fontWeight: 'bold',
                borderRight: '1px solid #f0f0f0',
                backgroundColor: '#fafafa',
                verticalAlign: 'middle'
              }}>
                <UserOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                学习类型
              </td>
              <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                <Tag color="green" style={{ margin: 0, fontSize: '14px', padding: '4px 8px' }}>
                  {analysis.learning_type}
                </Tag>
              </td>
            </tr>
            
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ 
                padding: '12px', 
                fontWeight: 'bold',
                borderRight: '1px solid #f0f0f0',
                backgroundColor: '#fafafa',
                verticalAlign: 'middle'
              }}>
                <UserOutlined style={{ marginRight: '8px', color: '#fa8c16' }} />
                基础水平
              </td>
              <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                <Tag color="orange" style={{ margin: 0, fontSize: '14px', padding: '4px 8px' }}>
                  {analysis.base_level}
                </Tag>
              </td>
            </tr>
            
            {analysis.learning_time && (
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ 
                  padding: '12px', 
                  fontWeight: 'bold',
                  borderRight: '1px solid #f0f0f0',
                  backgroundColor: '#fafafa',
                  verticalAlign: 'middle'
                }}>
                  <ClockCircleOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
                  学习时间
                </td>
                <td style={{ padding: '12px', verticalAlign: 'middle', fontSize: '14px' }}>
                  {analysis.learning_time}
                </td>
              </tr>
            )}
            
            {analysis.budget && (
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ 
                  padding: '12px', 
                  fontWeight: 'bold',
                  borderRight: '1px solid #f0f0f0',
                  backgroundColor: '#fafafa',
                  verticalAlign: 'middle'
                }}>
                  <DollarOutlined style={{ marginRight: '8px', color: '#eb2f96' }} />
                  学习预算
                </td>
                <td style={{ padding: '12px', verticalAlign: 'middle', fontSize: '14px' }}>
                  {analysis.budget}
                </td>
              </tr>
            )}
            
            {analysis.target_job && (
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ 
                  padding: '12px', 
                  fontWeight: 'bold',
                  borderRight: '1px solid #f0f0f0',
                  backgroundColor: '#fafafa',
                  verticalAlign: 'middle'
                }}>
                  <AimOutlined style={{ marginRight: '8px', color: '#f5222d' }} />
                  目标岗位
                </td>
                <td style={{ padding: '12px', verticalAlign: 'middle', fontSize: '14px' }}>
                  {analysis.target_job}
                </td>
              </tr>
            )}
            
            {analysis.implicit_needs && (
              <tr>
                <td style={{ 
                  padding: '12px', 
                  fontWeight: 'bold',
                  borderRight: '1px solid #f0f0f0',
                  backgroundColor: '#fafafa',
                  verticalAlign: 'middle'
                }}>
                  <BulbOutlined style={{ marginRight: '8px', color: '#faad14' }} />
                  隐性需求
                </td>
                <td style={{ padding: '12px', verticalAlign: 'middle', fontSize: '14px' }}>
                  {analysis.implicit_needs}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}