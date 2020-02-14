export function isFunction(val: any): val is Function {
  return typeof val === 'function'
}

export function isObject(val: any): val is object {
  return typeof val === 'object'
}

export function invariant(condition: any, message: string | Error) {
  if (!condition) {
    if (message instanceof Error) {
      throw message
    }
    throw new Error(message)
  }
}
