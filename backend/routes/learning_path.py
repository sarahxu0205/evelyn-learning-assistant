from flask import Blueprint, request, jsonify
from services.learning_path_service import LearningPathService
from utils.auth import token_required
from models.learning_path import LearningPath, db
from services.personalization_service import PersonalizationService
import json
import logging

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

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
    
    # 验证权限
    if path.user_id != current_user.id:
        return jsonify({'message': '无权访问此学习路径'}), 403
    
    # 获取原始路径数据
    original_path_data = path.get_path_data()
    
    # 构建响应数据
    response_data = {
        'id': path.id,
        'goal': path.goal,
        'path_data': original_path_data,
        'completion_rate': path.completion_rate,
        'created_at': path.created_at.isoformat(),
        'updated_at': path.updated_at.isoformat()
    }

    return jsonify(response_data), 200

# 新增：检测用户是否遇到挫折的接口
@learning_path_bp.route('/<int:path_id>/detect-frustration', methods=['GET'])
@token_required
def detect_frustration(current_user, path_id):
    """检测用户是否在当前学习路径中遇到挫折"""
    # 验证学习路径存在且属于当前用户
    path = LearningPath.query.filter_by(id=path_id, user_id=current_user.id).first()
    if not path:
        return jsonify({'message': '学习路径不存在'}), 404
    
    # 初始化个性化服务
    personalization_service = PersonalizationService()
    
    # 检测用户是否遇到挫折
    frustrated_skills = personalization_service.detect_frustration(current_user.id)
    
    logger.info(f"用户 {current_user.id} 的挫折检测结果：{frustrated_skills}")
    
    return jsonify({
        'has_frustration': bool(frustrated_skills),
        'frustrated_skills': frustrated_skills if frustrated_skills else []
    }), 200

# 新增：生成备选学习路径的接口
@learning_path_bp.route('/<int:path_id>/generate-alternative', methods=['POST'])
@token_required
def generate_alternative_path(current_user, path_id):
    """根据用户挫折情况生成备选学习路径"""
    # 验证学习路径存在且属于当前用户
    path = LearningPath.query.filter_by(id=path_id, user_id=current_user.id).first()
    if not path:
        return jsonify({'message': '学习路径不存在'}), 404
    
    # 初始化个性化服务
    personalization_service = PersonalizationService()
    
    # 检测用户是否遇到挫折
    frustrated_skills = personalization_service.detect_frustration(current_user.id)
    
    if not frustrated_skills:
        return jsonify({'message': '未检测到学习挫折，无需生成备选路径'}), 400
    
    # 生成备选学习路径
    adjusted_path_data = personalization_service.generate_alternative_path(
        current_user.id, path_id, frustrated_skills
    )
    
    if not adjusted_path_data:
        return jsonify({'message': '生成备选学习路径失败'}), 500
    
    try:
        # 解析调整后的路径数据
        adjusted_path = json.loads(adjusted_path_data)
        
        return jsonify({
            'original_path_id': path_id,
            'adjusted_path': adjusted_path,
            'frustrated_skills': frustrated_skills
        }), 200
    except Exception as e:
        logger.error(f"解析调整后的路径数据失败: {str(e)}")
        return jsonify({'message': '解析备选学习路径失败'}), 500

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