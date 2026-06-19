from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.auth import LoginRequest, LoginResponse, UsuarioInfo
from app.services.auth_service import (
    criar_token,
    get_current_user,
    verificar_senha,
)


router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.login == body.login).first()
    if not usuario or not usuario.ativo or not verificar_senha(body.senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login ou senha inválidos.",
        )

    token = criar_token({"sub": usuario.login})
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        usuario=UsuarioInfo.model_validate(usuario),
    )


@router.get("/me", response_model=UsuarioInfo)
def me(current: Usuario = Depends(get_current_user)):
    return UsuarioInfo.model_validate(current)
