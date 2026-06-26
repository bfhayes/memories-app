import { Routes, Route, useParams, Navigate, Outlet } from 'react-router-dom';
import { MemoryProvider, useMemory } from './context/MemoryContext';
import Spinner from './components/ui/Spinner';
import HubPage from './pages/HubPage';
import GatePage from './pages/GatePage';
import IdentityPage from './pages/IdentityPage';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import LibraryPage from './pages/LibraryPage';
import PhotoDetailPage from './pages/PhotoDetailPage';
import DetectiveHomePage from './pages/DetectiveHomePage';
import DetectivePlayPage from './pages/DetectivePlayPage';
import DetectiveDonePage from './pages/DetectiveDonePage';
import NotFoundPage from './pages/NotFoundPage';
import CreateMemoryPage from './pages/CreateMemoryPage';
import ErrorBoundary from './components/ErrorBoundary';

function FullLoader() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-page text-terracotta">
      <Spinner size={30} />
    </div>
  );
}

/** Decides whether to show the password gate, the identity picker, or the app. */
function Gatekeeper() {
  const { memory, isLoading, isError, unlocked, identity } = useMemory();
  if (isLoading) return <FullLoader />;
  if (isError || !memory) return <Navigate to="/" replace />;
  if (!unlocked) return <GatePage />;
  if (!identity) return <IdentityPage />;
  return <Outlet />;
}

function MemoryShell() {
  const { memoryId } = useParams();
  const id = Number(memoryId);
  if (!Number.isInteger(id) || id <= 0) return <Navigate to="/" replace />;
  return (
    <MemoryProvider memoryId={id}>
      <Gatekeeper />
    </MemoryProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<HubPage />} />
        <Route path="/new" element={<CreateMemoryPage />} />
        <Route path="/m/:memoryId" element={<MemoryShell />}>
          <Route index element={<HomePage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="photo/:photoId" element={<PhotoDetailPage />} />
          <Route path="detective" element={<DetectiveHomePage />} />
          <Route path="detective/done" element={<DetectiveDonePage />} />
          <Route path="detective/:mission" element={<DetectivePlayPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}
