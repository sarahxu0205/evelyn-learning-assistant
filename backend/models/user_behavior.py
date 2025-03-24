from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from models.user import db

class UserBehavior(db.Model):
    """用户行为模型"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    title = db.Column(db.String(200))
    search_query = db.Column(db.String(200))
    duration = db.Column(db.Integer, default=0)  # 停留时间（秒）
    timestamp = db.Column(db.DateTime, default=datetime.now)
    
    def __repr__(self):
        return f'<UserBehavior {self.id} - {self.url}>'