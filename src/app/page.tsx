import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          See your future baby.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Upload two parent photos. Adjust resemblance, age, and skin tone with
          sliders — not a one-shot guess. Get a photo back in under a minute.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/generate">Try it free</Link>
          </Button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          1 free photo on signup. No subscription.
        </p>
      </div>
    </main>
  );
}
