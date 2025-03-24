from flask import Blueprint, request, jsonify
from services.need_analysis_service import NeedAnalysisService

need_analysis_bp = Blueprint('need_analysis', __name__)
need_analysis_service = NeedAnalysisService()

@need_analysis_bp.route('', methods=['POST'])
def analyze_need():
    """分析学习需求"""
    data = request.get_json()
    
    if not data:
        return jsonify({'message': '请提供学习目标'}), 400
    
    goal = data.get('goal', '')
    
    if not goal:
        return jsonify({'message': '请提供学习目标'}), 400
    
    # 分析学习需求
    analysis_data = need_analysis_service.analyze_learning_need(goal)
    
    return jsonify(analysis_data), 200