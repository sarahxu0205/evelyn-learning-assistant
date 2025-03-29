from flask import Blueprint, request, jsonify
from models.user_behavior import UserBehavior, db
from utils.auth import token_required
import re
from urllib.parse import urlparse, parse_qs
from urllib.parse import unquote
import logging

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

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
    search_query = ""   
    # 从URL中包含搜索参数尝试提取search_query
    if url:
        parsed_url = urlparse(url)
        query_params = parse_qs(parsed_url.query)
        # 常见搜索参数名称
        search_param_names = ['q', 'query', 'key', 'keyword', 'wd', 'word', 'text', 'search', 'term']
        # 遍历所有可能的搜索参数名称
        for param in search_param_names:
            if param in query_params and query_params[param][0]:
                search_query = unquote(query_params[param][0])
                logger.info(f"从URL参数 '{param}' 提取到搜索关键字: {search_query}")
                break

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