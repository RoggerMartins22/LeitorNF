from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    login: str
    senha: str


class UsuarioInfo(BaseModel):
    id: int
    nome: str
    login: str
    papel: str

    model_config = ConfigDict(from_attributes=True)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioInfo
