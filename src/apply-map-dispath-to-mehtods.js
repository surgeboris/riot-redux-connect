import { throwIfNotObjectReturned } from './utils.js';

export default applyMdtm;

function applyMdtm(mdtm, dispatch, tag, options) {
    const mdtmType = typeof mdtm;
    if (mdtmType === 'object') {
        return mdtmWithObject(mdtm, dispatch, options);
    }
    if (mdtmType === 'function') {
        return mdtmWithFunction(mdtm, dispatch, tag);
    }
    throw new Error(`Unknown argument type: ${mdtmType}`);
}

function preventUpdateIfNeeded([e, ...rest], key, options) {
  const { defaultDisablePreventUpdate } = options;
  if (defaultDisablePreventUpdate) return;

  const isMultipleArgsPassed = rest.length !== 0;
  if (isMultipleArgsPassed) return;
  const isDomEvent = typeof e === 'object'
      || typeof e.preventDefault == 'function';
  if (!isDomEvent) return;

  const { disablePreventUpdateFor = [] } = options;
  if (disablePreventUpdateFor.indexOf(key) !== -1) return;
  e.preventUpdate = true;
}

function mdtmWithObject(mdtm, dispatch, options) {
    return Object.keys(mdtm).reduce((result, key) => {
        const actionCreator = mdtm[key];
        result[key] = (...args) => {
          preventUpdateIfNeeded(args, key, options);
          dispatch(actionCreator(...args));
        };
        return result;
    }, {});
}

function mdtmWithFunction(mdtm, dispatch, tag) {
    const result = mdtm.call(null, dispatch, tag);
    throwIfNotObjectReturned('mapDispatchToMethods', result);
    return result;
}
