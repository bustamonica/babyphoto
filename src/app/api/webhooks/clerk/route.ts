import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { env } from "@/lib/env";
import { getOrCreateUser } from "@/lib/users";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(env().CLERK_WEBHOOK_SECRET);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  if (evt.type === "user.created") {
    const { id, email_addresses } = evt.data;
    const email = email_addresses?.[0]?.email_address;
    if (!email) {
      return NextResponse.json({ error: "user has no email" }, { status: 400 });
    }
    await getOrCreateUser(id, email);
  }

  return NextResponse.json({ ok: true });
}
