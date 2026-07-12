import { useNavigate } from 'react-router-dom';

export default function ForbiddenPage() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="text-8xl font-bold text-red-500 mb-4">403</div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">Access Denied</h1>
      <p className="text-gray-500 mb-6 text-center max-w-md">
        You don't have permission to access this module.
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Return to Dashboard
      </button>
    </div>
  );
}
