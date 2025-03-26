import { Steps, Collapse, Typography, Tag, List, Card, Button, Space } from "antd"
import { ClockCircleOutlined, DollarOutlined, BookOutlined, ToolOutlined, ReadOutlined, VideoCameraOutlined } from "@ant-design/icons"

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
}

interface LearningPathDisplayProps {
  path: LearningPath
}

export const LearningPathDisplay = ({ path }: LearningPathDisplayProps) => {
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
  
  return (
    <div className="learning-path-display" style={{ padding: '0 16px' }}>
      <Title level={4} style={{ marginBottom: '16px', textAlign: 'left' }}>{path.title}</Title>
      
      <Paragraph style={{ textAlign: 'left', marginBottom: '16px' }}>{path.description}</Paragraph>
      
      <Paragraph style={{ textAlign: 'left', marginBottom: '24px' }}>
        <Tag icon={<ClockCircleOutlined />} color="blue">
          预计学习时间: {path.estimated_time}
        </Tag>
      </Paragraph>
      
      <div style={{ marginBottom: '24px' }}>
        <Title level={5} style={{ marginBottom: '16px', textAlign: 'left' }}>学习阶段</Title>
        <Steps 
          direction="vertical" 
          current={0}
          style={{ textAlign: 'left' }}
        >
          {path.stages.map((stage, index) => (
            <Step
              key={index}
              title={<Text strong>{stage.name}</Text>}
              description={
                <div style={{ textAlign: 'left' }}>
                  <Paragraph style={{ margin: '8px 0' }}>{stage.description}</Paragraph>
                  <Tag icon={<ClockCircleOutlined />} color="blue">
                    预计时间: {stage.estimated_time}
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
                <Text strong>{`阶段${index+1}：${stage.name}`}</Text>
                <Tag icon={<ClockCircleOutlined />} color="blue">
                  {stage.estimated_time}
                </Tag>
              </Space>
            } 
            key={index}
          >
            <Paragraph style={{ marginBottom: '16px' }}>{stage.description}</Paragraph>
            
            <Title level={5} style={{ marginBottom: '12px' }}>学习目标</Title>
            <List
              size="small"
              dataSource={stage.goals}
              renderItem={(goal, goalIndex) => (
                <List.Item style={{ padding: '8px 0', borderBottom: goalIndex === stage.goals.length - 1 ? 'none' : '1px solid #f0f0f0' }}>
                  <Text>{`${goalIndex + 1}. ${goal}`}</Text>
                </List.Item>
              )}
              style={{ marginBottom: '20px' }}
            />
            
            <Title level={5} style={{ marginBottom: '12px' }}>推荐资源</Title>
            <List
              grid={{ gutter: 16, column: 1 }}
              dataSource={stage.resources}
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
                            href={resource.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ fontWeight: 'bold', color: '#1890ff' }}
                          >
                            {resource.name}
                          </a>
                          <Tag 
                            color={getResourceTypeColor(resource.type)} 
                            icon={getResourceIcon(resource.type)}
                          >
                            {resource.type}
                          </Tag>
                          <Tag 
                            color={parseInt(resource.price) > 0 ? "gold" : "green"} 
                            icon={<DollarOutlined />}
                          >
                            {parseInt(resource.price) > 0 ? `¥${resource.price}` : '免费'}
                          </Tag>
                        </div>
                      }
                      description={
                        <Paragraph style={{ margin: '8px 0 0 0' }}>
                          {resource.description}
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