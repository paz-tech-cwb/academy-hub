SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

use academyhub;

drop table if exists role_capabilities;
drop table if exists capabilities;
drop table if exists answers;
drop table if exists alternatives;
drop table if exists questions;
drop table if exists lessons;
drop table if exists certificates;
drop table if exists unities;
drop table if exists users;
drop table if exists roles;

create table roles(
    id int primary key auto_increment,
    public_id varchar(36) not null unique,
    name varchar(50) not null unique,
    description varchar(255),
    is_system boolean not null default false
);

create table capabilities(
    id int primary key auto_increment,
    public_id varchar(36) not null unique,
    code varchar(100) not null unique,
    name varchar(100) not null,
    description varchar(255)
);

create table role_capabilities(
    id int primary key auto_increment,
    public_id varchar(36) not null unique,
    role_id int not null,
    capability_id int not null,
    unique key uq_role_capability (role_id, capability_id),
    foreign key (role_id) references roles(id) on delete cascade,
    foreign key (capability_id) references capabilities(id) on delete cascade
);

create table users(
    id int primary key auto_increment,
    public_id varchar(36) not null unique,
    username varchar(30) not null unique,
    password varchar(255) not null,
    experience int not null default 0,
    status boolean default true,
    role int not null default 1,
    profile_pic_url varchar(500),
    instagram varchar(255),
    email varchar(255),
    about_me text,
    constraint fk_users_role foreign key (role) references roles(id)
);

create table unities(
    id int primary key auto_increment,
    public_id varchar(36) not null unique,
    name varchar(255) not null unique,
    description text,
    cover_url varchar(500)
);

create table certificates(
    id int primary key auto_increment,
    public_id varchar(36) not null unique,
    unity_id int not null,
    user_id int not null,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP not null,
    foreign key (unity_id) references unities(id),
    foreign key (user_id) references users(id)
);

create table lessons(
    id int primary key auto_increment,
    public_id varchar(36) not null unique,
    title varchar(100) not null unique,
    description text,
    sequence int not null,
    video_url varchar(255) not null,
    unity_id int not null,
    foreign key (unity_id) references unities(id)
);

create table questions(
    id int primary key auto_increment,
    public_id varchar(36) not null unique,
    statement text not null,
    lesson_id int not null,
    unity_id int not null,
    foreign key (lesson_id) references lessons(id),
    foreign key (unity_id) references unities(id)
);

create table alternatives(
    id int primary key auto_increment,
    public_id varchar(36) not null unique,
    text text not null,
    is_correct boolean not null,
    question_id int not null,
    foreign key (question_id) references questions(id)
);

create table answers(
    id int primary key auto_increment,
    public_id varchar(36) not null unique,
    alternative_id int not null,
    user_id int not null,
    question_id int not null,
    lesson_id int not null,
    unity_id int not null,
    is_correct boolean not null,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP not null,
    foreign key (alternative_id) references alternatives(id),
    foreign key (user_id) references users(id),
    foreign key (question_id) references questions(id),
    foreign key (lesson_id) references lessons(id),
    foreign key (unity_id) references unities(id)
);

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
    (UUID(), 2, 1), (UUID(), 2, 2), (UUID(), 2, 3), (UUID(), 2, 4), (UUID(), 2, 5), (UUID(), 2, 6),
    (UUID(), 3, 2), (UUID(), 3, 3), (UUID(), 3, 4);

insert into users(
    public_id,
    username,
    password,
    experience,
    role,
    instagram,
    about_me,
    profile_pic_url
) values (
    "7a8e76dc-b3ae-4c84-bbe2-c67a19127bf7",
    "lucasaguiar",
    "$2a$11$AaHjow/HXXwaP6laCO.c4uyfQ2JPUtR5IzDI4.h61eH0crqtJbfP2",
    1784,
    2,
    "_prolud_",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "https://avatars.githubusercontent.com/u/163533114?v=4"
);

insert into users(
    public_id,
    username,
    password,
    role
) values (
    "915684cb-b6d4-4bce-a9f2-c7f93d5dcd78",
    "erielfundador",
    "$2a$11$jaTx5ZQR2YvUt9OJG22THOKXL5AwOX8PGNfo.81jsdVxhkJ727WoK",
    1
), (
    "fd471476-5c77-4ba6-a5ec-cf2ea2349af1",
    "jackson",
    "$2a$11$jaTx5ZQR2YvUt9OJG22THOKXL5AwOX8PGNfo.81jsdVxhkJ727WoK",
    1
), (
    "35f011b5-d534-4b49-b7b3-ccb1850532bb",
    "kaucartelli",
    "$2a$11$jaTx5ZQR2YvUt9OJG22THOKXL5AwOX8PGNfo.81jsdVxhkJ727WoK",
    1
), (
    "2f75a4f2-b0c5-4588-be2e-103ea82c4fe2",
    "wollimendes",
    "$2a$11$jaTx5ZQR2YvUt9OJG22THOKXL5AwOX8PGNfo.81jsdVxhkJ727WoK",
    1
), (
    "af241179-32bd-4975-b171-d127ce776d34",
    "danielsouza",
    "$2a$11$jaTx5ZQR2YvUt9OJG22THOKXL5AwOX8PGNfo.81jsdVxhkJ727WoK",
    1
);






insert into unities(public_id, name, cover_url)
values(
    "4e9d2fd4-c8b2-11f1-bd9e-2214ed7128a8",
    "Teologias Perigosas",
    "https://pub-928c4ebf165a4e05870940ce127e2377.r2.dev/unities/4e9d2fd4-c8b2-11f1-bd9e-2214ed7128a8.png"
);

insert into lessons(public_id, title, description, sequence, video_url, unity_id)
values
    (UUID(), "Como Identificar um Ensino Falso", 'Nesta primeira mensagem da série "Teologias Perigosas"[...] na fé cristã.', 1, "https://youtu.be/7r1qARCbL8I?si=68QLE6yqbYFTm7jg", 1),
    (UUID(), "A Bíblia Tem Algum Erro?", 'Na segunda mensagem da série “Teologias Perigosas”[...] fortalecer sua fé.', 2, "https://youtu.be/zvsLciGgqVU?si=1Z7Z0xYguQJVncYh", 1),
    (UUID(), "Cuidado com Esses Ensinos", 'Na terceira e última mensagem da série “Teologias Perigosas”[...] da graça bíblica.', 3, "https://youtu.be/4QwlBR7qETw?si=dIpNmzx3qCLlQGUj", 1);

insert into questions(public_id, statement, lesson_id, unity_id)
values
    (UUID(), "Título questão 1", 1, 1),
    (UUID(), "Título questão 2", 1, 1),
    (UUID(), "Título questão 3", 2, 1),
    (UUID(), "Título questão 4", 2, 1),
    (UUID(), "Título questão 5", 3, 1),
    (UUID(), "Título questão 6", 3, 1);

insert into alternatives(public_id, text, is_correct, question_id)
values
    (UUID(), "Texto f da alternativa", false, 1),
    (UUID(), "Texto 3 da alternativa", true, 1),
    (UUID(), "Texto b da alternativa", false, 1),
    (UUID(), "Texto 5 da alternativa", false, 1),
    (UUID(), "Texto 5 da alternativa", false, 2),
    (UUID(), "Texto 0 da alternativa", false, 2),
    (UUID(), "Texto 1 da alternativa", true, 2),
    (UUID(), "Texto b da alternativa", false, 2),
    (UUID(), "Texto c da alternativa", true, 3),
    (UUID(), "Texto 3 da alternativa", false, 3),
    (UUID(), "Texto 9 da alternativa", false, 3),
    (UUID(), "Texto a da alternativa", false, 3),
    (UUID(), "Texto 1 da alternativa", false, 4),
    (UUID(), "Texto 8 da alternativa", false, 4),
    (UUID(), "Texto c da alternativa", true, 4),
    (UUID(), "Texto 5 da alternativa", false, 4),
    (UUID(), "Texto 9 da alternativa", false, 5),
    (UUID(), "Texto 8 da alternativa", false, 5),
    (UUID(), "Texto 5 da alternativa", true, 5),
    (UUID(), "Texto 7 da alternativa", false, 5),
    (UUID(), "Texto 8 da alternativa", true, 6),
    (UUID(), "Texto 0 da alternativa", false, 6),
    (UUID(), "Texto e da alternativa", false, 6),
    (UUID(), "Texto 9 da alternativa", false, 6);
