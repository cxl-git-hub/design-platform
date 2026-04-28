"""认证路由 — 注册 / 登录"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from database import get_db
from models.user import User
from services.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["认证"])


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/register")
async def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # 检查重复
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(400, "用户名已存在")
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(400, "邮箱已注册")

    user = User(
        username=req.username,
        email=req.email,
        hashed_password=hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.username)
    return {
        "id": user.id,
        "username": user.username,
        "token": token,
    }


@router.post("/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(401, "用户名或密码错误")

    token = create_access_token(user.id, user.username)
    return {
        "id": user.id,
        "username": user.username,
        "token": token,
    }
