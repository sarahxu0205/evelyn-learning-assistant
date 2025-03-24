from flask import Blueprint, request, jsonify
from services.learning_path_service import LearningPathService
from utils.auth import token_required
from models.learning_path import LearningPath, db

learning_path_bp = Blueprint('learning_path', __name__)
learning_path_service = LearningPathService()

@learning_path_bp.route('', methods=['POST'])
def create_learning_path():
    """创建学习路径"""
    data = request.get_json()
    
    if not data:
        return jsonify({'message': '请提供学习目标'}), 400
    
    goal = data.get('goal', '')
    
    if not goal:
        return jsonify({'message': '请提供学习目标'}), 400
    
    # 获取用户ID（如果已登录）
    user_id = None
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        try:
            import jwt
            token = auth_header.split(' ')[1]
            data = jwt.decode(token, 'evelyn-secret-key', algorithms=['HS256'])
            user_id = data.get('user_id')
        except:
            pass
    
    # 生成学习路径
    path_data = learning_path_service.generate_learning_path(goal, user_id)
    
    return jsonify(path_data), 201

@learning_path_bp.route('', methods=['GET'])
@token_required
def get_learning_paths(current_user):
    """获取用户的学习路径列表"""
    paths = LearningPath.query.filter_by(user_id=current_user.id).order_by(LearningPath.created_at.desc()).all()
    
    result = []
    for path in paths:
        result.append({
            'id': path.id,
            'goal': path.goal,
            'path_data': path.get_path_data(),
            'completion_rate': path.completion_rate,
            'created_at': path.created_at.isoformat(),
            'updated_at': path.updated_at.isoformat()
        })
    
    return jsonify(result), 200

@learning_path_bp.route('/<int:path_id>', methods=['GET'])
@token_required
def get_learning_path(current_user, path_id):
    """获取指定学习路径"""
    path = LearningPath.query.filter_by(id=path_id, user_id=current_user.id).first()
    
    if not path:
        return jsonify({'message': '学习路径不存在'}), 404
    
    return jsonify({
        'id': path.id,
        'goal': path.goal,
        'path_data': path.get_path_data(),
        'completion_rate': path.completion_rate,
        'created_at': path.created_at.isoformat(),
        'updated_at': path.updated_at.isoformat()
    }), 200

@learning_path_bp.route('/<int:path_id>/completion', methods=['PUT'])
@token_required
def update_completion_rate(current_user, path_id):
    """更新学习路径完成率"""
    data = request.get_json()
    
    if not data:
        return jsonify({'message': '请提供完成率'}), 400
    
    completion_rate = data.get('completion_rate', 0)
    
    if not isinstance(completion_rate, (int, float)) or completion_rate < 0 or completion_rate > 100:
        return jsonify({'message': '完成率必须是0-100之间的数字'}), 400
    
    # 查找学习路径
    path = LearningPath.query.filter_by(id=path_id, user_id=current_user.id).first()
    
    if not path:
        return jsonify({'message': '学习路径不存在'}), 404
    
    # 更新完成率
    path.completion_rate = completion_rate
    
    try:
        db.session.commit()
        return jsonify({
            'message': '更新成功',
            'completion_rate': path.completion_rate
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'更新失败: {str(e)}'}), 500