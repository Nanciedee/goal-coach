import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F8F7F4]">

      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6">

        <header className="flex items-center justify-between py-6">
          <div className="font-semibold text-gray-900">
            Goal Coach
          </div>

          <Link
            href="/login"
            className="text-sm text-gray-600"
          >
            Log in
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center py-20">

          <div className="max-w-2xl text-center">

            <p className="text-sm font-medium tracking-wide text-gray-400">
              PRODUCTIVITY WITHOUT THE PRESSURE
            </p>

            <h1 className="mt-5 text-5xl font-semibold tracking-tight text-gray-900 sm:text-6xl">
              Make progress,
              <br />
              one thing at a time.
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-500">
              Turn overwhelming goals into small, realistic
              actions that adapt to your energy, motivation,
              and real life.
            </p>

            <Link
              href="/signup"
              className="mt-8 inline-block rounded-2xl bg-gray-900 px-7 py-4 font-medium text-white"
            >
              Get started →
            </Link>

            <p className="mt-5 text-sm text-gray-400">
              No perfect streaks. No guilt. Just the next step.
            </p>

          </div>

        </section>

      </div>

    </main>
  );
}
