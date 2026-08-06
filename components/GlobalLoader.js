"use client";
import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import Loader from './Loader';

export default function GlobalLoader({ children }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <Loader message="Loading SNACCIER..." />
      </div>
    );
  }

  return children;
}
