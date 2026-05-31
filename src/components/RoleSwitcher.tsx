'use client';
import { useState, useEffect } from 'react';

export default function RoleSwitcher() {
  const [role, setRole] = useState<'buyer' | 'artist'>('buyer');

  useEffect(() => {
    const match = document.cookie.match(/user_role=([^;]+)/);
    if (match) {
      setRole(match[1] as 'buyer' | 'artist');
    }
  }, []);

  const handleSwitch = (newRole: 'buyer' | 'artist') => {
    document.cookie = `user_role=${newRole}; path=/; max-age=31536000`;
    setRole(newRole);
    window.location.reload();
  };

  return (
    <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-xs font-semibold text-slate-300">
      <span className="text-slate-500 mr-1">模式:</span>
      <button 
        onClick={() => handleSwitch('buyer')} 
        className={`px-2.5 py-1 rounded-full transition-all duration-200 ${role === 'buyer' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
      >
        買家 (林買家)
      </button>
      <button 
        onClick={() => handleSwitch('artist')} 
        className={`px-2.5 py-1 rounded-full transition-all duration-200 ${role === 'artist' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
      >
        藝術家 (陳畫家)
      </button>
    </div>
  );
}
