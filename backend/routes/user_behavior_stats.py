from flask import Blueprint, jsonify, request
import jwt
from models.user_behavior import UserBehavior, db
from datetime import datetime, timedelta
import json
from sqlalchemy import func, desc
from urllib.parse import urlparse
import re
from services.user_behavior_stats_service import UserBehaviorStatsService
from utils.auth import token_required

user_behavior_stats_bp = Blueprint('user_behavior_stats', __name__)
user_behavior_stats_service = UserBehaviorStatsService()

# 密钥用于JWT签名
SECRET_KEY = 'evelyn-secret-key'

def token_required(f):
    """验证JWT令牌的装饰器"""
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': '未授权的请求'}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            user_id = data['user_id']
            
            # 检查用户是否存在
            from models.user import User
            current_user = User.query.get(user_id)
            if not current_user:
                return jsonify({'message': '用户不存在'}), 401
            
        except jwt.ExpiredSignatureError:
            return jsonify({'message': '令牌已过期'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': '无效的令牌'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

@user_behavior_stats_bp.route('/stats/<int:user_id>', methods=['GET'])
@token_required
def get_user_stats(current_user, user_id):
    """获取用户行为统计"""
    # 验证用户ID
    if current_user.id != user_id:
        return jsonify({'message': '无权访问此用户的统计数据'}), 403
    
    # 获取过去30天的行为数据
    thirty_days_ago = datetime.now() - timedelta(days=30)
    behaviors = UserBehavior.query.filter(
        UserBehavior.user_id == user_id,
        UserBehavior.timestamp >= thirty_days_ago
    ).all()
    
    if not behaviors:
        return jsonify({
            'message': '暂无行为数据',
            'totalLearningTime': 0,
            'weeklyLearningTime': [],
            'domainDistribution': []
        }), 200
    
    # 计算总学习时间（分钟）
    total_learning_time = sum(behavior.duration for behavior in behaviors if behavior.duration)
    
    # 计算每周学习时间
    weekly_learning_time = []
    days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    
    # 获取过去7天的日期
    today = datetime.now().date()
    week_start = today - timedelta(days=today.weekday())
    
    for i in range(7):
        day = week_start + timedelta(days=i)
        day_behaviors = [b for b in behaviors if b.timestamp.date() == day]
        day_time = sum(b.duration for b in day_behaviors if b.duration)
        
        weekly_learning_time.append({
            'day': days[i],
            'minutes': day_time // 60  # 转换为分钟
        })
    
    # 分析域名分布
    domains = {}
    for behavior in behaviors:
        if not behavior.url:
            continue
        
        try:
            domain = urlparse(behavior.url).netloc
            if domain:
                domains[domain] = domains.get(domain, 0) + (behavior.duration or 0)
        except:
            continue
    
    # 获取前5个域名
    top_domains = sorted(domains.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # 如果不足5个，添加"其他"类别
    other_time = sum(time for domain, time in domains.items() if domain not in [d for d, _ in top_domains])
    
    # 计算总时间
    total_domain_time = sum(time for _, time in top_domains) + other_time
    
    # 计算百分比
    domain_distribution = []
    for domain, time in top_domains:
        percentage = round((time / total_domain_time) * 100) if total_domain_time > 0 else 0
        domain_distribution.append({
            'domain': domain,
            'percentage': percentage
        })
    
    # 添加"其他"类别
    if other_time > 0:
        percentage = round((other_time / total_domain_time) * 100) if total_domain_time > 0 else 0
        domain_distribution.append({
            'domain': '其他',
            'percentage': percentage
        })
    
    return jsonify({
        'totalLearningTime': total_learning_time // 60,  # 转换为分钟
        'weeklyLearningTime': weekly_learning_time,
        'domainDistribution': domain_distribution
    }), 200

from flask import Blueprint, request, jsonify
from models.user_behavior import UserBehavior
from utils.auth import token_required
from services.user_behavior_stats_service import UserBehaviorStatsService

# 创建蓝图时添加一个唯一的 endpoint_prefix
user_behavior_stats_bp = Blueprint('user_behavior_stats', __name__, url_prefix='/api/user-behavior/stats')

stats_service = UserBehaviorStatsService()

# 修改路由装饰器，添加唯一的 endpoint 名称
@user_behavior_stats_bp.route('', methods=['GET'], endpoint='get_stats')
@token_required
def get_stats(current_user):
    """获取用户学习统计"""
    try:
        # 获取用户统计数据
        stats = stats_service.get_user_stats(current_user.id)
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'message': f'获取统计数据失败: {str(e)}'}), 500

# 如果有其他路由，也需要添加唯一的 endpoint
@user_behavior_stats_bp.route('/domains', methods=['GET'], endpoint='get_domain_stats')
@token_required
def get_domain_stats(current_user):
    """获取用户领域统计"""
    try:
        # 获取用户领域统计数据
        stats = stats_service.get_domain_distribution(current_user.id)
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'message': f'获取领域统计数据失败: {str(e)}'}), 500