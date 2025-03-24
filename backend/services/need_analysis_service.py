import requests
import json
import re

class NeedAnalysisService:
    """需求分析服务"""
    
    def __init__(self):
        self.ollama_api = "http://127.0.0.1:11434/api/generate"
        self.model = "deepseek-r1:8b"
    
    def analyze_learning_need(self, goal):
        """分析学习需求"""
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
                raise Exception("无法解析需求分析结果")
            
            json_str = json_match.group(0)
            analysis_data = json.loads(json_str)
            
            return analysis_data
            
        except Exception as e:
            print(f"分析学习需求失败: {str(e)}")
            # 返回一个默认的分析结果
            return self._get_default_analysis(goal)
    
    def _build_prompt(self, goal):
        """构建提示词"""
        return f"""
        你是一个专业的学习需求分析师，请分析用户的学习目标，提取关键信息。
        
        用户的学习目标是: {goal}
        
        请分析以下内容:
        1. 用户想学习的领域（如编程、烹饪、音乐等）
        2. 用户的学习类型（快速入门还是专业深造）
        3. 用户的现有基础（零基础、初级、中级、高级）
        4. 用户的学习时间（如果提及）
        5. 用户的学习预算（如果提及）
        6. 用户的目标岗位或应用场景（如果提及）
        7. 用户可能的隐性需求（例如用户说"想学Photoshop"可能实际需要的是平面设计就业路径）
        
        请以JSON格式返回，格式如下:
        {{
            "domain": "领域",
            "learning_type": "快速入门/专业深造",
            "base_level": "零基础/初级/中级/高级",
            "learning_time": "学习时间（如果提及）",
            "budget": "学习预算（如果提及）",
            "target_job": "目标岗位或应用场景（如果提及）",
            "implicit_needs": "隐性需求（如果有）"
        }}
        
        只返回JSON格式的分析结果，不要有其他文字。
        """
    
    def _get_default_analysis(self, goal):
        """获取默认分析结果"""
        # 简单分析目标中的关键词
        goal_lower = goal.lower()
        
        # 默认领域
        domain = "未知"
        if "python" in goal_lower or "编程" in goal_lower or "代码" in goal_lower:
            domain = "编程"
        elif "前端" in goal_lower or "web" in goal_lower or "html" in goal_lower:
            domain = "前端开发"
        elif "数据" in goal_lower or "分析" in goal_lower or "统计" in goal_lower:
            domain = "数据分析"
        elif "ai" in goal_lower or "人工智能" in goal_lower or "机器学习" in goal_lower:
            domain = "人工智能"
        elif "设计" in goal_lower or "ui" in goal_lower or "ux" in goal_lower:
            domain = "设计"
        elif "营销" in goal_lower or "广告" in goal_lower or "推广" in goal_lower:
            domain = "市场营销"
        
        # 默认学习类型
        learning_type = "快速入门"
        if "深入" in goal_lower or "精通" in goal_lower or "专业" in goal_lower:
            learning_type = "专业深造"
        
        # 默认基础水平
        base_level = "零基础"
        if "进阶" in goal_lower or "提升" in goal_lower:
            base_level = "初级"
        elif "高级" in goal_lower or "资深" in goal_lower:
            base_level = "中级"
        
        # 提取学习时间
        learning_time = ""
        time_patterns = [
            r'(\d+)\s*个?月',
            r'(\d+)\s*个?周',
            r'(\d+)\s*天',
            r'每[天周日]\s*(\d+)\s*小时'
        ]
        
        for pattern in time_patterns:
            match = re.search(pattern, goal_lower)
            if match:
                learning_time = match.group(0)
                break
        
        # 提取预算
        budget = ""
        budget_patterns = [
            r'预算\s*(\d+)',
            r'(\d+)\s*元',
            r'(\d+)\s*块'
        ]
        
        for pattern in budget_patterns:
            match = re.search(pattern, goal_lower)
            if match:
                budget = match.group(0)
                break
        
        return {
            "domain": domain,
            "learning_type": learning_type,
            "base_level": base_level,
            "learning_time": learning_time,
            "budget": budget,
            "target_job": "",
            "implicit_needs": ""
        }