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

[Promises/A+][spec-promise] implementation based on observer pattern. `Promises/A+ speciation` is a kind of typical solution for flow control. All promise instance is a kind of subject, all thenable callback functions are observers.

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

## Debug mode

Debug mode only works with [Visual Studio Code](https://code.visualstudio.com/docs/typescript/typescript-debugging) breakpoint.

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
