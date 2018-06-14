import * as riot from 'riot';
import riotReduxConnect from '../index.js';

let nextMixinNumber = 1;
export function performReduxConnect(store, globalOptions = {}) {
  const mixinName = globalOptions.mixinName || `reduxConnect${++nextMixinNumber}`;
  const connectConfig = Object.assign({ mixinName }, globalOptions);
  riotReduxConnect(riot, store, connectConfig);
  return mixinName;
}

let nextTagNumber = 1;
export function buildTestTag(tagHtml, tagCss, rootAttributes, tagScriptArg, opts = {}) {
  let tagScript = tagScriptArg;
  if (typeof tagScriptArg === 'object') {
    tagScript = getTagScript(tagScriptArg);
  }
  const tagName = opts.tagName || `test-tag${++nextTagNumber}`;
  riot.tag(tagName, tagHtml, tagCss, rootAttributes, tagScript);
  return tagName;
}

export function mountTestTag(tagHtml, tagCss, rootAttributes, tagScriptArg, opts) {
  const tagName = buildTestTag(tagHtml, tagCss, rootAttributes, tagScriptArg);
  const el = document.createElement('div');
  document.body.append(el);
  return riot.mount(el, tagName, opts)[0];
}

export function simulateClick(el) {
  var event = document.createEvent('HTMLEvents');
  event.initEvent('click', false, true);
  el.dispatchEvent(event);
}

export function getTemplateErrorChecker(fn) {
  return function(...args) {
    const origConsoleError = window.console.error;
    const mock = jest.fn();
    console.error = mock;
    fn.apply(this, args);
    expect(mock).not.toBeCalled();
    console.error = origConsoleError;
  };
}

riot.mixin({
  init() {
    this.numberOfUpdates = 0;
    this.on('updated', () => this.numberOfUpdates++);
  },
  countUpdatesDuringCall(fn, ...args) {
    const before = this.numberOfUpdates;
    fn(...args);
    const after = this.numberOfUpdates;
    return after - before;
  }
});

const identityFn = _ => _;
function getTagScript({
  mixinName,
  mapStateToOpts, mapDispatchToMethods, connectConfig,
  beforeReduxConnect = identityFn, afterReduxConnect = identityFn,
}) {
  return function() {
    beforeReduxConnect.call(this);
    this[mixinName](
      mapStateToOpts,
      getMdtmNotUsedInMemoize(mapDispatchToMethods),
      connectConfig
    );
    afterReduxConnect.call(this);
  };
};

function getMdtmNotUsedInMemoize(mdtm) {
  if (mdtm === null) return mdtm;
  if (typeof mdtm === 'function') {
    return (...args) => mdtm(...args);
  }
  return Object.assign({}, mdtm);
}
