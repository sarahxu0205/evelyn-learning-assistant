from flask import Flask, after_this_request
from flask_cors import CORS
from models.user import db
# 确保导入所有模型，以便正确创建表
from models.user import User
from models.user_behavior import UserBehavior
from models.learning_path import LearningPath, LearningStage
from routes.auth import auth_bp
from routes.user_behavior import user_behavior_bp
from routes.user_behavior_stats import user_behavior_stats_bp
from routes.learning_path import learning_path_bp
from routes.need_analysis import need_analysis_bp
from routes.resources import resources_bp
from routes.user import user_bp  # 添加这一行导入user_bp
import os

app = Flask(__name__)

# 简化CORS配置，使用更直接的方式
CORS(app, origins="*", supports_credentials=True)

# 添加全局响应拦截器，手动设置CORS头部
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

# 配置数据库
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///evelyn.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 初始化数据库
db.init_app(app)

# 注册蓝图
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(user_behavior_bp, url_prefix='/api/user-behavior')
app.register_blueprint(user_behavior_stats_bp)
app.register_blueprint(learning_path_bp, url_prefix='/api/learning-path')
app.register_blueprint(need_analysis_bp, url_prefix='/api/need-analysis')
app.register_blueprint(user_bp, url_prefix='/api/user')  
app.register_blueprint(resources_bp, url_prefix='/api/resources')

# 创建数据库表
@app.before_first_request
def create_tables():
    db.create_all()

@app.route('/')
def index():
    return 'Evelyn AI 学习助手 API 服务正在运行'

if __name__ == '__main__':
    # 确保数据库目录存在
    if not os.path.exists('instance'):
        os.makedirs('instance')
    
    # 创建数据库表（但不删除现有数据）
    with app.app_context():
        # 注释掉这行，防止数据被删除
        # db.drop_all()
        db.create_all()  # 只创建不存在的表
    
    app.run(debug=True)