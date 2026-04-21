"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function UploadForm({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const [parent1, setParent1] = useState<File | null>(null);
  const [parent2, setParent2] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);

  const ready = parent1 !== null && parent2 !== null && consent;

  function handleSubmit() {
    if (!signedIn) {
      router.push("/sign-up");
      return;
    }
    alert("Upload pipeline lands in Phase 1.");
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FileSlot label="Parent 1 photo" file={parent1} onChange={setParent1} />
        <FileSlot label="Parent 2 photo" file={parent2} onChange={setParent2} />
      </div>

      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          I confirm I have permission to use both photos. Photos are deleted within 24 hours.
        </span>
      </label>

      <Button onClick={handleSubmit} disabled={!ready} size="lg" className="w-full">
        Generate baby photo
      </Button>

      {!signedIn && (
        <p className="text-center text-xs text-muted-foreground">
          We&apos;ll ask for your email when you submit so you can come back to your results.
        </p>
      )}
    </div>
  );
}

function FileSlot({
  label,
  file,
  onChange,
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground hover:file:bg-primary/90"
      />
      {file && (
        <p className="mt-1 text-xs text-muted-foreground">
          {file.name} ({Math.round(file.size / 1024)} KB)
        </p>
      )}
    </div>
  );
}
