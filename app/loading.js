"use client";
import React from 'react';
import Loader from '@/components/Loader';

export default function RootLoading() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background">
      <Loader message="Loading SNACCIER..." />
    </div>
  );
}
