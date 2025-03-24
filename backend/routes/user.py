from flask import Blueprint, request, jsonify
import jwt
import json
from models.user import User, db
from models.user_behavior import UserBehavior
from functools import wraps  # 添加这一行

user_bp = Blueprint('user', __name__)

# 密钥用于JWT签名
SECRET_KEY = 'evelyn-secret-key'

def user_token_required(f):  # 修改装饰器名称
    """验证JWT令牌的装饰器"""
    @wraps(f)  # 添加 wraps 装饰器保留原函数信息
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
            current_user = User.query.get(user_id)
            if not current_user:
                return jsonify({'message': '用户不存在'}), 401
            
        except jwt.ExpiredSignatureError:
            return jsonify({'message': '令牌已过期'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': '无效的令牌'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

@user_bp.route('/<user_id>/profile', methods=['GET'], endpoint='get_profile')  # 添加唯一端点名称
@user_token_required  # 使用新的装饰器名称
def get_user_profile(current_user, user_id):
    """获取用户画像"""
    # 验证用户ID - 将user_id转换为整数再比较
    if current_user.id != int(user_id):
        return jsonify({'message': f'无权访问此用户信息'}), 403
    
    # 获取用户行为数据
    behaviors = UserBehavior.query.filter_by(user_id=user_id).all()
    
    # 分析用户行为
    domains = {}
    search_keywords = {}
    total_duration = 0
    
    for behavior in behaviors:
        # 分析域名
        domain = behavior.url.split('/')[2] if behavior.url and '/' in behavior.url else ''
        domains[domain] = domains.get(domain, 0) + 1
        
        # 分析搜索关键词
        if behavior.search_query:
            for keyword in behavior.search_query.split():
                search_keywords[keyword] = search_keywords.get(keyword, 0) + 1
        
        # 累计浏览时长
        total_duration += behavior.duration
    
    # 构建用户画像
    behavior_analysis = {
        'top_domains': sorted(domains.items(), key=lambda x: x[1], reverse=True)[:5],
        'top_keywords': sorted(search_keywords.items(), key=lambda x: x[1], reverse=True)[:10],
        'total_duration': total_duration,
        'behavior_count': len(behaviors)
    }
    
    # 解析用户存储的JSON数据
    try:
        learning_interests = json.loads(current_user.learning_interests) if hasattr(current_user, 'learning_interests') and current_user.learning_interests else []
        skill_levels = json.loads(current_user.skill_levels) if hasattr(current_user, 'skill_levels') and current_user.skill_levels else {}
    except (AttributeError, TypeError, json.JSONDecodeError):
        learning_interests = []
        skill_levels = {}
    
    # 构建用户画像响应
    profile = {
        'email': current_user.email,
        'learning_interests': learning_interests,
        'skill_levels': skill_levels,
        'learning_time': getattr(current_user, 'learning_time', None),
        'budget': getattr(current_user, 'budget', None),
        'purpose': '',  # 可以从用户数据中获取
        'behavior_analysis': behavior_analysis
    }
    
    return jsonify(profile), 200

@user_bp.route('/<user_id>/profile', methods=['PUT'], endpoint='update_profile')
@user_token_required
def update_user_profile(current_user, user_id):
    """更新用户画像"""
    # 验证用户ID - 将user_id转换为整数再比较
    if current_user.id != int(user_id):
        return jsonify({'message': f'无权修改此用户信息，当前用户ID: 请求的用户ID: {user_id}'}), 403
    
    data = request.get_json()
    
    if not data:
        return jsonify({'message': '请提供更新数据'}), 400
    
    # 更新用户数据
    try:
        if 'learning_time' in data and hasattr(current_user, 'learning_time'):
            current_user.learning_time = data['learning_time']
        
        if 'budget' in data and hasattr(current_user, 'budget'):
            current_user.budget = data['budget']
        
        if 'interests' in data and hasattr(current_user, 'learning_interests'):
            current_user.learning_interests = json.dumps(data['interests'])
        
        if 'skill_levels' in data and hasattr(current_user, 'skill_levels'):
            current_user.skill_levels = json.dumps(data['skill_levels'])
        
        # 保存更新
        db.session.commit()
        return jsonify({'message': '用户画像更新成功'}), 200
    except AttributeError as e:
        return jsonify({'message': f'更新失败: 用户模型缺少必要的属性 - {str(e)}'}), 400

@user_bp.route('/<user_id>/learning-paths', methods=['GET'], endpoint='get_learning_paths')
@user_token_required
def get_user_learning_paths(current_user, user_id):
    """获取用户的学习路径列表"""
    # 验证用户ID - 将user_id转换为整数再比较
    if current_user.id != int(user_id):
        return jsonify({'message': f'无权访问此用户信息，请求的用户ID: {user_id}'}), 403
    
    from models.learning_path import LearningPath
    
    # 获取用户的学习路径
    paths = LearningPath.query.filter_by(user_id=user_id).all()
    
    # 构建响应
    paths_list = []
    for path in paths:
        paths_list.append({
            'id': path.id,
            'title': path.title,
            'goal': path.goal,
            'created_at': path.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'estimated_time': path.estimated_time
        })
    
    return jsonify(paths_list), 200