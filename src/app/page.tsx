import Link from "next/link";
import Strands from "@/components/ui/strands";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 w-full">
      {/* Hero Section */}
      <div className="w-full flex-1 border-struct-b grid grid-cols-1 lg:grid-cols-2">
        <div className="border-struct-r p-8 md:p-16 lg:p-24 flex flex-col justify-center">
          <div className="inline-block border border-orange-600 text-orange-600 px-3 py-1 text-xs font-bold uppercase tracking-widest mb-8 self-start bg-orange-600/10">
            Secure & Automated Payments
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-black leading-none mb-8 text-white uppercase tracking-tight">
            Trustless <br />
            <span className="text-orange-600">Freelance</span> <br />
            Payments
          </h1>

          <p className="text-lg text-[#a1a1aa] max-w-xl leading-relaxed mb-12 border-l-2 border-orange-600 pl-6">
            Hire developers with confidence. Funds are locked securely in an escrow contract and only released when the work is actually done.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/projects/create" className="btn-primary text-center">
              Post a Project
            </Link>
            <Link href="/projects" className="btn-outline text-center">
              Find Freelance Work
            </Link>
          </div>
        </div>

        {/* Structural Hero Graphic / Data */}
        <div className="bg-[#111113] p-8 md:p-16 flex flex-col justify-between hidden lg:flex">
          <div className="space-y-4">
            <div className="flex justify-between border-struct-b pb-4">
              <span className="text-xs uppercase text-[#a1a1aa] tracking-widest">Platform Status</span>
              <span className="text-xs uppercase text-green-500 font-bold tracking-widest">Online & Secure</span>
            </div>
            <div className="flex justify-between border-struct-b pb-4">
              <span className="text-xs uppercase text-[#a1a1aa] tracking-widest">Blockchain Tech</span>
              <span className="text-xs uppercase text-white font-bold tracking-widest">Stellar & Soroban</span>
            </div>
            <div className="flex justify-between border-struct-b pb-4">
              <span className="text-xs uppercase text-[#a1a1aa] tracking-widest">Total Escrow Volume</span>
              <span className="text-xs uppercase text-white font-bold tracking-widest">$14.2M USDC</span>
            </div>
          </div>
          <div className="w-full h-[300px] md:h-[300px] relative mx-auto my-auto flex items-center justify-center overflow-hidden">
            <Strands
              colors={["#F97316", "#7C3AED", "#06B6D4"]}
              count={3}
              speed={0.5}
              amplitude={1}
              waviness={1}
              thickness={0.7}
              glow={2.6}
              taper={3}
              spread={1}
              intensity={0.6}
              saturation={1.5}
              opacity={1}
              scale={1.5}
              glass={false}
              refraction={1}
              dispersion={1}
              glassSize={1}
            />
          </div>
          <div className="mt-auto">
            <p className="font-display text-4xl text-[#27272a] font-black uppercase tracking-tight">
              // Work Protected By <br /> Smart Contracts
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3">
        {[
          {
            title: "Secure Escrow",
            desc: "Your money is held safely in a smart contract. It’s only released to the freelancer once you approve the milestone.",
            num: "01"
          },
          {
            title: "Instant Global Payments",
            desc: "Pay or get paid instantly anywhere in the world using stablecoins (USDC) with nearly zero transaction fees.",
            num: "02"
          },
          {
            title: "Automated Approvals",
            desc: "Link your project to GitHub. When a pull request is merged, the milestone is automatically marked complete.",
            num: "03"
          }
        ].map((feature, i) => (
          <div key={i} className={`p-8 md:p-12 hover:bg-[#111113] transition-colors ${i < 2 ? 'border-struct-r' : ''}`}>
            <span className="text-orange-600 font-bold text-xl mb-8 block">{feature.num}</span>
            <h3 className="font-display text-2xl font-black mb-4 text-white uppercase">{feature.title}</h3>
            <p className="text-[#a1a1aa] text-sm leading-relaxed">{feature.desc}</p>
          </div>
        ))}
    </div>
      
      {/* Logo Marquee */}
      <div className="w-full border-t border-[#27272a] py-8 overflow-hidden bg-black flex relative">
        <div className="w-full absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-black via-transparent to-black max-w-7xl mx-auto"></div>
        <div className="flex w-max min-w-full animate-marquee">
          {[1, 2].map((set) => (
            <div key={set} className="flex w-1/2 justify-around items-center px-4 gap-16 md:gap-32">
              {["STELLAR", "SOROBAN", "GITHUB", "SLACK", "NOTION", "VERCEL", "SUPABASE", "NEXT.JS"].map((logo, i) => (
                <span key={i} className="font-display font-black text-2xl text-[#3f3f46] uppercase tracking-widest whitespace-nowrap">
                  {logo}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
