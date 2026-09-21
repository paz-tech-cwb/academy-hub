export enum UserRole {
  User = 0,
  Admin = 1,
}

export interface UserProfile {
  publicId: string;
  username: string;
  experience: number;
  profilePic: string;
  requiredExperienceToNextLevel: number;
  level: number;
  levelPercentage: number;
  role: UserRole;
}

export interface LoginResponse {
  isLogged: boolean;
  accessToken: string;
  expiresIn?: string;
  message: string;
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

export interface CreateLessonInput {
  unityPublicId: string;
  title: string;
  description?: string | null;
  sequence: number;
  videoUrl?: string | null;
}

export interface UpdateLessonInput {
  title: string;
  description?: string | null;
  sequence: number;
  videoUrl?: string | null;
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
