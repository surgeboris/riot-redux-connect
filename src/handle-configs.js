import {
  memoize as memoizeDefault,
} from './utils.js';

import applyMdtm from './apply-map-dispatch-to-methods.js';

export const getInstanceConfigFactory = (globalOptions = {}) => {
  const {
    defaultOnStateChange = updateWithStateToOptsAndMethodsToTagInstance,
    defaultImplicitDispatchOptName = 'dispatch',
    defaultReduxSyncEventName = 'redux-sync',
    defaultDisablePreventUpdate = false,
    memoizeByFirstArgReference: memoize = memoizeDefault,
  } = globalOptions;

  const applyMdtmMemoized = memoize(applyMdtm);

  return (localOptions = {}, additionalOptions = {}) => {
    const defaultOptions = {
      onStateChange: defaultOnStateChange,
      implicitDispatchOptName: defaultImplicitDispatchOptName,
      reduxSyncEventName: defaultReduxSyncEventName,
      defaultDisablePreventUpdate,
    };
    const overridenOptions = {
      applyMdtmMemoized,
    };
    const instanceConfig = Object.assign(
      defaultOptions,
      localOptions,
      additionalOptions,
      overridenOptions,
    );
    return instanceConfig;
  };
};

function updateWithStateToOptsAndMethodsToTagInstance(
  stateOpts,
  dispatchMethods
) {
  const updateObj = Object.assign({}, dispatchMethods, {
    opts: Object.assign({}, this.opts, stateOpts),
  });
  if (this.isMounted) {
    this.update(updateObj);
  } else {
    Object.assign(this, updateObj);
  }
}
