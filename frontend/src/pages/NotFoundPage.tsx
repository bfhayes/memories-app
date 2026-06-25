import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

export default function NotFoundPage() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-page px-6">
      <EmptyState glyph="🧭" title="Page not found" action={<Link to="/"><Button block>Back to memories</Button></Link>}>
        That page doesn’t exist — or the link has expired.
      </EmptyState>
    </div>
  );
}
