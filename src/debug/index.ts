import { Promiser } from '..'

// 2.3.1
const $0 = new Promiser<typeof Promiser>(resolve => {
  setTimeout(() => {
    resolve($0)
  }, 0)
})

// 2.3.3.3.1
new Promiser(resolve => {
  resolve(
    new Promiser(resolve => {
      resolve(null)
    })
  )
})
