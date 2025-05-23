import { useState, useEffect } from "react"
import { Layout, Menu, Button, Avatar, Dropdown, message } from "antd"
import { UserOutlined, BookOutlined, BarChartOutlined, LogoutOutlined, IdcardOutlined } from "@ant-design/icons"
import { AuthModal } from "./components/AuthModal"
import LearningPathPage from "./pages/learning-path"
import LearningStatsPage from "./pages/learning-stats"
import UserProfilePage from "./pages/user-profile"
import "./style.css"

const { Header, Content } = Layout

const Sidebar = () => {
  const [currentPage, setCurrentPage] = useState("learning-path")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authModalVisible, setAuthModalVisible] = useState(false)
  
  useEffect(() => {
    // 检查用户是否已登录
    chrome.storage.local.get(["userToken"], (result) => {
      setIsLoggedIn(!!result.userToken)
    })
    
    // 添加显示登录模态框的事件监听器
    const handleShowLogin = () => {
      setAuthModalVisible(true)
    }
    
    // 添加监听 chrome.storage 变化的事件
    const handleStorageChange = (changes: any, namespace: string) => {
      if (namespace === 'local' && changes.userToken) {
        setIsLoggedIn(!!changes.userToken.newValue)
      }
    }
    
    window.addEventListener("evelyn:show-login", handleShowLogin)
    chrome.storage.onChanged.addListener(handleStorageChange)
    
    // 清理函数
    return () => {
      window.removeEventListener("evelyn:show-login", handleShowLogin)
      chrome.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [])
  
  const handleLogin = (success: boolean) => {
    if (success) {
      setIsLoggedIn(true)
      setAuthModalVisible(false)
    }
  }
  
  const handleLogout = () => {
    chrome.storage.local.remove(["userToken", "userId"], () => {
      setIsLoggedIn(false)
      message.success("已退出登录")
    })
  }
  
  const showLoginModal = () => {
    setAuthModalVisible(true)
  }
  
  const userMenu = (
    <Menu>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  )
  
  return (
    <Layout className="evelyn-sidebar-layout" style={{ height: '100vh', overflow: 'hidden', width: '100%' }}>
      <Header className="evelyn-sidebar-header" style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        padding: "0 16px",
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
        height: "64px",
        lineHeight: "64px"
      }}>
        <div style={{ fontWeight: "bold", fontSize: 18, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          Evelyn | 越学越懂你的AI导师
        </div>
        
        {isLoggedIn ? (
          <Dropdown overlay={userMenu} placement="bottomRight">
            <Avatar 
              style={{ backgroundColor: "#1890ff", cursor: "pointer" }} 
              icon={<UserOutlined />} 
            />
          </Dropdown>
        ) : (
          <Button 
            type="primary" 
            onClick={showLoginModal}
            className="evelyn-login-button"
          >
            登录/注册
          </Button>
        )}
      </Header>
      
      <Content className="evelyn-sidebar-content" style={{ padding: 0, overflow: "auto", height: "calc(100vh - 64px)" }}>
        <Menu
          mode="horizontal"
          selectedKeys={[currentPage]}
          onClick={({ key }) => setCurrentPage(key as string)}
          style={{ borderBottom: "1px solid #f0f0f0", display: "flex" }}
          className="evelyn-sidebar-menu"
        >
          <Menu.Item key="learning-path" icon={<BookOutlined />} style={{ 
            flex: 1, 
            textAlign: "center",
            position: "relative",
            borderBottom: "none" 
          }}>
            学习路径
          </Menu.Item>
          <Menu.Item key="learning-stats" icon={<BarChartOutlined />} style={{ 
            flex: 1, 
            textAlign: "center",
            position: "relative",
            borderBottom: "none"
          }}>
            学习统计
          </Menu.Item>
          <Menu.Item key="user-profile" icon={<IdcardOutlined />} style={{ 
            flex: 1, 
            textAlign: "center",
            position: "relative",
            borderBottom: "none"
          }}>
            我的画像
          </Menu.Item>
        </Menu>
        
        <div style={{ padding: '16px', overflowY: 'auto', height: 'calc(100% - 46px)' }} className="evelyn-sidebar-page-container">
          {currentPage === "learning-path" && <LearningPathPage />}
          {currentPage === "learning-stats" && <LearningStatsPage />}
          {currentPage === "user-profile" && <UserProfilePage />}
        </div>
      </Content>
      
      <AuthModal 
        visible={authModalVisible} 
        onClose={() => setAuthModalVisible(false)} 
        onLogin={handleLogin} 
      />
    </Layout>
  )
}

export default Sidebar