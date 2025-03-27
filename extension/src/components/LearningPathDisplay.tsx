import { Steps, Collapse, Typography, Tag, List, Card, Button, Space, Slider, Progress, message } from "antd"
import { ClockCircleOutlined, DollarOutlined, BookOutlined, ToolOutlined, ReadOutlined, VideoCameraOutlined, CheckCircleOutlined } from "@ant-design/icons"
import { useState, useEffect } from "react"

const { Step } = Steps
const { Panel } = Collapse
const { Title, Paragraph, Text } = Typography

interface Resource {
  type: string
  name: string
  link: string
  description: string
  price: string
}

interface Stage {
  name: string
  description: string
  estimated_time: string
  resources: Resource[]
  goals: string[]
}

interface LearningPath {
  title: string
  description: string
  estimated_time: string
  stages: Stage[]
  id?: number  // 添加ID字段用于API调用
  completion_rate?: number  // 添加完成率字段
}

interface LearningPathDisplayProps {
  path: LearningPath
  onUpdatePath?: (updatedPath: LearningPath) => void  // 添加更新回调
}

export const LearningPathDisplay = ({ path, onUpdatePath }: LearningPathDisplayProps) => {
  const [completionRate, setCompletionRate] = useState<number>(path.completion_rate || 0)
  const [updating, setUpdating] = useState<boolean>(false)
  
  // 添加安全检查，确保path是有效对象
  useEffect(() => {
    if (!path || typeof path !== 'object') {
      console.error('无效的学习路径数据:', path);
      return;
    }
    
    // 当 path 变化时，更新 completionRate 状态
    setCompletionRate(path.completion_rate || 0);
  }, [path, path.id, path.completion_rate]);
  
  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "课程":
        return <VideoCameraOutlined />
      case "书籍":
        return <BookOutlined />
      case "工具":
        return <ToolOutlined />
      case "文章":
        return <ReadOutlined />
      default:
        return <BookOutlined />
    }
  }
  
  const getResourceTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "课程":
        return "blue"
      case "书籍":
        return "green"
      case "工具":
        return "purple"
      case "文章":
        return "orange"
      default:
        return "default"
    }
  }
  
  // 更新完成率的函数
  const updateCompletionRate = async () => {
    if (!path.id) {
      message.error('无法更新进度：缺少学习路径ID')
      return
    }
    
    setUpdating(true)
    
    try {
      // 获取用户令牌
      const userTokenResult = await new Promise<{userToken?: string}>((resolve) => {
        chrome.storage.local.get(['userToken'], (result) => {
          resolve(result)
        })
      })
      
      if (!userTokenResult.userToken) {
        message.error('请先登录后再更新学习进度')
        setUpdating(false)
        return
      }
      
      // 发送消息到后台脚本进行API调用
      chrome.runtime.sendMessage(
        {
          type: 'updateLearningPathCompletion',
          pathId: path.id,
          completionRate: completionRate,
          token: userTokenResult.userToken
        },
        (response) => {
          setUpdating(false)
          
          if (response && response.success) {
            message.success('学习进度已更新')
            
            // 更新本地路径数据
            if (onUpdatePath) {
              onUpdatePath({
                ...path,
                completion_rate: completionRate
              })
            }
          } else {
            message.error(response?.error || '更新失败，请稍后再试')
          }
        }
      )
    } catch (error) {
      console.error('更新学习进度出错:', error)
      message.error('更新失败，请稍后再试')
      setUpdating(false)
    }
  }
  
  // 计算当前阶段 - 添加安全检查
  const getCurrentStage = () => {
    if (!path || !path.stages || !Array.isArray(path.stages) || path.stages.length === 0) {
      return 0;
    }
    
    if (!path.completion_rate || path.completion_rate === 0) return 0
    if (path.completion_rate === 100) return path.stages.length - 1
    
    // 根据完成率计算当前阶段
    const stageIndex = Math.floor((path.completion_rate / 100) * path.stages.length)
    return Math.min(stageIndex, path.stages.length - 1)
  }
  
  // 添加安全检查，确保path和stages是有效的
  if (!path || !path.stages || !Array.isArray(path.stages)) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>无法显示学习路径，数据格式不正确</p>
      </div>
    );
  }
  
  return (
    <div className="learning-path-display" style={{ padding: '0 16px' }}>
      <Title level={4} style={{ marginBottom: '16px', textAlign: 'left' }}>{path.title || '未命名学习路径'}</Title>
      
      <Paragraph style={{ textAlign: 'left', marginBottom: '16px' }}>{path.description || '无描述'}</Paragraph>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Paragraph style={{ textAlign: 'left', marginBottom: 0 }}>
          <Tag icon={<ClockCircleOutlined />} color="blue">
            预计学习时间: {path.estimated_time}
          </Tag>
        </Paragraph>
        
        {/* 添加完成率显示 */}
        {path.id && (
          <Paragraph style={{ textAlign: 'left', marginBottom: 0 }}>
            <Tag icon={<CheckCircleOutlined />} color={completionRate === 100 ? "success" : "processing"}>
              完成进度: {completionRate}%
            </Tag>
          </Paragraph>
        )}
      </div>
      
      {/* 添加完成率更新组件 */}
      {path.id && (
        <Card 
          size="small" 
          title={<div style={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            <span>学习进度跟踪</span>
          </div>}
          style={{ 
            marginBottom: '24px', 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>
              当前进度: <span style={{ color: completionRate === 100 ? '#52c41a' : '#1890ff' }}>{completionRate}%</span>
            </Text>
          </div>
          
          <Progress 
            percent={completionRate} 
            status={completionRate === 100 ? "success" : "active"} 
            style={{ marginBottom: '16px' }}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          
          <div style={{ marginBottom: '24px' }}>
            <Slider
              value={completionRate}
              onChange={(value) => setCompletionRate(value)}
              min={0}
              max={100}
              step={5}
              marks={{
                0: '0%',
                25: '25%',
                50: '50%',
                75: '75%',
                100: '100%'
              }}
              tooltip={{
                formatter: (value) => `${value}%`
              }}
            />
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <Button 
              type="primary" 
              onClick={updateCompletionRate} 
              loading={updating}
              disabled={completionRate === path.completion_rate}
              icon={<CheckCircleOutlined />}
              style={{ width: '120px' }}
            >
              更新进度
            </Button>
          </div>
        </Card>
      )}
      
      <div style={{ marginBottom: '24px' }}>
        <Title level={5} style={{ marginBottom: '16px', textAlign: 'left' }}>学习阶段</Title>
        <Steps 
          direction="vertical" 
          current={getCurrentStage()}
          style={{ textAlign: 'left' }}
        >
          {path.stages.map((stage, index) => (
            <Step
              key={index}
              title={<Text strong>{stage.name || `阶段 ${index+1}`}</Text>}
              description={
                <div style={{ textAlign: 'left' }}>
                  <Paragraph style={{ margin: '8px 0' }}>{stage.description || '无描述'}</Paragraph>
                  <Tag icon={<ClockCircleOutlined />} color="blue">
                    预计时间: {stage.estimated_time || '未知'}
                  </Tag>
                </div>
              }
            />
          ))}
        </Steps>
      </div>
      
      <Title level={5} style={{ marginBottom: '16px', textAlign: 'left' }}>详细学习计划</Title>
      <Collapse defaultActiveKey={['0']} style={{ textAlign: 'left', marginBottom: '24px' }}>
        {path.stages.map((stage, index) => (
          <Panel 
            header={
              <Space>
                <Text strong>{`${stage.name || `阶段 ${index+1}`}`}</Text>
                <Tag icon={<ClockCircleOutlined />} color="blue">
                  {stage.estimated_time || '未知'}
                </Tag>
              </Space>
            } 
            key={index}
          >
            <Paragraph style={{ marginBottom: '16px' }}>{stage.description || '无描述'}</Paragraph>
            
            <Title level={5} style={{ marginBottom: '12px' }}>学习目标</Title>
            <List
              size="small"
              dataSource={stage.goals || []}
              renderItem={(goal, goalIndex) => (
                <List.Item style={{ padding: '8px 0', borderBottom: goalIndex === (stage.goals?.length || 0) - 1 ? 'none' : '1px solid #f0f0f0' }}>
                  <Text>{`${goalIndex + 1}. ${goal}`}</Text>
                </List.Item>
              )}
              style={{ marginBottom: '20px' }}
            />
            
            <Title level={5} style={{ marginBottom: '12px' }}>推荐资源</Title>
            <List
              grid={{ gutter: 16, column: 1 }}
              dataSource={stage.resources || []}
              renderItem={(resource) => (
                <List.Item>
                  <Card 
                    size="small" 
                    style={{ 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      borderRadius: '8px'
                    }}
                  >
                    <Card.Meta
                      title={
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                          <a 
                            href={resource.link || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ fontWeight: 'bold', color: '#1890ff' }}
                          >
                            {resource.name || '未命名资源'}
                          </a>
                          <Tag 
                            color={getResourceTypeColor(resource.type || '其他')} 
                            icon={getResourceIcon(resource.type || '其他')}
                          >
                            {resource.type || '其他'}
                          </Tag>
                          <Tag 
                            color={resource.price && !isNaN(parseInt(resource.price)) && parseInt(resource.price) > 0 ? "gold" : "green"} 
                            icon={<DollarOutlined />}
                          >
                            {resource.price && !isNaN(parseInt(resource.price)) && parseInt(resource.price) > 0 ? `¥${resource.price}` : '免费'}
                          </Tag>
                        </div>
                      }
                      description={
                        <Paragraph style={{ margin: '8px 0 0 0' }}>
                          {resource.description || '无描述'}
                        </Paragraph>
                      }
                    />
                  </Card>
                </List.Item>
              )}
            />
          </Panel>
        ))}
      </Collapse>
    </div>
  )
}
