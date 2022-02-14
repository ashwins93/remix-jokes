import { useLoaderData, Link, useParams, useCatch, redirect, Form } from 'remix'
import type { LoaderFunction, ActionFunction, MetaFunction } from 'remix'
import type { Joke } from '@prisma/client'
import { db } from '~/utils/db.server'
import { getUserId, requireUserId } from '~/utils/session.server'
import { JokeDisplay } from '~/components/joke'

type LoaderData = {
  joke: Joke
  isOwner: boolean
}

export const meta: MetaFunction = ({ data }: { data: LoaderData }) => {
  if (!data) {
    return {
      title: 'No joke',
      description: 'No joke found',
    }
  }
  return {
    title: `${data.joke.name} joke`,
    description: `Enjoy the ${data.joke.name} joke and much more`,
  }
}

export const action: ActionFunction = async ({ request, params }) => {
  const data = await request.formData()
  const method = data.get('_method')?.toString()
  if (method === 'delete') {
    const userId = await requireUserId(request)
    const { jokeId } = params

    const joke = await db.joke.findUnique({ where: { id: jokeId } })

    if (!joke) {
      throw new Response('What a joke! Not found.', {
        status: 404,
      })
    }

    if (joke.jokesterId !== userId) {
      throw new Response('You do not have permission to do that', {
        status: 401,
      })
    }

    await db.joke.delete({ where: { id: jokeId } })

    return redirect('/jokes')
  }

  return new Response('Method not supported', {
    status: 400,
  })
}

export const loader: LoaderFunction = async ({ params, request }) => {
  const { jokeId } = params
  const userId = await getUserId(request)

  const joke = await db.joke.findUnique({ where: { id: jokeId } })

  if (!joke) {
    throw new Response('What a joke! Not found.', {
      status: 404,
    })
  }

  const data: LoaderData = {
    joke,
    isOwner: joke.jokesterId === userId,
  }

  return data
}

export default function JokeRoute() {
  const data = useLoaderData<LoaderData>()
  return <JokeDisplay joke={data.joke} isOwner={data.isOwner} />
}

export function ErrorBoundary() {
  const { jokeId } = useParams()
  return (
    <div className="container">
      There was an error loading joke by the id {jokeId}. Sorry.
    </div>
  )
}

export function CatchBoundary() {
  const caught = useCatch()
  const params = useParams()

  console.log({ caught })

  if (caught.status === 404) {
    return (
      <div className="error-container">
        Huh? What the heck is "{params.jokeId}"?
      </div>
    )
  }

  if (caught.status === 401) {
    return (
      <div className="error-container">
        You don't have permission to do that
      </div>
    )
  }
  throw new Error(`Unhandled error: ${caught.status}`)
}
