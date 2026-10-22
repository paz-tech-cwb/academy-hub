SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

use academyhub;
-- Ids explícitos: users.role é FK para roles.id e o enum domain.Enums.Roles
-- fixa os mesmos valores. O name TEM que casar com nameof(Roles.X), porque o
-- JwtService grava user.Role.ToString() no claim.
insert into roles(id, public_id, name, description, is_system) values
    (1, UUID(), "User", "Usuário comum da plataforma.", true),
    (2, UUID(), "Admin", "Administrador com acesso total.", true),
    (3, UUID(), "Professor", "Cria questionários e importa playlists.", false);

alter table roles auto_increment = 4;

-- O code é constante em domain.Constants.Capabilities e aparece no
-- [Authorize(Policy = ...)]: criar linha nova aqui não concede nada.
insert into capabilities(id, public_id, code, name, description) values
    (1, UUID(), "content.manage", "Gerenciar conteúdos", "Criar, editar, excluir e reordenar unidades e aulas."),
    (2, UUID(), "content.read", "Visualizar conteúdos para edição", "Ver a árvore de questões e alternativas de uma aula."),
    (3, UUID(), "questionnaire.manage", "Gerenciar questionários", "Criar, editar e excluir questões e alternativas."),
    (4, UUID(), "playlist.import", "Importar playlists", "Importar uma playlist do YouTube como nova unidade."),
    (5, UUID(), "users.manage", "Gerenciar usuários", "Listar, editar, inativar e excluir usuários."),
    (6, UUID(), "permissions.manage", "Gerenciar permissões", "Configurar funções e as funcionalidades de cada uma.");

-- A função aponta direto para as funcionalidades. User fica sem nenhuma:
-- acessa /settings e não vê nenhum card.
insert into role_capabilities(public_id, role_id, capability_id) values
    (UUID(), 2, 1),
    (UUID(), 2, 2),
    (UUID(), 2, 3),
    (UUID(), 2, 4),
    (UUID(), 2, 5),
    (UUID(), 2, 6),
    (UUID(), 3, 2),
    (UUID(), 3, 3),
    (UUID(), 3, 4);
