SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

use academyhub;
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
