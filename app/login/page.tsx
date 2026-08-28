export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; returnTo?: string }> }) {
  const query = await searchParams;
  const returnTo = query.returnTo?.startsWith('/') && !query.returnTo.startsWith('//') ? query.returnTo : '/edit';
  return (
    <main className="login-page">
      <form className="login-card" action="/api/auth/login" method="post">
        <span className="login-mark">OC</span>
        <p className="login-kicker">Open Canvas Builder</p>
        <h1>Enter your studio.</h1>
        <p>Use the administrator password configured by the person hosting this builder.</p>
        <input type="hidden" name="returnTo" value={returnTo} />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
        {query.error ? <p className="login-error" role="alert">That password was not accepted.</p> : null}
        <button type="submit">Open editor</button>
        <a href="/">View published site</a>
      </form>
    </main>
  );
}
