/** Tiny observable store (no dependencies). */
export function createStore<T extends object>(initial: T) {
  let state = initial;
  const subs = new Set<(s: T) => void>();
  return {
    get: () => state,
    set(patch: Partial<T>) {
      state = { ...state, ...patch };
      subs.forEach((fn) => fn(state));
    },
    subscribe(fn: (s: T) => void) {
      subs.add(fn);
      return () => {
        subs.delete(fn);
      };
    },
  };
}

/** Critical loading, shown by the preloader: fonts, hero poster, hero video. */
export const loading = createStore({
  fonts: false,
  poster: false,
  /** 0..1 of the hero video download; 1 also when the video is skipped or failed */
  video: 0,
  /** 0..1 of the whole film (all frames / the whole video): the loading bar after the preloader */
  film: 0,
  /** true once the preloader has opened */
  done: false,
  /** the page has a cinematic hero (home) */
  hasHero: false,
});

/**
 * The space video behind the rest of the home page.
 * `after` 0..1: the hero film has ended (we went into the O); `finale` 0..1: the way back out has begun.
 */
export const ambient = createStore({ after: 0, finale: 0 });
