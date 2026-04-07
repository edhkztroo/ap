import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Download,
  FileImage,
  FileText,
  ImagePlus,
  Loader,
  LogIn,
  LogOut,
  PlusCircle,
  Rows3,
  Search
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase, surveyImagesBucket, cmsEditorEmail, cmsEditorPassword } from '../lib/supabase';
import { SurveyContentBlock, SurveyPost } from '../types';
import { CMS_ADMIN_PASSWORD, CMS_ADMIN_USERNAME } from '../constants';
import ResearchFooter from './ResearchFooter';

interface SurveysProps {
  mode: 'list' | 'detail' | 'admin';
  posts: SurveyPost[];
  isSupabaseReady: boolean;
  isLoading: boolean;
  loadError: string;
  onPublished: (post: SurveyPost) => void;
}

interface AdminTextBlock {
  id: string;
  type: 'text';
  content: string;
}

interface AdminImageBlock {
  id: string;
  type: 'image';
  caption: string;
  imageUrl: string;
  file: File | null;
}

type AdminBlock = AdminTextBlock | AdminImageBlock;

interface CmsEditorAccount {
  username: string;
  password: string;
  role: 'admin' | 'editor';
}

const researchLogo = '/aprap-research.svg';
const cmsEditorsStorageKey = 'ap-research-cms-editors';
const defaultCmsEditors: CmsEditorAccount[] = [
  {
    username: CMS_ADMIN_USERNAME,
    password: CMS_ADMIN_PASSWORD,
    role: 'admin'
  }
];

const emptyForm = {
  title: '',
  category: '',
  summary: '',
  pdfUrl: '',
  publishedAt: ''
};

const createBlockId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createEmptyTextBlock = (): AdminTextBlock => ({
  id: createBlockId(),
  type: 'text',
  content: ''
});

const createEmptyImageBlock = (): AdminImageBlock => ({
  id: createBlockId(),
  type: 'image',
  caption: '',
  imageUrl: '',
  file: null
});

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

const formatSupabaseError = (message: string) => {
  if (!message) {
    return '';
  }
  if (message.includes('survey_posts') || message.includes('row-level security')) {
    return 'Todavía falta terminar la configuración inicial del panel.';
  }
  return 'Todavía falta terminar la configuración inicial del panel.';
};

const normalizeContentBlocks = (post: SurveyPost): SurveyContentBlock[] => {
  if (post.contentBlocks && post.contentBlocks.length > 0) {
    return post.contentBlocks;
  }

  return post.content
    .split('\n\n')
    .filter(Boolean)
    .map((paragraph, index) => ({
      id: `${post.id}-fallback-${index}`,
      type: 'text' as const,
      content: paragraph
    }));
};

const PageHeader = () => (
  <div className="flex items-center justify-between gap-4 mb-10">
    <Link
      to="/"
      className="inline-flex items-center gap-2 rounded-full border border-[#94cfff]/14 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#8bbce9] hover:border-[#94cfff]/28 hover:bg-white/[0.08] hover:text-white transition-colors"
    >
      <ArrowLeft size={16} />
      Regresa a AP
    </Link>
    <img src={researchLogo} alt="Acción Política Research" className="h-12 w-auto object-contain" />
  </div>
);

const Surveys: React.FC<SurveysProps> = ({
  mode,
  posts,
  isSupabaseReady,
  isLoading,
  loadError,
  onPublished
}) => {
  const navigate = useNavigate();
  const { postId } = useParams();
  const [formState, setFormState] = useState(emptyForm);
  const [authState, setAuthState] = useState({ username: '', password: '' });
  const [session, setSession] = useState<Session | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [contentBlocks, setContentBlocks] = useState<AdminBlock[]>([createEmptyTextBlock()]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [countryFilter, setCountryFilter] = useState('Todos');
  const [visiblePosts, setVisiblePosts] = useState(9);
  const [cmsEditors, setCmsEditors] = useState<CmsEditorAccount[]>(defaultCmsEditors);
  const [currentCmsUser, setCurrentCmsUser] = useState<CmsEditorAccount | null>(null);
  const [newEditor, setNewEditor] = useState({ username: '', password: '' });

  useEffect(() => {
    if (!supabase) {
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const storedEditors = window.localStorage.getItem(cmsEditorsStorageKey);
      if (!storedEditors) {
        window.localStorage.setItem(cmsEditorsStorageKey, JSON.stringify(defaultCmsEditors));
        setCmsEditors(defaultCmsEditors);
        return;
      }

      const parsedEditors = JSON.parse(storedEditors) as CmsEditorAccount[];
      if (!Array.isArray(parsedEditors) || parsedEditors.length === 0) {
        window.localStorage.setItem(cmsEditorsStorageKey, JSON.stringify(defaultCmsEditors));
        setCmsEditors(defaultCmsEditors);
        return;
      }

      const normalizedEditors = parsedEditors.some((editor) => editor.username === CMS_ADMIN_USERNAME)
        ? parsedEditors
        : defaultCmsEditors;

      window.localStorage.setItem(cmsEditorsStorageKey, JSON.stringify(normalizedEditors));
      setCmsEditors(normalizedEditors);
    } catch {
      setCmsEditors(defaultCmsEditors);
    }
  }, []);

  const sortedPosts = useMemo(
    () =>
      [...posts].sort(
        (left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()
      ),
    [posts]
  );

  const selectedPost = useMemo(
    () => sortedPosts.find((post) => post.id === postId),
    [postId, sortedPosts]
  );
  const categories = useMemo(
    () => ['Todas', ...new Set(sortedPosts.map((post) => post.category))],
    [sortedPosts]
  );
  const countries = useMemo(
    () => [
      'Todos',
      ...new Set(
        sortedPosts.flatMap((post) =>
          post.contentBlocks
            ?.filter((block): block is Extract<SurveyContentBlock, { type: 'text' }> => block.type === 'text')
            .flatMap((block) =>
              ['México', 'Colombia', 'República Dominicana', 'Venezuela', 'Ecuador', 'Guatemala', 'Paraguay']
                .filter((country) => block.content.toLowerCase().includes(country.toLowerCase()))
            ) ?? []
        )
      )
    ],
    [sortedPosts]
  );
  const filteredPosts = useMemo(() => {
    return sortedPosts.filter((post) => {
      const matchesSearch =
        !searchTerm ||
        `${post.title} ${post.summary} ${post.category}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'Todas' || post.category === categoryFilter;
      const matchesCountry =
        countryFilter === 'Todos' ||
        normalizeContentBlocks(post).some(
          (block) =>
            block.type === 'text' &&
            block.content.toLowerCase().includes(countryFilter.toLowerCase())
        );

      return matchesSearch && matchesCategory && matchesCountry;
    });
  }, [sortedPosts, searchTerm, categoryFilter, countryFilter]);
  const visibleGridPosts = filteredPosts.slice(0, visiblePosts);

  useEffect(() => {
    setVisiblePosts(9);
  }, [searchTerm, categoryFilter, countryFilter]);

  const handleAuthFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setAuthState((current) => ({ ...current, [name]: value }));
  };

  const handleNewEditorFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setNewEditor((current) => ({ ...current, [name]: value }));
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const updateBlock = (blockId: string, patch: Partial<AdminTextBlock & AdminImageBlock>) => {
    setContentBlocks((current) =>
      current.map((block) => (block.id === blockId ? ({ ...block, ...patch } as AdminBlock) : block))
    );
  };

  const addTextBlock = () => setContentBlocks((current) => [...current, createEmptyTextBlock()]);
  const addImageBlock = () => setContentBlocks((current) => [...current, createEmptyImageBlock()]);
  const removeBlock = (blockId: string) =>
    setContentBlocks((current) => current.filter((block) => block.id !== blockId));

  const handleCoverImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedImage(event.target.files?.[0] ?? null);
  };

  const handleBlockImageChange = (blockId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    updateBlock(blockId, {
      file,
      imageUrl: file ? URL.createObjectURL(file) : ''
    });
  };

  const uploadImage = async (file: File, userId: string, prefix: string) => {
    if (!supabase) {
      throw new Error('Supabase no está configurado.');
    }

    const extension = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

    const { error } = await supabase.storage.from(surveyImagesBucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

    if (error) {
      throw error;
    }

    return supabase.storage.from(surveyImagesBucket).getPublicUrl(path).data.publicUrl;
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      setErrorMessage('Todavía falta activar el acceso del panel.');
      return;
    }

    const matchedAccount = cmsEditors.find(
      (account) => account.username === authState.username.trim() && account.password === authState.password
    );

    if (!matchedAccount) {
      setErrorMessage('Usuario o clave incorrectos.');
      return;
    }

    if (!cmsEditorEmail || !cmsEditorPassword) {
      setErrorMessage('Todavía falta completar la configuración de acceso.');
      return;
    }

    setIsAuthenticating(true);
    setErrorMessage('');
    setSuccessMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email: cmsEditorEmail,
      password: cmsEditorPassword
    });

    setIsAuthenticating(false);

    if (error) {
      setErrorMessage('No pude iniciar sesión en este momento. Inténtalo otra vez.');
      return;
    }

    setCurrentCmsUser(matchedAccount);
    setSuccessMessage('Sesión iniciada. Ya puedes publicar artículos.');
    setAuthState({ username: '', password: '' });
  };

  const handleLogout = async () => {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setCurrentCmsUser(null);
    setSuccessMessage('Sesión cerrada.');
  };

  const handleCreateEditor = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (currentCmsUser?.role !== 'admin') {
      setErrorMessage('Solo el usuario principal puede crear otros editores.');
      return;
    }

    const username = newEditor.username.trim().toLowerCase();
    const password = newEditor.password.trim();

    if (!username || !password) {
      setErrorMessage('Completa usuario y clave del nuevo editor.');
      return;
    }

    if (cmsEditors.some((editor) => editor.username === username)) {
      setErrorMessage('Ese usuario ya existe dentro del CMS.');
      return;
    }

    const updatedEditors = [...cmsEditors, { username, password, role: 'editor' as const }];
    setCmsEditors(updatedEditors);
    setNewEditor({ username: '', password: '' });
    setErrorMessage('');
    setSuccessMessage(`Editor ${username} creado correctamente.`);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(cmsEditorsStorageKey, JSON.stringify(updatedEditors));
    }
  };

  const handleDeleteEditor = (username: string) => {
    if (currentCmsUser?.role !== 'admin' || username === CMS_ADMIN_USERNAME) {
      return;
    }

    const updatedEditors = cmsEditors.filter((editor) => editor.username !== username);
    setCmsEditors(updatedEditors);
    setSuccessMessage(`Editor ${username} eliminado.`);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(cmsEditorsStorageKey, JSON.stringify(updatedEditors));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase || !session) {
      setErrorMessage('Debes iniciar sesión como admin para publicar.');
      return;
    }
    if (!selectedImage) {
      setErrorMessage('Debes seleccionar una imagen principal.');
      return;
    }

    const normalizedBlocks = contentBlocks.filter((block) =>
      block.type === 'text' ? block.content.trim() : block.file || block.imageUrl
    );

    if (normalizedBlocks.length === 0) {
      setErrorMessage('Agrega al menos un bloque de contenido al artículo.');
      return;
    }

    const normalizedPost = {
      title: formState.title.trim(),
      category: formState.category.trim(),
      summary: formState.summary.trim(),
      pdfUrl: formState.pdfUrl.trim(),
      publishedAt: formState.publishedAt || new Date().toISOString().slice(0, 10)
    };

    if (!normalizedPost.title || !normalizedPost.category || !normalizedPost.summary || !normalizedPost.pdfUrl) {
      setErrorMessage('Completa título, categoría, resumen y PDF.');
      return;
    }

    setIsPublishing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const heroImageUrl = await uploadImage(selectedImage, session.user.id, 'cover');
      const uploadedBlocks: SurveyContentBlock[] = [];

      for (const block of normalizedBlocks) {
        if (block.type === 'text') {
          uploadedBlocks.push({
            id: block.id,
            type: 'text',
            content: block.content.trim()
          });
          continue;
        }

        if (!block.file) {
          continue;
        }

        const blockImageUrl = await uploadImage(block.file, session.user.id, 'block');
        uploadedBlocks.push({
          id: block.id,
          type: 'image',
          imageUrl: blockImageUrl,
          caption: block.caption.trim()
        });
      }

      const plainContent = uploadedBlocks
        .filter((block): block is Extract<SurveyContentBlock, { type: 'text' }> => block.type === 'text')
        .map((block) => block.content)
        .join('\n\n');

      const { data, error } = await supabase
        .from('survey_posts')
        .insert({
          title: normalizedPost.title,
          category: normalizedPost.category,
          summary: normalizedPost.summary,
          content: plainContent,
          content_blocks: uploadedBlocks,
          image_url: heroImageUrl,
          pdf_url: normalizedPost.pdfUrl,
          published_at: normalizedPost.publishedAt,
          user_id: session.user.id
        })
        .select(
          'id, title, category, summary, content, content_blocks, image_url, pdf_url, published_at, created_at'
        )
        .single();

      if (error || !data) {
        setErrorMessage('No pude guardar el artículo. Inténtalo otra vez.');
        setIsPublishing(false);
        return;
      }

      const publishedPost: SurveyPost = {
        id: data.id,
        title: data.title,
        category: data.category,
        summary: data.summary,
        content: data.content,
        contentBlocks: data.content_blocks ?? undefined,
        imageUrl: data.image_url,
        pdfUrl: data.pdf_url,
        publishedAt: data.published_at,
        createdAt: data.created_at
      };

      onPublished(publishedPost);
      setFormState(emptyForm);
      setSelectedImage(null);
      setContentBlocks([createEmptyTextBlock()]);
      setSuccessMessage('Artículo publicado correctamente.');
      navigate(`/encuestas/${publishedPost.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No pude subir las imágenes en este momento.';
      setErrorMessage(message);
    } finally {
      setIsPublishing(false);
    }
  };

  if (mode === 'detail') {
    return (
    <>
    <section className="min-h-screen bg-[#081a3a] py-24 text-white">
      <div className="container mx-auto px-6">
          <div className="flex items-center justify-between gap-4 mb-10">
            <Link
              to="/encuestas"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[#8bbce9] hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Volver al home de encuestas
            </Link>
            <img src={researchLogo} alt="Acción Política Research" className="h-12 w-auto object-contain" />
          </div>

          {isLoading ? (
            <div className="min-h-[60vh] flex items-center justify-center gap-3 text-[#8bbce9]">
              <Loader className="animate-spin" size={20} />
              Cargando artículo...
            </div>
          ) : selectedPost ? (
            <article className="max-w-5xl mx-auto overflow-hidden rounded-[36px] border border-[#94cfff]/20 bg-[#102553] shadow-[0_0_60px_rgba(11,30,70,0.35)]">
              <div className="relative h-[320px] md:h-[540px]">
                <img src={selectedPost.imageUrl} alt={selectedPost.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#081a3a] via-[#081a3a]/40 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 md:p-12 max-w-4xl">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] font-mono text-[#94cfff] mb-4 backdrop-blur-sm">
                    <FileText size={14} />
                    {selectedPost.category}
                  </span>
              <h1 className="font-heading text-4xl md:text-7xl leading-[0.92] text-white mb-4">
                {selectedPost.title}
              </h1>
                  <div className="inline-flex items-center gap-2 text-sm text-[#d2e9ff]">
                    <CalendarDays size={16} />
                    {formatDate(selectedPost.publishedAt)}
                  </div>
                </div>
              </div>

              <div className="p-8 md:p-12 space-y-8 bg-[linear-gradient(180deg,rgba(16,37,83,1)_0%,rgba(11,28,64,1)_100%)]">
                <p className="text-[1.55rem] md:text-[1.8rem] leading-[1.2] text-[#dff2ff]">{selectedPost.summary}</p>
                <div className="space-y-8">
                  {normalizeContentBlocks(selectedPost).map((block) =>
                    block.type === 'text' ? (
                      <p key={block.id} className="text-lg leading-relaxed text-[#b8d8f4]">
                        {block.content}
                      </p>
                    ) : (
                      <figure key={block.id} className="space-y-3">
                        <img
                          src={block.imageUrl}
                          alt={block.caption || selectedPost.title}
                          className="w-full max-h-[560px] object-cover rounded-[28px] border border-[#94cfff]/18"
                        />
                        {block.caption ? (
                          <figcaption className="text-sm text-[#8bbce9] text-center">{block.caption}</figcaption>
                        ) : null}
                      </figure>
                    )
                  )}
                </div>
                <a
                  href={selectedPost.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 rounded-full bg-[#94cfff] px-6 py-3 font-heading font-bold uppercase tracking-[0.2em] text-sm text-[#081a3a] shadow-[0_12px_30px_rgba(148,207,255,0.2)] hover:bg-white transition-colors"
                >
                  <Download size={18} />
                  Descargar PDF
                </a>
              </div>
            </article>
          ) : (
            <div className="min-h-[50vh] flex items-center justify-center text-center px-6 text-[#8bbce9]">
              No encontré ese artículo.
            </div>
          )}
        </div>
      </section>
      <ResearchFooter />
    </>
    );
  }

  if (mode === 'admin') {
    const showCms = Boolean(session);

    return (
      <>
      <section className="min-h-screen bg-[#081a3a] py-24 text-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <PageHeader />

          {!showCms ? (
            <div className="max-w-xl mx-auto rounded-[36px] border border-[#94cfff]/20 bg-[#f7fbff] p-8 md:p-10 text-[#16295d] shadow-[0_0_60px_rgba(11,30,70,0.35)]">
              <span className="inline-flex items-center rounded-full bg-[#94cfff]/12 px-4 py-2 font-mono text-xs uppercase tracking-[0.32em] font-bold mb-5 text-[#35548f]">
                Panel editorial
              </span>
              <h1 className="font-heading text-4xl md:text-5xl uppercase leading-none mb-4 text-[#081a3a]">
                Acceso Admin
              </h1>
              <p className="text-[#4c6aa1] mb-8 leading-relaxed">
                Ingresa con tu usuario y clave de CMS para acceder al panel editorial de Encuestas.
              </p>

              {!isSupabaseReady ? (
                <div className="mb-5 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm text-amber-100">
                  El panel todavía se está terminando de activar.
                </div>
              ) : null}

              {loadError ? (
                <div className="mb-5 rounded-2xl border border-red-300/30 bg-red-400/10 p-4 text-sm text-red-100">
                  {formatSupabaseError(loadError)}
                </div>
              ) : null}

              <form onSubmit={handleLogin} className="space-y-4">
                <label className="block">
                  <span className="text-xs uppercase tracking-[0.28em] text-[#35548f] font-mono mb-2 block">
                    Usuario
                  </span>
                  <input
                    type="text"
                    name="username"
                    value={authState.username}
                    onChange={handleAuthFieldChange}
                    autoComplete="username"
                    className="w-full rounded-2xl bg-white border border-[#c9def6] px-4 py-3 text-[#16295d] placeholder:text-[#7a8cab] outline-none focus:border-[#6cb7f3]"
                  />
                </label>
                <label className="block">
                  <span className="text-xs uppercase tracking-[0.28em] text-[#35548f] font-mono mb-2 block">
                    Contraseña
                  </span>
                  <input
                    type="password"
                    name="password"
                    value={authState.password}
                    onChange={handleAuthFieldChange}
                    autoComplete="current-password"
                    className="w-full rounded-2xl bg-white border border-[#c9def6] px-4 py-3 text-[#16295d] placeholder:text-[#7a8cab] outline-none focus:border-[#6cb7f3]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isAuthenticating || !isSupabaseReady}
                  className="inline-flex items-center gap-2 rounded-full bg-[#94cfff] px-6 py-3 font-heading font-bold uppercase tracking-[0.25em] text-sm text-[#081a3a] shadow-[0_12px_30px_rgba(148,207,255,0.18)] hover:bg-white transition-colors disabled:opacity-40"
                >
                  {isAuthenticating ? <Loader className="animate-spin" size={16} /> : <LogIn size={16} />}
                  Ingresar al CMS
                </button>
              </form>

              {errorMessage ? <p className="mt-5 text-sm text-red-300">{errorMessage}</p> : null}
              {successMessage ? <p className="mt-5 text-sm text-emerald-700">{successMessage}</p> : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-[0.78fr_1.22fr] gap-8">
              <div className="rounded-[32px] border border-[#94cfff]/20 bg-[linear-gradient(180deg,rgba(16,37,83,0.96)_0%,rgba(9,24,58,0.98)_100%)] p-8 shadow-[0_0_60px_rgba(11,30,70,0.35)]">
                <div className="flex items-center gap-3 mb-5">
                  <LogOut className="text-[#94cfff]" size={22} />
                  <h2 className="font-heading text-3xl uppercase leading-none text-white">Panel editorial</h2>
                </div>
                <p className="text-[#b8d8f4] mb-6 leading-relaxed">
                  Ya estás dentro. Desde aquí puedes construir artículos completos para Research.
                </p>
                <div className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100 mb-5">
                  Sesión activa como {currentCmsUser?.username} · {currentCmsUser?.role === 'admin' ? 'Administrador principal' : 'Editor'}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-full border border-[#94cfff]/30 px-5 py-3 text-sm uppercase tracking-[0.25em] font-heading text-white hover:border-[#94cfff] hover:bg-[#94cfff]/10 transition-colors"
                >
                  <LogOut size={16} />
                  Cerrar sesión
                </button>

                {errorMessage ? <p className="mt-5 text-sm text-red-300">{errorMessage}</p> : null}
                {successMessage ? <p className="mt-5 text-sm text-emerald-300">{successMessage}</p> : null}

                {currentCmsUser?.role === 'admin' ? (
                  <div className="mt-8 rounded-[28px] border border-[#94cfff]/16 bg-white/[0.04] p-5">
                    <h3 className="font-heading text-2xl uppercase leading-none text-white mb-2">Equipo editorial</h3>
                    <p className="text-sm text-[#b8d8f4] mb-5">
                      Crea usuarios y claves para otros editores. Ellos solo entran al CMS y publican artículos.
                    </p>

                    <form onSubmit={handleCreateEditor} className="space-y-4 mb-5">
                      <label className="block">
                        <span className="text-xs uppercase tracking-[0.28em] text-[#94cfff] font-mono mb-2 block">
                          Nuevo usuario
                        </span>
                        <input
                          type="text"
                          name="username"
                          value={newEditor.username}
                          onChange={handleNewEditorFieldChange}
                          className="w-full rounded-2xl bg-white px-4 py-3 text-[#16295d] placeholder:text-[#7a8cab] outline-none border border-transparent focus:border-[#6cb7f3]"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs uppercase tracking-[0.28em] text-[#94cfff] font-mono mb-2 block">
                          Clave
                        </span>
                        <input
                          type="text"
                          name="password"
                          value={newEditor.password}
                          onChange={handleNewEditorFieldChange}
                          className="w-full rounded-2xl bg-white px-4 py-3 text-[#16295d] placeholder:text-[#7a8cab] outline-none border border-transparent focus:border-[#6cb7f3]"
                        />
                      </label>
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#94cfff] px-5 py-3 font-heading font-bold uppercase tracking-[0.24em] text-sm text-[#081a3a] shadow-[0_12px_28px_rgba(148,207,255,0.18)] hover:bg-white transition-colors"
                      >
                        <PlusCircle size={16} />
                        Crear editor
                      </button>
                    </form>

                    <div className="space-y-3">
                      {cmsEditors.map((editor) => (
                        <div
                          key={editor.username}
                          className="flex items-center justify-between gap-4 rounded-2xl border border-[#94cfff]/16 bg-[#081a3a]/60 px-4 py-3"
                        >
                          <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-white">{editor.username}</p>
                            <p className="text-xs text-[#8bbce9]">
                              {editor.role === 'admin' ? 'Administrador principal' : 'Editor publicador'}
                            </p>
                          </div>
                          {editor.role === 'editor' ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteEditor(editor.username)}
                              className="text-xs uppercase tracking-[0.22em] text-[#94cfff] hover:text-white"
                            >
                              Eliminar
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-[32px] border border-[#94cfff]/18 bg-[#f7fbff] p-8 text-[#16295d] shadow-[0_0_50px_rgba(11,30,70,0.18)]">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <label className="block md:col-span-2">
                    <span className="text-xs uppercase tracking-[0.28em] text-[#4c6aa1] font-mono mb-2 block">
                      Título
                    </span>
                    <input
                      name="title"
                      value={formState.title}
                      onChange={handleChange}
                      disabled={!session || isPublishing}
                      className="w-full rounded-2xl bg-white border border-[#c9def6] px-4 py-3 text-[#16295d] placeholder:text-[#7a8cab] outline-none focus:border-[#6cb7f3] disabled:opacity-40"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs uppercase tracking-[0.28em] text-[#4c6aa1] font-mono mb-2 block">
                      Categoría
                    </span>
                    <input
                      name="category"
                      value={formState.category}
                      onChange={handleChange}
                      disabled={!session || isPublishing}
                      className="w-full rounded-2xl bg-white border border-[#c9def6] px-4 py-3 text-[#16295d] placeholder:text-[#7a8cab] outline-none focus:border-[#6cb7f3] disabled:opacity-40"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs uppercase tracking-[0.28em] text-[#4c6aa1] font-mono mb-2 block">
                      Fecha
                    </span>
                    <input
                      type="date"
                      name="publishedAt"
                      value={formState.publishedAt}
                      onChange={handleChange}
                      disabled={!session || isPublishing}
                      className="w-full rounded-2xl bg-white border border-[#c9def6] px-4 py-3 text-[#16295d] placeholder:text-[#7a8cab] outline-none focus:border-[#6cb7f3] disabled:opacity-40"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="text-xs uppercase tracking-[0.28em] text-[#4c6aa1] font-mono mb-2 block">
                      Resumen
                    </span>
                    <textarea
                      name="summary"
                      value={formState.summary}
                      onChange={handleChange}
                      disabled={!session || isPublishing}
                      rows={3}
                      className="w-full rounded-2xl bg-white border border-[#c9def6] px-4 py-3 text-[#16295d] placeholder:text-[#7a8cab] outline-none focus:border-[#6cb7f3] disabled:opacity-40"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="text-xs uppercase tracking-[0.28em] text-[#4c6aa1] font-mono mb-2 block">
                      Imagen principal
                    </span>
                    <label className="flex items-center gap-3 w-full rounded-2xl bg-white border border-[#c9def6] px-4 py-4 text-[#16295d] cursor-pointer hover:border-[#6cb7f3] transition-colors">
                      <FileImage size={18} className="text-[#6cb7f3]" />
                      <span className="text-sm text-[#35548f]">
                        {selectedImage ? selectedImage.name : 'Seleccionar imagen principal'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverImageChange}
                        disabled={!session || isPublishing}
                        className="hidden"
                      />
                    </label>
                  </label>

                  <div className="md:col-span-2 rounded-[28px] border border-[#c9def6] bg-white p-5 space-y-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h2 className="font-heading text-2xl uppercase leading-none text-[#16295d]">Contenido del artículo</h2>
                        <p className="text-sm text-[#4c6aa1]">
                          Agrega párrafos e imágenes internas en el orden que quieras.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={addTextBlock}
                          disabled={!session || isPublishing}
                          className="inline-flex items-center gap-2 rounded-full border border-[#c9def6] px-4 py-2 text-xs uppercase tracking-[0.25em] font-heading text-[#16295d] hover:border-[#6cb7f3] hover:bg-[#94cfff]/10 transition-colors disabled:opacity-40"
                        >
                          <Rows3 size={14} />
                          Texto
                        </button>
                        <button
                          type="button"
                          onClick={addImageBlock}
                          disabled={!session || isPublishing}
                          className="inline-flex items-center gap-2 rounded-full border border-[#c9def6] px-4 py-2 text-xs uppercase tracking-[0.25em] font-heading text-[#16295d] hover:border-[#6cb7f3] hover:bg-[#94cfff]/10 transition-colors disabled:opacity-40"
                        >
                          <ImagePlus size={14} />
                          Imagen
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {contentBlocks.map((block, index) => (
                        <div key={block.id} className="rounded-[24px] border border-[#d6e6f8] p-4 space-y-4 bg-[#f7fbff]">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs uppercase tracking-[0.28em] text-[#4c6aa1] font-mono">
                              Bloque {index + 1} · {block.type === 'text' ? 'Texto' : 'Imagen'}
                            </span>
                            {contentBlocks.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => removeBlock(block.id)}
                                className="text-xs uppercase tracking-[0.25em] text-red-400 hover:text-red-500"
                              >
                                Eliminar
                              </button>
                            ) : null}
                          </div>

                          {block.type === 'text' ? (
                            <textarea
                              value={block.content}
                              onChange={(event) => updateBlock(block.id, { content: event.target.value })}
                              disabled={!session || isPublishing}
                              rows={6}
                              className="w-full rounded-2xl bg-white border border-[#c9def6] px-4 py-3 text-[#16295d] placeholder:text-[#7a8cab] outline-none focus:border-[#6cb7f3] disabled:opacity-40"
                              placeholder="Escribe un párrafo del artículo"
                            />
                          ) : (
                            <div className="space-y-4">
                              <label className="flex items-center gap-3 w-full rounded-2xl bg-white border border-[#c9def6] px-4 py-4 text-[#16295d] cursor-pointer hover:border-[#6cb7f3] transition-colors">
                                <FileImage size={18} className="text-[#6cb7f3]" />
                                <span className="text-sm text-[#35548f]">
                                  {block.file ? block.file.name : 'Seleccionar imagen interna'}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(event) => handleBlockImageChange(block.id, event)}
                                  disabled={!session || isPublishing}
                                  className="hidden"
                                />
                              </label>
                              {block.imageUrl ? (
                                <img
                                  src={block.imageUrl}
                                  alt="Vista previa"
                                  className="w-full max-h-64 object-cover rounded-[20px] border border-[#d6e6f8]"
                                />
                              ) : null}
                              <input
                                value={block.caption}
                                onChange={(event) => updateBlock(block.id, { caption: event.target.value })}
                                disabled={!session || isPublishing}
                                className="w-full rounded-2xl bg-white border border-[#c9def6] px-4 py-3 text-[#16295d] placeholder:text-[#7a8cab] outline-none focus:border-[#6cb7f3] disabled:opacity-40"
                                placeholder="Pie de foto opcional"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <label className="block md:col-span-2">
                    <span className="text-xs uppercase tracking-[0.28em] text-[#4c6aa1] font-mono mb-2 block">
                      Link del PDF en Drive
                    </span>
                    <input
                      name="pdfUrl"
                      value={formState.pdfUrl}
                      onChange={handleChange}
                      disabled={!session || isPublishing}
                      className="w-full rounded-2xl bg-white border border-[#c9def6] px-4 py-3 text-[#16295d] placeholder:text-[#7a8cab] outline-none focus:border-[#6cb7f3] disabled:opacity-40"
                    />
                  </label>

                  <div className="md:col-span-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-2">
                    <p className="text-sm text-[#4c6aa1]">
                      Cuando publiques, el artículo se verá en su propia página dentro de Encuestas.
                    </p>
                    <button
                      type="submit"
                      disabled={!session || isPublishing}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#081a3a] px-6 py-3 font-heading font-bold uppercase tracking-[0.25em] text-sm text-white shadow-[0_14px_30px_rgba(8,26,58,0.2)] hover:bg-[#102553] transition-colors disabled:opacity-40"
                    >
                      {isPublishing ? <Loader className="animate-spin" size={18} /> : <PlusCircle size={18} />}
                      Publicar artículo
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </section>
      <ResearchFooter />
      </>
    );
  }

  return (
    <section className="min-h-screen bg-[#081a3a] py-24 text-white">
      <div className="container mx-auto px-6">
        <div className="mb-10 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#d8ecff] hover:border-white/24 hover:bg-white/[0.08] transition-colors"
          >
            <ArrowLeft size={14} />
            Regresa a AP
          </Link>
          <img src={researchLogo} alt="Acción Política Research" className="h-11 w-auto object-contain" />
        </div>

        {isLoading ? (
          <div className="min-h-[40vh] flex items-center justify-center gap-3 text-[#8bbce9]">
            <Loader className="animate-spin" size={20} />
            Cargando artículos...
          </div>
        ) : (
          <div className="text-white">
            <div className="border-y border-white/8 px-0 py-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-2">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8bbce9]">
                    Acción Política Research
                  </span>
                  <div>
                    <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">Encuestas recientes</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#9ebfdd] md:text-base">
                      Encuestas, análisis y documentos para leer el clima político con un formato simple, limpio y editorial.
                    </p>
                  </div>
                </div>

                <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr] xl:max-w-4xl">
                  <label className="block">
                    <div className="flex items-center gap-3 border-b border-white/10 px-0 py-3 focus-within:border-[#94cfff]/50">
                      <Search size={16} className="text-[#8bbce9]" />
                      <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Buscar artículo"
                        className="w-full bg-transparent text-sm text-white placeholder:text-[#6e89ad] outline-none"
                      />
                    </div>
                  </label>
                  <label className="block">
                    <select
                      value={categoryFilter}
                      onChange={(event) => setCategoryFilter(event.target.value)}
                      className="w-full border-b border-white/10 bg-transparent px-0 py-3 text-sm text-white outline-none focus:border-[#94cfff]/50"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category} className="text-black">
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <select
                      value={countryFilter}
                      onChange={(event) => setCountryFilter(event.target.value)}
                      className="w-full border-b border-white/10 bg-transparent px-0 py-3 text-sm text-white outline-none focus:border-[#94cfff]/50"
                    >
                      {countries.map((country) => (
                        <option key={country} value={country} className="text-black">
                          {country}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </div>

            <div className="border-t border-white/8 px-0 py-8 md:py-10">
              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8bbce9]">
                    Articles
                  </span>
                  <h3 className="mt-2 text-4xl font-black text-white">Todas las entradas</h3>
                </div>
                <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8bbce9]">
                  {filteredPosts.length} publicaciones
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {visibleGridPosts.map((post) => (
                  <article key={post.id} className="space-y-4">
                    <Link to={`/encuestas/${post.id}`} className="block overflow-hidden rounded-[18px]">
                      <img src={post.imageUrl} alt={post.title} className="h-[230px] w-full object-cover" />
                    </Link>
                    <div>
                      <span className="mb-3 inline-flex text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8bbce9]">
                        {post.category}
                      </span>
                      <Link to={`/encuestas/${post.id}`} className="block">
                        <h4 className="text-2xl font-extrabold leading-tight text-white hover:text-[#dff2ff] transition-colors">
                          {post.title}
                        </h4>
                      </Link>
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#9ebfdd]">
                        {post.summary}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7eaad1]">
                        <span>{formatDate(post.publishedAt)}</span>
                        <span>Research note</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {filteredPosts.length > visiblePosts ? (
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisiblePosts((current) => current + 6)}
                    className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#081a3a] hover:bg-[#94cfff] transition-colors"
                  >
                    Cargar más
                  </button>
                </div>
              ) : null}

              {filteredPosts.length === 0 ? (
                <div className="border border-white/8 px-6 py-10 text-center text-[#9ebfdd]">
                  No encontré artículos con esos filtros.
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
      <ResearchFooter />
    </section>
  );
};

export default Surveys;
