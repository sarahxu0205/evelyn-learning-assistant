import { useState, useEffect } from "react"
import { Typography, Card, Spin, Empty, Statistic, Row, Col, Progress } from "antd"
import { ClockCircleOutlined, GlobalOutlined } from "@ant-design/icons"
import { Column } from "@ant-design/charts"

const { Title, Paragraph } = Typography

interface WeeklyLearningTime {
  day: string
  minutes: number
}

interface DomainDistribution {
  domain: string
  percentage: number
}

interface LearningStatsData {
  totalLearningTime: number
  weeklyLearningTime: WeeklyLearningTime[]
  domainDistribution: DomainDistribution[]
}

export const LearningStats = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<LearningStatsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await new Promise<{userToken?: string}>((resolve) => {
          chrome.storage.local.get(["userToken"], resolve)
        })
        
        if (!result.userToken) {
          throw new Error("未登录")
        }
        
        // 使用消息传递方式发送请求
        chrome.runtime.sendMessage(
          {
            type: 'getLearningStats',
            token: result.userToken
          },
          (response) => {
            if (response && response.success) {
              setStats(response.data);
            } else {
              console.error("获取学习统计失败", response?.error);
              setError("获取学习统计失败，请稍后重试");
              
              // 使用模拟数据
              setStats({
                totalLearningTime: 1250, // 分钟
                weeklyLearningTime: [
                  { day: "周一", minutes: 120 },
                  { day: "周二", minutes: 90 },
                  { day: "周三", minutes: 180 },
                  { day: "周四", minutes: 60 },
                  { day: "周五", minutes: 150 },
                  { day: "周六", minutes: 200 },
                  { day: "周日", minutes: 150 }
                ],
                domainDistribution: [
                  { domain: "编程", percentage: 45 },
                  { domain: "数据分析", percentage: 30 },
                  { domain: "人工智能", percentage: 15 },
                  { domain: "其他", percentage: 10 }
                ]
              });
            }
            setLoading(false);
          }
        );
      } catch (error) {
        console.error("获取学习统计失败", error);
        setError("获取学习统计失败，请稍后重试");
        
        // 使用模拟数据
        setStats({
          totalLearningTime: 1250,
          weeklyLearningTime: [
            { day: "周一", minutes: 120 },
            { day: "周二", minutes: 90 },
            { day: "周三", minutes: 180 },
            { day: "周四", minutes: 60 },
            { day: "周五", minutes: 150 },
            { day: "周六", minutes: 200 },
            { day: "周日", minutes: 150 }
          ],
          domainDistribution: [
            { domain: "编程", percentage: 45 },
            { domain: "数据分析", percentage: 30 },
            { domain: "人工智能", percentage: 15 },
            { domain: "其他", percentage: 10 }
          ]
        });
        setLoading(false);
      }
    }
    
    fetchStats();
  }, []);
  
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }
  
  if (error || !stats) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Empty description={error || "暂无学习统计数据"} />
      </div>
    )
  }
  
  // 计算总学习时间的小时和分钟
  const hours = Math.floor(stats.totalLearningTime / 60)
  const minutes = stats.totalLearningTime % 60
  
  // 配置周学习时间柱状图
  const weeklyConfig = {
    data: stats.weeklyLearningTime,
    xField: 'day',
    yField: 'minutes',
    color: '#1890ff',
    label: {
      position: 'middle',
      style: {
        fill: '#FFFFFF',
        opacity: 0.6,
      },
    },
    meta: {
      minutes: {
        alias: '学习时间（分钟）',
      },
    },
  }
  
  return (
    <div className="learning-stats" style={{ padding: '16px' }}>
      <Title level={4} style={{ marginBottom: '24px', textAlign: 'center' }}>学习统计</Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card hoverable style={{ height: '100%', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: '#666' }}>总学习时间</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClockCircleOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '8px' }} />
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#1890ff' }}>{hours}</span>
              </div>
              <div style={{ fontSize: '18px', color: '#1890ff', marginTop: '4px' }}>
                小时 {minutes} 分钟
              </div>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card hoverable style={{ height: '100%', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: '#666' }}>本周学习天数</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GlobalOutlined style={{ fontSize: '24px', color: '#52c41a', marginRight: '8px' }} />
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#52c41a' }}>
                  {stats.weeklyLearningTime.filter(item => item.minutes > 0).length}
                </span>
              </div>
              <div style={{ fontSize: '18px', color: '#52c41a', marginTop: '4px' }}>
                天
              </div>
            </div>
          </Card>
        </Col>
      </Row>
      
      <Card 
        title={<span style={{ fontWeight: 'bold' }}>本周学习时间分布</span>} 
        style={{ marginBottom: 24, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        headStyle={{ borderBottom: '1px solid #f0f0f0', padding: '12px 16px' }}
        bodyStyle={{ padding: '16px' }}
      >
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {stats.weeklyLearningTime.map((item, index) => (
            <div key={index} style={{ marginBottom: index === stats.weeklyLearningTime.length - 1 ? 0 : 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 'bold' }}>{item.day}</span>
                <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{item.minutes} 分钟</span>
              </div>
              <Progress 
                percent={Math.round((item.minutes / Math.max(...stats.weeklyLearningTime.map(i => i.minutes))) * 100)} 
                status="active" 
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                strokeWidth={10}
                format={() => ''}
              />
            </div>
          ))}
        </div>
      </Card>
      
      <Card 
        title={<span style={{ fontWeight: 'bold' }}>学习领域分布</span>}
        style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        headStyle={{ borderBottom: '1px solid #f0f0f0', padding: '12px 16px' }}
        bodyStyle={{ padding: '16px' }}
      >
        {stats.domainDistribution.map((item, index) => (
          <div key={index} style={{ marginBottom: index === stats.domainDistribution.length - 1 ? 0 : 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontWeight: 'bold' }}>{item.domain}</span>
              <span style={{ color: '#722ed1', fontWeight: 'bold' }}>{item.percentage}%</span>
            </div>
            <Progress 
              percent={item.percentage} 
              status="active" 
              strokeColor={{
                from: '#722ed1',
                to: '#1890ff',
              }}
              strokeWidth={10}
            />
          </div>
        ))}
      </Card>
    </div>
  )
}