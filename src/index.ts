import { isFunction, invariant, isObject, isDef } from './shared/utils'

type OnRejected = (reason?: Error) => void
type OnFulfilled<T> = (value?: T | Promiser<T>) => void

interface ThenableCallbacks<T> {
  onFulfilled?: OnFulfilled<T>
  onRejected?: OnRejected
}

/**
 * @description All states
 * @spec https://promisesaplus.com/#promise-states
 */
const enum States {
  pending = 'pending',
  fulfilled = 'fulfilled',
  rejected = 'rejected',
}

export class Promiser<T> {
  private state: States = States.pending
  private value: any = undefined
  /**
   * Why is _queue a list, not a plain object directly
   * 1. onFulfilled or onRejected can be registered when state is pending.
   * 2. spec 2.2.6 `then` may be called multiple times on the same promise.
   * Multiple `then` calling for registering multiple callbacks on the same
   * promise with pending state to prevent callback override.
   */
  private _queue: ThenableCallbacks<T>[] = []

  private _fulfill(result?: any) {
    this.switchState(States.fulfilled)
    this.value = result

    this.marcoTaskRunner(() => this.flushCallbacks('onFulfilled'))
  }

  private _reject(error?: Error) {
    this.switchState(States.rejected)
    this.value = error

    this.marcoTaskRunner(() => this.flushCallbacks('onRejected'))
  }

  private flushCallbacks(type: keyof ThenableCallbacks<T>) {
    this._queue.forEach(callbacks =>
      this.marcoTaskRunner(() => {
        const handler = callbacks[type]
        if (isFunction(handler)) {
          handler(this.value)
        }
      })
    )
    this._queue.length = 0
  }

  /**
   * Why should we have a taskRunner ?
   * @description In practice, this requirement ensures that onFulfilled and
   * onRejected execute asynchronously, after the event loop turn in which then
   * is called, and with a **fresh stack**.
   * In JavaScript, we can use micro-task or task to create a fresh stack
   * @spec https://promisesaplus.com/#point-34
   */
  private marcoTaskRunner(callback: Function, ...args: any[]) {
    setTimeout(() => {
      callback.apply(this, args)
    }, 0)
  }

  private switchState(state?: States) {
    if (this.state !== States.pending) return

    invariant(
      !(this.state === States.pending && !isDef(state)),
      'Require a target state'
    )
    this.state = state!
  }

  private _subscribe(onFulfilled?: OnFulfilled<T>, onRejected?: OnRejected) {
    this._queue.push({
      onFulfilled,
      onRejected,
    })
  }

  /**
   * @spec https://promisesaplus.com/#the-promise-resolution-procedure
   * @param executor
   */
  constructor(executor: (resolve: OnFulfilled<T>, reject: OnRejected) => void) {
    invariant(this instanceof Promiser, "Constructor Promiser requires 'new'")

    const promiser = this
    try {
      executor(
        function fulfill(result?: any): void {
          // 1. if promiser and result is same object
          if (result === promiser) {
            promiser._reject(
              new TypeError("CAN'T resolve a promiser with itself")
            )
            return
          }

          // 2. if result is a promise
          if (result instanceof Promiser) {
            result.then(
              promiser._fulfill.bind(promiser),
              promiser._reject.bind(promiser)
            )
            return
          }

          // 3. if result is a object or function
          if (isObject(result) || isFunction(result)) {
            let thenable: Promiser<T>['then'] | null = null
            try {
              thenable = result.then
            } catch (error) {
              promiser._reject(error)
            }

            // spec 2.3.3.3
            if (isFunction(thenable)) {
              thenable.call(
                result,
                function resolvePromise(val: any) {
                  fulfill.call(promiser, val)
                },
                function rejectPromise(reason) {
                  promiser._reject(reason)
                }
              )
              return
            }
            // spec 2.3.3.4
            promiser._fulfill(result)
            return
          }

          // 4. if result is not a object or function
          promiser._fulfill(result)
        },
        function reject(reason?: Error): void {
          promiser._reject(reason)
        }
      )
    } catch (error) {
      this._reject(error)
    }
  }

  /**
   * @description register a asynchronous operation callback
   * @param onFulfilled
   * @param onRejected
   * @spec https://promisesaplus.com/#the-then-method
   */
  then(onFulfilled?: OnFulfilled<T>, onRejected?: OnRejected): Promiser<T> {
    return new Promiser((resolve, reject) => {
      resolve()
    })
  }
}
