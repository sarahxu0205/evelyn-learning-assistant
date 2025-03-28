import ollama
import json
import logging
from services.knowledge_crawler import KnowledgeCrawler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import json
import uuid
import requests
from models.learning_path import LearningPath, db

class KnowledgeService:
    """知识服务，用于生成学习路径"""
    
    def __init__(self):
        self.ollama_api = "http://127.0.0.1:11434/api/generate"
        self.model = "deepseek-r1:8b"  # 使用本地模型
            
        self.crawler = KnowledgeCrawler()
    
    def generate_learning_path(self, goal):
        """生成学习路径"""
        # 构建提示词
        prompt = f"""
        作为一个专业的学习路径规划师，请根据用户的学习目标，生成一个详细的学习路径。
        
        用户学习目标: {goal}
        
        请生成一个包含以下内容的学习路径:
        1. 路径标题
        2. 3-5个学习阶段，每个阶段包含:
           - 阶段标题
           - 阶段描述
           - 2-3个推荐资源(包括类型、标题、描述、难度、价格、链接)
           - 2-3个学习建议
        
        请以JSON格式返回，格式如下:
        {{
            "title": "路径标题",
            "stages": [
                {{
                    "title": "阶段1标题",
                    "description": "阶段1描述",
                    "resources": [
                        {{
                            "type": "book/course/tool/article",
                            "title": "资源标题",
                            "description": "资源描述",
                            "difficulty": "初级/中级/高级",
                            "price": 0,
                            "link": "资源链接"
                        }}
                    ],
                    "tips": ["学习建议1", "学习建议2"]
                }}
            ]
        }}
        
        只返回JSON格式，不要有其他内容。
        """
        
        try:
            # 调用本地Ollama模型
            response = requests.post(
                self.ollama_api,
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                }
            )
            
            if response.status_code != 200:
                raise Exception(f"调用Ollama API失败: {response.text}")
            
            # 解析响应
            result = response.json()
            response_text = result.get("response", "")
            
            # 提取JSON部分
            json_start = response_text.find("{")
            json_end = response_text.rfind("}")
            
            if json_start == -1 or json_end == -1:
                raise Exception("无法从响应中提取JSON")
            
            json_text = response_text[json_start:json_end+1]
            learning_path = json.loads(json_text)
            
            return learning_path
            
        except Exception as e:
            # 如果调用失败，返回一个默认的学习路径
            print(f"生成学习路径失败: {str(e)}")
            return self._generate_default_path(goal)
    
    def _generate_default_path(self, goal):
        """生成默认学习路径"""
        return {
            "title": f"学习路径: {goal[:30]}...",
            "stages": [
                {
                    "title": "基础入门",
                    "description": "掌握基本概念和工具",
                    "resources": [
                        {
                            "type": "course",
                            "title": "入门课程",
                            "description": "适合初学者的基础课程",
                            "difficulty": "初级",
                            "price": 0,
                            "link": "https://www.example.com/course1"
                        },
                        {
                            "type": "book",
                            "title": "入门指南",
                            "description": "全面介绍基础知识",
                            "difficulty": "初级",
                            "price": 49,
                            "link": "https://www.example.com/book1"
                        }
                    ],
                    "tips": ["每天坚持学习", "做好笔记"]
                },
                {
                    "title": "进阶学习",
                    "description": "深入理解核心概念",
                    "resources": [
                        {
                            "type": "course",
                            "title": "进阶课程",
                            "description": "深入学习核心知识",
                            "difficulty": "中级",
                            "price": 99,
                            "link": "https://www.example.com/course2"
                        },
                        {
                            "type": "tool",
                            "title": "实用工具",
                            "description": "提高学习效率的工具",
                            "difficulty": "中级",
                            "price": 0,
                            "link": "https://www.example.com/tool1"
                        }
                    ],
                    "tips": ["多做实践", "参与社区讨论"]
                },
                {
                    "title": "实战项目",
                    "description": "通过项目巩固所学知识",
                    "resources": [
                        {
                            "type": "course",
                            "title": "项目实战",
                            "description": "从零开始构建实际项目",
                            "difficulty": "高级",
                            "price": 149,
                            "link": "https://www.example.com/course3"
                        },
                        {
                            "type": "article",
                            "title": "最佳实践指南",
                            "description": "行业专家分享的经验",
                            "difficulty": "高级",
                            "price": 0,
                            "link": "https://www.example.com/article1"
                        }
                    ],
                    "tips": ["定期复习", "寻找导师指导"]
                }
            ]
        }
    
    def _call_llm(self, prompt):
        """调用大语言模型生成内容"""
        try:
            # 调用本地Ollama模型
            response = requests.post(
                self.ollama_api,
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                }
            )
            
            if response.status_code != 200:
                raise Exception(f"调用Ollama API失败: {response.text}")
            
            # 解析响应
            result = response.json()
            response_text = result.get("response", "")
            
            # 提取JSON部分
            json_start = response_text.find("{")
            json_end = response_text.rfind("}")
            
            if json_start == -1 or json_end == -1:
                raise Exception("无法从响应中提取JSON")
            
            json_text = response_text[json_start:json_end+1]
            return json.loads(json_text)
            
        except Exception as e:
            logger.error(f"调用LLM失败: {str(e)}")
            return None
    
    def analyze_learning_goal(self, goal_text):
        """分析用户学习目标，提取关键信息"""
        logger.info(f"分析学习目标: {goal_text}")
        
        prompt = f"""
        请分析以下学习目标，提取关键信息:
        
        {goal_text}
        
        请提取以下信息并以JSON格式返回:
        1. 学习领域 (domain): 如编程、设计、语言等
        2. 具体技能 (skills): 如Python、UI设计、英语等
        3. 用户基础水平 (level): 初级/中级/高级
        4. 学习时间 (duration): 用户计划投入的时间
        5. 预算 (budget): 用户计划投入的金额
        6. 学习目的 (purpose): 如就业、兴趣、考证等
        
        只返回JSON格式，不要有其他文字。
        """
        
        try:
            # 修改为使用与__init__中相同的API调用方式
            response = requests.post(
                self.ollama_api,
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                }
            )
            
            if response.status_code != 200:
                raise Exception(f"调用Ollama API失败: {response.text}")
            
            # 解析响应
            result = response.json()
            response_text = result.get("response", "")
            
            # 提取JSON部分
            import re
            json_match = re.search(r'({.*})', response_text.replace('\n', ''), re.DOTALL)
            if not json_match:
                raise ValueError("无法解析模型返回的JSON")
            
            goal_info = json.loads(json_match.group(1))
            logger.info(f"提取的学习目标信息: {goal_info}")
            
            return goal_info
        
        except Exception as e:
            logger.error(f"分析学习目标失败: {str(e)}")
            # 返回一个基本的结构，避免后续处理出错
            return {
                'domain': '',
                'skills': [],
                'level': '初级',
                'duration': '',
                'budget': 0,
                'purpose': ''
            }
    
    def generate_advanced_learning_path(self, goal_text):
        """根据用户学习目标生成高级学习路径（包含分析和爬取资源）"""
        logger.info(f"生成高级学习路径: {goal_text}")
        
        # 1. 分析学习目标
        goal_info = self.analyze_learning_goal(goal_text)
        
        # 2. 根据分析结果爬取相关资源
        if goal_info['skills']:
            for skill in goal_info['skills']:
                self.crawler.crawl_courses(skill)
                self.crawler.crawl_books(skill)
        
        # 3. 构建资源之间的关系
        self.crawler.build_relationships()
        
        # 4. 使用大模型生成学习路径
        prompt = f"""
        请根据以下用户学习目标和信息，生成一个详细的学习路径:
        
        用户目标: {goal_text}
        
        分析结果:
        - 学习领域: {goal_info['domain']}
        - 具体技能: {', '.join(goal_info['skills']) if isinstance(goal_info['skills'], list) else goal_info['skills']}
        - 用户基础: {goal_info['level']}
        - 学习时间: {goal_info['duration']}
        - 预算: {goal_info['budget']}
        - 学习目的: {goal_info['purpose']}
        
        请生成一个分阶段的学习路径，每个阶段包含:
        1. 阶段名称
        2. 阶段描述
        3. 推荐资源(课程、书籍、工具、文章等)
        4. 学习建议
        
        请考虑用户的基础水平、时间和预算限制，确保学习路径是可行的。
        
        请以JSON格式返回，格式如下:
        {{
            "title": "学习路径标题",
            "stages": [
                {{
                    "title": "阶段1标题",
                    "description": "阶段1描述",
                    "resources": [
                        {{
                            "type": "course|book|tool|article",
                            "title": "资源标题",
                            "description": "资源描述",
                            "price": "价格(数字)",
                            "difficulty": "初级|中级|高级",
                            "link": "资源链接"
                        }}
                    ],
                    "tips": ["学习建议1", "学习建议2"]
                }}
            ]
        }}
        
        只返回JSON格式，不要有其他文字。
        """
        
        try:
            # 修改为使用与__init__中相同的API调用方式
            response = requests.post(
                self.ollama_api,
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                }
            )
            
            if response.status_code != 200:
                raise Exception(f"调用Ollama API失败: {response.text}")
            
            # 解析响应
            result = response.json()
            response_text = result.get("response", "")
            
            # 提取JSON部分
            import re
            json_match = re.search(r'({.*})', response_text.replace('\n', ''), re.DOTALL)
            if not json_match:
                raise ValueError("无法解析模型返回的JSON")
            
            learning_path = json.loads(json_match.group(1))
            logger.info(f"生成的学习路径: {learning_path['title']}")
            
            return learning_path
        
        except Exception as e:
            logger.error(f"生成学习路径失败: {str(e)}")
            # 返回一个基本的错误信息
            raise ValueError(f"生成学习路径失败: {str(e)}")
    
    def save_learning_path(self, user_id, goal_text, learning_path):
        """保存用户的学习路径"""
        from models.learning_path import LearningPath, LearningStage, db
        import uuid
        
        # 创建学习路径记录
        path_id = str(uuid.uuid4())
        new_path = LearningPath(
            id=path_id,
            user_id=user_id,
            title=learning_path['title'],
            estimated_time=learning_path['estimated_time'],
            goal=goal_text,
            path_data=json.dumps(learning_path, ensure_ascii=False),
            completion_rate=0
        )
        
        db.session.add(new_path) 
        db.session.commit()
        logger.info(f"已保存用户 {user_id} 的学习路径")
        
        return path_id