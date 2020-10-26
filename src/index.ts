import { createEvent, Store } from "effector";

export interface AsyncStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export type Config = {
  /**
   * prefix for the stored keys. Key for store is {prefix}:{store.shortName}
   */
  prefixKey?: string;
  /**
   * One of SessionStorageAsync, LocalStorageAsync or react-native's AsyncStorage
   */
  storage: AsyncStorage;
  expireMs?: number;
};
type PersistedState = [number, any];

export const SessionStorageAsync: AsyncStorage = {
  getItem(key: string): Promise<string | null> {
    return Promise.resolve(sessionStorage.getItem(key));
  },

  setItem(key: string, value: string): Promise<void> {
    return Promise.resolve(sessionStorage.setItem(key, value));
  },
  removeItem(key: string): Promise<void> {
    return Promise.resolve(sessionStorage.removeItem(key));
  },
};

export const LocalStorageAsync: AsyncStorage = {
  getItem(key: string): Promise<string | null> {
    return Promise.resolve(sessionStorage.getItem(key));
  },

  setItem(key: string, value: string): Promise<void> {
    return Promise.resolve(sessionStorage.setItem(key, value));
  },
  removeItem(key: string): Promise<void> {
    return Promise.resolve(sessionStorage.removeItem(key));
  },
};

export const withPersist = <State>(store: Store<State>, config?: Config) => {
  const name = store.shortName;
  const persistKey = config?.prefixKey ? `${config.prefixKey}:${name}` : name;
  const rehydrate = createEvent<State>("@PERSIST/REHYDRATE");

  const bindPersistAction = store.watch((state) => {
    config.storage.setItem(persistKey, JSON.stringify([Date.now(), state]));
  });

  config.storage.getItem(persistKey).then((persistedState) => {
    if (persistedState) {
      const parsedState = parseStoredState(persistedState);

      if (
        config.expireMs &&
        parsedState[0] + config.expireMs > config.expireMs
      ) {
        config.storage.removeItem(persistKey);
        bindPersistAction();
      } else {
        store.on(rehydrate, (_state, data) => data);
        bindPersistAction();
        // const unwatch = store.watch(rehydrate, () => {
        // bindPersistAction();
        // unwatch();
        // });
        rehydrate(parsedState[1]);
      }
    } else {
      bindPersistAction();
    }
  });

  return store;
};
/**
 * const withPersist = makeWithPersist({prefixKey:"myroot", storage:SessionStorageAsync})
 *
 * const myStore$ = withPersist(createStore(...))
 */
export const makeWithPersist = (config: Config) => <State>(
  store: Store<State>
) => withPersist(store, config);

const parseStoredState = (str: string) => JSON.parse(str) as PersistedState;
