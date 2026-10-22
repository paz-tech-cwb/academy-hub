SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

use academyhub;
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
