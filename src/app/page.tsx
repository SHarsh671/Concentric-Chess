import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Gamepad, Users, Sparkles, BookOpen } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent" />

        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="text-white space-y-6 z-10">
              <div className="inline-block">
                <span className="bg-orange-500/20 text-orange-400 px-4 py-2 rounded-full text-sm font-semibold">
                  Historic Chess Variants Online
                </span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                Play Chess on a{" "}
                <span className="text-orange-500">Circular Board</span>
              </h1>

              <p className="text-xl text-slate-300 leading-relaxed">
                  Featuring two original variants, Concentric Chess and Archimedes Spiral Chess, designed within the last year for modern online play.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-6">
                  <Link href="/play">
                    <Gamepad className="mr-2 h-5 w-5" />
                    Play Now
                  </Link>
                </Button>

                <Button asChild size="lg" variant="outline" className="bg-white text-slate-900 border-white hover:bg-slate-100 text-lg px-8 py-6">
                  <Link href="/rules">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Learn Rules
                  </Link>
                </Button>
              </div>

              <div className="flex gap-8 pt-6 text-sm text-slate-400">
                <div>
                  <div className="text-2xl font-bold text-white">72</div>
                  <div>Unique Cells</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">2</div>
                  <div>Game Variants</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">∞</div>
                  <div>Strategies</div>
                </div>
              </div>
            </div>

            {/* Right: Board Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full" />
              <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-3xl p-8 border border-slate-700">
                <Image
                  src="/cc/ccboard.svg"
                  alt="Concentric Chess Board"
                  width={600}
                  height={600}
                  className="w-full h-auto drop-shadow-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Why Play Concentric Chess?
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Discover what makes these original variants unique and challenging
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <Card className="bg-slate-800/50 border-slate-700 hover:border-orange-500/50 transition-colors">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Gamepad className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-white">Circular Board</h3>
                <p className="text-slate-400">
                  72 cells in concentric rings create unique paths and strategic possibilities impossible on traditional boards
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-slate-800/50 border-slate-700 hover:border-orange-500/50 transition-colors">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-white">Special Pieces</h3>
                <p className="text-slate-400">
                  Prince pieces immune to check, Berolina pawns with diagonal movement, and the King&apos;s initial leap
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-slate-800/50 border-slate-700 hover:border-orange-500/50 transition-colors">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-white">Online Multiplayer</h3>
                <p className="text-slate-400">
                  Challenge friends with custom invites or join matchmaking. Real-time gameplay with move history and replays
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="bg-slate-800/50 border-slate-700 hover:border-orange-500/50 transition-colors">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                  <BookOpen className="h-8 w-8 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold text-white">Original Variants</h3>
                <p className="text-slate-400">
                  Based on Original Concentric Chess and Archimedes Spiral Chess, now available for online play
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Variants Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Choose Your Variant
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Two unique chess variants, each with their own strategic depth
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Concentric Chess */}
            <Card className="bg-slate-800/50 border-slate-700 overflow-hidden hover:border-orange-500/50 transition-all hover:scale-105">
              <CardContent className="p-0">
                <div className="relative h-64 bg-slate-900">
                  <Image
                    src="/cc/ccboard.png"
                    alt="Concentric Chess Board"
                    width={400}
                    height={400}
                    className="w-full h-full object-contain p-4"
                  />
                </div>
                <div className="p-6 space-y-4">
                  <h3 className="text-2xl font-bold text-white">Concentric Chess</h3>
                  <p className="text-slate-400">
                    Classic circular board with 72 cells arranged in concentric rings.
                    Features crescents, half-moons, and twin cells that create unique movement patterns.
                  </p>
                  <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                    <Link href="/play">
                      Play Concentric Chess
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Archimedes Chess */}
            <Card className="bg-slate-800/50 border-slate-700 overflow-hidden hover:border-blue-500/50 transition-all hover:scale-105">
              <CardContent className="p-0">
                <div className="relative h-64 bg-slate-900">
                  <Image
                    src="/as/asboard.png"
                    alt="Archimedes Spiral Chess Board"
                    width={400}
                    height={400}
                    className="w-full h-full object-contain p-4"
                  />
                </div>
                <div className="p-6 space-y-4">
                  <h3 className="text-2xl font-bold text-white">Archimedes Spiral Chess</h3>
                  <p className="text-slate-400">
                    Spiral board layout with unique geometry. Based on the Archimedes spiral,
                    offering even more complex strategic possibilities.
                  </p>
                  <Button asChild className="w-full bg-slate-600 hover:bg-slate-700 text-white" disabled>
                    <span>
                      Coming Soon
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Get Started in 3 Steps
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Start playing in under a minute
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto text-3xl font-bold text-white">
                1
              </div>
              <h3 className="text-2xl font-bold text-white">Create Account</h3>
              <p className="text-slate-400">
                Sign up in seconds with email or play as a guest
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto text-3xl font-bold text-white">
                2
              </div>
              <h3 className="text-2xl font-bold text-white">Choose Game Mode</h3>
              <p className="text-slate-400">
                Play locally, invite a friend, or join matchmaking
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto text-3xl font-bold text-white">
                3
              </div>
              <h3 className="text-2xl font-bold text-white">Start Playing</h3>
              <p className="text-slate-400">
                Make your first move and discover new strategies
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">
            Ready to Experience Chess<br />Like Never Before?
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Join players discovering new strategies on circular boards.
            Free to play, endless possibilities.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-10 py-7">
              <Link href="/signup">
                Sign Up Free
              </Link>
            </Button>

            <Button asChild size="lg" variant="outline" className="bg-white text-slate-900 border-white hover:bg-slate-100 text-lg px-10 py-7">
              <Link href="/play">
                Play as Guest
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
