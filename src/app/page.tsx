import { auth, currentUser } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCreditBalance, getOrCreateUser } from "@/lib/users";
import { UploadForm } from "./upload-form";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { userId } = await auth();

  let email: string | null = null;
  let balance = 0;

  if (userId) {
    const user = await currentUser();
    email =
      user?.primaryEmailAddress?.emailAddress ??
      user?.emailAddresses[0]?.emailAddress ??
      null;
    if (email) {
      await getOrCreateUser(userId, email);
      balance = await getCreditBalance(userId);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">See your future baby</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload two parent photos. We&apos;ll generate a baby photo in under a minute.
          </p>
        </div>
        {userId && email && (
          <div className="text-right">
            <div className="rounded-full border px-4 py-1.5 text-sm font-medium">
              {balance} {balance === 1 ? "credit" : "credits"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{email}</p>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload two parent photos</CardTitle>
        </CardHeader>
        <CardContent>
          <UploadForm signedIn={!!userId} />
        </CardContent>
      </Card>
    </main>
  );
}
