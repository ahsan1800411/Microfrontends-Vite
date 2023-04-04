import { importShared } from './__federation_fn_import.js';

let keyCount = 0;
function atom(read, write) {
  const key = `atom${++keyCount}`;
  const config = {
    toString: () => key
  };
  if (typeof read === "function") {
    config.read = read;
  } else {
    config.init = read;
    config.read = (get) => get(config);
    config.write = (get, set, arg) => set(
      config,
      typeof arg === "function" ? arg(get(config)) : arg
    );
  }
  if (write) {
    config.write = write;
  }
  return config;
}

const hasInitialValue = (atom) => "init" in atom;
const isActuallyWritableAtom = (atom) => !!atom.write;
const cancelPromiseMap = /* @__PURE__ */ new WeakMap();
const registerCancelPromise = (promise, cancel) => {
  cancelPromiseMap.set(promise, cancel);
  promise.catch(() => {
  }).finally(() => cancelPromiseMap.delete(promise));
};
const cancelPromise = (promise, next) => {
  const cancel = cancelPromiseMap.get(promise);
  if (cancel) {
    cancelPromiseMap.delete(promise);
    cancel(next);
  }
};
const resolvePromise = (promise, value) => {
  promise.status = "fulfilled";
  promise.value = value;
};
const rejectPromise = (promise, e) => {
  promise.status = "rejected";
  promise.reason = e;
};
const isEqualAtomValue = (a, b) => "v" in a && "v" in b && Object.is(a.v, b.v);
const isEqualAtomError = (a, b) => "e" in a && "e" in b && Object.is(a.e, b.e);
const hasPromiseAtomValue = (a) => "v" in a && a.v instanceof Promise;
const returnAtomValue = (atomState) => {
  if ("e" in atomState) {
    throw atomState.e;
  }
  return atomState.v;
};
const createStore = () => {
  const atomStateMap = /* @__PURE__ */ new WeakMap();
  const mountedMap = /* @__PURE__ */ new WeakMap();
  const pendingMap = /* @__PURE__ */ new Map();
  let stateListeners;
  let storeListeners;
  let mountedAtoms;
  if (({"BASE_URL":"/","MODE":"production","DEV":false,"PROD":true,"SSR":false} && "production") !== "production") {
    stateListeners = /* @__PURE__ */ new Set();
    storeListeners = /* @__PURE__ */ new Set();
    mountedAtoms = /* @__PURE__ */ new Set();
  }
  const getAtomState = (atom) => atomStateMap.get(atom);
  const setAtomState = (atom, atomState) => {
    if (({"BASE_URL":"/","MODE":"production","DEV":false,"PROD":true,"SSR":false} && "production") !== "production") {
      Object.freeze(atomState);
    }
    const prevAtomState = atomStateMap.get(atom);
    atomStateMap.set(atom, atomState);
    if (!pendingMap.has(atom)) {
      pendingMap.set(atom, prevAtomState);
    }
    if (prevAtomState && hasPromiseAtomValue(prevAtomState)) {
      const next = "v" in atomState ? atomState.v instanceof Promise ? atomState.v : Promise.resolve(atomState.v) : Promise.reject(atomState.e);
      cancelPromise(prevAtomState.v, next);
    }
  };
  const updateDependencies = (atom, nextAtomState, depSet) => {
    const dependencies = /* @__PURE__ */ new Map();
    let changed = false;
    depSet.forEach((a) => {
      const aState = a === atom ? nextAtomState : getAtomState(a);
      if (aState) {
        dependencies.set(a, aState);
        if (nextAtomState.d.get(a) !== aState) {
          changed = true;
        }
      } else if (({"BASE_URL":"/","MODE":"production","DEV":false,"PROD":true,"SSR":false} && "production") !== "production") {
        console.warn("[Bug] atom state not found");
      }
    });
    if (changed || nextAtomState.d.size !== dependencies.size) {
      nextAtomState.d = dependencies;
    }
  };
  const setAtomValue = (atom, value, depSet) => {
    const prevAtomState = getAtomState(atom);
    const nextAtomState = {
      d: (prevAtomState == null ? void 0 : prevAtomState.d) || /* @__PURE__ */ new Map(),
      v: value
    };
    if (depSet) {
      updateDependencies(atom, nextAtomState, depSet);
    }
    if (prevAtomState && isEqualAtomValue(prevAtomState, nextAtomState) && prevAtomState.d === nextAtomState.d) {
      return prevAtomState;
    }
    setAtomState(atom, nextAtomState);
    return nextAtomState;
  };
  const setAtomError = (atom, error, depSet) => {
    const prevAtomState = getAtomState(atom);
    const nextAtomState = {
      d: (prevAtomState == null ? void 0 : prevAtomState.d) || /* @__PURE__ */ new Map(),
      e: error
    };
    if (depSet) {
      updateDependencies(atom, nextAtomState, depSet);
    }
    if (prevAtomState && isEqualAtomError(prevAtomState, nextAtomState) && prevAtomState.d === nextAtomState.d) {
      return prevAtomState;
    }
    setAtomState(atom, nextAtomState);
    return nextAtomState;
  };
  const readAtomState = (atom) => {
    const atomState = getAtomState(atom);
    if (atomState) {
      atomState.d.forEach((_, a) => {
        if (a !== atom && !mountedMap.has(a)) {
          readAtomState(a);
        }
      });
      if (Array.from(atomState.d).every(
        ([a, s]) => a === atom || getAtomState(a) === s
      )) {
        return atomState;
      }
    }
    const depSet = /* @__PURE__ */ new Set();
    let isSync = true;
    const getter = (a) => {
      depSet.add(a);
      if (a === atom) {
        const aState2 = getAtomState(a);
        if (aState2) {
          return returnAtomValue(aState2);
        }
        if (hasInitialValue(a)) {
          return a.init;
        }
        throw new Error("no atom init");
      }
      const aState = readAtomState(a);
      return returnAtomValue(aState);
    };
    let controller;
    let setSelf;
    const options = {
      get signal() {
        if (!controller) {
          controller = new AbortController();
        }
        return controller.signal;
      },
      get setSelf() {
        if (({"BASE_URL":"/","MODE":"production","DEV":false,"PROD":true,"SSR":false} && "production") !== "production" && !isActuallyWritableAtom(atom)) {
          console.warn("setSelf function cannot be used with read-only atom");
        }
        if (!setSelf && isActuallyWritableAtom(atom)) {
          setSelf = (...args) => {
            if (({"BASE_URL":"/","MODE":"production","DEV":false,"PROD":true,"SSR":false} && "production") !== "production" && isSync) {
              console.warn("setSelf function cannot be called in sync");
            }
            if (!isSync) {
              return writeAtom(atom, ...args);
            }
          };
        }
        return setSelf;
      }
    };
    try {
      const value = atom.read(getter, options);
      if (value instanceof Promise) {
        let continuePromise;
        const promise = new Promise((resolve, reject) => {
          let settled = false;
          value.then(
            (v) => {
              if (!settled) {
                settled = true;
                setAtomValue(atom, promise, depSet);
                resolvePromise(promise, v);
                resolve(v);
              }
            },
            (e) => {
              if (!settled) {
                settled = true;
                setAtomValue(atom, promise, depSet);
                rejectPromise(promise, e);
                reject(e);
              }
            }
          );
          continuePromise = (next) => {
            if (!settled) {
              settled = true;
              next.then(
                (v) => resolvePromise(promise, v),
                (e) => rejectPromise(promise, e)
              );
              resolve(next);
            }
          };
        });
        promise.status = "pending";
        registerCancelPromise(promise, (next) => {
          if (next) {
            continuePromise(next);
          }
          controller == null ? void 0 : controller.abort();
        });
        return setAtomValue(atom, promise, depSet);
      }
      return setAtomValue(atom, value, depSet);
    } catch (error) {
      return setAtomError(atom, error, depSet);
    } finally {
      isSync = false;
    }
  };
  const readAtom = (atom) => returnAtomValue(readAtomState(atom));
  const addAtom = (atom) => {
    let mounted = mountedMap.get(atom);
    if (!mounted) {
      mounted = mountAtom(atom);
    }
    return mounted;
  };
  const canUnmountAtom = (atom, mounted) => !mounted.l.size && (!mounted.t.size || mounted.t.size === 1 && mounted.t.has(atom));
  const delAtom = (atom) => {
    const mounted = mountedMap.get(atom);
    if (mounted && canUnmountAtom(atom, mounted)) {
      unmountAtom(atom);
    }
  };
  const recomputeDependents = (atom) => {
    const mounted = mountedMap.get(atom);
    mounted == null ? void 0 : mounted.t.forEach((dependent) => {
      if (dependent !== atom) {
        const prevAtomState = getAtomState(dependent);
        const nextAtomState = readAtomState(dependent);
        if (!prevAtomState || !isEqualAtomValue(prevAtomState, nextAtomState)) {
          recomputeDependents(dependent);
        }
      }
    });
  };
  const writeAtomState = (atom, ...args) => {
    let isSync = true;
    const getter = (a) => returnAtomValue(readAtomState(a));
    const setter = (a, ...args2) => {
      let r;
      if (a === atom) {
        if (!hasInitialValue(a)) {
          throw new Error("atom not writable");
        }
        const prevAtomState = getAtomState(a);
        const nextAtomState = setAtomValue(a, args2[0]);
        if (!prevAtomState || !isEqualAtomValue(prevAtomState, nextAtomState)) {
          recomputeDependents(a);
        }
      } else {
        r = writeAtomState(a, ...args2);
      }
      if (!isSync) {
        flushPending();
      }
      return r;
    };
    const result = atom.write(getter, setter, ...args);
    isSync = false;
    return result;
  };
  const writeAtom = (atom, ...args) => {
    const result = writeAtomState(atom, ...args);
    flushPending();
    return result;
  };
  const mountAtom = (atom, initialDependent) => {
    const mounted = {
      t: new Set(initialDependent && [initialDependent]),
      l: /* @__PURE__ */ new Set()
    };
    mountedMap.set(atom, mounted);
    if (({"BASE_URL":"/","MODE":"production","DEV":false,"PROD":true,"SSR":false} && "production") !== "production") {
      mountedAtoms.add(atom);
    }
    readAtomState(atom).d.forEach((_, a) => {
      const aMounted = mountedMap.get(a);
      if (aMounted) {
        aMounted.t.add(atom);
      } else {
        if (a !== atom) {
          mountAtom(a, atom);
        }
      }
    });
    readAtomState(atom);
    if (isActuallyWritableAtom(atom) && atom.onMount) {
      const onUnmount = atom.onMount((...args) => writeAtom(atom, ...args));
      if (onUnmount) {
        mounted.u = onUnmount;
      }
    }
    return mounted;
  };
  const unmountAtom = (atom) => {
    var _a;
    const onUnmount = (_a = mountedMap.get(atom)) == null ? void 0 : _a.u;
    if (onUnmount) {
      onUnmount();
    }
    mountedMap.delete(atom);
    if (({"BASE_URL":"/","MODE":"production","DEV":false,"PROD":true,"SSR":false} && "production") !== "production") {
      mountedAtoms.delete(atom);
    }
    const atomState = getAtomState(atom);
    if (atomState) {
      if (hasPromiseAtomValue(atomState)) {
        cancelPromise(atomState.v);
      }
      atomState.d.forEach((_, a) => {
        if (a !== atom) {
          const mounted = mountedMap.get(a);
          if (mounted) {
            mounted.t.delete(atom);
            if (canUnmountAtom(a, mounted)) {
              unmountAtom(a);
            }
          }
        }
      });
    } else if (({"BASE_URL":"/","MODE":"production","DEV":false,"PROD":true,"SSR":false} && "production") !== "production") {
      console.warn("[Bug] could not find atom state to unmount", atom);
    }
  };
  const mountDependencies = (atom, atomState, prevDependencies) => {
    const depSet = new Set(atomState.d.keys());
    prevDependencies == null ? void 0 : prevDependencies.forEach((_, a) => {
      if (depSet.has(a)) {
        depSet.delete(a);
        return;
      }
      const mounted = mountedMap.get(a);
      if (mounted) {
        mounted.t.delete(atom);
        if (canUnmountAtom(a, mounted)) {
          unmountAtom(a);
        }
      }
    });
    depSet.forEach((a) => {
      const mounted = mountedMap.get(a);
      if (mounted) {
        mounted.t.add(atom);
      } else if (mountedMap.has(atom)) {
        mountAtom(a, atom);
      }
    });
  };
  const flushPending = () => {
    while (pendingMap.size) {
      const pending = Array.from(pendingMap);
      pendingMap.clear();
      pending.forEach(([atom, prevAtomState]) => {
        const atomState = getAtomState(atom);
        if (atomState) {
          if (atomState.d !== (prevAtomState == null ? void 0 : prevAtomState.d)) {
            mountDependencies(atom, atomState, prevAtomState == null ? void 0 : prevAtomState.d);
          }
          const mounted = mountedMap.get(atom);
          if (mounted && !// TODO This seems pretty hacky. Hope to fix it.
          // Maybe we could `mountDependencies` in `setAtomState`?
          (prevAtomState && !hasPromiseAtomValue(prevAtomState) && (isEqualAtomValue(prevAtomState, atomState) || isEqualAtomError(prevAtomState, atomState)))) {
            mounted.l.forEach((listener) => listener());
          }
        } else if (({"BASE_URL":"/","MODE":"production","DEV":false,"PROD":true,"SSR":false} && "production") !== "production") {
          console.warn("[Bug] no atom state to flush");
        }
      });
    }
    if (({"BASE_URL":"/","MODE":"production","DEV":false,"PROD":true,"SSR":false} && "production") !== "production") {
      stateListeners.forEach((l) => l());
      storeListeners.forEach((l) => l("state"));
    }
  };
  const subscribeAtom = (atom, listener) => {
    const mounted = addAtom(atom);
    flushPending();
    const listeners = mounted.l;
    listeners.add(listener);
    if (({"BASE_URL":"/","MODE":"production","DEV":false,"PROD":true,"SSR":false} && "production") !== "production") {
      storeListeners.forEach((l) => l("sub"));
    }
    return () => {
      listeners.delete(listener);
      delAtom(atom);
      if (({"BASE_URL":"/","MODE":"production","DEV":false,"PROD":true,"SSR":false} && "production") !== "production") {
        storeListeners.forEach((l) => l("unsub"));
      }
    };
  };
  if (({"BASE_URL":"/","MODE":"production","DEV":false,"PROD":true,"SSR":false} && "production") !== "production") {
    return {
      get: readAtom,
      set: writeAtom,
      sub: subscribeAtom,
      // store dev methods (these are tentative and subject to change without notice)
      dev_subscribe_state: (l) => {
        console.warn(
          "[DEPRECATED] dev_subscribe_state is deprecated and will be removed in the next minor version. use dev_subscribe_store instead."
        );
        stateListeners.add(l);
        return () => {
          stateListeners.delete(l);
        };
      },
      dev_subscribe_store: (l) => {
        storeListeners.add(l);
        return () => {
          storeListeners.delete(l);
        };
      },
      dev_get_mounted_atoms: () => mountedAtoms.values(),
      dev_get_atom_state: (a) => atomStateMap.get(a),
      dev_get_mounted: (a) => mountedMap.get(a),
      dev_restore_atoms: (values) => {
        for (const [atom, value] of values) {
          if (hasInitialValue(atom)) {
            setAtomValue(atom, value);
            recomputeDependents(atom);
          }
        }
        flushPending();
      }
    };
  }
  return {
    get: readAtom,
    set: writeAtom,
    sub: subscribeAtom
  };
};
let defaultStore;
const getDefaultStore = () => {
  if (!defaultStore) {
    defaultStore = createStore();
  }
  return defaultStore;
};

const ReactExports = await importShared('react');
const {createContext,useContext,useRef,createElement,useReducer,useEffect,useDebugValue,useCallback} = ReactExports;

const StoreContext = createContext(void 0);
const useStore = (options) => {
  const store = useContext(StoreContext);
  return (options == null ? void 0 : options.store) || store || getDefaultStore();
};
const Provider = ({
  children,
  store
}) => {
  const storeRef = useRef();
  if (!store && !storeRef.current) {
    storeRef.current = createStore();
  }
  return createElement(
    StoreContext.Provider,
    {
      value: store || storeRef.current
    },
    children
  );
};

const isPromise = (x) => x instanceof Promise;
const use = ReactExports.use || ((promise) => {
  if (promise.status === "pending") {
    throw promise;
  } else if (promise.status === "fulfilled") {
    return promise.value;
  } else if (promise.status === "rejected") {
    throw promise.reason;
  } else {
    promise.status = "pending";
    promise.then(
      (v) => {
        promise.status = "fulfilled";
        promise.value = v;
      },
      (e) => {
        promise.status = "rejected";
        promise.reason = e;
      }
    );
    throw promise;
  }
});
function useAtomValue(atom, options) {
  const store = useStore(options);
  const [[valueFromReducer, storeFromReducer, atomFromReducer], rerender] = useReducer(
    (prev) => {
      const nextValue = store.get(atom);
      if (Object.is(prev[0], nextValue) && prev[1] === store && prev[2] === atom) {
        return prev;
      }
      return [nextValue, store, atom];
    },
    void 0,
    () => [store.get(atom), store, atom]
  );
  let value = valueFromReducer;
  if (storeFromReducer !== store || atomFromReducer !== atom) {
    rerender();
    value = store.get(atom);
  }
  const delay = options == null ? void 0 : options.delay;
  useEffect(() => {
    const unsub = store.sub(atom, () => {
      if (typeof delay === "number") {
        setTimeout(rerender, delay);
        return;
      }
      rerender();
    });
    rerender();
    return unsub;
  }, [store, atom, delay]);
  useDebugValue(value);
  return isPromise(value) ? use(value) : value;
}

function useSetAtom(atom, options) {
  const store = useStore(options);
  const setAtom = useCallback(
    (...args) => {
      if (({"BASE_URL":"/","MODE":"production","DEV":false,"PROD":true,"SSR":false} && "production") !== "production" && !("write" in atom)) {
        throw new Error("not writable atom");
      }
      return store.set(atom, ...args);
    },
    [store, atom]
  );
  return setAtom;
}

function useAtom(atom, options) {
  return [
    useAtomValue(atom, options),
    // We do wrong type assertion here, which results in throwing an error.
    useSetAtom(atom, options)
  ];
}

export { Provider, atom, createStore, getDefaultStore, useAtom, useAtomValue, useSetAtom, useStore };
