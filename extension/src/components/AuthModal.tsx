import { useState, useEffect } from "react"
import { Form, Input, Button, message } from "antd"

interface AuthModalProps {
  visible: boolean
  onClose: () => void
  onLogin: (success: boolean) => void
}

export const AuthModal = ({ visible, onClose, onLogin }: AuthModalProps) => {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  
  // 当模态框显示或隐藏时重置表单
  useEffect(() => {
    if (visible) {
      form.resetFields()
    }
  }, [visible, form])
  
  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      setLoading(true)
      console.log("开始登录请求，参数:", values)
      
      // 定义API地址
      let response = await fetch(`http://127.0.0.1:5000/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(values),
        mode: "cors",
        credentials: "omit"
      })
      
      console.log("收到响应:", response.status, response.statusText)
      
      // 只有在响应成功时才尝试解析JSON
      if (response.ok) {
        let data = await response.json()
        console.log("响应数据:", data)
        
        // 直接保存用户信息，不使用回调
        try {
          // 保存用户信息到本地存储
          await new Promise<void>((resolve) => {
            chrome.storage.local.set({
              userToken: data.token,
              userId: data.user_id
            }, () => {
              console.log("用户信息已保存到本地存储")
              resolve();
            });
          });
          
          console.log("准备关闭弹窗...");
          // 强制执行关闭操作
          onClose();
          console.log("弹窗已关闭，准备通知登录成功...");
          onLogin(true);
          console.log("已通知登录成功");
          
          // 显示成功消息
          message.success(data.message || "登录成功123");
          
          // 重置表单
          form.resetFields();
        } catch (storageError) {
          console.error("保存用户信息失败", storageError);
        }
      } else {
        // 如果响应不成功，尝试读取错误信息
        try {
          let errorData = await response.json();
          throw new Error(errorData.message || `请求失败: ${response.status}`);
        } catch (jsonError) {
          throw new Error(`请求失败: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error: any) {
      console.error("认证失败", error)
      // 显示更详细的错误信息
      message.error(`登录失败: ${error.message || "请检查网络连接和服务器状态"}`)
    } finally {
      setLoading(false)
    }
  }
  
  if (!visible) {
    return null
  }
  
  return (
    <div className="auth-modal-container" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      pointerEvents: 'auto'
    }}>
      <div style={{
        width: '350px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        padding: '24px',
        maxHeight: '90%',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0 }}>登录/注册</h2>
          <Button type="text" onClick={onClose} style={{ padding: '4px' }}>✕</Button>
        </div>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "请输入邮箱" },
              { type: "email", message: "请输入有效的邮箱地址" }
            ]}
            validateTrigger={["onChange", "onBlur"]}
          >
            <Input placeholder="邮箱" />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[
              { required: true, message: "请输入密码" },
              { min: 6, message: "密码长度不能少于6个字符" }
            ]}
            validateTrigger={["onChange", "onBlur"]}
          >
            <Input.Password placeholder="密码" />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
            >
              登录/注册
            </Button>
          </Form.Item>
        </Form>
        
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#999' }}>
          首次登录将会自动注册
        </p>
      </div>
    </div>
  )
}