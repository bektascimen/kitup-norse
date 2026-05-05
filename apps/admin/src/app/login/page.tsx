import { sendMagicLink } from './actions';

async function action(formData: FormData): Promise<void> {
  'use server';
  await sendMagicLink(formData);
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <form action={action} className="space-y-4 w-full max-w-sm">
        <h1 className="text-2xl font-display">kitUP Admin Login</h1>
        <input
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full px-3 py-2 bg-bgElevated border border-border rounded-md"
        />
        <button className="w-full px-3 py-2 bg-accent text-bg rounded-md">
          Send magic link
        </button>
      </form>
    </main>
  );
}
