ALTER TABLE movimentocontas ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;
UPDATE movimentocontas SET ativo = FALSE WHERE descricao_produtos LIKE '[SYSTEM_DELETED]%';
