// Premium packaging MOCKUP for pickle products shown until genuine
// product photography is uploaded. Deliberately a branded packaging concept,
// never a food photograph. Rendered whenever a pickle has no real image yet.
export default function PicklePackMock({ name = "AMYA" }) {
  const short = (name.replace(/\bPickle\b/i, "").trim() || "AMYA").toUpperCase();
  return (
    <div
      data-testid="pickle-pack-mock"
      className="h-full w-full flex items-center justify-center bg-ivory-warm px-3 pt-9 pb-3"
    >
      <div className="w-[52%] max-w-[136px]">
        {/* lid */}
        <div className="mx-auto h-3.5 w-3/5 rounded-t-md bg-terracotta-deep" />
        {/* jar body */}
        <div className="rounded-xl bg-ivory shadow-[0_10px_26px_-14px_rgba(66,37,31,0.35)] px-2.5 pt-3.5 pb-2.5">
          {/* terracotta label */}
          <div className="rounded-md bg-terracotta text-ivory text-center px-2 py-3">
            <p className="font-serif text-lg leading-none">AMYA</p>
            <span className="block mx-auto my-1.5 h-px w-7 bg-gold/70" />
            <p className="font-sans text-[7px] uppercase tracking-[0.26em] text-ivory/80">Artisanal Foods</p>
            <p className="font-serif text-xs mt-1.5 leading-tight">{short}</p>
          </div>
          <p className="text-center font-sans text-[7px] uppercase tracking-[0.2em] text-ink-soft mt-2">Packaging concept</p>
        </div>
      </div>
    </div>
  );
}
