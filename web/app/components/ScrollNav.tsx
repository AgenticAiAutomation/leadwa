'use client';

import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function ScrollNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="font-headline text-2xl font-bold text-ink">
            <a href="/" onClick={closeMobileMenu}>Leadwa</a>
          </div>

          {/* Desktop Nav */}
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

          {/* Mobile Hamburger */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-ink hover:text-bottle-green transition"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-200 ${
            isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-4 space-y-3 bg-white border-t border-ink/10">
            <a
              href="#how-it-works"
              onClick={closeMobileMenu}
              className="block px-4 py-2 text-ink hover:text-bottle-green hover:bg-bottle-green/5 transition font-semibold"
            >
              How it works
            </a>
            <a
              href="#pricing"
              onClick={closeMobileMenu}
              className="block px-4 py-2 text-ink hover:text-bottle-green hover:bg-bottle-green/5 transition font-semibold"
            >
              Pricing
            </a>
            <a
              href="/login"
              onClick={closeMobileMenu}
              className="block px-4 py-2 text-ink hover:text-bottle-green hover:bg-bottle-green/5 transition font-semibold"
            >
              Login
            </a>
            <div className="px-4 pt-2">
              <a
                href="#hero"
                onClick={closeMobileMenu}
                className="block text-center bg-bottle-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-bottle-green-light transition"
              >
                Create free link
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
