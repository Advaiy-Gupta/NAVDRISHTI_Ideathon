import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="container-page py-16">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted">
        The address may be mistyped. <Link to="/" className="link">Go to the home page</Link>.
      </p>
    </div>
  );
}
