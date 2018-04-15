import {
  isShallowEqual,
  throwIfNotObjectReturned,
} from './utils.js';

const noDispatchMethods = {};

export const getUpdateTagFunction = (instanceConfig) => {
  let prevStateOpts = {};
  let prevDispatchMethods = noDispatchMethods;
  const { onStateChange, tagInstance } = instanceConfig;
  return () => {
    const stateOpts = getStateOpts(instanceConfig);

    let dispatchMethods = getDispatchMethods(instanceConfig);
    assignImplicitDispatchIfNeeded(stateOpts, instanceConfig);

    const isSameStateOpts = isShallowEqual(stateOpts, prevStateOpts);
    const isSameDispatchMethods = (dispatchMethods === prevDispatchMethods);
    if (isSameStateOpts && isSameDispatchMethods) return;

    onStateChange.call(tagInstance, stateOpts, dispatchMethods);

    prevStateOpts = stateOpts;
    prevDispatchMethods = dispatchMethods;
  };
};

function getStateOpts({ store, mapStateToOpts, tagInstance }) {
  if (!shouldMapStateToOpts(mapStateToOpts)) return {};
  const stateOpts = mapStateToOpts(store.getState(), tagInstance);
  throwIfNotObjectReturned('mapStateToOpts', stateOpts);
  return stateOpts;
}

function getDispatchMethods({
  store, applyMdtmMemoized, mapDispatchToMethods, tagInstance,
  disablePreventUpdateFor, defaultDisablePreventUpdate,
}) {
  if (!shouldMapDispatchToMethods(mapDispatchToMethods)) {
    return noDispatchMethods;
  }
  return applyMdtmMemoized(mapDispatchToMethods, store.dispatch, tagInstance, {
    disablePreventUpdateFor, defaultDisablePreventUpdate
  });
}

function assignImplicitDispatchIfNeeded(stateOpts, {
  store, implicitDispatchOptName, mapDispatchToMethods
}) {
  if (shouldMapDispatchToMethods(mapDispatchToMethods)) return;
  stateOpts[implicitDispatchOptName] = store.dispatch;
}

export function shouldMapStateToOpts(msto) {
  return typeof msto === 'function';
}

export function shouldMapDispatchToMethods(mdtm) {
  return mdtm !== null;
}
