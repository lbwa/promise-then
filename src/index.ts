import { isFunction, invariant, isObject, isStrictEql } from './shared/utils'

type OnRejected = (reason?: Error) => any
type OnFulfilled<T> = (value?: T | Promiser<T>) => any

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

/**
 * Why should we have a taskRunner ?
 * @description In practice, this requirement ensures that onFulfilled and
 * onRejected execute asynchronously, after the event loop turn in which then
 * is called, and with a **fresh stack**.
 * In JavaScript, we can use micro-task or task to create a fresh stack
 * @spec https://promisesaplus.com/#point-34
 */
function marcoTaskRunner(this: any, callback: Function, ...args: any[]) {
  setTimeout(() => {
    callback.apply(this, args)
  }, 0)
}

export class Promiser<T> {
  private state: States = States.pending
  private value: any = undefined
  /**
   * Why is _observers a list, not a plain object directly
   * 1. onFulfilled or onRejected can be registered when state is pending.
   * 2. spec 2.2.6 `then` may be called multiple times on the same promise.
   */
  private _observers: ThenableCallbacks<T>[] = []

  private _settle(state: Exclude<States, States.pending>, result?: any) {
    if (this.state !== States.pending) return // exit when settled state
    this.state = state
    this.value = result // any valid JS value or Error object
    this._notify(
      isStrictEql(state, States.fulfilled) ? 'onFulfilled' : 'onRejected'
    )
  }

  private _register(onFulfilled?: OnFulfilled<T>, onRejected?: OnRejected) {
    // Current promiser instance is a `subject`, all onFulfilled and onRejected
    // callbacks are `observer`.
    this._observers.push({
      onFulfilled,
      onRejected,
    })
  }

  private _notify(type: keyof ThenableCallbacks<T>) {
    // spec 2.2.6 asynchronous notification
    this._observers.forEach(callbacks =>
      marcoTaskRunner(() => {
        const handler = callbacks[type]
        if (isFunction(handler)) {
          handler(this.value)
        }
      })
    )
    this._observers.length = 0
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
          // 1. spec 2.3.1 if promiser and result is same object
          if (result === promiser) {
            promiser._settle(
              States.rejected,
              new TypeError("CAN'T resolve a promiser with itself")
            )
            return
          }

          // 2. spec 2.3.2 if result is a promise
          if (result instanceof Promiser) {
            // spec 2.3.2.1
            result.then(
              result => promiser._settle(States.fulfilled, result), // spec 2.3.2.2
              reason => promiser._settle(States.rejected, reason) // spec 2.3.2.3
            )
            return
          }

          // 3. spec 2.3.3 if result is a object or function
          if (isObject(result) || isFunction(result)) {
            // spec 2.3.3.3.3, 2.3.3.3.4
            let flagInvoked = false
            try {
              // spec 2.3.3.1
              const then: Promiser<T>['then'] = result.then // thenable
              // spec 2.3.3.3
              if (isFunction(then)) {
                then.call(
                  result,
                  function resolvePromise(val: any) {
                    // spec 2.3.3.3.3
                    if (!flagInvoked) {
                      // spec 2.3.3.3.1
                      fulfill.call(promiser, val)
                      flagInvoked = true
                    }
                  },
                  function rejectPromise(reason) {
                    // spec 2.3.3.3.3
                    if (!flagInvoked) {
                      // spec 2.3.3.3.2
                      promiser._settle(States.rejected, reason)
                      flagInvoked = true
                    }
                  }
                )
                return
              }
              // spec 2.3.3.4
              promiser._settle(States.fulfilled, result)
            } catch (error) {
              // spec 2.3.3.3.4
              if (!flagInvoked) {
                // spec 2.3.3.2, 2.3.3.4.2
                promiser._settle(States.rejected, error)
              }
            }
            return
          }

          // 4. spec 2.3.4 if result is not a object or function
          promiser._settle(States.fulfilled, result)
        },
        function reject(reason?: Error): void {
          promiser._settle(States.rejected, reason)
        }
      )
    } catch (error) {
      this._settle(States.rejected, error)
    }
  }

  /**
   * @description register a asynchronous operation callback
   * @spec https://promisesaplus.com/#the-then-method
   */
  then(onFulfilled?: OnFulfilled<T>, onRejected?: OnRejected): Promiser<T> {
    const createFulfilledHandler = (
      resolve: OnFulfilled<T>,
      reject: OnRejected
    ) => (result: any) => {
      // spec 2.2.4
      try {
        if (isFunction(onFulfilled)) {
          resolve(onFulfilled(result)) // spec 2.2.2, 2.2.5, 2.2.7.1
        } else {
          resolve(result) // spec 2.2.1, 2.2.7.3
        }
      } catch (evaluationError) {
        reject(evaluationError) // spec 2.2.7.2
      }
    }
    const createRejectedHandler = (
      resolve: OnFulfilled<T>,
      reject: OnRejected
    ) => (error?: Error) => {
      try {
        if (isFunction(onRejected)) {
          resolve(onRejected(error)) // spec 2.2.3, 2.2.5
        } else {
          reject(error) // spec 2.2.1, 2.2.7.4
        }
      } catch (evaluationError) {
        reject(evaluationError) // spec 2.2.7.2
      }
    }
    // spec 2.2.7
    return new Promiser((resolve, reject) => {
      const handleFulfilled = createFulfilledHandler(resolve, reject)
      const handleRejected = createRejectedHandler(resolve, reject)
      if (this.state === States.pending) {
        return this._register(
          /**
           * spec 2.2.4
           * onFulfilled or onRejected must not be called until the execution
           * context stack contains only platform code.
           * https://promisesaplus.com/#point-34
           */
          result => marcoTaskRunner(() => handleFulfilled(result)),
          error => marcoTaskRunner(() => handleRejected(error))
        )
      }

      if (isStrictEql(this.state, States.fulfilled)) {
        return marcoTaskRunner(() => handleFulfilled(this.value))
      }

      if (isStrictEql(this.state, States.rejected)) {
        return marcoTaskRunner(() => handleRejected(this.value))
      }
    })
  }
}

export default Promiser
