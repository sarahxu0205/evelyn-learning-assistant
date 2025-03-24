from flask import request, jsonify
from functools import wraps
import jwt
from models.user import User

def token_required(f):
    """验证Token的装饰器"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # 从请求头中获取token
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'message': '缺少认证Token'}), 401
        
        try:
            # 解码token
            data = jwt.decode(token, 'evelyn-secret-key', algorithms=['HS256'])
            current_user = User.query.filter_by(id=data['user_id']).first()
            
            if not current_user:
                return jsonify({'message': '无效的Token'}), 401
            
        except Exception as e:
            return jsonify({'message': f'无效的Token: {str(e)}'}), 401
        
        # 将用户信息传递给被装饰的函数
        return f(current_user, *args, **kwargs)
    
    return decorated