import requests
import json
import re
from models.learning_path import LearningPath, db
import logging

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class LearningPathService:
    """学习路径服务"""
    
    def __init__(self):
        self.ollama_api = "http://127.0.0.1:11434/api/generate"
        self.model = "deepseek-r1:8b"
    
    def generate_learning_path(self, goal, user_id=None):
        """生成学习路径"""
        try:
            # 构建提示词
            prompt = self._build_prompt(goal)
            
            # 调用Ollama API
            response = requests.post(
                self.ollama_api,
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                }
            )
            
            if response.status_code != 200:
                raise Exception(f"Ollama API调用失败: {response.text}")
            
            # 解析响应
            result = response.json()
            response_text = result.get("response", "")
            
            # 提取JSON部分
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if not json_match:
                raise Exception("无法解析学习路径")
            
            json_str = json_match.group(0)
            path_data = json.loads(json_str)
            
            print(f"学习路径内容: {path_data}")

            # 保存到数据库
            learning_path = LearningPath(
                user_id=user_id,
                goal=goal
            )
            learning_path.set_path_data(path_data)
            
            if user_id:  # 只有登录用户才保存到数据库
                try:
                    # 从path_data中提取title
                    title = path_data.get('title', goal)  # 如果没有title，使用goal作为默认值
                    description = path_data.get('description', goal)  # 如果没有description，使用goal作为默认值
                    estimated_time = path_data.get('estimated_time', "48小时")  # 如果没有description，使用48小时作为默认值
                            
                    # 创建学习路径记录
                    path = LearningPath(
                        user_id=user_id,
                        title=title,  # 确保设置title
                        description=description,  # 确保设置description
                        goal=goal,
                        estimated_time=estimated_time,  # 确保设置estimated_time
                        path_data=json.dumps(path_data)
                    )
                            
                    db.session.add(path)
                    db.session.commit()
                except Exception as e:
                        db.session.rollback()
                        print(f"保存学习路径失败: {str(e)}")
            
            return path_data
            
        except Exception as e:
            print(f"生成学习路径失败: {str(e)}")
            # 返回一个默认的学习路径
            return self._get_default_path(goal)
    
    def _build_prompt(self, goal):
        """构建提示词"""
        return f"""
        你是一个专业的学习路径规划师，请根据用户的学习目标，制定一个详细的学习路径。
        
        用户的学习目标是: {goal}
        
        请分析用户的学习目标，考虑以下因素:
        1. 用户的现有基础
        2. 用户的学习时间
        3. 用户的学习预算
        4. 用户的目标岗位或应用场景
        
        然后，请制定一个分阶段的学习路径，每个阶段包括:
        1. 阶段名称
        2. 阶段描述
        3. 预计学习时间
        4. 推荐的学习资源(课程、书籍、工具、文章等)
        5. 阶段学习目标
        
        请以JSON格式返回，格式如下:
        {{
            "title": "学习路径标题",
            "description": "学习路径总体描述",
            "estimated_time": "总预计学习时间",
            "stages": [
                {{
                    "name": "阶段1名称",
                    "description": "阶段1描述",
                    "estimated_time": "阶段1预计学习时间",
                    "resources": [
                        {{
                            "type": "课程/书籍/工具/文章",
                            "name": "资源名称",
                            "link": "资源链接",
                            "description": "资源描述",
                            "price": "资源价格(0表示免费)"
                        }}
                    ],
                    "goals": [
                        "目标1",
                        "目标2"
                    ]
                }}
            ]
        }}
        
        只返回JSON格式的学习路径，不要有其他文字。
        需要确保总预计学习时间是所有阶段预计学习时间的总和。
        """
    
    def _get_default_path(self, goal):
        """获取默认学习路径"""
        # 简单分析目标中的关键词
        goal_lower = goal.lower()
        
        if "python" in goal_lower or "编程" in goal_lower:
            return self._get_python_path()
        elif "前端" in goal_lower or "web" in goal_lower:
            return self._get_frontend_path()
        elif "数据" in goal_lower or "分析" in goal_lower:
            return self._get_data_analysis_path()
        elif "ai" in goal_lower or "人工智能" in goal_lower or "机器学习" in goal_lower:
            return self._get_ai_path()
        else:
            return self._get_general_path()
    
    def _get_python_path(self):
        """获取Python学习路径"""
        return {
            "title": "Python编程从入门到精通",
            "description": "这是一条从零基础开始学习Python编程的路径，适合完全没有编程经验的初学者。",
            "estimated_time": "3-6个月",
            "stages": [
                {
                    "name": "Python基础入门",
                    "description": "学习Python的基本语法、数据类型、控制流和函数等基础知识。",
                    "estimated_time": "4周",
                    "resources": [
                        {
                            "type": "课程",
                            "name": "Python编程：从入门到实践",
                            "link": "https://book.douban.com/subject/26829016/",
                            "description": "最受欢迎的Python入门书籍之一，通过实践项目学习Python编程。",
                            "price": "79"
                        },
                        {
                            "type": "课程",
                            "name": "Python入门课程 - 中国大学MOOC",
                            "link": "https://www.icourse163.org/course/BIT-268001",
                            "description": "北京理工大学的Python入门课程，适合零基础学习。",
                            "price": "0"
                        }
                    ],
                    "goals": [
                        "掌握Python基本语法",
                        "能够编写简单的Python程序",
                        "理解变量、数据类型、条件语句和循环"
                    ]
                },
                {
                    "name": "Python进阶与实践",
                    "description": "学习更多Python高级特性，并开始构建实际项目。",
                    "estimated_time": "8周",
                    "resources": [
                        {
                            "type": "课程",
                            "name": "Python进阶 - 慕课网",
                            "link": "https://www.imooc.com/learn/317",
                            "description": "学习Python的高级特性和编程技巧。",
                            "price": "0"
                        },
                        {
                            "type": "工具",
                            "name": "PyCharm社区版",
                            "link": "https://www.jetbrains.com/pycharm/download/",
                            "description": "专业的Python集成开发环境，提高编程效率。",
                            "price": "0"
                        }
                    ],
                    "goals": [
                        "掌握Python高级特性",
                        "能够开发简单的Web应用",
                        "理解面向对象编程概念"
                    ]
                }
            ]
        }
    
    def _get_frontend_path(self):
        """获取前端学习路径"""
        return {
            "title": "前端开发学习路径",
            "description": "从零开始学习前端开发，包括HTML、CSS、JavaScript和现代前端框架。",
            "estimated_time": "4-8个月",
            "stages": [
                {
                    "name": "HTML和CSS基础",
                    "description": "学习网页结构和样式的基础知识。",
                    "estimated_time": "4周",
                    "resources": [
                        {
                            "type": "课程",
                            "name": "MDN Web文档 - HTML入门",
                            "link": "https://developer.mozilla.org/zh-CN/docs/Learn/HTML/Introduction_to_HTML",
                            "description": "Mozilla开发者网络的HTML入门教程，非常全面。",
                            "price": "0"
                        },
                        {
                            "type": "课程",
                            "name": "CSS入门教程 - 菜鸟教程",
                            "link": "https://www.runoob.com/css/css-tutorial.html",
                            "description": "简单易懂的CSS入门教程。",
                            "price": "0"
                        }
                    ],
                    "goals": [
                        "掌握HTML基本标签和结构",
                        "理解CSS选择器和样式属性",
                        "能够创建简单的静态网页"
                    ]
                },
                {
                    "name": "JavaScript基础",
                    "description": "学习JavaScript编程语言，为动态网页开发打下基础。",
                    "estimated_time": "6周",
                    "resources": [
                        {
                            "type": "课程",
                            "name": "现代JavaScript教程",
                            "link": "https://zh.javascript.info/",
                            "description": "从基础到高级的JavaScript教程，内容全面且实用。",
                            "price": "0"
                        },
                        {
                            "type": "工具",
                            "name": "VS Code",
                            "link": "https://code.visualstudio.com/",
                            "description": "轻量级但功能强大的代码编辑器，前端开发必备。",
                            "price": "0"
                        }
                    ],
                    "goals": [
                        "掌握JavaScript基本语法",
                        "理解DOM操作和事件处理",
                        "能够为网页添加交互功能"
                    ]
                }
            ]
        }
    
    def _get_data_analysis_path(self):
        """获取数据分析学习路径"""
        return {
            "title": "数据分析学习路径",
            "description": "从零开始学习数据分析，包括统计学基础、Python数据分析工具和数据可视化。",
            "estimated_time": "4-6个月",
            "stages": [
                {
                    "name": "数据分析基础",
                    "description": "学习数据分析的基本概念和统计学基础。",
                    "estimated_time": "4周",
                    "resources": [
                        {
                            "type": "课程",
                            "name": "数据分析入门 - 中国大学MOOC",
                            "link": "https://www.icourse163.org/course/XJTU-1206980804",
                            "description": "西安交通大学的数据分析入门课程，适合零基础学习。",
                            "price": "0"
                        },
                        {
                            "type": "书籍",
                            "name": "深入浅出统计学",
                            "link": "https://book.douban.com/subject/7056708/",
                            "description": "通俗易懂的统计学入门书籍，适合零基础学习。",
                            "price": "69"
                        }
                    ],
                    "goals": [
                        "理解数据分析的基本概念",
                        "掌握基本的统计学知识",
                        "能够进行简单的数据处理"
                    ]
                },
                {
                    "name": "Python数据分析工具",
                    "description": "学习Python数据分析工具，如NumPy、Pandas和Matplotlib。",
                    "estimated_time": "6周",
                    "resources": [
                        {
                            "type": "课程",
                            "name": "利用Python进行数据分析 - 第2版",
                            "link": "https://book.douban.com/subject/26274624/",
                            "description": "Pandas创始人Wes McKinney的经典著作，深入讲解Python数据分析。",
                            "price": "99"
                        },
                        {
                            "type": "工具",
                            "name": "Jupyter Notebook",
                            "link": "https://jupyter.org/",
                            "description": "交互式数据分析工具，数据分析师必备。",
                            "price": "0"
                        }
                    ],
                    "goals": [
                        "掌握NumPy和Pandas的基本用法",
                        "能够进行数据清洗和预处理",
                        "掌握基本的数据可视化技能"
                    ]
                }
            ]
        }
    
    def _get_ai_path(self):
        """获取AI学习路径"""
        return {
            "title": "人工智能学习路径",
            "description": "从零开始学习人工智能，包括机器学习、深度学习和自然语言处理。",
            "estimated_time": "6-12个月",
            "stages": [
                {
                    "name": "数学和编程基础",
                    "description": "学习人工智能所需的数学和编程基础。",
                    "estimated_time": "8周",
                    "resources": [
                        {
                            "type": "课程",
                            "name": "机器学习的数学基础 - 3Blue1Brown",
                            "link": "https://www.bilibili.com/video/BV1aE411o7qd",
                            "description": "通过可视化方式讲解机器学习所需的线性代数和微积分知识。",
                            "price": "0"
                        },
                        {
                            "type": "课程",
                            "name": "Python编程入门 - 中国大学MOOC",
                            "link": "https://www.icourse163.org/course/BIT-268001",
                            "description": "北京理工大学的Python入门课程，适合零基础学习。",
                            "price": "0"
                        }
                    ],
                    "goals": [
                        "掌握线性代数和微积分基础",
                        "掌握Python编程基础",
                        "理解概率论和统计学基础"
                    ]
                },
                {
                    "name": "机器学习基础",
                    "description": "学习机器学习的基本概念和算法。",
                    "estimated_time": "12周",
                    "resources": [
                        {
                            "type": "课程",
                            "name": "吴恩达机器学习课程 - Coursera",
                            "link": "https://www.coursera.org/learn/machine-learning",
                            "description": "最受欢迎的机器学习入门课程，由斯坦福大学教授吴恩达讲授。",
                            "price": "0"
                        },
                        {
                            "type": "书籍",
                            "name": "《机器学习实战》",
                            "link": "https://book.douban.com/subject/24703171/",
                            "description": "通过实际案例学习机器学习算法。",
                            "price": "69"
                        }
                    ],
                    "goals": [
                        "理解机器学习的基本概念",
                        "掌握常见的机器学习算法",
                        "能够使用scikit-learn实现简单的机器学习模型"
                    ]
                }
            ]
        }
    
    def _get_general_path(self):
        """获取通用学习路径"""
        return {
            "title": "自定义学习路径",
            "description": "根据您的学习目标定制的学习路径。",
            "estimated_time": "3-6个月",
            "stages": [
                {
                    "name": "基础知识学习",
                    "description": "学习该领域的基础知识和概念。",
                    "estimated_time": "4周",
                    "resources": [
                        {
                            "type": "课程",
                            "name": "领域入门课程 - 中国大学MOOC",
                            "link": "https://www.icourse163.org/",
                            "description": "中国大学MOOC平台上的相关入门课程。",
                            "price": "0"
                        },
                        {
                            "type": "书籍",
                            "name": "入门书籍推荐",
                            "link": "https://book.douban.com/",
                            "description": "豆瓣评分较高的入门书籍。",
                            "price": "50-100"
                        }
                    ],
                    "goals": [
                        "理解该领域的基本概念",
                        "掌握基础知识",
                        "能够进行简单的实践"
                    ]
                },
                {
                    "name": "进阶学习",
                    "description": "深入学习该领域的进阶知识和技能。",
                    "estimated_time": "8周",
                    "resources": [
                        {
                            "type": "课程",
                            "name": "进阶课程推荐",
                            "link": "https://www.coursera.org/",
                            "description": "Coursera平台上的相关进阶课程。",
                            "price": "0-1000"
                        },
                        {
                            "type": "工具",
                            "name": "相关工具推荐",
                            "link": "https://github.com/",
                            "description": "GitHub上的相关开源工具。",
                            "price": "0"
                        }
                    ],
                    "goals": [
                        "掌握进阶知识和技能",
                        "能够独立完成项目",
                        "理解行业最佳实践"
                    ]
                }
            ]
        }

    
    def save_alternative_path(self, path_id, alternative_path_data, user_id=None):
        """
        保存备选学习路径至学习路径库
        
        Args:
            path_id: 原始学习路径ID
            alternative_path_data: 备选学习路径数据
            user_id: 用户ID，用于验证权限
            
        Returns:
            bool: 保存是否成功
            str: 错误信息（如果有）
            dict: 更新后的学习路径数据
        """
        logger.info(f"保存备选学习路径至学习路径库，path_id: {path_id}, alternative_path_data: {alternative_path_data}, user_id: {user_id}")

        # 确保alternative_path_data是字典类型
        if isinstance(alternative_path_data, str):
            try:
                alternative_path_data = json.loads(alternative_path_data)
            except json.JSONDecodeError:
                return False, "无效的备选路径数据格式", None
                
        # 查询原始学习路径
        path = LearningPath.query.get(path_id)
        if not path:
            return False, "找不到原始学习路径", None
            
        # 验证用户权限
        if user_id and path.user_id != user_id:
            return False, "无权修改此学习路径", None
            
        try:       
            # 更新学习路径
            path.title = alternative_path_data.get('title', path.title)
            path.description = alternative_path_data.get('description', path.description)
            path.estimated_time = alternative_path_data.get('estimated_time', path.estimated_time)
            path.path_data = json.dumps(alternative_path_data)
            
            # 保存到数据库
            db.session.add(path)
            db.session.commit()
            
            print(f"成功保存备选学习路径，更新路径 ID: {path_id}")
            return True, None, alternative_path_data
            
        except Exception as e:
            db.session.rollback()
            error_msg = f"保存备选学习路径失败: {str(e)}"
            print(error_msg)
            return False, error_msg, None
