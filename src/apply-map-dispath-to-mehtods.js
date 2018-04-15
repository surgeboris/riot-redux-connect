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
  if (rest.length !== 0) return;
  if (typeof e !== 'object') return;
  if (typeof e.preventDefault !== 'function') return;
  const { disablePreventUpdateFor = [], defaultDisablePreventUpdate } = options;
  if (defaultDisablePreventUpdate) return;
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
