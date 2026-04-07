import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const preloadSurveysPage = () => import('./Surveys');

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const menuItems = ['Nosotros', 'Servicios', 'Experiencia', 'Campañas'];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    if (location.pathname !== '/') {
      navigate(`/#${id}`);
      setIsMenuOpen(false);
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-500 ${
        isScrolled ? 'bg-black/90 backdrop-blur-md py-4 border-b border-white/10' : 'bg-transparent py-8'
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Logo Area - Image Based */}
        <Link className="cursor-pointer" to="/">
          <img 
            src="/logo.svg" 
            alt="ACCIÓN POLÍTICA" 
            className="h-12 md:h-16 w-auto object-contain hover:opacity-90 transition-opacity"
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-10">
          {menuItems.map((item) => (
            <button 
              key={item}
              onClick={() => scrollToSection(item.toLowerCase())}
              className="text-sm font-semibold uppercase tracking-widest text-gray-300 hover:text-brand-red transition-colors duration-300"
            >
              {item}
            </button>
          ))}
          <Link
            to="/encuestas"
            onMouseEnter={() => void preloadSurveysPage()}
            onFocus={() => void preloadSurveysPage()}
            className="inline-flex h-11 items-center justify-center rounded-full border border-white bg-white px-6 text-xs font-bold uppercase tracking-[0.18em] text-[#081a3a] transition-all duration-300 hover:bg-[#f1f5f9]"
          >
            Encuestas
          </Link>
        </div>

        {/* CTA Button */}
        <div className="hidden md:block">
          <button 
            onClick={() => scrollToSection('contacto')}
            className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 text-xs font-bold uppercase tracking-[0.18em] text-white transition-all duration-300 hover:bg-brand-red hover:border-brand-red"
          >
            Contacto
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-brand-dark border-b border-white/10 py-6 px-6 flex flex-col space-y-4 shadow-2xl">
          {menuItems.map((item) => (
            <button 
              key={item}
              onClick={() => scrollToSection(item.toLowerCase())}
              className="text-left text-lg font-heading font-medium text-white hover:text-brand-red"
            >
              {item}
            </button>
          ))}
          <Link
            to="/encuestas"
            onMouseEnter={() => void preloadSurveysPage()}
            onFocus={() => void preloadSurveysPage()}
            onClick={() => setIsMenuOpen(false)}
            className="text-left text-lg font-heading font-medium text-[#c8e6ff] hover:text-white"
          >
            Encuestas
          </Link>
          <button
            onClick={() => scrollToSection('contacto')}
            className="text-left text-lg font-heading font-medium text-white hover:text-brand-red"
          >
            Contacto
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
