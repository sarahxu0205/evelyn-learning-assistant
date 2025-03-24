from flask import Blueprint, request, jsonify
from models.user_behavior import UserBehavior, db
from utils.auth import token_required

user_behavior_bp = Blueprint('user_behavior', __name__)

@user_behavior_bp.route('', methods=['POST'])
@token_required
def record_behavior(current_user):
    """记录用户行为"""
    data = request.get_json()
    
    if not data:
        return jsonify({'message': '请提供行为数据'}), 400
    
    url = data.get('url', '')
    title = data.get('title', '')
    search_query = data.get('search_query', '')
    duration = data.get('duration', 0)
    
    if not url:
        return jsonify({'message': '请提供URL'}), 400
    
    # 创建用户行为记录
    behavior = UserBehavior(
        user_id=current_user.id,
        url=url,
        title=title,
        search_query=search_query,
        duration=duration
    )
    
    try:
        db.session.add(behavior)
        db.session.commit()
        return jsonify({'message': '记录成功', 'id': behavior.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'记录失败: {str(e)}'}), 500

@user_behavior_bp.route('', methods=['GET'])
@token_required
def get_behaviors(current_user):
    """获取用户行为列表"""
    behaviors = UserBehavior.query.filter_by(user_id=current_user.id).order_by(UserBehavior.timestamp.desc()).all()
    
    result = []
    for behavior in behaviors:
        result.append({
            'id': behavior.id,
            'url': behavior.url,
            'title': behavior.title,
            'search_query': behavior.search_query,
            'duration': behavior.duration,
            'timestamp': behavior.timestamp.isoformat()
        })
    
    return jsonify(result), 200