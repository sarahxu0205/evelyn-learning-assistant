from models.user_behavior import UserBehavior
from models.user import User
from sqlalchemy import func, desc
from datetime import datetime, timedelta
import re
from collections import Counter
import logging
import jieba  # 添加jieba中文分词

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class UserBehaviorStatsService:
    """用户行为统计服务"""
    
    def __init__(self):
        # 初始化jieba分词，添加技术词汇
        tech_words = [
            "人工智能", "机器学习", "深度学习", "神经网络", "自然语言处理", 
            "计算机视觉", "数据挖掘", "大数据", "云计算", "区块链",
            "前端开发", "后端开发", "全栈开发", "移动开发", "微服务",
            "DevOps", "敏捷开发", "测试驱动", "持续集成", "持续部署"
        ]
        for word in tech_words:
            jieba.add_word(word)
    
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
        #logger.info(f"关键词: {keywords} 统计: {keyword_counter}")
        
        # 扩展并优化领域映射
        domain_mapping = {
            # 编程语言
            "python": "编程",
            "java": "编程",
            "javascript": "编程",
            "typescript": "编程",
            "c++": "编程",
            "c#": "编程",
            "php": "编程",
            "ruby": "编程",
            "swift": "编程",
            "kotlin": "编程",
            "go": "编程",
            "rust": "编程",
            "scala": "编程",
            "perl": "编程",
            "shell": "编程",
            "bash": "编程",
            "powershell": "编程",
            
            # 前端技术
            "html": "前端开发",
            "css": "前端开发",
            "javascript": "前端开发",
            "typescript": "前端开发",
            "react": "前端开发",
            "vue": "前端开发",
            "angular": "前端开发",
            "jquery": "前端开发",
            "bootstrap": "前端开发",
            "sass": "前端开发",
            "less": "前端开发",
            "webpack": "前端开发",
            "vite": "前端开发",
            "小程序": "前端开发",
            "uniapp": "前端开发",
            "flutter": "前端开发",
            "electron": "前端开发",
            
            # 后端技术
            "nodejs": "后端开发",
            "express": "后端开发",
            "koa": "后端开发",
            "django": "后端开发",
            "flask": "后端开发",
            "fastapi": "后端开发",
            "spring": "后端开发",
            "springboot": "后端开发",
            "laravel": "后端开发",
            "thinkphp": "后端开发",
            "rails": "后端开发",
            "asp.net": "后端开发",
            "微服务": "后端开发",
            "restful": "后端开发",
            "graphql": "后端开发",
            "api": "后端开发",
            
            # 数据库
            "mysql": "数据库",
            "postgresql": "数据库",
            "mongodb": "数据库",
            "redis": "数据库",
            "elasticsearch": "数据库",
            "sqlite": "数据库",
            "oracle": "数据库",
            "sqlserver": "数据库",
            "nosql": "数据库",
            "数据库": "数据库",
            "sql": "数据库",
            
            # 开发工具与环境
            "git": "开发工具",
            "github": "开发工具",
            "gitlab": "开发工具",
            "docker": "开发工具",
            "kubernetes": "开发工具",
            "jenkins": "开发工具",
            "vscode": "开发工具",
            "intellij": "开发工具",
            "pycharm": "开发工具",
            "webstorm": "开发工具",
            "vim": "开发工具",
            "linux": "开发工具",
            "ubuntu": "开发工具",
            "centos": "开发工具",
            "macos": "开发工具",
            "windows": "开发工具",
            
            # 通用编程概念
            "编程": "编程",
            "代码": "编程",
            "开发": "编程",
            "程序": "编程",
            "软件": "编程",
            "算法": "编程",
            "数据结构": "编程",
            "设计模式": "编程",
            "面向对象": "编程",
            "函数式": "编程",
            "编译": "编程",
            "调试": "编程",
            "测试": "编程",
            "部署": "编程",
            "重构": "编程",
            "性能优化": "编程",
            
            # 数据分析
            "数据": "数据分析",
            "分析": "数据分析",
            "统计": "数据分析",
            "pandas": "数据分析",
            "numpy": "数据分析",
            "scipy": "数据分析",
            "matplotlib": "数据分析",
            "seaborn": "数据分析",
            "tableau": "数据分析",
            "power bi": "数据分析",
            "excel": "数据分析",
            "spss": "数据分析",
            "r语言": "数据分析",
            "可视化": "数据分析",
            "数据清洗": "数据分析",
            "数据挖掘": "数据分析",
            "数据仓库": "数据分析",
            "etl": "数据分析",
            "olap": "数据分析",
            "大数据": "数据分析",
            "hadoop": "数据分析",
            "spark": "数据分析",
            "hive": "数据分析",
            "flink": "数据分析",
            
            # 人工智能
            "ai": "人工智能",
            "人工智能": "人工智能",
            "机器学习": "人工智能",
            "深度学习": "人工智能",
            "神经网络": "人工智能",
            "nlp": "人工智能",
            "自然语言处理": "人工智能",
            "计算机视觉": "人工智能",
            "cv": "人工智能",
            "tensorflow": "人工智能",
            "pytorch": "人工智能",
            "keras": "人工智能",
            "scikit-learn": "人工智能",
            "强化学习": "人工智能",
            "监督学习": "人工智能",
            "无监督学习": "人工智能",
            "半监督学习": "人工智能",
            "迁移学习": "人工智能",
            "生成式ai": "人工智能",
            "chatgpt": "人工智能",
            "llm": "人工智能",
            "大语言模型": "人工智能",
            "gpt": "人工智能",
            "bert": "人工智能",
            "transformer": "人工智能",
            "yolo": "人工智能",
            "cnn": "人工智能",
            "rnn": "人工智能",
            "lstm": "人工智能",
            "gan": "人工智能",
            
            # 产品设计
            "产品": "产品设计",
            "设计": "产品设计",
            "ui": "产品设计",
            "ux": "产品设计",
            "用户体验": "产品设计",
            "交互": "产品设计",
            "原型": "产品设计",
            "需求": "产品设计",
            "用户故事": "产品设计",
            "用例": "产品设计",
            "产品经理": "产品设计",
            "产品运营": "产品设计",
            "用户研究": "产品设计",
            "竞品分析": "产品设计",
            "市场调研": "产品设计",
            "figma": "产品设计",
            "sketch": "产品设计",
            "axure": "产品设计",
            "墨刀": "产品设计",
            "蓝湖": "产品设计",
            
            # 市场营销
            "营销": "市场营销",
            "广告": "市场营销",
            "seo": "市场营销",
            "sem": "市场营销",
            "推广": "市场营销",
            "品牌": "市场营销",
            "市场": "市场营销",
            "销售": "市场营销",
            "用户增长": "市场营销",
            "转化率": "市场营销",
            "留存": "市场营销",
            "活跃": "市场营销",
            "gmv": "市场营销",
            "arpu": "市场营销",
            "roi": "市场营销",
            "crm": "市场营销",
            "内容营销": "市场营销",
            "社交媒体": "市场营销",
            "短视频": "市场营销",
            "直播": "市场营销",
            
            # 金融
            "金融": "金融",
            "投资": "金融",
            "理财": "金融",
            "股票": "金融",
            "基金": "金融",
            "债券": "金融",
            "期货": "金融",
            "外汇": "金融",
            "保险": "金融",
            "信托": "金融",
            "银行": "金融",
            "证券": "金融",
            "财务": "金融",
            "会计": "金融",
            "税务": "金融",
            "审计": "金融",
            "风控": "金融",
            "区块链": "金融",
            "加密货币": "金融",
            "比特币": "金融",
            "以太坊": "金融"
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
            return []  # 返回空数组，表示没有任何领域数据
        
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
        if not text:
            return []
            
        # 转为小写
        text = text.lower()
        
        # 使用jieba进行中文分词
        words = []
        
        # 对英文和中文分别处理
        # 1. 提取英文单词和数字
        english_words = re.findall(r'[a-zA-Z0-9][-_a-zA-Z0-9.#+]*', text)
        words.extend([w for w in english_words if len(w) > 1])
        
        # 2. 使用jieba进行中文分词
        # 先移除英文单词，避免干扰中文分词
        for ew in english_words:
            text = text.replace(ew, ' ')
        
        # 进行中文分词
        chinese_words = jieba.cut(text)
        words.extend([w.strip() for w in chinese_words if len(w.strip()) > 1])
        
        # 过滤停用词
        stop_words = {
            "的", "了", "和", "是", "在", "我", "有", "你", "他", "她", "它", "们", 
            "这", "那", "什么", "怎么", "如何", "为什么", "怎样", "哪些", "哪里", 
            "谁", "什么时候", "多少", "几", "怎么办", "可以", "应该", "需要", 
            "想要", "必须", "可能", "也许", "大概", "或许", "如果", "但是", 
            "然而", "不过", "虽然", "因为", "所以", "因此", "于是", "而且", 
            "并且", "或者", "either", "or", "and", "but", "if", "then", 
            "therefore", "however", "although", "though", "because", 
            "since", "as", "for", "so", "thus", "moreover", "furthermore",
            "the", "a", "an", "of", "to", "in", "on", "at", "by", "with",
            "from", "for", "about", "against", "between", "into", "through",
            "during", "before", "after", "above", "below", "up", "down",
            "this", "that", "these", "those", "my", "your", "his", "her",
            "its", "our", "their", "who", "which", "what", "where", "when",
            "why", "how", "all", "any", "both", "each", "few", "more", "most",
            "other", "some", "such", "no", "nor", "not", "only", "own", "same",
            "than", "too", "very", "can", "will", "just", "should", "now"
        }
        
        filtered_words = [word for word in words if word not in stop_words and len(word) > 1]
        
        return filtered_words