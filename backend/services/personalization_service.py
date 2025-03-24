import datetime
import logging
import math
import json
from models.user_behavior import UserBehavior
from models.learning_path import LearningPath
from services.knowledge_service import KnowledgeService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PersonalizationService:
    """个性化服务，用于调整学习路径"""
    
    def __init__(self):
        self.knowledge_service = KnowledgeService()
    
    def detect_frustration(self, user_id):
        """检测用户是否遇到挫折"""
        # 获取用户最近的搜索行为
        recent_behaviors = UserBehavior.query.filter_by(user_id=user_id).order_by(
            UserBehavior.timestamp.desc()
        ).limit(20).all()
        
        # 分析搜索关键词，检测挫折信号
        frustration_keywords = ["太难了", "看不懂", "不理解", "困难", "放弃", "help", "难度大"]
        frustrated_skills = {}
        
        for behavior in recent_behaviors:
            if not behavior.search_query:
                continue
            
            # 检查搜索查询是否包含挫折关键词
            for keyword in frustration_keywords:
                if keyword in behavior.search_query.lower():
                    # 提取可能的技能名称（简化处理）
                    query_words = behavior.search_query.split()
                    for word in query_words:
                        if word not in frustration_keywords and len(word) > 2:
                            frustrated_skills[word] = frustrated_skills.get(word, 0) + 1
        
        # 返回出现频率超过3次的技能
        return [skill for skill, count in frustrated_skills.items() if count >= 3]
    
    def generate_alternative_path(self, user_id, path_id, frustrated_skills):
        """生成备选学习路径"""
        # 获取原始学习路径
        path = LearningPath.query.get(path_id)
        if not path:
            return None
        
        # 解析路径数据
        path_data = json.loads(path.path_data)
        
        # 构建提示词，请求生成备选路径
        prompt = f"""
        用户在学习过程中遇到了挫折，请为以下学习路径生成一个更容易理解的备选方案。
        
        用户遇到困难的技能/概念: {', '.join(frustrated_skills)}
        
        原始学习路径:
        {json.dumps(path_data, ensure_ascii=False, indent=2)}
        
        请生成一个更简单、更容易理解的备选学习路径，特别是针对用户遇到困难的部分。
        保持相同的JSON格式，但调整内容使其更易于理解。
        """
        
        try:
            # 调用知识服务生成备选路径
            adjusted_path = self.knowledge_service._call_llm(prompt)
            
            # 如果生成失败，返回None
            if not adjusted_path:
                return None
            
            return adjusted_path
            
        except Exception as e:
            print(f"生成备选路径失败: {str(e)}")
            return None
    
    def adjust_path_based_on_behavior(self, user_id, path_id):
        """根据用户行为调整学习路径"""
        # 获取用户行为数据
        behaviors = UserBehavior.query.filter_by(user_id=user_id).order_by(
            UserBehavior.timestamp.desc()
        ).limit(50).all()
        
        if not behaviors:
            return None
        
        # 获取原始学习路径
        path = LearningPath.query.get(path_id)
        if not path:
            return None
        
        # 解析路径数据
        path_data = json.loads(path.path_data)
        
        # 分析用户行为，提取兴趣和倾向
        domains = {}
        keywords = {}
        
        for behavior in behaviors:
            # 分析域名
            if behavior.url:
                domain = behavior.url.split('/')[2] if '/' in behavior.url else ''
                domains[domain] = domains.get(domain, 0) + 1
            
            # 分析搜索关键词
            if behavior.search_query:
                for keyword in behavior.search_query.split():
                    if len(keyword) > 2:
                        keywords[keyword] = keywords.get(keyword, 0) + 1
        
        # 获取用户最常访问的域名和搜索关键词
        top_domains = sorted(domains.items(), key=lambda x: x[1], reverse=True)[:5]
        top_keywords = sorted(keywords.items(), key=lambda x: x[1], reverse=True)[:10]
        
        # 构建提示词，请求调整路径
        prompt = f"""
        根据用户的浏览行为，请调整以下学习路径，使其更符合用户的兴趣和倾向。
        
        用户常访问的网站: {', '.join([domain for domain, _ in top_domains])}
        用户常搜索的关键词: {', '.join([keyword for keyword, _ in top_keywords])}
        
        原始学习路径:
        {json.dumps(path_data, ensure_ascii=False, indent=2)}
        
        请根据用户的行为数据调整学习路径，特别是推荐的资源和学习建议。
        保持相同的JSON格式，但调整内容使其更符合用户的兴趣和倾向。
        """
        
        try:
            # 调用知识服务调整路径
            adjusted_path = self.knowledge_service._call_llm(prompt)
            
            # 如果调整失败，返回None
            if not adjusted_path:
                return None
            
            return adjusted_path
            
        except Exception as e:
            print(f"调整学习路径失败: {str(e)}")
            return None