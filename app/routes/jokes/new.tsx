import { ActionFunction, json, redirect } from 'remix'
import { db } from '~/utils/db.server'

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

export const action: ActionFunction = async ({ request }) => {
  const data = await request.formData()

  const name = data.get('name')?.toString()
  const content = data.get('content')?.toString()

  if (!name || !content) {
    return badRequest({
      formError: `Form not submitted correctly.`,
    })
  }

  const joke = await db.joke.create({
    data: {
      name,
      content,
    },
  })

  return redirect(`/jokes/${joke.id}`)
}

export default function JokesNewRoute() {
  return (
    <div>
      <p>Add your own joke</p>
      <form method="post">
        <div>
          <label>
            Name: <input type="text" name="name" />
          </label>
        </div>
        <div>
          <label>
            Content: <textarea name="content" />
          </label>
        </div>
        <div>
          <button type="submit" className="button">
            Add
          </button>
        </div>
      </form>
    </div>
  )
}
