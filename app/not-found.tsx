export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="text-center">
        <p className="font-mono text-6xl font-bold text-amber mb-4">404</p>
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Page Not Found
        </h1>
        <p className="text-text-secondary mb-8">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <a href="/" className="btn-primary">
          Go Home
        </a>
      </div>
    </div>
  );
}
