from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    # 添加以下字段
    learning_interests = db.Column(db.Text, nullable=True)  # 存储为JSON字符串
    skill_levels = db.Column(db.Text, nullable=True)  # 存储为JSON字符串
    learning_time = db.Column(db.Integer, nullable=True)  # 每周学习时间（小时）
    budget = db.Column(db.Float, nullable=True)  # 学习预算
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    # 关联
    behaviors = db.relationship('UserBehavior', backref='user', lazy=True)
    learning_paths = db.relationship('LearningPath', backref='user', lazy=True)
    
    def __repr__(self):
        return f'<User {self.email}>'