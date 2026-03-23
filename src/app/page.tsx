import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Gamepad,
  BookOpen,
  Trophy,
  Circle,
  Crown,
  Swords,
  Target,
  ScrollText,
  Zap,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-serif">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, #000 0px, #000 2px, transparent 2px, transparent 40px),
                             repeating-linear-gradient(90deg, #000 0px, #000 2px, transparent 2px, transparent 40px)`,
          }}
        />
      </div>

      <section className="relative overflow-hidden border-b-8 border-black">
        <div className="absolute top-10 left-10 text-9xl opacity-5 font-bold select-none">
          ♔
        </div>
        <div className="absolute bottom-10 right-10 text-9xl opacity-5 font-bold select-none">
          ♚
        </div>

        <div className="container mx-auto px-4 py-16 lg:py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Trophy className="h-5 w-5 text-white" strokeWidth={2} />
              <span className="font-bold tracking-wider text-sm">
                ORIGINAL CHESS VARIANTS ONLINE
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4 text-6xl lg:text-8xl">
                <span className="opacity-20">♜</span>
                <h1 className="font-bold leading-none text-black tracking-wide">
                  CONCENTRIC & ARCHIMEDEAN
                </h1>
                <span className="opacity-20">♞</span>
              </div>
              <div className="flex items-center justify-center gap-4 text-6xl lg:text-8xl">
                <span className="opacity-20">♝</span>
                <h1 className="font-bold leading-none text-black tracking-wide">
                  CHESS
                </h1>
                <span className="opacity-20">♛</span>
              </div>
            </div>

            <p className="text-xl lg:text-2xl text-gray-700 leading-relaxed max-w-3xl mx-auto">
              Experience chess on a revolutionary circular board. Two original
              variants designed for strategic depth and modern online play.
            </p>

            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Button
                asChild
                size="lg"
                className="bg-black hover:bg-gray-900 text-white text-lg px-10 py-7 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                <Link href="/play">
                  <Gamepad className="mr-2 h-5 w-5 text-white" />
                  PLAY NOW
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-white text-black border-4 border-black text-lg px-10 py-7 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                <Link href="/rules">
                  <BookOpen className="mr-2 h-5 w-5 text-black" />
                  LEARN RULES
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-8">
              <div className="p-4 bg-white border-4 border-black">
                <div className="text-4xl font-bold text-black">72</div>
                <div className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                  Cells
                </div>
              </div>
              <div className="p-4 bg-black text-white border-4 border-black">
                <div className="text-4xl font-bold">2</div>
                <div className="text-sm font-bold uppercase tracking-wider">
                  Variants
                </div>
              </div>
              <div className="p-4 bg-white border-4 border-black">
                <div className="text-4xl font-bold text-black">∞</div>
                <div className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                  Moves
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-black text-white text-4xl mb-4 border-4 border-black">
              ♔
            </div>
            <h2 className="text-5xl lg:text-6xl font-bold text-black mb-4 tracking-wide">
              WHY PLAY?
            </h2>
            <div className="w-32 h-2 bg-black mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { icon: <Circle />, title: "Circular Board", desc: "72 cells in concentric rings create unique paths impossible on traditional square boards." },
              { icon: <Crown />, title: "Special Pieces", desc: "Prince pieces, Berolina pawns, and unique royal movement rules." },
              { icon: <Swords />, title: "Online Play", desc: "Challenge friends or join matchmaking with real-time gameplay." },
              { icon: <Target />, title: "Strategic Depth", desc: "New tactical possibilities with crescents, half-moons, and twin cells." },
              { icon: <ScrollText />, title: "Move History", desc: "Review games with complete move replay and analysis tools." },
              { icon: <Zap />, title: "Fast & Free", desc: "No downloads required. Play instantly in your browser." },
            ].map((feature, i) => (
              <Card key={i} className="bg-white border-4 border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-20 h-20 bg-white border-4 border-black flex items-center justify-center mx-auto">
                    {feature.icon &&
                      feature.icon.type &&
                      <feature.icon.type className="h-10 w-10 text-black" strokeWidth={2} />}
                  </div>
                  <h3 className="text-2xl font-bold text-black uppercase tracking-wide">
                    {feature.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {feature.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


      <section className="py-20 bg-gray-50 border-y-8 border-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl lg:text-6xl font-bold text-black mb-4">
              CHOOSE YOUR VARIANT
            </h2>
            <div className="w-32 h-2 bg-black mx-auto"></div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Concentric Chess */}
            <Card className="bg-white border-8 border-black overflow-hidden hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all">
              <CardContent className="p-0">
                <div className="relative h-80 bg-white border-b-8 border-black p-8">
                  <Image
                    src="/cc/ccboard.png"
                    alt="Concentric Chess Board"
                    width={400}
                    height={400}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-8 space-y-4 bg-gray-50">
                  <h3 className="text-3xl font-bold text-black uppercase">Concentric Chess</h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Classic circular board with 72 cells in concentric rings.
                    Features unique movement patterns with crescents and half-moons.
                  </p>
                  <Button asChild className="w-full bg-black hover:bg-gray-900 text-white py-6 text-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold">
                    <Link href="/play?variant=concentric">
                      PLAY NOW ♔
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Archimedes Chess */}
            <Card className="bg-white border-8 border-black overflow-hidden hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all">
              <CardContent className="p-0">
                <div className="relative h-80 bg-white border-b-8 border-black p-8">
                  <Image
                    src="/as/asboard.png"
                    alt="Archimedes Spiral Chess Board"
                    width={400}
                    height={400}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-8 space-y-4 bg-gray-50">
                  <h3 className="text-3xl font-bold text-black uppercase">Archimedes Spiral</h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Spiral board layout based on the Archimedes spiral.
                    Even more complex strategic possibilities await.
                  </p>
                  <Button asChild className="w-full bg-black hover:bg-gray-900 text-white py-6 text-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold">
                    <Link href="/play?variant=archimedean">
                      PLAY NOW ♚
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl lg:text-6xl font-bold text-black mb-4">
              GET STARTED
            </h2>
            <div className="w-32 h-2 bg-black mx-auto mb-4"></div>
            <p className="text-xl text-gray-600">Three simple steps to your first game</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-black text-white border-4 border-black flex items-center justify-center mx-auto text-4xl font-bold">
                1
              </div>
              <h3 className="text-2xl font-bold text-black uppercase">Sign Up</h3>
              <p className="text-gray-700">
                Create account or play as guest
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-black text-white border-4 border-black flex items-center justify-center mx-auto text-4xl font-bold">
                2
              </div>
              <h3 className="text-2xl font-bold text-black uppercase">Choose Mode</h3>
              <p className="text-gray-700">
                Local, friend invite, or matchmaking
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-black text-white border-4 border-black flex items-center justify-center mx-auto text-4xl font-bold">
                3
              </div>
              <h3 className="text-2xl font-bold text-black uppercase">Play</h3>
              <p className="text-gray-700">
                Make moves and master the circle
              </p>
            </div>
          </div>
        </div>
      </section>




      <section className="py-24 bg-black text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 text-9xl opacity-10 select-none">
          ♜♞♝♛♚♝♞♜
        </div>
        <div className="absolute bottom-0 right-0 text-9xl opacity-10 select-none rotate-180">
          ♜♞♝♛♚♝♞♜
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-5xl lg:text-7xl font-bold mb-6">
            READY TO PLAY?
          </h2>
          <p className="text-2xl mb-10 max-w-2xl mx-auto opacity-90">
            Join players worldwide discovering new strategies on circular boards.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-black text-white text-xl px-12 py-8 border-4 border-whitev shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] font-bold"
            >
              <Link href="/signup">SIGN UP FREE</Link>
            </Button>

          
          </div>
        </div>
      </section>
    </div>
  );
}