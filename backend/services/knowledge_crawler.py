import requests
from bs4 import BeautifulSoup
import json
import time
import random
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class KnowledgeCrawler:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
        }
        self.knowledge_graph = {
            'nodes': [],  # 存储课程、技能、领域、工具、书籍等节点
            'edges': [],  # 存储节点之间的关系
        }
        self.course_platforms = [
            {'name': '得到', 'url': 'https://www.dedao.cn/'},
            {'name': '极客时间', 'url': 'https://time.geekbang.org/'},
            {'name': 'B站', 'url': 'https://www.bilibili.com/'},
            {'name': '慕课网', 'url': 'https://www.imooc.com/'},
            {'name': '网易云课堂', 'url': 'https://study.163.com/'},
            {'name': '知乎知学堂', 'url': 'https://www.zhihu.com/education'},
            {'name': '掘金社区', 'url': 'https://juejin.cn/'}
        ]
        self.book_platforms = [
            {'name': '豆瓣读书', 'url': 'https://book.douban.com/'},
            {'name': '京东读书', 'url': 'https://book.jd.com/'},
            {'name': '当当网', 'url': 'http://book.dangdang.com/'}
        ]
    
    def crawl_courses(self, keyword, platform=None):
        """爬取特定关键词的课程信息"""
        logger.info(f"开始爬取关键词 '{keyword}' 的课程信息")
        
        courses = []
        platforms = [platform] if platform else self.course_platforms
        
        for platform in platforms:
            try:
                logger.info(f"从 {platform['name']} 爬取课程")
                
                # 这里应该是具体的爬虫逻辑，根据不同平台实现不同的爬取方式
                # 为了演示，我们使用模拟数据
                if platform['name'] == '极客时间':
                    courses.extend(self._mock_geektime_courses(keyword))
                elif platform['name'] == 'B站':
                    courses.extend(self._mock_bilibili_courses(keyword))
                else:
                    courses.extend(self._mock_general_courses(keyword, platform['name']))
                
                # 随机延时，避免请求过于频繁
                time.sleep(random.uniform(1, 3))
                
            except Exception as e:
                logger.error(f"爬取 {platform['name']} 课程时出错: {str(e)}")
        
        # 将爬取的课程添加到知识图谱
        for course in courses:
            self._add_node('course', course)
        
        return courses
    
    def crawl_books(self, keyword, platform=None):
        """爬取特定关键词的书籍信息"""
        logger.info(f"开始爬取关键词 '{keyword}' 的书籍信息")
        
        books = []
        platforms = [platform] if platform else self.book_platforms
        
        for platform in platforms:
            try:
                logger.info(f"从 {platform['name']} 爬取书籍")
                
                # 这里应该是具体的爬虫逻辑
                # 为了演示，我们使用模拟数据
                books.extend(self._mock_books(keyword, platform['name']))
                
                # 随机延时
                time.sleep(random.uniform(1, 3))
                
            except Exception as e:
                logger.error(f"爬取 {platform['name']} 书籍时出错: {str(e)}")
        
        # 将爬取的书籍添加到知识图谱
        for book in books:
            self._add_node('book', book)
        
        return books
    
    def build_relationships(self):
        """构建知识图谱中节点之间的关系"""
        logger.info("开始构建知识图谱关系")
        
        nodes = self.knowledge_graph['nodes']
        
        # 为了演示，我们使用一些预定义的关系规则
        # 实际项目中，这部分可能需要更复杂的逻辑或者人工标注
        
        # 例如：找出所有Python相关的课程和书籍，建立它们之间的关系
        python_nodes = [node for node in nodes if 'python' in node['title'].lower()]
        
        for i, node1 in enumerate(python_nodes):
            for j, node2 in enumerate(python_nodes):
                if i != j:
                    # 根据难度建立前置关系
                    if node1['difficulty'] == '初级' and node2['difficulty'] in ['中级', '高级']:
                        self._add_edge(node1['id'], node2['id'], 'prerequisite')
                    
                    # 根据类型建立互补关系
                    if node1['type'] == 'course' and node2['type'] == 'book':
                        self._add_edge(node1['id'], node2['id'], 'complementary')
        
        logger.info(f"知识图谱关系构建完成，共 {len(self.knowledge_graph['edges'])} 条关系")
    
    def export_knowledge_graph(self, filepath):
        """导出知识图谱到文件"""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.knowledge_graph, f, ensure_ascii=False, indent=2)
        
        logger.info(f"知识图谱已导出到 {filepath}")
        return filepath
    
    def _add_node(self, node_type, data):
        """添加节点到知识图谱"""
        node_id = f"{node_type}_{len(self.knowledge_graph['nodes'])}"
        
        node = {
            'id': node_id,
            'type': node_type,
            'title': data['title'],
            'description': data.get('description', ''),
            'difficulty': data.get('difficulty', '中级'),
            'price': data.get('price', 0),
            'platform': data.get('platform', ''),
            'url': data.get('url', ''),
            'rating': data.get('rating', 0)
        }
        
        self.knowledge_graph['nodes'].append(node)
        return node_id
    
    def _add_edge(self, source_id, target_id, relation_type):
        """添加边到知识图谱"""
        edge = {
            'source': source_id,
            'target': target_id,
            'relation': relation_type
        }
        
        self.knowledge_graph['edges'].append(edge)
    
    # 以下是模拟数据生成方法，实际项目中应替换为真实爬虫逻辑
    
    def _mock_geektime_courses(self, keyword):
        """模拟极客时间课程数据"""
        return [
            {
                'title': f'深入浅出{keyword}',
                'description': f'从零开始学习{keyword}的核心概念和实践技巧',
                'difficulty': '初级',
                'price': 299,
                'platform': '极客时间',
                'url': f'https://time.geekbang.org/column/intro/100{random.randint(10, 99)}',
                'rating': 4.8
            },
            {
                'title': f'{keyword}进阶实战',
                'description': f'通过实际项目提升{keyword}开发能力',
                'difficulty': '中级',
                'price': 399,
                'platform': '极客时间',
                'url': f'https://time.geekbang.org/column/intro/100{random.randint(10, 99)}',
                'rating': 4.7
            }
        ]
    
    def _mock_bilibili_courses(self, keyword):
        """模拟B站课程数据"""
        return [
            {
                'title': f'{keyword}入门到精通',
                'description': f'通俗易懂的{keyword}视频教程',
                'difficulty': '初级',
                'price': 0,
                'platform': 'B站',
                'url': f'https://www.bilibili.com/video/BV1{random.choice(["a", "b", "c"])}{random.randint(1000, 9999)}',
                'rating': 4.5
            }
        ]
    
    def _mock_general_courses(self, keyword, platform):
        """模拟通用课程数据"""
        difficulties = ['初级', '中级', '高级']
        prices = [0, 99, 199, 299, 399, 499]
        
        return [
            {
                'title': f'{platform} - {keyword}专业课程',
                'description': f'{platform}平台上最受欢迎的{keyword}学习资源',
                'difficulty': random.choice(difficulties),
                'price': random.choice(prices),
                'platform': platform,
                'url': f'https://example.com/{platform}/{keyword}/{random.randint(1000, 9999)}',
                'rating': round(random.uniform(3.5, 5.0), 1)
            }
        ]
    
    def _mock_books(self, keyword, platform):
        """模拟书籍数据"""
        difficulties = ['初级', '中级', '高级']
        prices = [39, 59, 79, 99, 129]
        
        return [
            {
                'title': f'{keyword}权威指南',
                'description': f'全面讲解{keyword}的经典著作',
                'difficulty': random.choice(difficulties),
                'price': random.choice(prices),
                'platform': platform,
                'url': f'https://book.example.com/{platform}/{keyword}/{random.randint(1000, 9999)}',
                'rating': round(random.uniform(4.0, 5.0), 1)
            },
            {
                'title': f'{keyword}实战项目详解',
                'description': f'通过实际项目学习{keyword}',
                'difficulty': random.choice(difficulties),
                'price': random.choice(prices),
                'platform': platform,
                'url': f'https://book.example.com/{platform}/{keyword}/{random.randint(1000, 9999)}',
                'rating': round(random.uniform(4.0, 5.0), 1)
            }
        ]