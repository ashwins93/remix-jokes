import { LoaderFunction, useLoaderData, Link } from 'remix'
import type { Joke } from '@prisma/client'
import { db } from '~/utils/db.server'

type LoaderData = {
  joke: Joke
}

export const loader: LoaderFunction = async () => {
  const count = await db.joke.count()
  const randomNumber = Math.floor(Math.random() * count)
  const [randomJoke] = await db.joke.findMany({
    take: 1,
    skip: randomNumber,
  })
  const data: LoaderData = {
    joke: randomJoke,
  }
  return data
}

export default function JokesIndexRoute() {
  const data = useLoaderData<LoaderData>()

  return (
    <div>
      <p>Here's a random joke:</p>
      <p>{data.joke.content}</p>
      <Link to={data.joke.id}>{data.joke.name} Permalink</Link>
    </div>
  )
}
