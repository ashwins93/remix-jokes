import { Link, Outlet, useLoaderData } from 'remix'
import type { LinksFunction, LoaderFunction } from 'remix'
import type { Joke } from '@prisma/client'
import stylesUrl from '../styles/jokes.css'
import { db } from '~/utils/db.server'

type LoaderData = {
  jokes: Array<Joke>
}

export const loader: LoaderFunction = async () => {
  return {
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
  } as LoaderData
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
                  <Link to={joke.id}>{joke.name}</Link>
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
