import { compare, hash } from 'bcryptjs'
import { createCookieSessionStorage, redirect } from 'remix'
import { db } from './db.server'

type LoginForm = {
  username: string
  password: string
}

export const login = async ({ username, password }: LoginForm) => {
  const user = await db.user.findUnique({
    where: {
      username,
    },
  })

  if (!user) return null

  const validPassword = await compare(password, user.passwordHash)

  if (!validPassword) return null

  return user
}

const sessionSecret = process.env.SESSION_SECRET

if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set')
}

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    cookie: {
      name: 'RJ_session',
      secrets: [sessionSecret],
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
    },
  })

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await getSession()

  session.set('userId', userId)

  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await commitSession(session),
    },
  })
}

export function getUserSession(request: Request) {
  return getSession(request.headers.get('Cookie'))
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request)
  const userId = session.get('userId')

  if (!userId || typeof userId !== 'string') return null

  return userId
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const session = await getUserSession(request)
  const userId = session.get('userId')

  if (!userId || typeof userId !== 'string') {
    const searchParams = new URLSearchParams([['redirectTo', redirectTo]])
    throw redirect(`/login?${searchParams}`)
  }

  return userId
}

export async function getUser(request: Request) {
  const userId = await getUserId(request)

  if (!userId || typeof userId !== 'string') {
    return null
  }

  try {
    const user = await db.user.findUnique({ where: { id: userId } })
    return user
  } catch (e) {
    throw logout(request)
  }
}

export async function logout(request: Request) {
  const session = await getSession(request.headers.get('Cookie'))

  return redirect('/login', {
    headers: {
      'Set-Cookie': await destroySession(session),
    },
  })
}

export async function register({ username, password }: LoginForm) {
  const passwordHash = await hash(password, 10)

  const user = await db.user.create({
    data: { username, passwordHash },
  })

  return user
}
