# 产品功能设计
## 产品功能概述及主要功能模块说明
- 产品名称：​Evelyn｜越学越懂你的AI导师
- 产品概述：​Evelyn是一款基于AI的学习助手，产品形态是浏览器插件，产品价值是根据用户个人情况、学习需求、学习预算、学习时间等因素量身定制学习路线，以帮助用户快速学习。
- 产品的目标用户如下，不同的人有不同的需求，比如学生可能需要更系统的课程，而转行者可能需要快速入门，所以产品需要足够灵活，适应不同用户：
    - ​垂直领域学习者：AI/编程/数据分析等技能提升人群（核心刚需）。
    - ​转行/跨行业者：非技术背景想切入AI领域（如产品经理、传统行业从业者）。
    - ​学生/职场新人：需要系统性学习路径但缺乏方向（高频需求）。
    - ​企业培训市场：中小型企业为员工批量采购技能提升方案（B端潜力）。
- 主要功能模块包括：
    - 用户注册和登录模块
    - 用户画像构建模块
    - 构建知识图谱模块
    - 学习路线制定模块
    - 学习建议与动态调整模块
    - 学习成果统计模块
- 用户注册和登录模块说明：
    - 根据邮箱和密码注册或登录
    - 登出功能
- 用户画像构建模块，主要通过以下两种方式完成：
    - 隐形数据：通过插件记录用户浏览行为、停留时长、搜索关键词，来动态的构建用户画像
    - 显式问卷：通过5分钟快速测评，如：现有基础、每日学习时间、目标学习成果、预算区间、目标岗位等
- 构建知识图谱模块说明：
    - 知识图谱包括：
        - 知识图谱节点：如课程、技能、领域、工具、书籍等
        - 知识图谱边：如课程之间的依赖关系（如：需先学统计学再学机器学习）、技能之间的依赖关系、领域之间的依赖关系等、替代关系（《Python Crash Course》图书 vs Codecademy交互课）、性价比关系（Coursera专项证书 vs 同类免费资源+模拟考试）
        - 知识图谱属性：如课程的难度、技能的难度、领域的难度等、工具的价格、书籍的价格等
    - 知识图谱的构建可以通过以下两种方式完成：
        - 爬虫：通过爬虫爬取互联网上的课程、技能、领域、书籍等信息，然后构建知识图谱
        - 人工标注：通过人工标注的方式，将用户的学习需求、学习时间、学习预算等信息转化为知识图谱
    - 知识图谱的资源网络图谱，主要包括以下几方面：
        - 爆款知识课程，如：得到（体系化课程），极客时间（体系化课程），B站（实战技巧），慕课网（体系化课程），网易云课堂（体系化课程），知乎知学堂（体系化课程），掘金社区（体系化课程）
        - 爆款知识文章，如：公众号，小红书，知乎（经验贴）
        - 畅销好评书籍，如：豆瓣读书，京东读书，当当网
        - 涉及的工具推荐，根据用户的学习路线，推荐要使用的专业且流行的工具，如：产品经理的学习路线需要掌握Axure/Figma等原型工具的使用
- 学习路线制定模块说明：
    - 插件会根据用户输入的学习需求和自身情况，为用户制定学习路线，如：数学基础薄弱者自动插入前置学习模块。
    - 用户输入的内容如：学习需求，包括自身基础、学习目标、学习时间、学习预算区间、目标岗位等，以下为一些示例：
        - 0基础小白，想用6个月时间学会钢琴，预算500元，每天能学1小时，学完能够演奏流行歌曲
        - 技术从业10年，转型AI产品经理应该学什么
        - 零基础转行前端开发，预算5000元
- 学习建议与动态调整模块说明：
    - 插件会根据用户的学习进度和路线难度（如用户浏览行为和停留时长），为用户提供学习建议。
    - 可以动态调整路径，比如根据学习进度、用户行为（如教程视频跳过率/笔记密度）自动推荐下一步或者实时调整路径
- 学习成果统计模块说明：
    - 插件会根据用户的学习成果，为用户提供学习成果统计。
    - 可以实时更新学习进度追踪，完成度百分比圆环 + 每周学习报告，本地存储学习状态（IndexedDB） + 简易数据可视化（Chart.js）

## 功能一：用户注册和登录
### 功能详细说明
- 注册/登录
  - 输入邮箱和密码，点击注册/登陆按钮，注册/登陆成功，如果失败则弹出错误信息
  - 如果是注册，则向用户邮箱发送验证邮件，用户点击邮件中的链接，验证成功后才能登录
  - 如果是登录，则直接登录
- 登出
  - 点击登出按钮
  - 登出成功
### 交互说明
- 注册与登陆使用同一个按钮，如果用户没有注册，则弹出注册窗口，如果用户已经注册，则弹出登录窗口
- 在弹出的半层中，在注册/登陆窗口中，用户输入邮箱和密码，点击注册/登陆按钮，如果注册/登陆成功，则登陆层关闭，如果失败，则弹出错误信息

## 功能二：用户画像构建模块
### 功能详细说明
- 可以根据用户的浏览行为、停留时长、搜索关键词，来动态的构建用户画像

## 功能三：构建知识图谱模块
### 功能详细说明
- 可以通过爬虫爬取互联网上的课程、技能、领域、书籍等信息，然后构建知识图谱

## 功能四：学习路线制定模块
### 功能详细说明
- 根据用户输入的学习需求和自身情况，为用户制定学习路线，如：数学基础薄弱者自动插入前置学习模块。
### 交互说明
- ​目标输入页
  - 有一个标题，提示请用户输入目标
  - 有一个输入框，提示用户输入学习需求，如：学习目标、学习时间、学习预算区间、目标岗位等
  - 在输入框下方展示一些提示说明，如：
    - 包含预算信息可获得更精准推荐哦
    - 试试输入'如何用6个月通过PMP认证'
    - 零基础转行前端开发，预算5000元
  - 有一个提交按钮，点击提交按钮，如果提交成功，则跳转到路径展示页，如果失败，则弹出错误信息
- ​路径展示页
  - 有一个标题，展示学习路线
  - 有一个路径列表，列表中分阶段展示用户的学习路径
 
## 功能五：学习建议与动态调整模块
### 功能详细说明
- 插件会根据用户的学习进度和路线难度（如用户浏览行为和停留时长），为用户提供学习建议。

## 功能六：学习成果统计模块
### 功能详细说明
- 可以实时更新学习进度追踪，完成度百分比圆环 + 每周学习报告，本地存储学习状态（IndexedDB） + 简易数据可视化（Chart.js）

## 技术架构要点
### ​语义理解层
- 领域分类（判断用户想学编程/烹饪/音乐）
- 需求拆解（区分“快速入门”vs“专业深造”）
- 隐性需求挖掘（用户说“想学Photoshop”可能实际需要的是平面设计就业路径）
### 资源检索层
- 检索课程（根据用户需求、学习时间、学习预算、学习目标、学习岗位等）
- 检索书籍（根据用户需求、学习时间、学习预算、学习目标、学习岗位等）
- 检索工具（根据用户需求、学习时间、学习预算、学习目标、学习岗位等）
- 检索文章（根据用户需求、学习时间、学习预算、学习目标、学习岗位等）
### 个性化引擎
​- 遗忘曲线预测：根据艾宾浩斯记忆法自动插入复习时间点
- ​挫折预警系统：当用户搜索“XX技能太难了”超过3次时，启动备选路径生成
### 需要调用的API说明
- 大模型选型：本地ollama模型
  - 本地LLM模型可以使用： deepseek-r1:8b deepseek-r1:8b llama3.2:3b qwen2.5:latest
  - 本地embedding模型使用：bge-m3:latest  
- API调用文档：http://127.0.0.1:11434/

### 技术框架选型
- 使用 Plasmo 作为浏览器插件的前端框架，Plasmo的文档是 https://docs.plasmo.com/
- 使用 python 作为后端框架，使用Flask作为框架，Flask文档是 https://flask.palletsprojects.com/zh-cn/stable/

## 全局说明 
- UI风格模仿chrome爆款插件 Monica，参考资料如下：
  - Monica在chrome应用商店的详情链接是 https://chromewebstore.google.com/detail/monica-chatgpt-ai%E5%8A%A9%E6%89%8B-deeps/ofpnmcalabcbjgholdjcjblkibolbppb?hl=zh-CN&utm_source=ext_sidebar 
  - Monica的官网是https://monica.im/home
- 右侧弹出抽屉样式展示产品功能
- 最小化后在侧边栏展示小图标，点击后展开抽屉，交互效果也类似于 Monica