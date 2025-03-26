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
import logging

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# 创建唯一的蓝图实例
user_behavior_stats_bp = Blueprint('user_behavior_stats', __name__)
stats_service = UserBehaviorStatsService()

@user_behavior_stats_bp.route('/stats', methods=['GET'])
@token_required
def get_user_stats(current_user):
    """获取用户行为统计"""
    try:
        # 获取用户统计数据
        stats = stats_service.get_user_stats(current_user.id)
        logger.info(f"用户学习情况统计：{stats}")

        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'message': f'获取统计数据失败: {str(e)}'}), 500

@user_behavior_stats_bp.route('/domains', methods=['GET'])
@token_required
def get_domain_stats(current_user):
    """获取用户领域统计"""
    try:
        # 获取用户领域统计数据
        stats = stats_service.get_domain_distribution(current_user.id)
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'message': f'获取领域统计数据失败: {str(e)}'}), 500