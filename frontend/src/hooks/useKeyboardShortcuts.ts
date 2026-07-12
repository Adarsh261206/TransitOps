import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('input[placeholder*="Search"]');
        searchInput?.focus();
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        const path = window.location.pathname;
        if (path.includes('trips')) navigate('/trips?action=create');
        else if (path.includes('vehicles')) navigate('/vehicles?action=add');
        else if (path.includes('drivers')) navigate('/drivers?action=add');
        else navigate('/trips?action=create');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);
}
