from flask import Blueprint, request, jsonify
import json
from models.user import User, db
from models.user_behavior import UserBehavior
from utils.auth import token_required  # 导入统一的装饰器

user_bp = Blueprint('user', __name__)

@user_bp.route('/<user_id>/profile', methods=['GET'], endpoint='get_profile')
@token_required  # 使用统一的装饰器
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
@token_required
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
