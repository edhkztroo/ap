import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { ABOUT_TEXT, PRODUCTS } from '../constants';
import { Shield, Monitor, Video, Users } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const About: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgContainerRef = useRef<HTMLDivElement>(null);
  const icons = [Monitor, Shield, Video, Users];

  useEffect(() => {
    const ctx = gsap.context(() => {
      
      gsap.from(imgContainerRef.current, {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 70%",
        },
        x: -50,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out"
      });

      gsap.from(".about-stagger", {
        scrollTrigger: {
            trigger: ".about-content",
            start: "top 80%",
        },
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 1,
        ease: "power3.out"
      });

      gsap.from(".product-card", {
        scrollTrigger: {
          trigger: ".products-grid",
          start: "top 85%",
        },
        y: 50,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "power2.out"
      });

    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="nosotros" ref={containerRef} className="py-32 bg-brand-dark relative overflow-hidden">
      {/* Large background text */}
      <div className="absolute top-20 right-0 text-[200px] font-heading font-bold text-white opacity-[0.02] pointer-events-none select-none leading-none hidden lg:block">
        AGENCY
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Image Side */}
          <div ref={imgContainerRef} className="relative group">
            <div className="relative overflow-hidden rounded-[32px] shadow-2xl border border-white/10">
               <div className="absolute inset-0 bg-brand-dark/20 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
               <img 
                 src="https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?q=80&w=1932&auto=format&fit=crop" 
                 alt="War Room Strategy" 
                 className="w-full h-[500px] lg:h-[700px] object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-105"
               />
            </div>
            {/* Floating Badge */}
            <div className="absolute top-10 -left-2 md:-left-6 bg-white text-black p-6 rounded-[24px] shadow-xl z-20 transform -rotate-2 group-hover:rotate-0 transition-transform duration-300">
                <span className="block text-sm font-mono uppercase tracking-widest border-b border-black pb-2 mb-2">Desde 2010</span>
                <span className="block text-xl font-heading font-bold">Liderando<br/>Latinoamérica</span>
            </div>
          </div>

          {/* Content Side */}
          <div className="about-content pl-0 lg:pl-10">
            <span className="about-stagger text-brand-red font-mono text-sm uppercase tracking-widest font-bold mb-4 block">Quiénes Somos</span>
            <h2 className="about-stagger font-heading text-5xl md:text-6xl text-white font-bold mb-8 leading-none">
              CONSULTORÍA DE<br/>
              <span className="text-transparent text-stroke">ALTO NIVEL</span>
            </h2>
            <p className="about-stagger text-xl text-gray-400 font-light leading-relaxed mb-12">
              {ABOUT_TEXT}
            </p>
            
            <div className="about-stagger grid grid-cols-2 gap-4 mb-16">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-6">
                    <span className="block text-4xl font-heading font-bold text-white mb-1">98%</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Tasa de Éxito</span>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-6">
                    <span className="block text-4xl font-heading font-bold text-white mb-1">24/7</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Monitoreo Activo</span>
                </div>
            </div>

            <div className="products-grid grid grid-cols-1 gap-4">
              {PRODUCTS.map((product, index) => {
                const Icon = icons[index % icons.length];
                return (
                  <div key={index} className="product-card flex items-center gap-6 p-5 rounded-[24px] border border-white/8 bg-white/[0.03] hover:bg-white/5 hover:border-brand-red/30 transition-colors duration-300">
                    <div className="h-12 w-12 rounded-2xl bg-brand-charcoal flex items-center justify-center text-white shrink-0">
                        <Icon size={20} />
                    </div>
                    <div>
                        <h4 className="text-white font-heading font-bold text-lg uppercase">{product.title}</h4>
                        <p className="text-sm text-gray-400">{product.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default About;
