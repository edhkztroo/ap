import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { EXPERIENCE } from '../constants';
import { Globe, CheckCircle } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Experience: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      
      gsap.fromTo(".exp-header", 
        { y: 50, autoAlpha: 0 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
          },
          y: 0,
          autoAlpha: 1,
          duration: 1,
          ease: "power3.out"
        }
      );

      gsap.fromTo(".country-card", 
        { y: 50, autoAlpha: 0 },
        {
          scrollTrigger: {
            trigger: ".countries-grid",
            start: "top 80%",
          },
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out"
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="experiencia" ref={sectionRef} className="py-32 bg-black relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 opacity-40">
        <img 
          src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop" 
          alt="Global Network" 
          className="w-full h-full object-cover grayscale mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/20"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="exp-header flex flex-col md:flex-row justify-between items-end mb-20 rounded-[32px] border border-white/10 bg-white/[0.04] backdrop-blur-sm px-6 py-8 md:px-8 md:py-10">
           <div>
              <div className="flex items-center space-x-2 text-brand-red mb-4">
                  <Globe size={18} />
                  <span className="font-mono text-xs uppercase tracking-widest font-bold">Alcance Internacional</span>
              </div>
              <h2 className="font-heading text-5xl md:text-6xl text-white font-bold">
                EXPERIENCIA <br />
                SIN FRONTERAS
              </h2>
           </div>
           <p className="text-gray-400 text-right max-w-md mt-6 md:mt-0">
             Más de una década operando en los escenarios políticos más desafiantes de la región.
           </p>
        </div>

        {/* Anchor for Campañas Navigation */}
        <div id="campañas" className="h-1 w-full absolute -mt-24"></div>

        <div className="countries-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {EXPERIENCE.map((exp, index) => (
            <div key={index} className="country-card opacity-0 group relative rounded-[28px] bg-white/5 backdrop-blur-sm p-8 border border-white/10 hover:-translate-y-1 hover:border-brand-red/50 hover:bg-white/10 transition-all duration-300">
              <div className="absolute top-0 right-0 p-4 font-heading text-6xl font-bold text-white opacity-[0.03] group-hover:opacity-[0.1] transition-opacity select-none">
                  {exp.flagCode}
              </div>
              
              <div className="flex items-center space-x-4 mb-6 relative z-10">
                 <div className="w-1 h-8 bg-brand-red shadow-[0_0_10px_rgba(230,30,37,0.5)]"></div>
                 <h3 className="text-2xl font-heading text-white font-bold uppercase tracking-wide">
                    {exp.country}
                 </h3>
              </div>

              <ul className="space-y-3 relative z-10">
                {exp.highlights.map((highlight, idx) => (
                  <li key={idx} className="text-sm text-gray-400 flex items-start group-hover:text-white transition-colors">
                    <CheckCircle size={14} className="text-brand-red mt-1 mr-2 shrink-0" />
                    <span className="leading-snug">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;
