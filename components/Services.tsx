import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { SERVICES } from '../constants';
import { ArrowUpRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Services: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  const bgImages = [
    "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=2070&auto=format&fit=crop", // Strategy
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop", // Data
    "https://images.unsplash.com/photo-1557200134-90327ee9fafa?q=80&w=2070&auto=format&fit=crop", // Comm
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop"  // Positioning
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      
      // Header Animation
      gsap.fromTo(".section-header", 
        { y: 30, autoAlpha: 0 },
        {
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
          },
          y: 0,
          autoAlpha: 1,
          duration: 1,
          ease: "power3.out"
        }
      );

      // Cards Animation
      gsap.fromTo(".service-card", 
        { y: 50, autoAlpha: 0 },
        {
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 85%",
          },
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "back.out(1.2)"
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="servicios" ref={containerRef} className="py-32 bg-brand-charcoal relative overflow-hidden">
      
      {/* Abstract Background for Section */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
         <img 
            src="https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2232&auto=format&fit=crop" 
            className="w-full h-full object-cover mix-blend-overlay"
            alt="Texture"
         />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="rounded-[36px] border border-white/10 bg-black/20 backdrop-blur-sm px-6 py-10 md:px-10 md:py-12">
        <div className="section-header mb-24 text-center">
            <span className="text-brand-red font-mono text-xs uppercase tracking-widest font-bold mb-3 block">Nuestra Expertise</span>
            <h2 className="font-heading text-5xl md:text-7xl text-white font-bold leading-none mb-6">
              CAPACIDADES <span className="text-brand-red">360°</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Dominamos el terreno, el aire y el espacio digital con un enfoque integrado.
            </p>
        </div>

        <div ref={cardsRef} className="services-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICES.map((service, index) => {
            const Icon = service.icon;
            const bgImage = bgImages[index % bgImages.length];

            return (
              <div 
                key={index} 
                className="service-card group relative h-[480px] rounded-[28px] bg-white/5 border border-white/10 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-brand-red/50 hover:shadow-2xl hover:shadow-brand-red/10"
              >
                {/* Default dark gradient background */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10 pointer-events-none"></div>

                {/* Hover Background Image - Changed default opacity from 0 to 20 to avoid empty look */}
                <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-50 transition-opacity duration-700 scale-110 group-hover:scale-100 transition-transform ease-out">
                    <img src={bgImage} alt={service.title} className="w-full h-full object-cover filter grayscale contrast-125" />
                    <div className="absolute inset-0 bg-brand-red/30 mix-blend-multiply"></div>
                </div>

                <div className="absolute inset-0 flex flex-col justify-between p-8 z-20">
                    <div className="flex justify-between items-start">
                        <div className="h-14 w-14 rounded-2xl bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-brand-red group-hover:border-brand-red group-hover:text-white transition-all duration-300 shadow-lg">
                           <Icon size={24} />
                        </div>
                        <ArrowUpRight className="text-gray-500 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0" size={28} />
                    </div>
                    
                    <div className="transform translate-y-0 transition-transform duration-500">
                        <h4 className="text-2xl md:text-3xl font-heading text-white mb-4 font-bold leading-tight uppercase drop-shadow-lg">
                          {service.title}
                        </h4>
                        
                        <ul className="space-y-2">
                          {service.items.map((item, idx) => (
                              <li key={idx} className="text-xs md:text-sm text-gray-300 flex items-center opacity-80 group-hover:opacity-100 transform translate-y-0 transition-all duration-300">
                              <div className="w-1 h-1 bg-brand-red mr-2 rounded-full"></div>
                              {item}
                              </li>
                          ))}
                        </ul>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
