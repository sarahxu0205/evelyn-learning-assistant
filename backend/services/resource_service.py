import requests
import json
from urllib.parse import urlparse
import re

class ResourceService:
    """资源推荐服务"""
    
    def __init__(self):
        self.ollama_api = "http://127.0.0.1:11434/api/generate"
        self.model = "deepseek-r1:8b"
        
        # 预加载一些常见领域的资源
        self.preloaded_resources = self._load_preloaded_resources()
    
    def _load_preloaded_resources(self):
        """加载预设的资源数据"""
        # 这里可以从数据库或文件中加载，这里简化为直接返回
        return {
            "programming": [
                {
                    "title": "《Python编程：从入门到实践》",
                    "type": "book",
                    "description": "最受欢迎的Python入门书籍之一，通过实践项目学习Python编程。",
                    "difficulty": "初级",
                    "price": 79,
                    "link": "https://book.douban.com/subject/26829016/"
                },
                {
                    "title": "FreeCodeCamp",
                    "type": "course",
                    "description": "免费的编程学习平台，提供互动式编程课程和项目。",
                    "difficulty": "初级",
                    "price": 0,
                    "link": "https://www.freecodecamp.org/"
                }
            ],
            "data_analysis": [
                {
                    "title": "《利用Python进行数据分析》",
                    "type": "book",
                    "description": "Pandas创始人Wes McKinney的经典著作，深入讲解Python数据分析。",
                    "difficulty": "中级",
                    "price": 99,
                    "link": "https://book.douban.com/subject/25779298/"
                },
                {
                    "title": "Kaggle",
                    "type": "tool",
                    "description": "数据科学竞赛平台，提供大量数据集和案例。",
                    "difficulty": "中级",
                    "price": 0,
                    "link": "https://www.kaggle.com/"
                }
            ],
            "ai": [
                {
                    "title": "《动手学深度学习》",
                    "type": "book",
                    "description": "李沐等人编写的深度学习入门书籍，配有视频课程和代码。",
                    "difficulty": "中级",
                    "price": 0,
                    "link": "https://zh.d2l.ai/"
                },
                {
                    "title": "吴恩达机器学习课程",
                    "type": "course",
                    "description": "Coursera上最受欢迎的机器学习入门课程。",
                    "difficulty": "中级",
                    "price": 0,
                    "link": "https://www.coursera.org/learn/machine-learning"
                }
            ],
            "product_management": [
                {
                    "title": "《人人都是产品经理》",
                    "type": "book",
                    "description": "苏杰的产品经理入门书籍，讲解产品经理的基本素养和工作方法。",
                    "difficulty": "初级",
                    "price": 59,
                    "link": "https://book.douban.com/subject/4723970/"
                },
                {
                    "title": "Axure RP",
                    "type": "tool",
                    "description": "专业的原型设计工具，产品经理必备。",
                    "difficulty": "中级",
                    "price": 2999,
                    "link": "https://www.axure.com/"
                }
            ]
        }
    
    def get_page_resources(self, url, title, content):
        """根据页面内容推荐相关学习资源"""
        try:
            # 分析页面内容，确定领域
            domain = self._analyze_page_domain(url, title, content)
            
            # 如果能确定领域，直接返回预加载的资源
            if domain in self.preloaded_resources:
                return {"resources": self.preloaded_resources[domain]}
            
            # 如果无法确定领域，使用LLM生成推荐
            resources = self._generate_resources_with_llm(url, title, content)
            return {"resources": resources}
            
        except Exception as e:
            print(f"获取页面资源失败: {str(e)}")
            # 返回一些通用资源
            return {"resources": self.preloaded_resources["programming"][:3]}
    
    def _analyze_page_domain(self, url, title, content):
        """分析页面内容，确定领域"""
        # 提取关键词
        keywords = self._extract_keywords(url, title, content)
        
        # 简单规则匹配
        if any(kw in keywords for kw in ["python", "java", "javascript", "编程", "代码", "开发"]):
            return "programming"
        elif any(kw in keywords for kw in ["数据", "分析", "统计", "pandas", "excel", "tableau"]):
            return "data_analysis"
        elif any(kw in keywords for kw in ["ai", "人工智能", "机器学习", "深度学习", "神经网络"]):
            return "ai"
        elif any(kw in keywords for kw in ["产品", "需求", "用户", "交互", "设计", "产品经理"]):
            return "product_management"
        
        # 默认返回编程领域
        #return "programming"
        return ""
    
    def _extract_keywords(self, url, title, content):
        """提取页面关键词"""
        # 合并标题和内容
        text = f"{title} {content}"
        
        # 转为小写
        text = text.lower()
        
        # 简单分词
        words = re.findall(r'\w+', text)
        
        # 返回所有词
        return words
    
    def _generate_resources_with_llm(self, url, title, content):
        """使用LLM生成资源推荐"""
        try:
            # 构建提示词
            prompt = f"""
            根据以下网页信息，推荐3个相关的学习资源（课程、书籍、工具或文章）。
            
            网页标题: {title}
            网页URL: {url}
            网页内容摘要: {content[:500]}...
            
            请以JSON格式返回，每个资源包含以下字段:
            - title: 资源标题
            - type: 资源类型（course/book/tool/article）
            - description: 资源描述
            - difficulty: 难度（初级/中级/高级）
            - price: 价格（数字，0表示免费）
            - link: 资源链接
            
            只返回JSON数组，不要有其他文字。
            """
            
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
            json_match = re.search(r'\[\s*\{.*\}\s*\]', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                resources = json.loads(json_str)
                return resources
            
            # 如果无法解析JSON，返回默认资源
            return self.preloaded_resources["programming"][:3]
            
        except Exception as e:
            print(f"LLM生成资源推荐失败: {str(e)}")
            return self.preloaded_resources["programming"][:3]