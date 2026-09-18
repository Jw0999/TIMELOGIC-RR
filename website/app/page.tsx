import { Hero } from "@/components/Hero";

export default function Home() {
  return (
    <main
      id="main"
      className="min-h-screen w-full bg-[#050711] py-4 sm:py-8 lg:py-10 px-3 sm:px-6 lg:px-8 flex flex-col items-center justify-center relative overflow-hidden"
    >
      {/* Outer ambient canvas lighting matching reference image */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-950/50 via-purple-900/25 to-transparent blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-blue-950/50 via-amber-950/20 to-transparent blur-[140px]" />

      <Hero />
    </main>
  );
}
