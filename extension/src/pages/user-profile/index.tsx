import React, { useEffect, useState } from "react"
import { Card, Typography, Tag, Progress, Divider, Spin, Empty, List, Statistic, Row, Col } from "antd"
import { ClockCircleOutlined, BookOutlined, DollarOutlined, GlobalOutlined, TagsOutlined } from "@ant-design/icons"

const { Title, Text } = Typography

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
    <div>
      <Title level={4}>我的学习画像</Title>
      
      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Statistic 
              title="学习时间偏好" 
              value={profile.learning_time || "未设置"} 
              prefix={<ClockCircleOutlined />} 
            />
          </Col>
          <Col span={12}>
            <Statistic 
              title="学习预算" 
              value={profile.budget || "未设置"} 
              prefix={<DollarOutlined />} 
            />
          </Col>
        </Row>
      </Card>
      
      <Card title="学习兴趣" style={{ marginBottom: 16 }}>
        {profile.learning_interests && profile.learning_interests.length > 0 ? (
          <div>
            {profile.learning_interests.map((interest, index) => (
              <Tag color="blue" key={index} style={{ margin: "4px" }}>
                {interest}
              </Tag>
            ))}
          </div>
        ) : (
          <Empty description="暂无学习兴趣数据" />
        )}
      </Card>
      
      <Card title="技能水平" style={{ marginBottom: 16 }}>
        {profile.skill_levels && Object.keys(profile.skill_levels).length > 0 ? (
          <div>
            {Object.entries(profile.skill_levels).map(([skill, level]) => (
              <div key={skill} style={{ marginBottom: 12 }}>
                <Text>{skill}</Text>
                <Progress percent={Number(level)} status="active" />
              </div>
            ))}
          </div>
        ) : (
          <Empty description="暂无技能水平数据" />
        )}
      </Card>
      
      <Card title="浏览行为分析">
        <div style={{ marginBottom: 16 }}>
          <Statistic 
            title="总浏览时长" 
            value={`${Math.floor(profile.behavior_analysis.total_duration / 60)}分钟`} 
            prefix={<ClockCircleOutlined />} 
          />
        </div>
        
        <Divider orientation="left">常访问网站</Divider>
        {profile.behavior_analysis.top_domains.length > 0 ? (
          <List
            size="small"
            dataSource={profile.behavior_analysis.top_domains}
            renderItem={(item) => (
              <List.Item>
                <GlobalOutlined style={{ marginRight: 8 }} /> {item[0]} 
                <span style={{ marginLeft: 8, color: "#999" }}>({item[1]}次)</span>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无网站访问数据" />
        )}
        
        <Divider orientation="left">热门关键词</Divider>
        {profile.behavior_analysis.top_keywords.length > 0 ? (
          <div>
            {profile.behavior_analysis.top_keywords.map((item, index) => (
              <Tag color="green" key={index} style={{ margin: "4px" }}>
                <TagsOutlined /> {item[0]} ({item[1]})
              </Tag>
            ))}
          </div>
        ) : (
          <Empty description="暂无关键词数据" />
        )}
      </Card>
    </div>
  )
}

export default UserProfilePage