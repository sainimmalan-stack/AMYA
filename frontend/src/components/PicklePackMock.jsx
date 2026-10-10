// Premium packaging MOCKUP for pickle products shown until genuine
// product photography is uploaded. Deliberately a branded packaging concept,
// never a food photograph. Rendered whenever a pickle has no real image yet.
export default function PicklePackMock({ name = "AMYA" }) {
  const short = name.replace(/\bPickle\b/i, "").trim() || "AMYA";
  return (
    <div
      data-testid="pickle-pack-mock"
      className="h-full w-full flex items-center justify-center bg-gradient-to-b from-ivory to-ivory-warm"
    >
      <div className="relative w-[58%] max-w-[180px]">
        {/* lid */}
        <div className="mx-auto h-4 w-2/3 rounded-t-md bg-terracotta-deep" />
        <div className="mx-auto h-1.5 w-3/4 rounded-sm bg-choco/70" />
        {/* jar body */}
        <div className="mt-1 rounded-xl border border-ink/10 bg-ivory shadow-[0_12px_30px_-14px_rgba(66,37,31,0.4)] px-3 py-5">
          {/* terracotta label */}
          <div className="rounded-md bg-terracotta text-ivory text-center px-2 py-4 border border-gold/40">
            <p className="font-serif text-xl leading-none">AMYA</p>
            <span className="block mx-auto my-1.5 h-px w-8 bg-gold" />
            <p className="font-sans text-[8px] uppercase tracking-[0.28em] text-ivory/80">Artisanal Foods</p>
            <p className="font-serif text-sm mt-2 leading-tight">{short}</p>
          </div>
          <p className="text-center font-sans text-[8px] uppercase tracking-[0.2em] text-ink-soft mt-3">Packaging concept</p>
        </div>
      </div>
    </div>
  );
}
