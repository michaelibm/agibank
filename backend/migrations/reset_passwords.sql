-- ═══════════════════════════════════════════════════════════
-- AGIBANK — Reset de senhas (rode se as credenciais não funcionam)
-- ═══════════════════════════════════════════════════════════

-- superadmin → senha: superadmin123
UPDATE super_admins
SET senha_hash = '$2b$10$qchMLtO/t2jWhWMkijcvRujW9fxDRdmrzME7vsrhUmZlaAvKNq0A6'
WHERE login = 'superadmin';

-- admin da empresa agibank → senha: admin123
UPDATE administradores a
SET senha_hash = '$2b$10$q7SJ3mogXRUwHKn3ErhUuepEk6zjeRKHBpbkUGf2bcWdo1lgVPt1u'
FROM empresas e
WHERE a.empresa_id = e.id AND e.slug = 'agibank' AND a.login = 'admin';

-- Confirmação
SELECT 'superadmin' AS tipo, login, 'superadmin123' AS senha_atual FROM super_admins WHERE login='superadmin'
UNION ALL
SELECT 'admin_empresa', a.login, 'admin123' FROM administradores a JOIN empresas e ON e.id=a.empresa_id WHERE e.slug='agibank';
