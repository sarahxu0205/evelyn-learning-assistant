import { useEffect, useState } from "react"
import { Typography, Card, Descriptions, Tag, Divider, Button, Form, Input, Select, InputNumber, message } from "antd"
import { UserOutlined, ClockCircleOutlined, DollarOutlined, AimOutlined } from "@ant-design/icons"

const { Title, Paragraph } = Typography
const { Option } = Select

// 定义用户画像数据接口
interface UserProfileData {
  email?: string;
  learning_interests?: string[];
  skill_levels?: Record<string, string>;
  learning_time?: number;
  budget?: number;
  purpose?: string;
  interests?: string[];
  behavior_analysis?: {
    top_domains?: [string, number][];
    top_keywords?: [string, number][];
    total_duration?: number;
  };
}

// 定义表单值接口
interface ProfileFormValues {
  learning_time: number;
  budget: number;
  purpose: string;
  interests: string[];
}

export const UserProfile = () => {
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form] = Form.useForm<ProfileFormValues>()

  useEffect(() => {
    // 获取用户画像数据
    const fetchProfile = async () => {
      try {
        // 从本地存储获取用户ID
        chrome.storage.local.get(["userToken", "userId"], async (result) => {
          if (!result.userToken || !result.userId) {
            setLoading(false)
            return
          }
          
          const response = await fetch(`http://127.0.0.1:5000/api/user/${result.userId}/profile`, {
            headers: {
              "Authorization": `Bearer ${result.userToken}`
            }
          })
          
          if (!response.ok) {
            throw new Error("获取用户画像失败")
          }
          
          const data = await response.json() as UserProfileData
          setProfile(data)
          
          // 设置表单初始值
          form.setFieldsValue({
            learning_time: data.learning_time || 0,
            budget: data.budget || 0,
            purpose: data.purpose || '',
            interests: data.interests || []
          })
        })
      } catch (error) {
        console.error("获取用户画像失败", error)
        message.error("获取用户画像失败")
      } finally {
        setLoading(false)
      }
    }
    
    fetchProfile()
  }, [form])

  const handleSaveProfile = async (values: ProfileFormValues) => {
    try {
      setLoading(true)
      
      chrome.storage.local.get(["userToken", "userId"], async (result) => {
        if (!result.userToken || !result.userId) {
          message.error("请先登录")
          setLoading(false)
          return
        }
        
        const response = await fetch(`http://127.0.0.1:5000/api/user/${result.userId}/profile`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${result.userToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(values)
        })
        
        if (!response.ok) {
          throw new Error("更新用户画像失败")
        }
        
        const data = await response.json() as UserProfileData
        setProfile(data)
        message.success("用户画像更新成功")
        setEditing(false)
      })
    } catch (error) {
      console.error("更新用户画像失败", error)
      message.error("更新用户画像失败")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>加载中...</div>
  }

  if (!profile) {
    return (
      <div>
        <Title level={4}>用户画像</Title>
        <Paragraph>请先登录以查看您的用户画像</Paragraph>
      </div>
    )
  }

  const { email, learning_interests, skill_levels, learning_time, budget, purpose, behavior_analysis } = profile

  return (
    <div className="user-profile">
      <Title level={4}>用户画像</Title>
      
      {!editing ? (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Descriptions title="基本信息" column={1}>
              <Descriptions.Item label="邮箱">{email || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="学习时间">
                <ClockCircleOutlined /> {learning_time || 0} 小时/周
              </Descriptions.Item>
              <Descriptions.Item label="学习预算">
                <DollarOutlined /> ¥{budget || 0}
              </Descriptions.Item>
              <Descriptions.Item label="学习目的">
                <AimOutlined /> {purpose || '未设置'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
          
          <Card title="学习兴趣" style={{ marginBottom: 16 }}>
            {learning_interests && learning_interests.length > 0 ? (
              learning_interests.map((interest, index) => (
                <Tag key={index} color="blue" style={{ margin: '0 8px 8px 0' }}>
                  {interest}
                </Tag>
              ))
            ) : (
              <Paragraph>暂无学习兴趣数据</Paragraph>
            )}
          </Card>
          
          <Card title="技能水平" style={{ marginBottom: 16 }}>
            {skill_levels && Object.keys(skill_levels).length > 0 ? (
              Object.entries(skill_levels).map(([skill, level], index) => (
                <div key={index} style={{ marginBottom: 8 }}>
                  <span>{skill}: </span>
                  <Tag color={
                    level === "初级" ? "green" : 
                    level === "中级" ? "orange" : "red"
                  }>
                    {level}
                  </Tag>
                </div>
              ))
            ) : (
              <Paragraph>暂无技能水平数据</Paragraph>
            )}
          </Card>
          
          {behavior_analysis && (
            <Card title="行为分析">
              <Descriptions column={1}>
                <Descriptions.Item label="常访问网站">
                  {behavior_analysis.top_domains && behavior_analysis.top_domains.length > 0 ? (
                    behavior_analysis.top_domains.map(([domain, count], index) => (
                      <Tag key={index} color="purple" style={{ margin: '0 8px 8px 0' }}>
                        {domain} ({count}次)
                      </Tag>
                    ))
                  ) : (
                    <span>暂无数据</span>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="搜索关键词">
                  {behavior_analysis.top_keywords && behavior_analysis.top_keywords.length > 0 ? (
                    behavior_analysis.top_keywords.map(([keyword, count], index) => (
                      <Tag key={index} color="cyan" style={{ margin: '0 8px 8px 0' }}>
                        {keyword} ({count}次)
                      </Tag>
                    ))
                  ) : (
                    <span>暂无数据</span>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="总浏览时长">
                  {behavior_analysis.total_duration ? (
                    <>
                      {Math.floor((behavior_analysis.total_duration || 0) / 3600)}小时
                      {Math.floor(((behavior_analysis.total_duration || 0) % 3600) / 60)}分钟
                    </>
                  ) : (
                    <span>0小时0分钟</span>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}
          
          <Button 
            type="primary" 
            onClick={() => setEditing(true)} 
            style={{ marginTop: 16 }}
          >
            编辑用户画像
          </Button>
        </>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveProfile}
        >
          <Form.Item
            name="learning_time"
            label="每周学习时间（小时）"
            rules={[{ required: true, message: "请输入每周学习时间" }]}
          >
            <InputNumber min={0} max={168} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="budget"
            label="学习预算（元）"
            rules={[{ required: true, message: "请输入学习预算" }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="purpose"
            label="学习目的"
          >
            <Select placeholder="请选择学习目的">
              <Option value="就业">就业</Option>
              <Option value="兴趣">兴趣</Option>
              <Option value="考证">考证</Option>
              <Option value="升职加薪">升职加薪</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="interests"
            label="学习兴趣"
          >
            <Select mode="tags" placeholder="请输入学习兴趣，按回车键添加">
              <Option value="编程">编程</Option>
              <Option value="设计">设计</Option>
              <Option value="数据分析">数据分析</Option>
              <Option value="人工智能">人工智能</Option>
              <Option value="产品经理">产品经理</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{ marginRight: 8 }}>
              保存
            </Button>
            <Button onClick={() => setEditing(false)}>
              取消
            </Button>
          </Form.Item>
        </Form>
      )}
    </div>
  )
}