<h1 align="center">Promise/then</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/promise-then">
    <img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/promise-then?logo=npm">
  </a>
  <a href="https://www.npmjs.com/package/promise-then">
    <img alt="npm" src="https://img.shields.io/npm/v/promise-then?logo=npm">
  </a>
  <a href="https://github.com/lbwa/promise-then/actions">
    <img alt="unit tests" src="https://github.com/lbwa/promise-then/workflows/Promises%2FA%2B%20Test%20Suite/badge.svg">
  </a>
</p>

This library is a kind of implementation for [Promises/A+ specification][spec-promise] which is a kind of typical solution for asynchronous flow control.

The entire callbacks calling are based on [observer pattern](https://en.wikipedia.org/wiki/Observer_pattern). Not two different queues subscribe to a particular state (eg. `fulfilled` OR `rejected`), but just only one **callbacks** queue as `subject's observer` to observe _the state changes of promise instance_.

```text
              callbacks
  (not a particular type of callbacks)
                  +
                  |
               observe
                  |
                  v
the state  changes of Promise instance
       (not a particular state)
                  +
                  |
               notify
                  |
                  v
          callbacks in queue
                  +
                  |
                call
                  |
                  v
      onFulfilled or onRejected

```

[spec-promise]: https://promisesaplus.com

## Installation

```bash
# using yarn
yarn add promise-then

# using npm
npm i promise-then
```

## Usage

```ts
import Promiser from 'promise-then'

const promiser = new Promiser((resolve, reject) => {
  // ... omit unrelated code
  resolve(result) // or reject(reason)
})

promiser.then(
  result => {
    /* get `result` from promiser internal */
  },
  reason => {
    /* handle any error in the promiser */
  }
)
```

## Unit tests

All unit tests have been handled by [the official test suite][doc-promise-test-suite].

[doc-promise-test-suite]: https://github.com/promises-aplus/promises-tests

```bash
# using yarn
yarn test

# using npm
npm t
```

## Debug mode

Debug mode only works with `Visual Studio Code` breakpoint [tutorial][doc-ts-debug].

[doc-ts-debug]: https://code.visualstudio.com/docs/typescript/typescript-debugging

You can use those commands to run debug mode directly if necessary.

```bash
# using yarn
yarn run debug

# using npm
npm run debug
```

## Further

- [Promises/A+ specification][spec-promise]

## License

[MIT](./LICENSE) © [Bowen Liu](https://github.com/lbwa)
