import React, { useEffect, useState } from "react"
import { Card, Typography, Tag, Progress, Divider, Spin, Empty, List, Statistic, Row, Col, Button, Space, Form, Input, Select, InputNumber, message, Modal } from "antd"
import { ClockCircleOutlined, BookOutlined, DollarOutlined, GlobalOutlined, TagsOutlined, EditOutlined } from "@ant-design/icons"

const { Title, Text } = Typography
const { Option } = Select

interface ProfileData {
  email: string;
  learning_interests: string[];
  skill_levels: Record<string, number>;
  learning_time: string;
  budget: string;
  behavior_analysis: {
    top_domains: [string, number][];
    top_keywords: [string, number][];
    total_duration: number;
    behavior_count: number;
  };
}

const UserProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [userId, setUserId] = useState<number | null>(null)
  const [userToken, setUserToken] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [form] = Form.useForm()
  const [editingInterests, setEditingInterests] = useState<string[]>([])
  const [newInterest, setNewInterest] = useState("")
  const [editingSkills, setEditingSkills] = useState<Record<string, number>>({})
  const [newSkill, setNewSkill] = useState("")
  const [newSkillLevel, setNewSkillLevel] = useState(50)

  useEffect(() => {
    // 获取用户信息
    chrome.storage.local.get(['userId', 'userToken'], (result) => {
      if (result.userId && result.userToken) {
        setUserId(result.userId)
        setUserToken(result.userToken)
        fetchUserProfile(result.userId, result.userToken)
      } else {
        setLoading(false)
        setError("请先登录以查看您的学习画像")
      }
    })
  }, [])

  // 修改为使用消息传递获取用户画像
  const fetchUserProfile = async (userId: number, token: string) => {
    try {
      setLoading(true)
      
      // 使用消息传递方式获取用户画像
      chrome.runtime.sendMessage(
        {
          type: 'getUserProfile',
          userId: userId,
          token: token
        },
        (response) => {
          if (response && response.success) {
            console.log('获取用户画像成功:', response.data)
            setProfile(response.data)
            setError("")
          } else {
            console.error('获取用户画像失败:', response?.error || '未知错误')
            setError(response?.error || "获取用户画像失败，请稍后再试")
          }
          setLoading(false)
        }
      )
    } catch (err) {
      console.error("获取用户画像出错:", err)
      setError("获取用户画像失败，请稍后再试")
      setLoading(false)
    }
  }

  // 初始化编辑表单数据
  useEffect(() => {
    if (profile && isEditing) {
      form.setFieldsValue({
        learning_time: profile.learning_time || '',
        budget: profile.budget || '',
      })
      setEditingInterests(profile.learning_interests || [])
      setEditingSkills(profile.skill_levels || {})
    }
  }, [profile, isEditing, form])

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      const updateData = {
        learning_time: parseInt(values.learning_time, 10), // 转换为整数
        budget: parseFloat(values.budget), // 转换为浮点数
        interests: editingInterests,
        skill_levels: editingSkills
      }

      // 使用消息传递方式更新用户画像
      chrome.runtime.sendMessage(
        {
          type: 'updateUserProfile',
          userId,
          token: userToken,
          data: updateData
        },
        (response) => {
          if (response && response.success) {
            message.success('用户画像更新成功')
            setIsEditing(false)
            // 重新获取用户画像数据
            fetchUserProfile(userId as number, userToken as string)
          } else {
            message.error(response?.error || '更新失败，请稍后再试')
          }
        }
      )
    } catch (err) {
      console.error('更新用户画像出错:', err)
      message.error('更新失败，请稍后再试')
    }
  }

  // 添加兴趣标签
  const handleAddInterest = () => {
    if (newInterest && !editingInterests.includes(newInterest)) {
      setEditingInterests([...editingInterests, newInterest])
      setNewInterest("")
    }
  }

  // 删除兴趣标签
  const handleRemoveInterest = (interest: string) => {
    setEditingInterests(editingInterests.filter(item => item !== interest))
  }

  // 添加技能
  const handleAddSkill = () => {
    if (newSkill && !Object.keys(editingSkills).includes(newSkill)) {
      setEditingSkills({
        ...editingSkills,
        [newSkill]: newSkillLevel
      })
      setNewSkill("")
      setNewSkillLevel(50)
    }
  }

  // 更新技能水平
  const handleSkillLevelChange = (skill: string, level: number) => {
    setEditingSkills({
      ...editingSkills,
      [skill]: level
    })
  }

  // 删除技能
  const handleRemoveSkill = (skill: string) => {
    const newSkills = { ...editingSkills }
    delete newSkills[skill]
    setEditingSkills(newSkills)
  }

  // 渲染编辑表单
  const renderEditForm = () => {
    return (
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          learning_time: profile?.learning_time ? String(profile.learning_time) : '',
          budget: profile?.budget ? String(profile.budget) : '',
        }}
      >
        <Card title="基本信息" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="learning_time"
                label="每周学习时间（小时）"
                rules={[{ required: true, message: '请输入每周学习时间' }]}
              >
                <InputNumber 
                  min={1} 
                  max={168} 
                  style={{ width: '100%' }} 
                  placeholder="请输入每周学习时间"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="budget"
                label="学习预算（元/月）"
                rules={[{ required: true, message: '请输入学习预算' }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="请输入学习预算"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="学习兴趣" style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 16 }}>
            {editingInterests.map((interest, index) => (
              <Tag 
                color="blue" 
                key={index} 
                style={{ margin: "4px" }}
                closable
                onClose={() => handleRemoveInterest(interest)}
              >
                {interest}
              </Tag>
            ))}
          </div>
          <Input.Group compact>
            <Input
              style={{ width: 'calc(100% - 100px)' }}
              placeholder="添加新的学习兴趣"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onPressEnter={handleAddInterest}
            />
            <Button type="primary" onClick={handleAddInterest}>添加</Button>
          </Input.Group>
        </Card>

        <Card title="技能水平" style={{ marginBottom: 16 }}>
          {Object.entries(editingSkills).map(([skill, level]) => (
            <div key={skill} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{skill}</Text>
                <Button 
                  type="text" 
                  danger 
                  size="small" 
                  onClick={() => handleRemoveSkill(skill)}
                >
                  删除
                </Button>
              </div>
              <Progress 
                percent={level} 
                status="active" 
                // 移除不支持的onChange属性
              />
              <InputNumber
                min={0}
                max={100}
                value={level}
                onChange={(value) => handleSkillLevelChange(skill, value as number)}
                style={{ width: 100 }}
              />
            </div>
          ))}
          <Input.Group compact style={{ marginTop: 16 }}>
            <Input
              style={{ width: 'calc(100% - 200px)' }}
              placeholder="添加新的技能"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
            />
            <InputNumber
              min={0}
              max={100}
              value={newSkillLevel}
              onChange={(value) => setNewSkillLevel(value as number)}
              style={{ width: 100 }}
            />
            <Button type="primary" onClick={handleAddSkill}>添加</Button>
          </Input.Group>
        </Card>

        <div style={{ textAlign: 'right', marginTop: 16 }}>
          <Space>
            <Button onClick={() => setIsEditing(false)}>取消</Button>
            <Button type="primary" htmlType="submit">保存</Button>
          </Space>
        </div>
      </Form>
    )
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载用户画像...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Empty description={error} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Empty description="暂无用户画像数据" />
      </div>
    )
  }

  return (
    <div className="user-profile-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24,
        borderBottom: '1px solid #f0f0f0',
        paddingBottom: 16
      }}>
        <Title level={4} style={{ margin: 0 }}>我的学习画像</Title>
        {!isEditing && (
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => setIsEditing(true)}
          >
            编辑画像
          </Button>
        )}
      </div>
      
      {isEditing ? (
        renderEditForm()
      ) : (
        <>
          <Card 
            title={<span style={{ fontWeight: 'bold' }}>基本信息</span>} 
            style={{ marginBottom: 16, borderRadius: '8px' }}
            headStyle={{ backgroundColor: '#f9f9f9' }}
          >
            <Row gutter={24}>
              <Col span={12}>
                <Statistic 
                  title={<span style={{ fontSize: '14px', color: '#666' }}>每周学习时间</span>}
                  value={profile.learning_time ? `${profile.learning_time}小时` : "未设置"} 
                  prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />} 
                  valueStyle={{ fontWeight: 'bold' }}
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title={<span style={{ fontSize: '14px', color: '#666' }}>学习预算</span>}
                  value={profile.budget ? `¥${profile.budget}/月` : "未设置"} 
                  precision={2}
                  prefix={<DollarOutlined style={{ color: '#52c41a' }} />} 
                  valueStyle={{ fontWeight: 'bold' }}
                />
              </Col>
            </Row>
          </Card>
          
          <Card 
            title={<span style={{ fontWeight: 'bold' }}>学习兴趣</span>} 
            style={{ marginBottom: 16, borderRadius: '8px' }}
            headStyle={{ backgroundColor: '#f9f9f9' }}
          >
            {profile.learning_interests && profile.learning_interests.length > 0 ? (
              <div>
                {profile.learning_interests.map((interest, index) => (
                  <Tag 
                    color="blue" 
                    key={index} 
                    style={{ margin: "4px", padding: '4px 8px', borderRadius: '4px' }}
                  >
                    {interest}
                  </Tag>
                ))}
              </div>
            ) : (
              <Empty description="暂无学习兴趣数据" />
            )}
          </Card>
          
          <Card 
            title={<span style={{ fontWeight: 'bold' }}>技能水平</span>} 
            style={{ marginBottom: 16, borderRadius: '8px' }}
            headStyle={{ backgroundColor: '#f9f9f9' }}
          >
            {profile.skill_levels && Object.keys(profile.skill_levels).length > 0 ? (
              <div>
                {Object.entries(profile.skill_levels).map(([skill, level]) => (
                  <div key={skill} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text strong>{skill}</Text>
                      <Text type="secondary">{level}%</Text>
                    </div>
                    <Progress 
                      percent={Number(level)} 
                      status="active" 
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="暂无技能水平数据" />
            )}
          </Card>
          
          <Card 
            title={<span style={{ fontWeight: 'bold' }}>浏览行为分析</span>} 
            style={{ borderRadius: '8px' }}
            headStyle={{ backgroundColor: '#f9f9f9' }}
          >
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
              <Statistic 
                title={<span style={{ fontSize: '14px', color: '#666' }}>总浏览时长</span>}
                value={profile.behavior_analysis.total_duration < 60 ? 
                  "不到1分钟" : 
                  `${Math.floor(profile.behavior_analysis.total_duration / 60)}分钟`} 
                prefix={<ClockCircleOutlined style={{ color: '#722ed1' }} />} 
                valueStyle={{ fontWeight: 'bold' }}
              />
            </div>
            
            <Divider orientation="left" style={{ margin: '16px 0', color: '#666', fontWeight: 'bold' }}>
              常访问网站
            </Divider>
            {profile.behavior_analysis.top_domains && profile.behavior_analysis.top_domains.length > 0 ? (
              <List
                size="small"
                dataSource={profile.behavior_analysis.top_domains}
                renderItem={([domain, count]) => (
                  <List.Item style={{ padding: '8px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <Text><GlobalOutlined style={{ marginRight: 8, color: '#1890ff' }} />{domain}</Text>
                      <Tag color="blue">{count} 次访问</Tag>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无网站访问数据" />
            )}
            
            <Divider orientation="left" style={{ margin: '16px 0', color: '#666', fontWeight: 'bold' }}>
              热门关键词
            </Divider>
            {profile.behavior_analysis.top_keywords && profile.behavior_analysis.top_keywords.length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                {profile.behavior_analysis.top_keywords.map(([keyword, count], index) => {
                  // 截断过长的关键词
                  const displayKeyword = keyword.length > 20 ? 
                    `${keyword.substring(0, 20)}...` : 
                    keyword;
                  
                  return (
                    <Tag 
                      color={['magenta', 'red', 'volcano', 'orange', 'gold'][index % 5]} 
                      key={index} 
                      style={{ 
                        margin: "4px", 
                        padding: '4px 8px', 
                        maxWidth: '100%', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        borderRadius: '4px'
                      }}
                      title={keyword}
                    >
                      {displayKeyword} ({count})
                    </Tag>
                  );
                })}
              </div>
            ) : (
              <Empty description="暂无关键词数据" />
            )}
          </Card>
        </>
      )}
    </div>
  )
}

export default UserProfilePage