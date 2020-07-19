import React from 'react'

export const AuthCheckContext = React.createContext<
  (func: any, ...args: any[]) => any
>(() => null)
