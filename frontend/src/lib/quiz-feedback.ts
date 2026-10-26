import confetti from 'canvas-confetti';
import { AnswerVerifyOut } from '@/types';

const CONFETTI_COLORS = ['#3b82f6', '#2563eb', '#93c5fd', '#16a34a', '#4ade80', '#facc15'];
const EASE_OUT_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';
const FEEDBACK_STAGGER_MS = 70;
const MAX_FEEDBACK_DELAY_MS = 350;
const UNITY_CELEBRATION_MS = 1500;

/**
 * Indica se o usuário pediu ao sistema operacional para reduzir animações.
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Converte o centro de um elemento para a origem relativa à janela usada pelo confete.
 *
 * @param element - Elemento de onde o confete deve sair.
 * @returns Coordenadas entre 0 e 1 em relação à largura e à altura da janela.
 */
function getViewportOrigin(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return {
    x: (rect.left + rect.width / 2) / window.innerWidth,
    y: (rect.top + rect.height / 2) / window.innerHeight,
  };
}

/**
 * Sacode o card de uma questão errada, sinalizando que a resposta precisa ser revista.
 * Com animações reduzidas, o card não se move: a borda vermelha já comunica o erro.
 */
function shakeWrongAnswer(card: HTMLElement, delay: number) {
  if (prefersReducedMotion()) return;
  card.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-7px)' },
      { transform: 'translateX(6px)' },
      { transform: 'translateX(-4px)' },
      { transform: 'translateX(2px)' },
      { transform: 'translateX(0)' },
    ],
    { duration: 420, delay, easing: 'ease-out' },
  );
}

/**
 * Expande um contorno verde a partir do card de uma questão correta.
 * Com animações reduzidas, o contorno apenas esmaece no lugar, sem se expandir.
 */
function pulseCorrectAnswer(card: HTMLElement, delay: number) {
  const finalOffset = prefersReducedMotion() ? '2px' : '14px';
  card.animate(
    [
      { outline: '2px solid color-mix(in oklch, var(--success) 70%, transparent)', outlineOffset: '2px' },
      { outline: '2px solid color-mix(in oklch, var(--success) 0%, transparent)', outlineOffset: finalOffset },
    ],
    { duration: 650, delay, easing: EASE_OUT_EXPO },
  );
}

/**
 * Anima os cards das questões verificadas, de cima para baixo, conforme o resultado de cada uma.
 *
 * @param answers - Resultado de cada questão enviada na última verificação.
 * @param cards - Cards das questões, indexados pelo id público da questão.
 */
export function playAnswerFeedback(answers: AnswerVerifyOut[], cards: Map<string, HTMLElement>) {
  answers.forEach((answer, index) => {
    const card = cards.get(answer.publicQuestionId);
    if (!card) return;
    const delay = Math.min(index * FEEDBACK_STAGGER_MS, MAX_FEEDBACK_DELAY_MS);
    if (answer.isCorrect) pulseCorrectAnswer(card, delay);
    else shakeWrongAnswer(card, delay);
  });
}

/**
 * Dispara uma explosão de confete a partir do elemento informado, celebrando a conclusão da aula.
 * Não dispara nada quando o usuário pediu animações reduzidas.
 *
 * @param source - Elemento de onde o confete sai.
 */
export function celebrateLessonCompletion(source: HTMLElement) {
  confetti({
    particleCount: 110,
    spread: 75,
    startVelocity: 42,
    scalar: 0.9,
    ticks: 220,
    origin: getViewportOrigin(source),
    colors: CONFETTI_COLORS,
    disableForReducedMotion: true,
  });
}

/**
 * Celebra a conclusão da unidade: além da explosão da aula, lança confete pelas
 * laterais da tela por um segundo e meio.
 * Não dispara nada quando o usuário pediu animações reduzidas.
 *
 * @param source - Elemento de onde sai a explosão central.
 */
export function celebrateUnityCompletion(source: HTMLElement) {
  celebrateLessonCompletion(source);
  const end = Date.now() + UNITY_CELEBRATION_MS;

  const launchFromSides = () => {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 60,
      startVelocity: 55,
      origin: { x: 0, y: 0.75 },
      colors: CONFETTI_COLORS,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 60,
      startVelocity: 55,
      origin: { x: 1, y: 0.75 },
      colors: CONFETTI_COLORS,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) requestAnimationFrame(launchFromSides);
  };

  launchFromSides();
}
