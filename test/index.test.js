import * as riot from 'riot';
import {
  addTestMixins,
  performReduxConnect,
  buildTestTag,
  mountTestTag,
  simulateClick,
} from './helpers.js';
import {
  store, createUpdateStoreAction,
  updateStore, resetStore,
  getServerSideStore
} from './store.js';

const defaultState = { part1: 'foo1', part2: 'bar1' };
const defaultTagHtml = `
  <div ref="derived1">{opts.derivedValue1}</div>
  <div ref="derived2">{opts.derivedValue2}</div>
  <button ref="change_btn" onclick={change} />
  <button ref="reset_btn" onclick={reset} />
`;
const defaultTagScriptOpts = {
  mapStateToOpts({ part1, part2 }) {
    return {
      derivedValue1: `${part1}+${part2}`,
      derivedValue2: `${part1}x${part2}`,
    };
  },
  mapDispatchToMethods: {
    change: () => createUpdateStoreAction({ part1: 'foo2', part2: 'bar2' }),
    reset: () => createUpdateStoreAction(defaultState),
  },
  connectConfig: {},
};

describe('riot-redux-connect', () => {
  let tagInstance;

  function resetTestSetup(
    {
      initialState = defaultState,
      reduxConnectOpts = {},
      tagHtml = defaultTagHtml, tagScriptOpts, tagOpts = {},
    } = {},
  ) {
    const mixinName = performReduxConnect(store, reduxConnectOpts);
    updateStore(initialState);
    const tagScriptOptsFull = Object.assign(
      { mixinName }, defaultTagScriptOpts, tagScriptOpts
    );
    tagInstance = mountTestTag(tagHtml, tagScriptOptsFull, tagOpts);
  };

  afterEach(() => {
    tagInstance.unmount();
    resetStore();
  });

  test('merges state-derived values with the tag opts on tag initialization', () => {
    resetTestSetup();
    expect(tagInstance.refs.derived1.innerHTML).toBe('foo1+bar1');
    expect(tagInstance.refs.derived2.innerHTML).toBe('foo1xbar1');
  });

  test('assigns dispatch-wrapped action-creator methods to the tag instance', () => {
    resetTestSetup();
    expect(typeof tagInstance.change).toBe('function');
    expect(typeof tagInstance.reset).toBe('function');
  });

  test("wraps thunk action-creator in a way that keeps thunk's return value", () => {
    const returnValue = Symbol('thunk return value');
    const thunk = dispatch => returnValue;
    resetTestSetup({
      tagScriptOpts: {
        mapDispatchToMethods: {
          checkReturnValue: params => thunk,
        },
      },
    });
    expect(tagInstance.checkReturnValue()).toBe(returnValue);
  });

  test('avoids updating the tag when unrelated part of store changed', () => {
    resetTestSetup();
    const numberOfUpdates = tagInstance.countUpdatesDuringCall(
      updateStore, { unrelated: {} }
    );
    expect(numberOfUpdates).toBe(0);
  });

  test('updates derived values automatically on any (even extraneous) store change', () => {
    resetTestSetup();
    const numberOfUpdates = tagInstance.countUpdatesDuringCall(
      updateStore, { part1: 'changed1', part2: 'changed2' }
    );
    expect(tagInstance.refs.derived1.innerHTML).toBe('changed1+changed2');
    expect(tagInstance.refs.derived2.innerHTML).toBe('changed1xchanged2');
    expect(numberOfUpdates).toBe(1);
  });

  test('prevents riot-update in actions by default', () => {
    resetTestSetup();
    const numberOfUpdates = tagInstance.countUpdatesDuringCall(
      simulateClick, tagInstance.refs.change_btn
    );
    expect(tagInstance.refs.derived1.innerHTML).toBe('foo2+bar2');
    expect(tagInstance.refs.derived2.innerHTML).toBe('foo2xbar2');
    expect(numberOfUpdates).toBe(1);
  });

  test('allows to granularly disable riot-update prevention in action-creator methods via an option', () => {
    resetTestSetup({
      tagScriptOpts: {
        connectConfig: { disablePreventUpdateFor: ['change'] },
      },
    });
    const e = {};
    const numberOfUpdatesOnChange = tagInstance.countUpdatesDuringCall(
      simulateClick, tagInstance.refs.change_btn
    );
    expect(numberOfUpdatesOnChange).toBe(2);
    const numberOfUpdatesOnReset = tagInstance.countUpdatesDuringCall(
      simulateClick, tagInstance.refs.reset_btn
    );
    expect(numberOfUpdatesOnReset).toBe(1);
  });

  test('avoids auto-updating the tag on state change if mapStateToOpts not used', () => {
    resetTestSetup({
      tagScriptOpts: {
        mapStateToOpts: null,
      },
    });
    const numberOfUpdates = tagInstance.countUpdatesDuringCall(
      simulateClick, tagInstance.refs.change_btn
    );
    expect(numberOfUpdates).toBe(0);
  });

  test('passes dispatch and tag instance as an arguments to the function passed as "mapDispatchToMethods" argument', () => {
    const mapDispatchToMethods = jest.fn().mockReturnValue({});
    resetTestSetup({ tagScriptOpts: { mapDispatchToMethods } });
    const { mock: { calls } } = mapDispatchToMethods;
    expect(calls.length).toBe(1);
    expect(typeof calls[0][0]).toBe('function');
    expect(typeof calls[0][1]).toBe('object');
  });

  test('provides implicit customizable "dispatch" opt when there is no "mapDispatchToMethods" argument', () => {
    const implicitDispatchOptName = 'foobar';
    resetTestSetup({
      tagScriptOpts: {
        mapDispatchToMethods: null,
        connectConfig: { implicitDispatchOptName }
      }
    });
    expect(typeof tagInstance.opts[implicitDispatchOptName]).toBe('function');
  });

  test('updates tag instance on customizable "redux-sync" event', () => {
    const reduxSyncEventName = 'foobar';
    resetTestSetup({
      initialState: { itemsToPick: ['foo', 'bar'] },
      tagScriptOpts: {
        mapStateToOpts({ itemsToPick }, tag) {
          return { derivedValue1: itemsToPick[tag.opts.item] };
        },
        connectConfig: { reduxSyncEventName },
      },
      tagOpts: { item: 0 },
    });
    expect(tagInstance.refs.derived1.innerHTML).toBe('foo');
    tagInstance.opts.item = 1;
    tagInstance.update();
    expect(tagInstance.refs.derived1.innerHTML).toBe('foo');
    tagInstance.trigger(reduxSyncEventName);
    expect(tagInstance.refs.derived1.innerHTML).toBe('bar');
  });

  test('throws error when trying to connect already connected tag', () => {
    resetTestSetup();
    expect(() => { tagInstance.reduxConnect(null, null) }).toThrow();
  });
});

describe('riot-redux-connect', () => {
  test('supports server-side rendering', () => {
    const mixinName = 'ssrReduxConnect';
    const ssrStore = getServerSideStore({ part1: 'ssr1', part2: 'ssr2' });
    performReduxConnect(ssrStore, { mixinName });
    const tagScriptOpts = Object.assign({ mixinName }, defaultTagScriptOpts);
    const tagName = buildTestTag(
      defaultTagHtml,
      tagScriptOpts,
      { tagName: 'ssr-test' }
    );
    const output = riot.render(tagName);
    expect(output).toMatchSnapshot();
  });
});

