SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

use academyhub;

drop table if exists answers;
drop table if exists alternatives;
drop table if exists questions;
drop table if exists lessons;
drop table if exists certificates;
drop table if exists unities;
drop table if exists users;

create table users(
    id int primary key auto_increment,
    public_id varchar(36) not null unique,
    username varchar(30) not null unique,
    password varchar(255) not null,
    experience int not null default 0,
    status boolean default true,
    role int not null default 0
);

create table unities(
    id int primary key auto_increment,
    public_id varchar(36) not null unique,
    name varchar(255) not null unique,
    description text
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

insert into users(
    public_id,
    username,
    password,
    role
) values (
    "33e5cabd-e14a-415a-b94d-421bead93a35",
    "prolud",
    "$2a$11$DUhfwmZQryBVO42zkE2sWOUFJpyPWhqQbMVDWcUORl7EOSPLv3SQW",
    1
), (
    "3b391393-bb34-49bf-9037-da0f3e60ad17",
    "erielfundador",
    "$2a$11$jaTx5ZQR2YvUt9OJG22THOKXL5AwOX8PGNfo.81jsdVxhkJ727WoK",
    1
);

insert into unities(public_id, name)
values(
    "613c10a9-7f33-453b-a704-56a85679727b",
    "Teologias Perigosas"
);

insert into lessons(public_id, title, description, sequence, video_url, unity_id)
values
    ("03eaaa3f-9baa-4e5b-9da5-bfe2545a8d8e", "Como Identificar um Ensino Falso", 'Nesta primeira mensagem da série "Teologias Perigosas"[...] na fé cristã.', 1, "https://youtu.be/7r1qARCbL8I?si=68QLE6yqbYFTm7jg", 1),
    ("be8626f0-d0b5-4f94-82e1-0e9f4c311ab1", "A Bíblia Tem Algum Erro?", 'Na segunda mensagem da série “Teologias Perigosas”[...] fortalecer sua fé.', 2, "https://youtu.be/zvsLciGgqVU?si=1Z7Z0xYguQJVncYh", 1),
    ("dbf26f85-08c6-478e-a6fd-7b09aa15f816", "Cuidado com Esses Ensinos", 'Na terceira e última mensagem da série “Teologias Perigosas”[...] da graça bíblica.', 3, "https://youtu.be/4QwlBR7qETw?si=dIpNmzx3qCLlQGUj", 1);

insert into questions(public_id, statement, lesson_id, unity_id)
values
    ("24527d31-2fce-4508-9ebc-3e4f1e15bdfa", "Título questão 1", 1, 1),
    ("b1233014-eefa-44e2-b3ab-026706c66a84", "Título questão 2", 1, 1),
    ("e56d470c-d16b-4898-bf5c-22ef141750b9", "Título questão 3", 2, 1),
    ("abd4ae85-d017-4f0f-aa4a-63a59cc1c270", "Título questão 4", 2, 1),
    ("299e6bf0-3b50-4a23-b416-30e6249d980c", "Título questão 5", 3, 1),
    ("13a7003c-1098-41bc-8956-27781a31215d", "Título questão 6", 3, 1);

insert into alternatives(public_id, text, is_correct, question_id)
values
    ("80c149cd-3ef3-4c80-b1d8-7fbbfd8c2693", "Texto f da alternativa", false, 1),
    ("e5b0710d-9842-47f1-b094-3c30e5a93270", "Texto 3 da alternativa", true, 1),
    ("af765fe3-c287-4c75-a5ce-e062cfe2b986", "Texto b da alternativa", false, 1),
    ("c72d0e77-3ef7-4dc6-a55b-d040f061a637", "Texto 5 da alternativa", false, 1),
    ("01f9b7e0-93f4-4621-ab43-b1e6c6b1a34e", "Texto 5 da alternativa", false, 2),
    ("b6d5fd89-107f-4585-972a-39e16225b5b8", "Texto 0 da alternativa", false, 2),
    ("68a24cf7-a434-4b47-94ee-ea1cfc71a481", "Texto 1 da alternativa", true, 2),
    ("0c8a496b-423a-4a3c-b168-ea7812e88502", "Texto b da alternativa", false, 2),
    ("22f629cd-145a-4403-9858-e5e27846306a", "Texto c da alternativa", true, 3),
    ("54acc19d-09e3-4c93-b687-31dafa0a1f4b", "Texto 3 da alternativa", false, 3),
    ("6c2d1b0d-6c84-4b20-a8f9-5f7a4c67ee26", "Texto 9 da alternativa", false, 3),
    ("6b8306f2-19eb-4201-a80d-48737f316366", "Texto a da alternativa", false, 3),
    ("b78ab888-c7a2-41b8-9aac-f56d60b3b7bf", "Texto 1 da alternativa", false, 4),
    ("8443be98-42c9-4ca7-8ad3-2978fe0b60b9", "Texto 8 da alternativa", false, 4),
    ("e3be774d-be78-417c-9ae0-4426fdcac033", "Texto c da alternativa", true, 4),
    ("03fdcf2c-cf34-45e6-b4ca-56eb301a7204", "Texto 5 da alternativa", false, 4),
    ("0c7f6a2d-295a-41fb-a40d-4b2788e2e662", "Texto 9 da alternativa", false, 5),
    ("593e9d35-82dc-4952-99f7-d6c0031dc9e0", "Texto 8 da alternativa", false, 5),
    ("4457b265-f749-4a08-87b4-953baa730344", "Texto 5 da alternativa", true, 5),
    ("e6d5cbe9-42c4-4a4e-9392-384d2956a1ff", "Texto 7 da alternativa", false, 5),
    ("02db9eab-4149-4f2e-8502-10db41ced859", "Texto 8 da alternativa", true, 6),
    ("0a409df7-2987-466f-b7cf-4e91336c23a4", "Texto 0 da alternativa", false, 6),
    ("29cf7fa1-f9f3-405b-b2e8-88f30a0746f8", "Texto e da alternativa", false, 6),
    ("bed2a7ed-8657-427f-b36b-276216fc787e", "Texto 9 da alternativa", false, 6);
