import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import Experience from './components/Experience';
import Footer from './components/Footer';
import { DEFAULT_SURVEY_POSTS } from './constants';
import { SurveyPost } from './types';
import { supabase } from './lib/supabase';

const loadSurveysModule = () => import('./components/Surveys');
const Surveys = lazy(loadSurveysModule);

function HomePage() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const targetId = location.hash.replace('#', '');
    const element = document.getElementById(targetId);

    if (element) {
      window.setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth' });
      }, 0);
    }
  }, [location.hash]);

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Services />
        <Experience />
      </main>
      <Footer />
    </>
  );
}

function App() {
  const location = useLocation();
  const [surveyPosts, setSurveyPosts] = useState<SurveyPost[]>(DEFAULT_SURVEY_POSTS);
  const [surveyError, setSurveyError] = useState('');
  const [isSurveyLoading, setIsSurveyLoading] = useState(true);
  const isSupabaseReady = Boolean(supabase);
  const isSurveyRoute = location.pathname.startsWith('/encuestas');
  const hasLoadedSurveyPosts = useRef(false);

  const handlePublished = useMemo(
    () => (post: SurveyPost) =>
      setSurveyPosts((current) => {
        const withoutCurrent = current.filter((item) => item.id !== post.id);
        return [post, ...withoutCurrent];
      }),
    []
  );

  useEffect(() => {
    if (isSurveyRoute) {
      return;
    }

    const preloadTimer = window.setTimeout(() => {
      void loadSurveysModule();
    }, 900);

    return () => window.clearTimeout(preloadTimer);
  }, [isSurveyRoute]);

  useEffect(() => {
    let isMounted = true;

    const loadSurveyPosts = async () => {
      if (!supabase) {
        if (!isSurveyRoute) {
          setIsSurveyLoading(false);
          return;
        }
        setIsSurveyLoading(false);
        setSurveyError('Configura Supabase para publicar y leer entradas compartidas.');
        return;
      }

      if (hasLoadedSurveyPosts.current) {
        setIsSurveyLoading(false);
        return;
      }

      setIsSurveyLoading(true);

      const { data, error } = await supabase
        .from('survey_posts')
        .select('id, title, category, summary, content, content_blocks, image_url, pdf_url, published_at, created_at')
        .order('published_at', { ascending: false });

      if (!isMounted) {
        return;
      }

      if (error) {
        setSurveyError(error.message);
        setSurveyPosts(DEFAULT_SURVEY_POSTS);
        setIsSurveyLoading(false);
        return;
      }

      const normalizedPosts =
        data?.map((post) => ({
          id: post.id,
          title: post.title,
          category: post.category,
          summary: post.summary,
          content: post.content,
          contentBlocks: post.content_blocks ?? undefined,
          imageUrl: post.image_url,
          pdfUrl: post.pdf_url,
          publishedAt: post.published_at,
          createdAt: post.created_at
        })) ?? [];

      setSurveyPosts(normalizedPosts.length > 0 ? normalizedPosts : DEFAULT_SURVEY_POSTS);
      setSurveyError('');
      hasLoadedSurveyPosts.current = true;
      setIsSurveyLoading(false);
    };

    if (isSurveyRoute) {
      void loadSurveyPosts();
    } else {
      setIsSurveyLoading(false);
      const prefetchTimer = window.setTimeout(() => {
        void loadSurveyPosts();
      }, 1200);

      return () => {
        isMounted = false;
        window.clearTimeout(prefetchTimer);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [isSurveyRoute]);

  const surveyElement = (mode: 'list' | 'detail' | 'admin') => (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-[#8bbce9]">
          Cargando Encuestas...
        </div>
      }
    >
      <Surveys
        mode={mode}
        posts={surveyPosts}
        isSupabaseReady={isSupabaseReady}
        isLoading={isSurveyLoading}
        loadError={surveyError}
        onPublished={handlePublished}
      />
    </Suspense>
  );

  return (
    <div className="bg-brand-dark min-h-screen text-white font-sans selection:bg-brand-red selection:text-white">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/encuestas" element={surveyElement('list')} />
        <Route path="/encuestas/:postId" element={surveyElement('detail')} />
        <Route path="/encuestas/admin" element={surveyElement('admin')} />
      </Routes>
    </div>
  );
}

export default App;
