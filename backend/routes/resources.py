from flask import Blueprint, request, jsonify
from services.resource_service import ResourceService
import logging  # 添加日志模块

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

resources_bp = Blueprint('resources', __name__)
resource_service = ResourceService()

@resources_bp.route('/page', methods=['POST'])
def get_page_resources():
    """获取当前页面的相关资源"""
    data = request.get_json()
    
    if not data:
        logger.warning("请求中没有提供数据")
        return jsonify({'message': '请提供页面信息'}), 400
    
    url = data.get('url', '')
    title = data.get('title', '')
    content = data.get('content', '')
    
    logger.debug(f"请求参数: URL={url}, 标题={title}, 内容长度={len(content)}")
    
    if not url or not title:
        logger.warning("缺少必要参数: URL或标题")
        return jsonify({'message': '请提供页面URL和标题'}), 400
    
    # 获取页面资源
    logger.info(f"开始处理页面资源请求: {title}")
    resources = resource_service.get_page_resources(url, title, content)
    logger.info(f"页面资源处理完成，返回{len(resources)}个资源")
    
    return jsonify(resources), 200