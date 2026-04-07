import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.2 });

      // Background scale in
      tl.fromTo(".hero-bg", 
        { scale: 1.2 },
        { scale: 1, duration: 2.5, ease: "power2.out" }
      )
      
      // Subtitle
      .fromTo(".hero-subtitle", 
        { y: 20, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out" }, 
        "-=2"
      )
      
      // Letters Stagger
      .fromTo(".hero-char", 
        { y: 100, autoAlpha: 0, rotateX: -90 },
        { y: 0, autoAlpha: 1, rotateX: 0, stagger: 0.03, duration: 1.2, ease: "back.out(1.7)" }, 
        "-=1.8"
      )
      
      // Description
      .fromTo(".hero-desc", 
        { x: -30, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 1, ease: "power3.out" }, 
        "-=1"
      )
      
      // Buttons
      .fromTo(".hero-btn", 
        { y: 20, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, stagger: 0.1, duration: 0.8, ease: "power2.out" }, 
        "-=0.8"
      );

      // Parallax Scroll Effect
      gsap.to(bgRef.current, {
        yPercent: 20,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
      
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Helper to split text
  const splitText = (text: string, className: string) => {
    return text.split("").map((char, index) => (
      <span key={index} className={`${className} inline-block whitespace-pre origin-bottom`}>
        {char}
      </span>
    ));
  };

  return (
    <section id="hero" ref={containerRef} className="relative min-h-screen flex items-center overflow-hidden bg-brand-dark pt-20">
      
      {/* Background Image with Parallax */}
      <div className="absolute inset-0 w-full h-[120%] -top-[10%] z-0 overflow-hidden">
        <div ref={bgRef} className="hero-bg w-full h-full relative">
          <div className="absolute inset-0 bg-black/60 z-10 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent z-10"></div>
          <img 
            src="/fondo.jpg" 
            alt="Corporate Strategy" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/3 right-0 w-1/2 h-full bg-brand-red/10 blur-[100px] transform rotate-12 z-0 pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-20">
        <div className="max-w-7xl rounded-[32px] md:rounded-[40px] border border-white/10 bg-black/20 backdrop-blur-[6px] px-6 py-12 md:px-10 md:py-14 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
          
          <div className="hero-subtitle flex items-center gap-4 mb-6 opacity-0">
            <div className="h-[2px] w-12 bg-brand-red shadow-[0_0_15px_rgba(230,30,37,0.8)]"></div>
            <p className="text-white font-mono text-xs md:text-sm uppercase tracking-[0.3em] font-bold">
              Consultoría Política LATAM 2026
            </p>
          </div>

          <div ref={titleRef} className="font-heading font-bold leading-[0.85] text-white mb-10 uppercase perspective-text">
            <div className="text-6xl md:text-8xl lg:text-[10rem] overflow-hidden flex flex-wrap">
              {splitText("Estrategia", "hero-char text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400")}
            </div>
            <div className="text-6xl md:text-8xl lg:text-[10rem] overflow-hidden flex flex-wrap items-center gap-4 md:gap-8">
               <span className="hero-char text-brand-red italic pr-4 opacity-0">&</span>
               {splitText("Poder", "hero-char opacity-0")}
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-12">
            <p className="hero-desc text-gray-300 text-lg md:text-xl max-w-xl font-light leading-relaxed border-l-2 border-brand-red pl-6 opacity-0">
              Arquitectura política de alto nivel. Transformamos crisis en oportunidades y candidatos en líderes a través de inteligencia de datos y comunicación de precisión.
            </p>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 md:p-5 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
                className="hero-btn opacity-0 group relative rounded-full px-8 py-4 bg-brand-red text-white font-heading font-bold text-lg tracking-widest uppercase overflow-hidden hover:bg-red-700 transition-all shadow-[0_0_20px_rgba(230,30,37,0.4)] hover:shadow-[0_0_30px_rgba(230,30,37,0.6)]"
              >
                <span className="relative z-10">Agenda Reunión</span>
              </button>
              
              <button 
                 onClick={() => document.getElementById('experiencia')?.scrollIntoView({ behavior: 'smooth' })}
                 className="hero-btn opacity-0 rounded-full px-8 py-4 border border-white/30 text-white font-heading font-bold text-lg tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300"
              >
                Ver Experiencia
              </button>
            </div>
          </div>

        </div>
      </div>

     {/* Scroll Indicator */}
<div className="absolute bottom-10 right-10 flex flex-col items-center gap-2 opacity-50 animate-pulse">
  <span className="text-[10px] font-mono uppercase tracking-widest">Desliza</span>
  <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent"></div>
</div>
    </section>
  );
};

export default Hero;
