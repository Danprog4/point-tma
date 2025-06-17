import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(trpc.main.getHello.queryOptions());
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());

  return (
    <div className="p-10">
      <h3>Hello from backend with tRPC:</h3>
      {user && <div>{user.name}</div>}
      {isLoading ? <div>Loading...</div> : <div>hello {data?.hello}</div>}
    </div>
  );
}
