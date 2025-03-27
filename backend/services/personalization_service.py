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
        """
        检测用户是否遇到挫折
        
        Args:
            user_id: 用户ID
            
        Returns:
            list: 用户遇到挫折的技能列表，如果没有检测到挫折则返回空列表
        """
        # 获取用户最近的搜索行为（增加数量以提高准确性）
        recent_behaviors = UserBehavior.query.filter_by(user_id=user_id).order_by(
            UserBehavior.timestamp.desc()
        ).limit(30).all()
        
        if not recent_behaviors:
            logger.info(f"用户 {user_id} 没有足够的行为数据进行挫折检测")
            return []
        
        # 分析搜索关键词，检测挫折信号
        frustration_keywords = ["太难了", "看不懂", "不理解", "困难", "放弃", "help", "难度大", 
                               "confused", "stuck", "不会", "问题", "错误", "失败", "卡住"]
        frustrated_skills = {}
        
        # 记录最近一周的行为
        one_week_ago = datetime.datetime.now() - datetime.timedelta(days=7)
        
        for behavior in recent_behaviors:
            # 只考虑最近一周的行为
            if behavior.timestamp < one_week_ago:
                continue
                
            # 检查标题和搜索查询
            text_to_check = ""
            if behavior.search_query:
                text_to_check += behavior.search_query.lower() + " "
            if behavior.title:
                text_to_check += behavior.title.lower() + " "
                
            if not text_to_check:
                continue
            
            # 检查是否包含挫折关键词
            has_frustration = False
            for keyword in frustration_keywords:
                if keyword in text_to_check:
                    has_frustration = True
                    break
                    
            if has_frustration:
                # 提取可能的技能名称
                words = text_to_check.split()
                for word in words:
                    if word not in frustration_keywords and len(word) > 2:
                        frustrated_skills[word] = frustrated_skills.get(word, 0) + 1
        
        # 返回出现频率超过3次的技能（降低阈值以提高敏感度）
        result = [skill for skill, count in frustrated_skills.items() if count >= 3]
        
        logger.info(f"用户 {user_id} 的挫折检测结果: {result}")
        return result
    
    def generate_alternative_path(self, user_id, path_id, frustrated_skills):
        """
        生成备选学习路径
        
        Args:
            user_id: 用户ID
            path_id: 学习路径ID
            frustrated_skills: 用户遇到挫折的技能列表
            
        Returns:
            dict/str: 调整后的学习路径数据，如果生成失败则返回None
        """
        # 获取原始学习路径
        path = LearningPath.query.get(path_id)
        if not path:
            logger.error(f"找不到ID为 {path_id} 的学习路径")
            return None
        
        # 解析路径数据
        try:
            path_data = json.loads(path.path_data) if isinstance(path.path_data, str) else path.path_data
        except Exception as e:
            logger.error(f"解析路径数据失败: {str(e)}")
            return None
        
        # 构建提示词，请求生成备选路径
        prompt = f"""
        用户在学习过程中遇到了挫折，请为以下学习路径生成一个更容易理解的备选方案。
        
        用户遇到困难的技能/概念: {', '.join(frustrated_skills)}
        
        原始学习路径目标: {path.goal}
        
        原始学习路径:
        {json.dumps(path_data, ensure_ascii=False, indent=2)}
        
        请生成一个更简单、更容易理解的备选学习路径，特别是针对用户遇到困难的部分。
        保持相同的JSON格式，但调整内容使其更易于理解。
        提供更多的入门资源和基础解释，将复杂概念分解为更小的步骤。
        """
        
        try:
            # 调用知识服务生成备选路径
            logger.info(f"为用户 {user_id} 生成备选学习路径，针对技能: {frustrated_skills}")
            adjusted_path = self.knowledge_service._call_llm(prompt)
            
            # 如果生成失败，返回None
            if not adjusted_path:
                logger.error("生成备选路径失败: LLM返回空结果")
                return None
            
            # 确保返回的是字典而不是字符串
            if isinstance(adjusted_path, str):
                try:
                    adjusted_path = json.loads(adjusted_path)
                except json.JSONDecodeError:
                    logger.error(f"解析LLM返回的JSON失败: {adjusted_path[:100]}...")
                    return adjusted_path  # 返回原始字符串，让API层处理
            
            logger.info(f"成功为用户 {user_id} 生成备选学习路径")
            return adjusted_path
            
        except Exception as e:
            logger.error(f"生成备选路径失败: {str(e)}")
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
        path_data = json.loads(path.path_data) if isinstance(path.path_data, str) else path.path_data
        
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
            
            # 确保返回的是字典而不是字符串
            if isinstance(adjusted_path, str):
                adjusted_path = json.loads(adjusted_path)
            
            return adjusted_path
            
        except Exception as e:
            logger.error(f"调整学习路径失败: {str(e)}")
            return None