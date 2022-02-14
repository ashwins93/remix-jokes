import { Form, Link, Outlet, useLoaderData } from 'remix'
import type { LinksFunction, LoaderFunction } from 'remix'
import type { User } from '@prisma/client'
import stylesUrl from '../styles/jokes.css'
import { db } from '~/utils/db.server'
import { getUser } from '~/utils/session.server'

type LoaderData = {
  jokes: Array<{ id: string; name: string }>
  user: User | null
}

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request)
  const data: LoaderData = {
    jokes: await db.joke.findMany({
      select: {
        id: true,
        name: true,
      },
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    user,
  }

  return data
}

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: stylesUrl }]
}

export default function JokesRoute() {
  const data = useLoaderData<LoaderData>()

  return (
    <div className="jokes-layout">
      <header className="jokes-header">
        <div className="container">
          <h1 className="home-link">
            <Link to="/" title="Remix Jokes" aria-label="Remix Jokes">
              <span className="logo">🤪</span>
              <span className="logo-medium">J🤪KES</span>
            </Link>
          </h1>
          {data.user ? (
            <div className="user-info">
              <span>Hi {data.user.username}</span>
              <Form method="post" action="/logout">
                <button type="submit" className="button">
                  Logout
                </button>
              </Form>
            </div>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </header>

      <main className="jokes-main">
        <div className="container">
          <div className="jokes-list">
            <Link to=".">Get a random joke</Link>
            <p>Here are a few more jokes to check out:</p>
            <ul>
              {data.jokes.map(joke => (
                <li key={joke.id}>
                  <Link prefetch="intent" to={joke.id}>
                    {joke.name}
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="new" className="button">
              Add your own
            </Link>
          </div>
          <div className="jokes-outlet">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}

export function CatchBoundary() {}
