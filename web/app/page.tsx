import { site } from "@/lib/site";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">{site.name}</h1>
      <p className="mt-3 text-lg opacity-80">{site.tagline}</p>
    </main>
  );
}
