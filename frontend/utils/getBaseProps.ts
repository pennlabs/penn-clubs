import { GetServerSidePropsContext } from 'next'

import { doApiRequest } from '~/utils'

type FromNextContextOrPureValue<T> = T | ((ctx: GetServerSidePropsContext) => T)

const isFunction = <T>(
  value: FromNextContextOrPureValue<T>,
): value is (ctx: GetServerSidePropsContext) => T => typeof value === 'function'

const resolveNextContextValue = <T>(
  value: FromNextContextOrPureValue<T>,
  ctx: GetServerSidePropsContext,
): T => (isFunction(value) ? value(ctx) : value)

export const createBasePropFetcher =
  (args?: {
    permissions?: FromNextContextOrPureValue<string[]>
    additionalPermissions?: FromNextContextOrPureValue<string[]>
  }) =>
  async (ctx: GetServerSidePropsContext) => {
    const permissions = resolveNextContextValue(args?.permissions, ctx)
    const additionalPermissions = resolveNextContextValue(
      args?.additionalPermissions,
      ctx,
    )
    const fetchData = {
      headers: ctx.req ? { cookie: ctx.req.headers.cookie } : undefined,
    }
    const fetchSettings = async () => {
      try {
        const resp = await doApiRequest('/settings/?format=json', fetchData)
        if (resp.ok) {
          return resp.json()
        }
        return null
      } catch (e) {
        return null
      }
    }
    const fetchPermissions = async (): Promise<Record<string, boolean>> => {
      if ((permissions?.length ?? 0) <= 0) return {}
      const resp = await doApiRequest(
        `/settings/permissions/?perm=${[
          ...(permissions ?? []),
          ...(additionalPermissions ?? []),
        ].join(',')}&format=json`,
        fetchData,
      )
      if (!resp.ok) {
        return permissions!.reduce((acc, perm) => {
          acc[perm] = false
          return acc
        }, {})
      }
      const data = await resp.json()
      return data.permissions
    }
    const [userInfo, userPermissions] = await Promise.all([
      fetchSettings(),
      fetchPermissions(),
    ])
    const auth = {
      authenticated: !!userInfo,
      userInfo,
    }
    return { auth, permissions: userPermissions }
  }
