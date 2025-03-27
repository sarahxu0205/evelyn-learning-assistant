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

def get_personalized_path(user_id, path_id, original_path_data):
    """获取个性化调整后的学习路径
    
    Args:
        user_id: 用户ID
        path_id: 学习路径ID
        original_path_data: 原始路径数据
        
    Returns:
        dict: 包含调整信息的字典，格式为:
        {
            'adjusted_path': 调整后的路径数据,
            'adjustment_type': 调整类型 ('frustration' 或 'behavior'),
            'frustrated_skills': 检测到的挫折技能列表
        }
        如果没有调整，则返回 None
    """
    # 初始化个性化服务
    personalization_service = PersonalizationService()
    
    # 检测用户是否遇到挫折
    frustrated_skills = personalization_service.detect_frustration(user_id)
    
    logger.info(f"检测结果：{frustrated_skills}")
    
    # 根据用户行为调整学习路径
    adjusted_path_data = None
    adjustment_type = None
    
    if frustrated_skills:
        # 如果检测到挫折，生成替代学习路径
        adjusted_path_data = personalization_service.generate_alternative_path(
            user_id, path_id, frustrated_skills
        )
        if adjusted_path_data:
            adjustment_type = "frustration"
    else:
        # 根据用户行为调整学习路径
        adjusted_path_data = personalization_service.adjust_path_based_on_behavior(
            user_id, path_id
        )
        if adjusted_path_data:
            adjustment_type = "behavior"
    
    # 如果有调整，解析调整后的路径数据
    if adjusted_path_data:
        try:
            adjusted_path = json.loads(adjusted_path_data)
            
            # 返回调整信息
            return {
                'adjusted_path': adjusted_path,
                'adjustment_type': adjustment_type,
                'frustrated_skills': frustrated_skills if frustrated_skills else []
            }
        except Exception as e:
            print(f"解析调整后的路径数据失败: {str(e)}")
    
    # 如果没有调整或解析失败，返回None
    return None

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
    
    # 获取个性化调整后的路径
    # personalized_info = get_personalized_path(current_user.id, path_id, original_path_data)
    
    # 构建响应数据
    response_data = {
        'id': path.id,
        'goal': path.goal,
        'path_data': original_path_data,
        'completion_rate': path.completion_rate,
        'created_at': path.created_at.isoformat(),
        'updated_at': path.updated_at.isoformat()
    }

    '''
    # 如果有个性化调整，添加到响应中
    if personalized_info:
        response_data['adjusted_path'] = personalized_info['adjusted_path']
        response_data['adjustment_type'] = personalized_info['adjustment_type']
        response_data['frustrated_skills'] = personalized_info['frustrated_skills']
    '''
    return jsonify(response_data), 200

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