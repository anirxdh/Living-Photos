import CreateClient from "./create-client";

export const metadata = {
  title: "Create a memory — Living Photos",
  description: "Upload a photo to bring a memory to life.",
};

export default function CreatePage() {
  return (
    <main className="relative z-10 mx-auto max-w-2xl px-6 py-16">
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">New memory</p>
      <h1 className="mb-2 text-3xl font-light tracking-tight">Step inside a moment.</h1>
      <p className="mb-10 text-muted-foreground">
        Upload one interior photo — a room, a kitchen, a porch. We'll turn it into a walkable scene
        in about five minutes.
      </p>
      <CreateClient />
    </main>
  );
}
