import React from 'react';
import { SOCIALS, APP_NAME } from '../constants';
import { Twitter, Instagram, Facebook, Mail, ArrowRight } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer id="contacto" className="bg-brand-red text-white pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start mb-20">
          
          <div className="max-w-2xl mb-10 md:mb-0">
            <h2 className="font-heading text-5xl md:text-7xl font-bold mb-8 leading-none">
              HABLEMOS DE <br />
              TU CAMPAÑA
            </h2>
            <p className="text-white/80 text-lg max-w-md mb-8">
              La estrategia correcta marca la diferencia entre competir y ganar. Agenda una consulta estratégica hoy mismo.
            </p>
            <a 
              href={`mailto:consultoraaccionpolitica@gmail.com`} 
              className="inline-flex items-center space-x-3 bg-black text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors"
            >
              <span>Contactar Ahora</span>
              <ArrowRight size={20} />
            </a>
          </div>

          <div className="flex flex-col space-y-6">
            <h3 className="font-mono text-sm uppercase tracking-widest text-black/60 font-bold">Redes Sociales</h3>
            <div className="flex flex-col space-y-4">
              <a 
                href={`https://twitter.com/${SOCIALS.twitter.replace('@', '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-3 hover:text-black transition-colors"
              >
                <Twitter size={24} />
                <span className="text-lg font-heading">{SOCIALS.twitter}</span>
              </a>
              <a 
                href={`https://instagram.com/${SOCIALS.instagram.replace('@', '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-3 hover:text-black transition-colors"
              >
                <Instagram size={24} />
                <span className="text-lg font-heading">{SOCIALS.instagram}</span>
              </a>
              <a 
                href={`https://facebook.com/${SOCIALS.facebook}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-3 hover:text-black transition-colors"
              >
                <Facebook size={24} />
                <span className="text-lg font-heading">{SOCIALS.facebook}</span>
              </a>
            </div>
            <div className="pt-8 mt-8 border-t border-white/20">
               <div className="flex items-center space-x-2">
                  <Mail size={20} />
                  <a 
                    href={`https://${SOCIALS.web}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="font-mono text-sm hover:underline"
                  >
                    {SOCIALS.web}
                  </a>
               </div>
            </div>
          </div>
        </div>

        <div className="border-t border-black/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs font-mono text-black/40 uppercase">
          <p>&copy; 2025 {APP_NAME}. Todos los derechos reservados.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <span>Aviso de Privacidad</span>
            <span>Términos de Servicio</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
