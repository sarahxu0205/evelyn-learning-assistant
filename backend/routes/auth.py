from flask import Blueprint, request, jsonify
from models.user import User, db
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import re
from flask_cors import cross_origin
import logging  # 添加日志模块

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
@cross_origin()
def login():
    """用户登录（首次登录自动注册）"""
    logger.info(f"收到登录请求，请求头: {dict(request.headers)}")
    
    # 处理不同的 Content-Type
    if request.content_type and 'application/json' in request.content_type:
        try:
            data = request.get_json()
        except Exception as e:
            logger.error(f"解析JSON请求体失败: {str(e)}")
            return jsonify({'message': '请求格式错误，无法解析JSON数据'}), 400
    else:
        # 处理非JSON格式的请求
        try:
            raw_data = request.data.decode('utf-8')
            logger.info(f"原始请求数据: {raw_data}")
            # 尝试手动解析JSON
            import json
            try:
                data = json.loads(raw_data)
            except json.JSONDecodeError:
                # 如果不是JSON，尝试解析表单数据
                data = {}
                for key, value in request.form.items():
                    data[key] = value
                if not data and request.data:
                    return jsonify({'message': '无法解析请求数据，请使用JSON格式'}), 400
        except Exception as e:
            logger.error(f"处理请求数据失败: {str(e)}")
            return jsonify({'message': '请求处理失败'}), 400
    
    if not data:
        logger.warning("请求体为空或格式不正确")
        return jsonify({'message': '请提供登录信息'}), 400
    
    email = data.get('email', '')
    password = data.get('password', '')
    
    logger.info(f"登录信息: 邮箱={email}, 密码长度={len(password)}")
    # 验证邮箱格式
    if not re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', email):
        return jsonify({'message': '邮箱格式不正确'}), 400
    
    # 验证密码长度
    if len(password) < 6:
        return jsonify({'message': '密码长度不能少于6位'}), 400
    
    # 查找用户
    user = User.query.filter_by(email=email).first()
    # 如果用户不存在，自动注册
    if not user:
        try:
            logger.info(f"自动注册用户: 邮箱={email}")
            hashed_password = generate_password_hash(password)
            new_user = User(email=email, password=hashed_password)
            db.session.add(new_user)
            db.session.commit()
            user = new_user  # 使用新创建的用户
        except Exception as e:
            db.session.rollback()
            logger.info(f"自动注册用户失败: {str(e)}")
            return jsonify({'message': f'自动注册失败: {str(e)}'}), 500
    else:
        # 如果用户存在，验证密码
        logger.info(f"用户已存在: 邮箱={email}")
        if not check_password_hash(user.password, password):
            return jsonify({'message': '密码错误'}), 401
    
    # 生成Token
    token = jwt.encode(
        {
            'user_id': user.id,
            'exp': datetime.datetime.now() + datetime.timedelta(days=7)
        },
        'evelyn-secret-key',
        algorithm='HS256'
    )
    
    return jsonify({
        'message': '登录成功',
        'token': token,
        'user_id': user.id,
        'is_new_user': user == new_user if 'new_user' in locals() else False
    }), 200