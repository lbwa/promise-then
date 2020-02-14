export function isFunction(val: any): val is Function {
  return typeof val === 'function'
}

export function isObject(val: any): val is object {
  return typeof val === 'object' && val !== null
}

/**
 * @description used to compare **same type** data
 */
export function isStrictEql<T>(a: T, b: T) {
  return a === b
}

export function invariant(condition: any, message: string | Error) {
  if (!condition) {
    if (message instanceof Error) {
      throw message
    }
    throw new Error(message)
  }
}
