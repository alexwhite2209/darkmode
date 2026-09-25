import type { Chapter } from "@/types";
import { asset } from "@/lib/asset";

/**
 * Chapters of the one-take journey (seconds of the 30 s hero video).
 * Every world stands for one kind of website. Captions sit away from the action in frame.
 */
const timeline: Chapter[] = [
  {
    id: "portal",
    kind: "3D и WebGL",
    title: "Не просто сайт, а путешествие",
    text: "3D-сцены прямо в браузере. Гость не листает страницу, он путешествует.",
    start: 2.9,
    end: 5.3,
    placement: "bottom-left",
    still: { src: asset("/images/worlds/portal.webp"), alt: "Буква O с огненной короной крупным планом" },
  },
  {
    id: "dino",
    kind: "Интерактивные сайты",
    title: "Масштаб, который чувствуется",
    text: "Большие сцены и анимация по скроллу. Плавно даже на обычном ноутбуке.",
    start: 5.3,
    end: 8.6,
    placement: "left",
    still: { src: asset("/images/worlds/dino.webp"), alt: "Гигантский динозавр в фэнтези-долине открывает пасть" },
  },
  {
    id: "drift",
    kind: "Любая тематика",
    title: "Разная тематика и дизайн",
    text: "Подберём для вас: стиль, сюжет и настроение под ваш бизнес.",
    start: 9.1,
    end: 12.6,
    placement: "bottom-left",
    still: { src: asset("/images/worlds/drift.webp"), alt: "Спортивная машина в заносе на ночном треке" },
  },
  {
    id: "product",
    kind: "Продуктовые сайты",
    title: "Каждая деталь крупно",
    text: "Товар снят как в рекламе: блик, материал, механизм. Его хочется взять в руки.",
    start: 14.4,
    end: 17.4,
    placement: "left",
    still: { src: asset("/images/worlds/watch.webp"), alt: "Часы в тёмной студии, крупный план циферблата" },
  },
  {
    id: "architecture",
    kind: "Недвижимость и архитектура",
    title: "Дом продаётся до постройки",
    text: "Фасады, виды из окон, планировки. Покупатель гуляет по проекту, которого ещё нет.",
    start: 17.8,
    end: 20.7,
    placement: "left",
    still: { src: asset("/images/worlds/facade.webp"), alt: "Стеклянный фасад башни ночью, светится одно окно" },
  },
  {
    id: "office",
    kind: "Корпоративные сайты",
    title: "Компания изнутри",
    text: "Люди, процессы, масштаб. За минуту понятно, с кем вы работаете.",
    start: 20.9,
    end: 23.2,
    placement: "bottom-left",
    still: { src: asset("/images/worlds/office.webp"), alt: "Офис с рядами столов, вдали круглое окно" },
  },
  {
    id: "lounge",
    kind: "Отели, рестораны, заведения",
    title: "Чувствуешь атмосферу",
    text: "Свет, интерьер, настроение места. Гость решает прийти, пока листает.",
    start: 23.3,
    end: 25.7,
    placement: "left",
    still: { src: asset("/images/worlds/lounge.webp"), alt: "Лаунж в два этажа с баром и круглым окном" },
  },
  {
    id: "final",
    kind: "DARK MODE",
    title: "Любой из этих миров может стать вашим сайтом",
    text: "Расскажите о задаче. Покажем, как это будет выглядеть, до начала работ.",
    start: 26.6,
    end: 30,
    placement: "left",
    still: { src: asset("/images/worlds/final.webp"), alt: "Логотип DARK MODE над ночным городом" },
  },
];

/**
 * Part of the black between the O and the valley (3.0 s → 3.33 s of the render) was cut out,
 * so the pass through black is about half a second. Times above are in the uncut 30 s timeline.
 */
const CUT_AT = 3.0;
const CUT = 0.33;
const shift = (t: number) => (t > CUT_AT ? Math.round((t - CUT) * 100) / 100 : t);

export const chapters: Chapter[] = timeline.map((c) => ({ ...c, start: shift(c.start), end: shift(c.end) }));
