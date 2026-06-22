from slowapi import Limiter
from slowapi.util import get_remote_address

# TODO: no PythonAnywhere (WSGI), o estado em memória é reiniciado a cada
# worker. O rate limiting continua funcional por worker, mas não é compartilhado
# entre múltiplos workers simultâneos. Para ambiente de produção com alta
# concorrência, considere usar um backend Redis via slowapi.
limiter = Limiter(key_func=get_remote_address)
