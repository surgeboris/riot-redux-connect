riot-redux-connect
=========================

[Riot](https://github.com/riot/riot)-bindings
for [Redux](https://github.com/reactjs/redux).

[![npm version](https://img.shields.io/npm/v/riot-redux-connect.svg?style=flat-square)](https://www.npmjs.com/package/riot-redux-connect)
[![npm downloads](https://img.shields.io/npm/dm/riot-redux-connect.svg?style=flat-square)](https://www.npmjs.com/package/riot-redux-connect)
[![travis-ci build](https://travis-ci.org/surgeboris/riot-redux-connect.svg?branch=master)](https://travis-ci.org/surgeboris/riot-redux-connect)

Moving from `React + Redux` to `RiotJS + Redux`, I've been unable to find
a convenient way to use `Redux` store in `Riot` tags.
I've glanced through a number of approaches and packages,
but all of them lacked granular tag updates
and their API wasn't convenient enough for me.

This package aims to provide a base for effortless connection
of your `Riot` tags with your `Redux` store in maintainable
and performant way. Whenever your store updates, your tags will be updated
granularly i.e. only tags that are accessing changed parts
of the Redux store will be updated, not the whole application.

`riot-redux-connect` attempts to be consistent with
[react-redux `connect` function](https://github.com/reactjs/react-redux/blob/master/docs/api.md#connectmapstatetoprops-mapdispatchtoprops-mergeprops-options).
Although not all `react-redux` features are currently implemented,
`riot-redux-connect` still covers most popular usecases.
Missing `react-redux` features could be implemented in the future
(if there will be demand on them).





## Installation

`riot-redux-connect` requires **riot 2.3.16 or later**.

```
npm install --save riot-redux-connect
```

This assumes that you’re using [npm](http://npmjs.com/) package manager
with a module bundler like [Webpack](https://webpack.js.org/)
or [Parcel](https://parceljs.org) to consume
[es6-modules](https://www.ecma-international.org/ecma-262/6.0/#sec-imports).
`riot-redux-connect` version to use without module bundler
is not provided currently.
It may be added in the future though (if there will be demand on it).

`riot-redux-connect` also **uses `WeakMap`** es6-feature for memoization.
Babel does not transpile it, so if you're supporting non-es6-browsers
you should:

* either make sure that you provide `WeakMap` polyfill
(it is included in `babel-polyfill`)
* or provide custom memoization function
in `memoizeByFirstArgReference` parameter (will be explained further).





## Example

### index.js:

```javascript
import riot from 'riot';
import riotReduxConnect from 'riot-redux-connect';
import store from './store';

riotReduxConnect(riot, store);

document.body.innerHTML = `<some-tag></some-tag>`;
riot.mount('some-tag'));
```

### some-tag.tag:

```html
import { someAction, otherAction } from './action-creators';
import { selector, otherSelector } from './selectors';

<some-tag>
  <pre>{opts.infoReceivedFromRedux}</pre>
  <pre>{opts.otherInfoFromRedux}</pre>
  <button type="button" onclick={someAction}>Some action</button>
  <button type="button" onclick={otherAction}>OtherAction</button
  <script>
    function mapStateToOpts(state) {
      /*
       * selectors are functions that are receiving state plain object
       * and returning plain object with the data derived from state;
       *
       * selectors may ease the pain of refactoring state shape;
       * they can also improve perofrmance by leveraging memoization;
       * for further info see https://github.com/reactjs/reselect
       */
      return {
        infoReceivedFromRedux: selector(state),
        otherInfoFromRedux: otherSelector(state),
      }
    }

    const mapDispatchToMethods = {
      someAction,
      otherAction,
    }

    this.reduxConnect(mapStateToOpts, mapDispatchToMethods);
  </script>
</some-tag>
```





## Usage

`riot-redux-connect` provides only one (default) export:



<a id="riot-redux-connect"></a>
### `riotReduxConnect(riot, store, [options])`

A factory function that binds `Redux`-store to `Riot` global context.
Binding is implemented in special tag method (documented further),
provided via [riot global mixin](http://riotjs.com/guide/#global-mixins),
that this function creates under the hood. Although the name of this method
could be configured, we will refer to it as `reduxConnect` for convenience.
So, you can use `reduxConnect` method on any tag you want to have
connected to the `Redux`-store.

#### Arguments

* `riot` *(Object)*: `Riot` global context
* `store` *(Object)*: `Redux`-store
* [`options`] *(Object)*: If specified customizes the behavior
of `riotReduxConnect`; it accepts following options:

  * [`mixinName`] *(String)*: a method name to use in global mixin
  instead of `reduxConnect`

  * [`defaultOnStateChange`] *(Function)*: a function to be called
  on each granular tag update by default (each `reduxConnect` call may
  override it on per-tag basis).

    Main purpose of this function is to attach `Redux`-extracted data
    (let's call it `stateOpts`) and `Redux`-dispatch-bound methods
    (let's call them `dispathMethods`) to the tag instance.

    Function is called with tag context as `this`
    and `stateOpts` and `dispathMethods` as arguments.

    Default function implementation merges `stateOpts` with tag's `opts`
    and assign `dispatchMethods` to be the direct methods of tag instance

  * [`defaultImplicitDispatchOptName`] *(String)*: an opt name to use
  by default to put `Redux` `dispatch` method to,
  when no explicit `mapDispatchToMethods` argument
  is passed to `reduxConnect`

  * [`defaultReduxSyncEventName`] *(String)*: defines the name for the
  special event, which triggers re-calculation of redux-dervied opts and
  dispatch methods of the tag. Default to simple `redux-sync` value.

    This is mostly needed when you have selectors that depend on tag opts,
    and once those opts are updated you need to somehow
    get an updated redux-derived props and dispatch methods. You can also
    override this special event's name on the per-tag basis
    (see option `reduxSyncEventName` further).

  * [`defaultDisablePreventUpdate`] *(Boolean)*: if `true` the default
  behavior of preventing `riot`'s' auto-updates in action creators
  will be disabled for all tags; (by default this option set to `false`)

    I.e. `riot` [automatically updates tag](http://riotjs.com/guide/#tag-lifecycle)
    after any DOM-event handler was invoked in the contents of this tag.
    When you're using action creator as an event handler, you're getting
    double update (one auto-update by `riot` and one auto-update by `riot-redux-connect`).
    That's why `riot-redux-connect` tries to detect when action creator is used
    as an event handler and to automatically set `e.preventUpdate = true` to
    get rid of excessive `riot` auto-updates in those cases. You can disable
    this behavior by setting `defaultDisablePreventUpdate` to `true`, if you
    are not agree with `riotReduxConnect` for some reason. You can also override
    update-preventing behaviour on per-action-creator basis
    (see option `disablePreventUpdate` further).

  * [`memoizeByFirstArgReference`] *(Function)*: custom memoize
  implementation to use instead of the default one that uses `WeakMap`;
  `memoizeByFirstArgReference` should accept a function
  and return its counterpart memoized by using first argument reference
  as a key.



<a id="redux-connect"></a>
### `reduxConnect([mapStateToOpts], [mapDispatchToMethods], [options])`

This function is provided as a tag method (with configurable name)
by the means of [riot global mixin](http://riotjs.com/guide/#global-mixins)
implicitly defined by `riotReduxConnect`.
It connects the tag on which it was called with the `Redux` store,
by:

* injecting the relevant data and methods into tag instance .
* updating the tag instance on every change to the store data
that this tag instance uses

> You can call it on any tag you want to have connected
> to the `Redux`-store, but note that `reduxConnect` method
> should be used:
> - only once per tag (otherwise error will be thrown)
> - prior to tag's initialization (i.e. do not use it inside
> [tag lifecycle events](http://riotjs.com/api/#events))

#### Arguments

* [`mapStateToOpts(state, [tagInstance])`] \(*Function*):
If this argument is specified, the tag will subscribe
to `Redux` store updates. This means that any time the store is updated,
`mapStateToOpts` will be called. The result of `mapStateToOpts`
must be a plain object, which by default will be merged
to the tags’s `opts`. If you don't want to subscribe to store updates,
pass `null` or `undefined` in place of `mapStateToOpts`.

  `tagInstance` argument can be used to access tag's `opts` (or other
  properties/methods) in order to parametrize selectors somehow.
  Note, however, that if those properties/method return values
  will change on tag update, `Redux`-extracted data will not change
  immediately with them. It will only change after next dispatch.

  You can circumvent this by
  [triggering](http://riotjs.com/api/observable/#-eltriggerevents)
  `"redux-sync"` [event](http://riotjs.com/api/#events) on tag instance
  whenever you need it. Beware of inifinite cyclical updates though;
  make sure that update loop will break at some point
  (memoizing your functions could help with that).

  > The `mapStateToProps` function's first argument is the entire
  `Redux` store’s state and it returns an object to be passed as props.
  It is often called a **selector**. Use
  [reselect](https://github.com/reactjs/reselect) to efficiently
  compose selectors and
  [compute derived data](https://redux.js.org/recipes/computing-derived-data).

* [`mapDispatchToMethods(dispatch, [tagInstance])`]
\(*Object* or *Function*): If an object is passed, each function
inside it is assumed to be a `Redux` action creator. An object
with the same function names, but with every action creator
wrapped into a `dispatch` call so they may be invoked directly,
by default will be assigned to be the tag instance methods.
`riotReduxConnect` is also checking if those action creators
are used as DOM event handlers and in case they are,
[riot auto-updates](http://riotjs.com/guide/#tag-lifecycle)
is automatically disabled on them (unless you've
set `defaultDisablePreventUpdate` to `true`, of course).

  If a function is passed, it will be given `dispatch` as the
  first parameter and `tagInstance` as a second parameter.
  It’s up to you to return an object that somehow uses `dispatch`
  to bind action creators in your own way. (Tip: you may use the
  [`bindActionCreators()`](https://redux.js.org/api-reference/bindactioncreators)
  helper from `Redux`). Note that riot auto updates does not disabled
  in this case, so beware of double-updates on connected tag!

  `tagInstance` argument can be used to access tag's `opts` (or other
  properties/methods) in order to parametrize action creators somehow.
  Note, however, that if those properties/method return values
  will change on tag update, `Redux`-dispatch-bound data will not change
  immediately with them. It will only change after next dispatch.

  You can circumvent this by
  [triggering](http://riotjs.com/api/observable/#-eltriggerevents)
  `"redux-sync"` [event](http://riotjs.com/api/#events) on tag instance
  whenever you need it. Beware of inifinite cyclical updates though;
  make sure that update loop will break at some point
  (memoizing your functions could help with that).

  If you do not supply your own `mapDispatchToMethods` function
  or object full of action creators, the default
  `mapDispatchToMethods` implementation just injects `dispatch`
  into your tag’s `opts`.

* [`options`] *(Object)* If specified, further customizes the behavior
of the `reduxConnect`. In addition to the options passable
to `riotReduxConnect` (see those above), `reduxConnect` accepts
these additional options:

  * [`onStateChange`] *(Function)*: a function to be called
  on each granular tag update.

    Main purpose of this function is to attach `Redux`-extracted data
    (let's call it `stateOpts`) and `Redux`-dispatch-bound methods
    (let's call them `dispathMethods`) to the tag instance.

    Function is called with tag context as `this`
    and `stateOpts` and `dispathMethods` as arguments.

    Defaults to the `defaultOnStateChange` value
    of `riotReduxConnect`'s `options` argument.

  * [`implicitDispatchOptName`] *(String)*: an opt name to use
  to put `Redux` `dispatch` method to,
  when no explicit `mapDispatchToMethods` argument is passed
  to `reduxConnect`.

    Defaults to the `defaultImplicitDispatchOptName` value
    of `riotReduxConnect`'s `options` argument.

  * [`reduxSyncEventName`] *(String)*: defines the name for the
  special event, which triggers re-calculation of redux-dervied opts and
  dispatch methods of the tag. This is mostly needed when you have selectors
  that depend on tag opts, and once those opts are updated you need to somehow
  get an updated redux-derived props and dispatch methods.

    Defaults to the `defaultReduxSyncEventName` value
    of `riotReduxConnect`'s `options` argument.

  * [`disablePreventUpdate`] *([String])*: array of names of the properties
  in `mapDispatchToMethods` object (for `mapDispatchToMethods` function this
  options does nothing), for which the default behavior of disabling riot's
  auto-update (on DOM event handler calls) should NOT work.

    Defaults to the `defaultDisablePreventUpdate` value
    of `riotReduxConnect`'s `options` argument.






## Multiple stores example



Using multiple store is discouraged by Redux methodology, so please use
this way only if you're know what you're doing.


### index.js:

```javascript
import riot from 'riot';
import riotReduxConnect from 'riot-redux-connect';
import store1 from './store1';
import store2 from './store2';

riotReduxConnect(riot, store1, {
  mixinName: 'connectStore1'
});

riotReduxConnect(riot, store1, {
  mixinName: 'connectStore2'
});

document.body.innerHTML = `<some-tag></some-tag>`;
riot.mount('some-tag'));
```

### some-tag.tag:

```html
import { store1Action, store2Action } from './action-creators';
import { store1Selector, store2Selector } from './selectors';

<some-tag>
  <pre>{opts.infoFromStore1}</pre>
  <pre>{opts.infoFromStore2}</pre>
  <button type="button" onclick={store1Action}>Store1 action</button>
  <button type="button" onclick={store2Action}>Store2 action</button
  <script>
    this.connectStore1(
      state => ({ infoFromStore1: store1Selector(state) }),
      { store1Action }
    );

    this.connectStore2(
      state => ({ infoFromStore2: store2Selector(state) }),
      { store2Action }
    );
  </script>
</some-tag>
```





## License

MIT
