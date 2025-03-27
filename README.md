# Evelyn 智能学习助手浏览器插件 - 用户指南

## 1. 简介

Evelyn 是一个智能学习助手浏览器插件，旨在帮助用户规划个性化学习路径。它能根据用户的学习需求和个人情况，制定个性化的学习计划，并提供资源推荐。

## 2. 安装指南

### 2.1 安装后端服务

1. 确保已安装 Python 3.7 或更高版本
2. 打开终端，进入后端目录：
   ```bash
   cd /evelyn/backend
   ```
3. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```
4. 启动后端服务：
   ```bash
   python app.py
   ```
   服务将在 http://127.0.0.1:5000 上运行

### 2.2 安装浏览器插件

1. 确保已安装 Node.js 18.17.1 或更高版本（注意：使用较低版本如14.18.2可能会导致前端服务无法正常启动）
2. 打开终端，进入前端目录：
   ```bash
   cd /evelyn/extension
   ```
3. 安装依赖：
   ```bash
   npm install
   ```
4. 构建插件：
   ```bash
   npm run build
   ```
5. 在 Chrome 浏览器中加载插件：
   - 打开 Chrome，访问 `chrome://extensions/`
   - 开启右上角的"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择 `/evelyn/extension/build/chrome-mv3-prod` 目录

## 3. 使用指南

### 3.1 注册/登录

1. 点击浏览器右上角的 Evelyn 图标，打开插件弹窗
2. 在登录界面输入邮箱和密码
3. 点击"登录/注册"按钮
4. 首次登录会自动注册新账户

### 3.2 创建学习路径

1. 在插件主界面，点击"创建学习路径"
2. 在输入框中描述你的学习需求，例如：
   - "零基础学习前端开发"
   - "如何在6个月内通过PMP认证"
   - "想学习数据分析，预算5000元"
3. 点击"分析需求"按钮
4. 系统会分析你的需求，提取关键信息
5. 确认分析结果后，点击"生成学习路径"

### 3.3 查看学习路径

1. 生成的学习路径将以阶段式步骤展示
2. 每个阶段包含：
   - 阶段名称和目标
   - 推荐学习资源
   - 预计完成时间
   - 学习重点
3. 点击各阶段可展开查看详细内容
4. 点击资源链接可直接访问相关学习材料

### 3.4 跟踪学习进度

1. 在"我的学习路径"页面查看所有学习路径
2. 点击路径名称进入详情页
3. 勾选已完成的学习项目
4. 系统会自动记录你的学习进度
5. 在"统计"标签页查看学习数据分析

### 3.5 侧边栏功能

1. 浏览网页时，点击浏览器右侧的 Evelyn 图标打开侧边栏
2. 侧边栏提供学习路径的创建与查看功能

## 4. 功能详解

### 4.1 需求分析

系统会从你的学习需求中提取以下信息：
- 学习领域（如编程、语言、管理等）
- 基础水平（零基础、入门、进阶等）
- 学习目标（掌握技能、通过考试、就业等）
- 时间预算（短期、中期、长期）
- 资金预算（如有提及）

### 4.2 学习路径生成

基于需求分析，系统会生成包含以下内容的学习路径：
- 3-7个学习阶段
- 每个阶段的具体目标
- 推荐的学习资源（书籍、课程、网站等）
- 学习顺序和依赖关系
- 预计完成时间

### 4.3 资源推荐

系统推荐的学习资源包括：
- 免费资源（文档、教程、开源项目等）
- 付费资源（课程、书籍等）
- 实践项目建议
- 社区和学习群组

### 4.4 学习行为分析

系统会记录和分析你的学习行为：
- 学习时长和频率
- 资源访问情况
- 完成进度
- 学习偏好

## 5. 常见问题

### 5.1 插件无法连接到后端服务

- 确保后端服务正在运行（http://127.0.0.1:5000）
- 检查浏览器控制台是否有跨域错误
- 重启浏览器和后端服务

### 5.2 登录失败

- 确保邮箱格式正确
- 密码长度至少为6位
- 检查网络连接

### 5.3 学习路径生成失败

- 尝试提供更详细的学习需求
- 确保需求描述清晰明确
- 检查后端服务日志查看错误信息

### 5.4 如何备份数据

- 所有学习数据存储在后端数据库中
- 数据库文件位于 `/evelyn/backend/instance/evelyn.db`
- 定期复制此文件进行备份

## 6. 联系与支持

如有问题或建议，请通过以下方式联系我们：
- 在 GitHub 仓库提交 Issue
- 发送邮件至项目维护者

---

感谢使用 Evelyn 智能学习助手！我们希望它能帮助你实现学习目标，提升学习效率。