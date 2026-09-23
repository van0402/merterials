export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8">
      <div className="mb-4 h-3 w-40 rounded bg-slate-200" />

      <section className="overflow-hidden rounded-[26px] border bg-white shadow-sm">
        <div className="h-[160px] bg-slate-200" />
        <div className="flex flex-col gap-5 px-7 pb-7 sm:flex-row sm:items-end">
          <div className="-mt-14 h-[110px] w-[110px] flex-none rounded-[22px] border-4 border-white bg-slate-300" />
          <div className="min-w-0 flex-1 space-y-2.5 pt-4 sm:pt-0">
            <div className="h-6 w-64 rounded bg-slate-200" />
            <div className="h-3 w-48 rounded bg-slate-200" />
            <div className="h-3 w-32 rounded bg-slate-200" />
          </div>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="mt-3 h-3 w-full rounded bg-slate-200" />
            <div className="mt-2 h-3 w-5/6 rounded bg-slate-200" />
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="h-5 w-32 rounded bg-slate-200" />
            <div className="mt-4 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="h-[100px] bg-slate-200" />
                  <div className="space-y-2 p-2.5">
                    <div className="h-3 w-full rounded bg-slate-200" />
                    <div className="h-3 w-2/3 rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="h-5 w-24 rounded bg-slate-200" />
            <div className="mt-3 h-3 w-full rounded bg-slate-200" />
            <div className="mt-2 h-3 w-3/4 rounded bg-slate-200" />
          </section>
        </div>
      </div>
    </div>
  );
}