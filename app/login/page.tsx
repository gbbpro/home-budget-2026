import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-2xl text-white">⌂</div>
          <h1 className="text-xl font-semibold">Home Budget</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">Sign in to continue</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
