import { LinksFunction, ActionFunction, json, useActionData, Form } from 'remix'
import { Link, useSearchParams } from 'remix'
import { db } from '~/utils/db.server'
import { createUserSession, login, register } from '~/utils/session.server'

import stylesUrl from '../styles/login.css'

type ActionData = {
  formError?: string
  fieldErrors?: {
    username: string | undefined
    password: string | undefined
  }
  fields?: {
    loginType: string
    username: string
    password: string
  }
}

export const links: LinksFunction = () => {
  return [
    {
      rel: 'stylesheet',
      href: stylesUrl,
    },
  ]
}

function validateUsername(username: string) {
  if (username.length < 3) {
    return `Username must be at least 3 characters long.`
  }
}

function validatePassword(password: string) {
  if (password.length < 6) {
    return `Password must be at least 6 characters long.`
  }
}

function badRequest(data: ActionData) {
  return json(data, { status: 400 })
}

export const action: ActionFunction = async ({ request }) => {
  const data = await request.formData()

  const username = data.get('username')?.toString()
  const password = data.get('password')?.toString()
  const loginType = data.get('loginType')?.toString()
  const redirectTo = data.get('redirectTo')?.toString() || '/jokes'

  if (!username || !password || !loginType) {
    return badRequest({
      formError: `Form not submitted properly.`,
    })
  }

  const fieldErrors = {
    username: validateUsername(username),
    password: validatePassword(password),
  }

  const fields = {
    loginType,
    username,
    password,
  }

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors, fields })
  }

  switch (loginType) {
    case 'login': {
      const user = await login({
        username,
        password,
      })

      if (!user) {
        return badRequest({
          fields,
          formError: `Username/Password combination is incorrect`,
        })
      }
      return createUserSession(user.id, redirectTo)
    }
    case 'register': {
      const userExists = await db.user.findFirst({
        where: { username },
      })

      if (userExists) {
        return badRequest({
          fields,
          formError: `User with username ${username} already exists`,
        })
      }

      const user = await register({ username, password })

      if (!user) {
        return badRequest({
          fields,
          formError: 'Something went wrong while registering user.',
        })
      }
      return createUserSession(user.id, redirectTo)
    }
    default: {
      return badRequest({
        fields,
        formError: `Login type invalid`,
      })
    }
  }
}

export default function Login() {
  const [searchParams] = useSearchParams()
  const actionData = useActionData<ActionData>()
  return (
    <div className="container">
      <div className="content" data-light="">
        <h1>Login</h1>
        <Form
          method="post"
          aria-describedby={
            actionData?.formError ? 'form-error-message' : undefined
          }
        >
          <input
            type="hidden"
            name="redirectTo"
            value={searchParams.get('redirectTo') ?? undefined}
          />
          <fieldset>
            <legend className="sr-only">Login or Register?</legend>
            <label>
              <input
                type="radio"
                name="loginType"
                value="login"
                defaultChecked={
                  !actionData?.fields?.loginType ||
                  actionData?.fields?.loginType === 'login'
                }
              />{' '}
              Login
            </label>
            <label>
              <input
                type="radio"
                name="loginType"
                value="register"
                defaultChecked={actionData?.fields?.loginType === 'register'}
              />{' '}
              Register
            </label>
          </fieldset>
          <div>
            <label htmlFor="username-input">Username</label>
            <input
              type="text"
              id="username-input"
              name="username"
              aria-invalid={Boolean(actionData?.fieldErrors?.username)}
              aria-describedby={
                actionData?.fieldErrors?.username ? 'usernaem-error' : undefined
              }
              defaultValue={actionData?.fields?.username}
            />
            {actionData?.fieldErrors?.username ? (
              <p
                className="form-validation-error"
                role="alert"
                id="username-error"
              >
                {actionData.fieldErrors.username}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="password-input">Password</label>
            <input
              type="password"
              id="password-input"
              defaultValue={actionData?.fields?.password}
              name="password"
              aria-invalid={Boolean(actionData?.fieldErrors?.password)}
              aria-describedby={
                actionData?.fieldErrors?.password ? 'password-error' : undefined
              }
            />
            {actionData?.fieldErrors?.password ? (
              <p
                className="form-validation-error"
                role="alert"
                id="password-error"
              >
                {actionData.fieldErrors.password}
              </p>
            ) : null}
          </div>
          {actionData?.formError ? (
            <div id="form-error-message">
              <p className="form-validation-error" role="alert">
                {actionData.formError}
              </p>
            </div>
          ) : null}
          <button type="submit" className="button">
            Submit
          </button>
        </Form>
      </div>
      <div className="links">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/jokes">Jokes</Link>
          </li>
        </ul>
      </div>
    </div>
  )
}
