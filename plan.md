# Diflen Hub — CRUD de conteúdo para Admin

## Objetivo
Dar aos usuários com `Roles.Admin` permissão de CRUD nas entidades Unity, Lesson, Question e Alternative, permitindo configurar unidades, aulas, questões, alternativas e a resposta correta de cada questão. No frontend, disponibilizar telas/ações de edição gated pela role do usuário.

## Decisões confirmadas
- **Exclusão:** cascata completa (remove também respostas de usuários e certificados vinculados), com **alerta claro antes da ação** na interface.
- **Resposta correta:** exatamente uma alternativa correta por questão — ao marcar uma como correta, as demais da mesma questão são desmarcadas automaticamente.
- Referências por `publicId` nos endpoints admin (seguro contra renomeações).
- ⚠️ Tokens JWT existentes não terão o claim de role → admins precisam refazer login após o deploy.

---

## API (`diflen-hub-api`)

### 1. Autorização por role
- `src/infra/Services/JwtService.cs` — adicionar claim de role no token: `new Claim(ClaimTypes.Role, user.Role.ToString())`.
- Controllers admin usam `[Authorize(Roles = "Admin")]`.

### 2. Camada de repositório
- `IBaseRepository<T>` / `BaseRepository<T>` (`src/domain/Interfaces/Repositories/IBaseRepository.cs`, `src/infra/Repositories/BaseRepository.cs`): adicionar `UpdateAsync(T)`, `DeleteAsync(T)`, `DeleteRangeAsync(List<T>)` (RemoveRange + SaveChangesAsync).
- Cascata manual nos use cases de delete (ordem respeita as FKs RESTRICT; filhos antes dos pais):
  - **Unity:** certificados → respostas → alternativas → questões → aulas → unidade
  - **Lesson:** respostas → alternativas → questões → aula
  - **Question:** respostas → alternativas → questão
  - **Alternative:** respostas → alternativa
- Buscas de filhos por navegação já existentes no `IBaseRepository` (`GetListAsync(a => a.Alternative.Question.Lesson.Unity.PublicId == ...)` etc.).

### 3. Endpoints novos (4 controllers admin, todos `[Authorize(Roles="Admin")]`)
- **`AdminUnityController`** `api/admin/unity`: `POST` criar · `PUT {publicId}` · `DELETE {publicId}`
- **`AdminLessonController`** `api/admin/lesson`: `POST` · `PUT {publicId}` · `DELETE {publicId}` · `GET {publicId}` (árvore completa da aula: questões + alternativas **com `isCorrect`**, visível apenas para admin)
- **`AdminQuestionController`** `api/admin/question`: `POST` (lessonPublicId, statement) · `PUT {publicId}` · `DELETE {publicId}`
- **`AdminAlternativeController`** `api/admin/alternative`: `POST` (questionPublicId, text, isCorrect) · `PUT {publicId}` · `DELETE {publicId}`
- Regra "uma correta": o use case de create/update de alternativa desmarca as demais da mesma questão quando `IsCorrect = true`.
- Use case **só quando há regra de negócio** (if, validação entre entidades, cascata, consistência). CRUD puro (criar/atualizar/obter) chama o repositório direto — ver seção 4.

### 4. Use case vs repositório direto

**Repositório direto na controller (CRUD puro):**
- `AdminUnityController` `PUT {publicId}` — busca por publicId (404 se achar nada), atualiza nome/descrição via `IBaseRepository.UpdateAsync`.
- `AdminLessonController` `PUT {publicId}` — atualiza título, descrição, sequência, vídeo direto.
- `AdminLessonController` `GET {publicId}` — obtém a árvore via repositório e projeta o `AdminLessonResponse` na controller (questões + alternativas com `isCorrect`).
- `AdminQuestionController` `PUT {publicId}` — atualiza enunciado direto.

**Use cases mantidos (têm regra específica)** — em `src/application/UseCases/`, registrados em `src/application/Config/DependencyInjection.cs`:

**Unity**
- `CreateUnityUseCase` — unicidade do nome (`UNIQUE` → 400); validação básica fica no validator FluentValidation.
- `DeleteUnityUseCase` — cascata completa (certificados → respostas → alternativas → questões → aulas → unidade).

**Lesson**
- `CreateLessonUseCase` — recebe unityPublicId, valida unidade existente (404), preenche UnityId; video_url NOT NULL → default `""`.
- `DeleteLessonUseCase` — cascata (respostas → alternativas → questões → aula).

**Question**
- `CreateQuestionUseCase` — recebe lessonPublicId, valida aula existente (404), preenche UnityId via navegação.
- `DeleteQuestionUseCase` — cascata (respostas → alternativas → questão).

**Alternative**
- `CreateAlternativeUseCase` — recebe questionPublicId + text + isCorrect; se correta, desmarca as demais.
- `UpdateAlternativeUseCase` — atualiza texto/isCorrect; desmarca as demais quando correta.
- `DeleteAlternativeUseCase` — cascata (respostas → alternativa).

### 5. DTOs de request/resposta (com `[Description]` na convenção AGENTS.md)
- `api/Controllers/Requests/`: `CreateUnityRequest` / `UpdateUnityRequest` (name, description), `CreateLessonRequest` / `UpdateLessonRequest` (unityPublicId/–, title, description, sequence, videoUrl), `CreateQuestionRequest` / `UpdateQuestionRequest` (lessonPublicId/–, statement), `CreateAlternativeRequest` / `UpdateAlternativeRequest` (questionPublicId/–, text, isCorrect).
- `api/Controllers/Responses/`: `AdminLessonResponse` (publicId, title, description, sequence, videoUrl, questions[{publicId, statement, alternatives[{publicId, text, isCorrect}]}]) — projeção montada na controller (endpoint `GET` direto no repositório).
- Novos controllers com `[Tags]`, `[EndpointSummary]`, `[EndpointDescription]`, `[ProducesResponseType]` em cada endpoint.

#### 5.1 Validação com FluentValidation (regras básicas de request)
As validações básicas (campo obrigatório, tamanho, formato, faixa) ficam **fora** de use cases e controllers, via FluentValidation sobre as DTOs de request:

- **Pacote:** `dotnet add src/api/api.csproj package FluentValidation.AspNetCore` (segue a regra da AGENTS.md de nunca editar o `.csproj` à mão).
- **Registro** em `Program.cs`: `builder.Services.AddValidatorsFromAssemblyContaining<Program>();` — a validação automática do controller retorna **400** com os erros.
- **Validators** em `src/api/Controllers/Requests/Validators/`, um por DTO (`CreateUnityRequestValidator`, `UpdateUnityRequestValidator`, etc.), herdando `AbstractValidator<T>`:
  - **Unity:** `Name` required; `Name.Length` ≤ N; `Description` ≤ N.
  - **Lesson:** `Title` required; `Title.Length` ≤ N; `Description` ≤ N; `VideoUrl` formato URL quando informado; `Sequence` ≥ 0; `UnityPublicId` required (create).
  - **Question:** `Statement` required; `Statement.Length` ≤ N; `LessonPublicId` required (create).
  - **Alternative:** `Text` required; `Text.Length` ≤ N; `QuestionPublicId` required (create); `IsCorrect` — sem regra (basta `NOT NULL`).
- Com isso, use cases e controllers só cuidam de **regras de banco/existência**: unicidade (`UNIQUE` → 400) e validação de entidade pai (404). Nada de validação de formato neles.

### 6. Pequenas extensões aditivas em respostas de leitura existentes
- `GetUnitiesResponse` (`src/application/Dtos/GetUnitiesResponse.cs`) += `PublicId`.
- `GetLessonsResponse` (`src/api/Controllers/Responses/GetLessonsResponse.cs`) += `PublicId`, `Sequence`.

---

## Web (`diflen-hub-web`)

### 1. Tipos (`src/types/index.ts`)
- `Unity` += `publicId: string`.
- `Lesson` += `publicId: string`, `sequence: number`.
- Novos: `AdminAlternative` (text + isCorrect), `AdminQuestion` (statement + alternatives c/ isCorrect), `AdminLesson` (aula + questions c/ isCorrect), e payloads de create/update (`CreateUnityInput`, `CreateLessonInput`, `CreateQuestionInput`, `CreateAlternativeInput`).

### 2. Camada API (`src/lib/api/`)
- `unities.ts`: `create`, `update`, `remove`.
- `lessons.ts`: `create`, `update`, `remove`, `getAdminDetail(publicId)`.
- Novo `admin-content.ts`: `createQuestion`, `updateQuestion`, `deleteQuestion`, `createAlternative`, `updateAlternative`, `deleteAlternative`.

### 3. UI (gated por `user?.profile?.role === UserRole.Admin` via `useAuth`)
- **Home `/`** (`src/app/(authenticated)/page.tsx`): para admin — botão "Nova Unidade" + editar/excluir em cada card. Novo `UnityDialog` (react-hook-form + zod, padrão do `ImportPlaylistModal`). Invalida `queryKeys.unities.all`.
- **Página da unidade** (`/unity/[unityName]`): para admin — botão "Nova Aula" + editar/excluir por aula (título, descrição, sequência, `videoUrl`). Novo `LessonDialog`. Invalida `queryKeys.lessons.list(unityName)`.
- **Página da aula — aba Questionário**: para admin — modo editor: adicionar/editar/excluir questões e alternativas, com radio indicando a correta (uma por questão). Reutiliza `GET api/admin/lesson/{publicId}` via `getAdminDetail`. Invalida `queryKeys.questionnaire.byLesson(...)`.
- **Dialog de confirmação de exclusão** com alerta explícito (ex.: *"Excluir esta unidade também removerá todas as aulas, questões, alternativas, respostas e certificados relacionados. Esta ação não pode ser desfeita."*).
- Componentes novos em `src/components/admin/`: `unity-dialog.tsx`, `lesson-dialog.tsx`, `question-editor-dialog.tsx`, `confirm-dialog.tsx`, `lesson-admin-editor.tsx`.

### 4. Navegação pós-rename
- Ao renomear unidade/aula, links vindos das listas refletem o novo nome automaticamente (invalidação das queries). Sem mudanças de rota forçada.

---

## Verificação
- API: `dotnet build` na raiz `diflen-hub-api` (obrigatório pela AGENTS.md).
- Web: `npm run lint` e `npx tsc --noEmit` em `diflen-hub-web`.

## Pontos de atenção
- Caso algum registro órfão de schema antigo bloqueie a exclusão, a ordem de cascata acima garante que filhos saem antes dos pais.
- `lessons.video_url` é `NOT NULL` no schema → atribuir `""` quando não informado.
- `unities.name` e `lessons.title` são `UNIQUE` → nos use cases de create tratar violação como erro amigável (400). Nos `PUT` diretos (controller → repositório): publicId inexistente → 404; violação de `UNIQUE` → 400 (catch de `DbUpdateException` no controller).