from models.user_behavior import UserBehavior
from models.user import User
from sqlalchemy import func, desc
from datetime import datetime, timedelta
import re
from collections import Counter

class UserBehaviorStatsService:
    """用户行为统计服务"""
    
    def get_user_stats(self, user_id):
        """获取用户学习统计"""
        try:
            # 获取用户总学习时间
            total_learning_time = self._get_total_learning_time(user_id)
            
            # 获取用户每周学习时间分布
            weekly_learning_time = self._get_weekly_learning_time(user_id)
            
            # 获取用户学习领域分布
            domain_distribution = self._get_domain_distribution(user_id)
            
            return {
                "totalLearningTime": total_learning_time,
                "weeklyLearningTime": weekly_learning_time,
                "domainDistribution": domain_distribution
            }
        except Exception as e:
            print(f"获取用户学习统计失败: {str(e)}")
            return None
    
    def _get_total_learning_time(self, user_id):
        """获取用户总学习时间（分钟）"""
        total_duration = UserBehavior.query.with_entities(
            func.sum(UserBehavior.duration)
        ).filter(
            UserBehavior.user_id == user_id
        ).scalar()
        
        return total_duration or 0
    
    def _get_weekly_learning_time(self, user_id):
        """获取用户每周学习时间分布"""
        # 获取当前日期
        today = datetime.now().date()
        
        # 计算本周的开始日期（周一）
        start_of_week = today - timedelta(days=today.weekday())
        
        # 初始化每天的学习时间
        days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
        weekly_time = {day: 0 for day in days}
        
        # 查询本周的学习时间
        behaviors = UserBehavior.query.filter(
            UserBehavior.user_id == user_id,
            func.date(UserBehavior.timestamp) >= start_of_week
        ).all()
        
        # 统计每天的学习时间
        for behavior in behaviors:
            weekday = behavior.timestamp.weekday()  # 0-6，0表示周一
            day = days[weekday]
            weekly_time[day] += behavior.duration
        
        # 转换为前端需要的格式
        result = []
        for day in days:
            result.append({
                "day": day,
                "minutes": weekly_time[day]
            })
        
        return result
    
    def _get_domain_distribution(self, user_id):
        """获取用户学习领域分布"""
        # 获取用户的所有行为
        behaviors = UserBehavior.query.filter(
            UserBehavior.user_id == user_id
        ).all()
        
        # 提取关键词
        keywords = []
        for behavior in behaviors:
            # 从标题和搜索查询中提取关键词
            if behavior.title:
                keywords.extend(self._extract_keywords(behavior.title))
            if behavior.search_query:
                keywords.extend(self._extract_keywords(behavior.search_query))
        
        # 统计关键词频率
        keyword_counter = Counter(keywords)
        
        # 映射到领域
        domain_mapping = {
            "python": "编程",
            "java": "编程",
            "javascript": "编程",
            "html": "编程",
            "css": "编程",
            "编程": "编程",
            "代码": "编程",
            "开发": "编程",
            
            "数据": "数据分析",
            "分析": "数据分析",
            "统计": "数据分析",
            "pandas": "数据分析",
            "excel": "数据分析",
            "tableau": "数据分析",
            "可视化": "数据分析",
            
            "ai": "人工智能",
            "人工智能": "人工智能",
            "机器学习": "人工智能",
            "深度学习": "人工智能",
            "神经网络": "人工智能",
            "nlp": "人工智能",
            "自然语言处理": "人工智能",
            
            "产品": "产品设计",
            "设计": "产品设计",
            "ui": "产品设计",
            "ux": "产品设计",
            "用户体验": "产品设计",
            "交互": "产品设计",
            "原型": "产品设计",
            
            "营销": "市场营销",
            "广告": "市场营销",
            "seo": "市场营销",
            "sem": "市场营销",
            "推广": "市场营销",
            
            "金融": "金融",
            "投资": "金融",
            "理财": "金融",
            "股票": "金融",
            "基金": "金融"
        }
        
        # 统计领域分布
        domain_count = {}
        for keyword in keywords:
            keyword_lower = keyword.lower()
            if keyword_lower in domain_mapping:
                domain = domain_mapping[keyword_lower]
                domain_count[domain] = domain_count.get(domain, 0) + 1
        
        # 如果没有任何领域，返回默认值
        if not domain_count:
            return [
                {"domain": "编程", "percentage": 100}
            ]
        
        # 计算百分比
        total = sum(domain_count.values())
        domain_percentage = {}
        for domain, count in domain_count.items():
            percentage = round((count / total) * 100)
            domain_percentage[domain] = percentage
        
        # 确保百分比总和为100%
        total_percentage = sum(domain_percentage.values())
        if total_percentage != 100:
            # 调整最大值
            max_domain = max(domain_percentage.items(), key=lambda x: x[1])[0]
            domain_percentage[max_domain] += (100 - total_percentage)
        
        # 转换为前端需要的格式
        result = []
        for domain, percentage in domain_percentage.items():
            result.append({
                "domain": domain,
                "percentage": percentage
            })
        
        # 按百分比降序排序
        result.sort(key=lambda x: x["percentage"], reverse=True)
        
        return result
    
    def _extract_keywords(self, text):
        """从文本中提取关键词"""
        # 转为小写
        text = text.lower()
        
        # 简单分词
        words = re.findall(r'\w+', text)
        
        # 过滤停用词
        stop_words = {"的", "了", "和", "是", "在", "我", "有", "你", "他", "她", "它", "们", "这", "那", "什么", "怎么", "如何"}
        words = [word for word in words if word not in stop_words and len(word) > 1]
        
        return words