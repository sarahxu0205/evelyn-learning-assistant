import { Steps, Collapse, Typography, Tag, List, Card, Button } from "antd"
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
    <div className="learning-path-display">
      <Title level={4}>{path.title}</Title>
      
      <Paragraph>{path.description}</Paragraph>
      
      <Paragraph>
        <Tag icon={<ClockCircleOutlined />} color="blue">
          预计学习时间: {path.estimated_time}
        </Tag>
      </Paragraph>
      
      <Steps 
        direction="vertical" 
        current={0}
        style={{ marginBottom: 16 }}
      >
        {path.stages.map((stage, index) => (
          <Step
            key={index}
            title={stage.name}
            description={
              <div>
                <Paragraph>{stage.description}</Paragraph>
                <Tag icon={<ClockCircleOutlined />} color="blue">
                  预计时间: {stage.estimated_time}
                </Tag>
              </div>
            }
          />
        ))}
      </Steps>
      
      <Collapse defaultActiveKey={['0']}>
        {path.stages.map((stage, index) => (
          <Panel 
            header={
              <div>
                <Text strong>{stage.name}</Text>
                <Tag style={{ marginLeft: 8 }} icon={<ClockCircleOutlined />} color="blue">
                  {stage.estimated_time}
                </Tag>
              </div>
            } 
            key={index}
          >
            <Paragraph>{stage.description}</Paragraph>
            
            <Title level={5}>学习目标</Title>
            <List
              size="small"
              dataSource={stage.goals}
              renderItem={(goal) => (
                <List.Item>
                  <Text>{goal}</Text>
                </List.Item>
              )}
              style={{ marginBottom: 16 }}
            />
            
            <Title level={5}>推荐资源</Title>
            <List
              grid={{ gutter: 16, column: 1 }}
              dataSource={stage.resources}
              renderItem={(resource) => (
                <List.Item>
                  <Card size="small">
                    <Card.Meta
                      title={
                        <div>
                          <a href={resource.link} target="_blank" rel="noopener noreferrer">
                            {resource.name}
                          </a>
                          <Tag 
                            color={getResourceTypeColor(resource.type)} 
                            style={{ marginLeft: 8 }}
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
                      description={resource.description}
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