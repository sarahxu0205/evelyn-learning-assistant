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
    
    # 关联
    stages = db.relationship('LearningStage', backref='path', lazy=True, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f'<LearningPath {self.id} - {self.title}>'

class LearningStage(db.Model):
    """学习阶段模型"""
    __tablename__ = 'learning_stages'  # 明确指定表名
    
    id = db.Column(db.Integer, primary_key=True)
    path_id = db.Column(db.Integer, db.ForeignKey('learning_paths.id'), nullable=False)  # 修改这里的外键引用
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    estimated_time = db.Column(db.String(100))
    order = db.Column(db.Integer, default=0)  # 阶段顺序
    resources = db.Column(db.Text)  # 存储为JSON字符串
    goals = db.Column(db.Text)  # 存储为JSON字符串
    
    def __repr__(self):
        return f'<LearningStage {self.id} - {self.name}>'
    
    def get_resources(self):
        """获取资源列表"""
        if self.resources:
            return json.loads(self.resources)
        return []
    
    def get_goals(self):
        """获取目标列表"""
        if self.goals:
            return json.loads(self.goals)
        return []