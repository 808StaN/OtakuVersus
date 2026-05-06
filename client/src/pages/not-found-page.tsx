import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl">
      <Card className="text-center">
        <p className="ink-stamp mx-auto bg-[#cf1a4f] text-white">404</p>
        <h1 className="panel-title mt-3 text-5xl sm:text-6xl md:text-7xl">Page Not Found</h1>
        <div className="speech-bubble mx-auto mt-5 max-w-md">
          This location does not exist in this universe.
        </div>
        <div className="mt-6">
          <Link to="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
