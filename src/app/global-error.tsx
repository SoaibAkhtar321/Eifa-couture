'use client';

// Last-resort error page. It replaces the root layout when the layout itself
// crashes, so it carries its own <html>/<body> and uses plain inline styles.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#faf6f0',
          color: '#2a2a2a',
          fontFamily: 'Georgia, serif',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 400, margin: '0 0 12px' }}>Something went wrong</h1>
          <p style={{ fontSize: 15, lineHeight: 1.7, margin: '0 0 24px' }}>
            We hit an unexpected problem. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '12px 28px',
              border: '1px solid #b8963e',
              background: '#b8963e',
              color: '#2a2a2a',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
