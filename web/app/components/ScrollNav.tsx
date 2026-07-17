'use client';

import { useEffect, useState } from 'react';

export default function ScrollNav() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="font-headline text-2xl font-bold text-ink">
            <a href="/">Leadwa</a>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#how-it-works" className="text-ink hover:text-bottle-green transition font-semibold">
              How it works
            </a>
            <a href="#pricing" className="text-ink hover:text-bottle-green transition font-semibold">
              Pricing
            </a>
            <a href="/login" className="text-ink hover:text-bottle-green transition font-semibold">
              Login
            </a>
            <a
              href="#hero"
              className="bg-bottle-green text-white px-6 py-2 rounded-lg font-semibold hover:bg-bottle-green-light transition"
            >
              Create free link
            </a>
          </div>

          <div className="md:hidden">
            <a
              href="#hero"
              className="bg-bottle-green text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-bottle-green-light transition"
            >
              Create link
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
