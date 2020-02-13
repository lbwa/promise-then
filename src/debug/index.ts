import { Promiser } from '..'

const promiser = new Promiser<typeof Promiser>(resolve => {
  setTimeout(() => {
    resolve(promiser)
  }, 0)
})
