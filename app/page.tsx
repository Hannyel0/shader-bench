import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-8">
        <h1 className="text-4xl font-bold text-zinc-950 dark:text-zinc-50">
          Shadertoy Performance Framework
        </h1>
        <Link
          href="/shaders"
          className="rounded-full bg-zinc-950 px-8 py-4 text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Launch Shader Gallery
        </Link>
      </main>
    </div>
  );
}
