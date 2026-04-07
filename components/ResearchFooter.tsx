import React from 'react';
import { SOCIALS, APP_NAME } from '../constants';
import { Twitter, Instagram, Facebook, Mail, ArrowRight } from 'lucide-react';

const ResearchFooter: React.FC = () => {
  return (
    <footer className="bg-[#081a3a] text-white pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="rounded-[36px] bg-[linear-gradient(135deg,rgba(16,37,83,0.98)_0%,rgba(11,28,64,1)_100%)] border border-[#94cfff]/18 px-8 py-10 md:px-10 md:py-12 shadow-[0_24px_80px_rgba(6,18,44,0.3)]">
          <div className="flex flex-col md:flex-row justify-between items-start mb-20 gap-10">
            <div className="max-w-2xl">
              <h2 className="font-heading text-5xl md:text-7xl font-bold mb-8 leading-none">
                HABLEMOS DE <br />
                TU INVESTIGACIÓN
              </h2>
              <p className="text-[#cfe8ff] text-lg max-w-md mb-8">
                Convierte datos en decisiones con hallazgos claros, visuales y accionables.
              </p>
              <a
                href="mailto:consultoraaccionpolitica@gmail.com"
                className="inline-flex items-center space-x-3 rounded-full bg-[#94cfff] text-[#081a3a] px-8 py-4 font-bold uppercase tracking-widest hover:bg-white transition-colors"
              >
                <span>Contactar Research</span>
                <ArrowRight size={20} />
              </a>
            </div>

            <div className="flex flex-col space-y-6">
              <h3 className="font-mono text-sm uppercase tracking-widest text-[#8bbce9] font-bold">Redes Sociales</h3>
              <div className="flex flex-col space-y-4">
                <a
                  href={`https://twitter.com/${SOCIALS.twitter.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 text-[#e8f5ff] hover:text-[#94cfff] transition-colors"
                >
                  <Twitter size={24} />
                  <span className="text-lg font-heading">{SOCIALS.twitter}</span>
                </a>
                <a
                  href={`https://instagram.com/${SOCIALS.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 text-[#e8f5ff] hover:text-[#94cfff] transition-colors"
                >
                  <Instagram size={24} />
                  <span className="text-lg font-heading">{SOCIALS.instagram}</span>
                </a>
                <a
                  href={`https://facebook.com/${SOCIALS.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 text-[#e8f5ff] hover:text-[#94cfff] transition-colors"
                >
                  <Facebook size={24} />
                  <span className="text-lg font-heading">{SOCIALS.facebook}</span>
                </a>
              </div>
              <div className="pt-8 mt-8 border-t border-white/10">
                <div className="flex items-center space-x-2 text-[#cfe8ff]">
                  <Mail size={20} />
                  <a
                    href={`mailto:${SOCIALS.web}`}
                    className="font-mono text-sm hover:underline"
                  >
                    {SOCIALS.web}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs font-mono text-[#7ba4cf] uppercase">
            <p>&copy; 2026 {APP_NAME}. Todos los derechos reservados.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <span>Aviso de Privacidad</span>
              <span>Términos de Servicio</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default ResearchFooter;
