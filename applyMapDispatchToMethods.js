import { throwIfNotObjectReturned } from './utils.js';

export default applyMdtm;

function applyMdtm(mdtm, dispatch, tag) {
    const mdtmType = typeof mdtm;
    if (mdtmType === 'object') {
        return mdtmWithObject(mdtm, dispatch);
    }
    if (mdtmType === 'function') {
        return mdtmWithFunction(mdtm, dispatch, tag);
    }
    throw new Error(`Unknown argument type: ${mdtmType}`);
}

function mdtmWithObject(mdtm, dispatch) {
    return Object.keys(mdtm).reduce((result, key) => {
        const actionCreator = mdtm[key];
        result[key] = (...args) => dispatch(actionCreator(...args));
        return result;
    }, {});
}

function mdtmWithFunction(mdtm, dispatch, tag) {
    const result = mdtm.call(tag, dispatch);
    throwIfNotObjectReturned('mapDispatchToMethods', result);
    return result;
}
