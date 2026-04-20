import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCreditBalance, getOrCreateUser } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function GeneratePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error("Signed-in user has no email address on file");
  }

  await getOrCreateUser(userId, email);
  const balance = await getCreditBalance(userId);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Generate a baby photo</h1>
          <p className="text-sm text-muted-foreground">Signed in as {email}</p>
        </div>
        <div className="rounded-full border px-4 py-1.5 text-sm font-medium">
          {balance} {balance === 1 ? "credit" : "credits"}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload two parent photos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Upload flow lands here in Phase 1. The Phase 0 scaffold confirms auth,
            DB, and credit balance are wired.
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>Face detection + single-face check</li>
            <li>Age classifier gate (rejects probable minors)</li>
            <li>ArcFace embedding extraction</li>
            <li>InstantID on Replicate with hardcoded prompt</li>
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
