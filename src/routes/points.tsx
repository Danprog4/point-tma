import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/points')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/points"!</div>
}
