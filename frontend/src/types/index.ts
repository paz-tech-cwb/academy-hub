export enum UserRole {
  User = 1,
  Admin = 2,
  Professor = 3,
}

export interface LoginResponse {
  isLogged: boolean;
  accessToken: string;
  expiresIn?: string;
  message: string;
}

export interface ManagedUser {
  publicId: string;
  username: string;
  experience: number;
  status: boolean;
  role: UserRole;
  /** Identifica a função mesmo quando ela foi criada em runtime e não existe em `UserRole`. */
  rolePublicId: string | null;
  roleName: string;
}

export interface PaginatedUsers {
  items: ManagedUser[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UpdateUserInput {
  status?: boolean;
  rolePublicId?: string;
}

/** Funcionalidade do catálogo: a unidade de acesso que uma função concede. */
export interface Capability {
  publicId: string;
  code: string;
  name: string;
  description: string | null;
}

/** Função: o que se atribui ao usuário. Aponta direto para as funcionalidades. */
export interface Role {
  publicId: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  capabilities: Capability[];
}

export interface CreateRoleInput {
  name: string;
  description?: string | null;
}

export type UpdateRoleInput = CreateRoleInput;

export interface LeaderboardEntry {
  position: number;
  publicId: string;
  username: string;
  experience: number;
  profilePicUrl: string | null;
}

/** Dados públicos de um usuário, retornados por `GET /api/user/{username}`. */
export interface UserProfile {
  publicId: string;
  username: string;
  experience: number;
  requiredExperienceToNextLevel: number;
  level: number;
  /** Progresso dentro do nível atual, de 0 a 100. */
  levelPercentage: number;
  role: UserRole;
  profilePicUrl: string | null;
  /** Identificador (`@usuario`) ou endereço completo do perfil no Instagram. */
  instagram: string | null;
  aboutMe: string | null;
}

/** Dados editáveis do próprio perfil, retornados por `GET /api/me/profile`. Inclui o e-mail, que não é público. */
export interface MyProfile {
  profilePicUrl: string | null;
  aboutMe: string | null;
  instagram: string | null;
  email: string | null;
}

export interface UpdateMyProfileInput {
  aboutMe: string | null;
  instagram: string | null;
  email: string | null;
}

export interface PaginatedLeaderboard {
  items: LeaderboardEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Unity {
  publicId: string;
  name: string;
  description: string | null;
  unityCover?: string | null;
}

export interface UnityDetail extends Unity {
  wasUnityCorrectlyAnswered: boolean;
  wasCertificateAlreadyIssued: boolean;
}

export interface Lesson {
  publicId: string;
  title: string;
  sequence: number;
  concluded: boolean;
}

export interface LessonDetail extends Lesson {
  description: string | null;
  videoUrl: string | null;
}

export interface Alternative {
  publicId: string;
  text: string;
}

export interface Question {
  publicId: string;
  statement: string;
  alternatives: Alternative[];
}

export interface AnswerVerifyRequest {
  publicLessonId?: string;
  unityName: string;
  answers: {
    publicQuestionId: string;
    publicAlternativeId: string;
  }[];
}

export interface AnswerVerifyOut {
  publicQuestionId: string;
  publicAlternativeId: string;
  isCorrect: boolean;
}

export interface VerifyAnswersResponse {
  answers: AnswerVerifyOut[];
  currentPointsWeight: number;
  /**
   * Indica se todas as questões da **unidade inteira** estão corretamente
   * respondidas (não apenas as desta lição). A flag de conclusão da lição
   * é derivada no client a partir de `answers[].isCorrect`.
   */
  wasUnityCorrectlyAnswered: boolean;
  WasLessonCorrectlyAnswered: boolean;
  wasCertificateAlreadyIssued: boolean;
  message: string | null;
}

export interface CertificateResponse {
  unityName: string;
  createdAt: string;
}

export interface AdminAlternative {
  publicId: string;
  text: string;
  isCorrect: boolean;
}

export interface AdminQuestion {
  publicId: string;
  statement: string;
  alternatives: AdminAlternative[];
}

export interface AdminLesson {
  publicId: string;
  title: string;
  description: string | null;
  sequence: number;
  videoUrl: string | null;
  questions: AdminQuestion[];
}

export interface CreateUnityInput {
  name: string;
  description?: string | null;
}

export type UpdateUnityInput = CreateUnityInput;

/** Área de recorte em pixels da imagem original. */
export interface CoverCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Alteração de imagem (capa da unidade ou foto de perfil) escolhida num modal e ainda não enviada.
 * `src` é uma object URL do arquivo local; o recorte em blob só é gerado ao salvar.
 */
export type PendingCover =
  | { kind: 'file'; src: string; mimeType: string; crop: CoverCrop }
  | { kind: 'url'; url: string; crop: CoverCrop }
  | { kind: 'remove' };

export interface CreateLessonInput {
  unityPublicId: string;
  title: string;
  description?: string | null;
  videoUrl?: string | null;
}

export interface UpdateLessonInput {
  title: string;
  description?: string | null;
  videoUrl?: string | null;
}

export interface ReorderLessonsInput {
  lessons: {
    publicId: string;
    sequence: number;
  }[];
}

export interface CreateQuestionInput {
  lessonPublicId: string;
  statement: string;
}

export interface UpdateQuestionInput {
  statement: string;
}

export interface CreateAlternativeInput {
  questionPublicId: string;
  text: string;
  isCorrect: boolean;
}

export interface UpdateAlternativeInput {
  text: string;
  isCorrect: boolean;
}
