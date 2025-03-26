from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from models.user import db
import json

class LearningPath(db.Model):
    """学习路径模型"""
    __tablename__ = 'learning_paths'  # 明确指定表名
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # 允许匿名用户
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    goal = db.Column(db.String(500))
    estimated_time = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    path_data = db.Column(db.Text)  # 存储完整的路径数据（JSON格式）
    completion_rate = db.Column(db.Float, default=0)  # 完成率
    
    def __repr__(self):
        return f'<LearningPath {self.id} - {self.title}>'
    
    def get_path_data(self):
        """获取完整的路径数据"""
        if self.path_data:
            return json.loads(self.path_data)
        return {}
    
    def set_path_data(self, data):
        """设置完整的路径数据"""
        if isinstance(data, dict):
            self.path_data = json.dumps(data)
        else:
            self.path_data = data