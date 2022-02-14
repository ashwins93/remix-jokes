import {
  ActionFunction,
  Form,
  json,
  Link,
  LoaderFunction,
  redirect,
  useActionData,
  useCatch,
  useTransition,
} from 'remix'
import { JokeDisplay } from '~/components/joke'
import { db } from '~/utils/db.server'
import { getUserId, requireUserId } from '~/utils/session.server'

type ActionData = {
  formError?: string
  fieldErrors?: {
    name: string | undefined
    content: string | undefined
  }
  fields?: {
    name: string
    content: string
  }
}

const badRequest = (data: ActionData) => json(data, { status: 400 })

function validateJokeName(name: string) {
  if (name.length < 2) {
    return `That joke's name is too short`
  }
}

function validdateJokeContent(content: string) {
  if (content.length < 10) {
    return `That joke's too short.`
  }
}

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request)

  if (!userId) {
    throw new Response('Unauthorized', { status: 401 })
  }

  return {}
}

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request)
  const data = await request.formData()

  const name = data.get('name')?.toString()
  const content = data.get('content')?.toString()

  if (!name || !content) {
    return badRequest({
      formError: `Form not submitted correctly.`,
    })
  }

  const fieldErrors = {
    name: validateJokeName(name),
    content: validdateJokeContent(content),
  }

  const fields = { name, content }

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors, fields })
  }

  const joke = await db.joke.create({
    data: { ...fields, jokesterId: userId },
  })

  return redirect(`/jokes/${joke.id}`)
}

export default function JokesNewRoute() {
  const actionData = useActionData<ActionData>()
  const transition = useTransition()

  if (transition.submission) {
    const name = transition.submission.formData.get('name')
    const content = transition.submission.formData.get('content')

    if (
      typeof name === 'string' &&
      typeof content === 'string' &&
      validateJokeName(name) &&
      validdateJokeContent(content)
    ) {
      return <JokeDisplay joke={{ name, content }} canDelete={false} isOwner />
    }
  }

  return (
    <div>
      <p>Add your own joke</p>
      <Form method="post">
        <div>
          <label>
            Name:{' '}
            <input
              type="text"
              name="name"
              defaultValue={actionData?.fields?.name}
              aria-invalid={Boolean(actionData?.fieldErrors?.name)}
              aria-describedby={
                actionData?.fieldErrors?.name ? 'name-error' : undefined
              }
            />
          </label>
          {actionData?.fieldErrors?.name ? (
            <p className="form-validation-error" role="alert" id="name-alert">
              {actionData.fieldErrors.name}
            </p>
          ) : null}
        </div>
        <div>
          <label>
            Content:{' '}
            <textarea
              name="content"
              defaultValue={actionData?.fields?.content}
              aria-invalid={
                Boolean(actionData?.fieldErrors?.content) || undefined
              }
              aria-describedby={
                actionData?.fieldErrors?.content ? 'content-error' : undefined
              }
            />
          </label>
          {actionData?.fieldErrors?.content ? (
            <p
              className="form-validation-error"
              role="alert"
              id="content-alert"
            >
              {actionData.fieldErrors.content}
            </p>
          ) : null}
        </div>
        <div>
          <button type="submit" className="button">
            Add
          </button>
        </div>
      </Form>
    </div>
  )
}

export function ErrorBoundary() {
  return (
    <div className="error-container">
      Something unexpected went wrong. Sorry about that.
    </div>
  )
}

export function CatchBoundary() {
  const caught = useCatch()

  if (caught.status === 401) {
    return (
      <div className="error-container">
        <p>You must be loggged in to create a joke.</p>
        <Link to="/login">Login</Link>
      </div>
    )
  }
}
