export function memoize(fn) {
    const cache = new WeakMap();
    return (firstArg, ...otherArgs) => {
        let cachedResult = cache.get(firstArg);
        if (!cachedResult) {
            cachedResult = fn(firstArg, ...otherArgs);
            cache.set(firstArg, cachedResult);
        }
        return cachedResult;
    };
}

export function throwIfNotObjectReturned(name, value) {
    const valueType = typeof value;
    if (valueType !== 'object') {
        throw new Error(
            `${name} should return object; ${valueType} returned instead!`
        );
    }
}

export function isShallowEqual(v, o) {
    for(let key in v) {
        if(!(key in o) || v[key] !== o[key])
            return false;
    }
    for(let key in o) {
        if(!(key in v) || v[key] !== o[key])
            return false;
    }
    return true;
}

export function riotTagUpdate(
    stateOpts,
    dispatchMethods
) {
    this.update(Object.assign({}, dispatchMethods, {
        dispatchMethods,
        opts: Object.assign({}, this.opts, stateOpts),
    }));
}

const initStatusPropertyName = '_isRiotReduxConnectInitialized';
export function throwIfAlreadyInitialized(obj) {
  const isInitialized = obj[initStatusPropertyName];
  if (isInitialized) {
    throw new Error(
      `attempt to call "${mixinName}" mixin method twice!`
    );
  }
  Object.defineProperty(obj, initStatusPropertyName, {
    configurable: false,
    enumerable: false,
    writable: false,
    value: true,
  });
}
