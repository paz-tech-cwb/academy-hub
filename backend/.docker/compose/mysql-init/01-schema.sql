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
