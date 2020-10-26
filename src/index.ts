import { createEvent, Store } from "effector";

export type Config = {
  prefixKey?: string;
  storage: Storage;
  expireMs?: number;
};
type PersistedState = [number, any];

export const withPersist = <State>(store: Store<State>, config?: Config) => {
  const name = store.shortName;
  const persistKey = config?.prefixKey ? `${config.prefixKey}:${name}` : name;
  const rehydrate = createEvent<State>("@PERSIST/REHYDRATE");
  store.on(rehydrate, (_state, value) => value);

  const persistedState = config.storage.getItem(persistKey);

  if (persistedState) {
    const parsedState = parseStoredState(persistedState);

    if (config.expireMs && parsedState[0] + config.expireMs > config.expireMs) {
      config.storage.removeItem(persistKey);
    } else {
      rehydrate(parsedState[1]);
    }
  }

  store.watch((state) => {
    config.storage.setItem(persistKey, JSON.stringify([Date.now(), state]));
  });

  return store;
};
/**
 * const withPersist = makeWithPersist({prefixKey:"myroot", storage:sessionStorage})
 *
 * const myStore$ = withPersist(createStore(...))
 */
export const makeWithPersist = (config: Config) => <State>(
  store: Store<State>
) => withPersist(store, config);

const parseStoredState = (str: string) => JSON.parse(str) as PersistedState;
