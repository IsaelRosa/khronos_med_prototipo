-- APENAS PARA BANCO DE TESTE ISOLADO, sem dados reais e sem acesso publico.
-- Execute primeiro schema.mysql.sql em um banco MySQL 8 vazio.
-- As contas abaixo usam a senha conhecida "senha123". Nunca use em producao.
-- CPFs sao numeros ficticios invalidos e nao identificam pessoas reais.
-- Execute uma unica vez. Emails, codigos ou CPFs duplicados geram erro.

START TRANSACTION;

INSERT INTO users (id, email, password, name, role) VALUES
  (UUID(), 'admin-teste@example.invalid', '$2b$10$N1uYTgsvvM7wTFtAwMwjU.g6gk7BLN1hylU25jF2pTMDpH7u7PeWW', 'Administrador de Teste', 'admin'),
  (UUID(), 'medico-teste@example.invalid', '$2b$10$N1uYTgsvvM7wTFtAwMwjU.g6gk7BLN1hylU25jF2pTMDpH7u7PeWW', 'Medico de Teste', 'medico'),
  (UUID(), 'recepcao-teste@example.invalid', '$2b$10$N1uYTgsvvM7wTFtAwMwjU.g6gk7BLN1hylU25jF2pTMDpH7u7PeWW', 'Recepcao de Teste', 'recepcao');

INSERT INTO patients (id, code, name, cpf, birth, sex, email, allergies, medications, notes) VALUES
  (UUID(), 'TESTE-001', 'Paciente Ficticio 01', '00000000000', '1985-01-15', 'F', 'paciente01@example.invalid', JSON_ARRAY(), JSON_ARRAY(), 'Registro ficticio para testes.'),
  (UUID(), 'TESTE-002', 'Paciente Ficticio 02', '11111111111', '1990-04-20', 'M', 'paciente02@example.invalid', JSON_ARRAY(), JSON_ARRAY(), 'Registro ficticio para testes.'),
  (UUID(), 'TESTE-003', 'Paciente Ficticio 03', '22222222222', '1978-07-10', 'F', 'paciente03@example.invalid', JSON_ARRAY(), JSON_ARRAY(), 'Registro ficticio para testes.'),
  (UUID(), 'TESTE-004', 'Paciente Ficticio 04', '33333333333', '2000-09-05', 'M', 'paciente04@example.invalid', JSON_ARRAY(), JSON_ARRAY(), 'Registro ficticio para testes.'),
  (UUID(), 'TESTE-005', 'Paciente Ficticio 05', '44444444444', '1995-12-01', 'F', 'paciente05@example.invalid', JSON_ARRAY(), JSON_ARRAY(), 'Registro ficticio para testes.');

COMMIT;
