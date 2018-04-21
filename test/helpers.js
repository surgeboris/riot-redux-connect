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
export function buildTestTag(tagHtml, tagScriptArg, opts = {}) {
  let tagScript = tagScriptArg;
  if (typeof tagScriptArg === 'object') {
    tagScript = getTagScript(tagScriptArg);
  }
  const tagName = opts.tagName || `test-tag${++nextTagNumber}`;
  riot.tag(tagName, tagHtml, '', '', tagScript);
  return tagName;
}

export function mountTestTag(tagHtml, tagScriptArg, opts) {
  const tagName = buildTestTag(tagHtml, tagScriptArg);
  const el = document.createElement('div');
  document.body.append(el);
  return riot.mount(el, tagName, opts)[0];
}

export function simulateClick(el) {
  var event = document.createEvent('HTMLEvents');
  event.initEvent('click', false, true);
  el.dispatchEvent(event);
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
  onReduxConnect = identityFn,
}) {
  return function() {
    this[mixinName](
      mapStateToOpts,
      getMdtmNotUsedInMemoize(mapDispatchToMethods),
      connectConfig
    );
    onReduxConnect.call(this);
  };
};

function getMdtmNotUsedInMemoize(mdtm) {
  if (mdtm === null) return mdtm;
  if (typeof mdtm === 'function') {
    return (...args) => mdtm(...args);
  }
  return Object.assign({}, mdtm);
}
