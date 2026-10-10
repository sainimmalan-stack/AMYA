import Btn from "@/components/Btn";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-5">
      <span className="font-serif text-8xl text-terracotta/30">404</span>
      <h1 className="font-serif text-4xl mt-4">Page not found</h1>
      <p className="font-sans text-sm text-ink-soft mt-3">The page you're looking for doesn't exist.</p>
      <Btn to="/" variant="solid" className="mt-8">Back home</Btn>
    </div>
  );
}
