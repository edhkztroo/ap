import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bold,
  CalendarDays,
  Download,
  FileImage,
  FileText,
  ImagePlus,
  Italic,
  Loader,
  LogIn,
  LogOut,
  PlusCircle,
  Rows3,
  Search,
  Trash2,
  Underline
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
  onDeleted: (postId: string) => void;
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

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const toRichHtml = (value: string) => value.replace(/\n/g, '<br />');
const slugifyPostTitle = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getSurveyPostPath = (post: SurveyPost) => `/encuestas/${slugifyPostTitle(post.title)}`;
const getYouTubeEmbedUrl = (value: string) => {
  const trimmed = value.trim();
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  const longMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/);
  const id = shortMatch?.[1] || longMatch?.[1] || embedMatch?.[1];
  return id ? `https://www.youtube.com/embed/${id}` : null;
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
  onPublished,
  onDeleted
}) => {
  const navigate = useNavigate();
  const { postId } = useParams();
  const [formState, setFormState] = useState(emptyForm);
  const [authState, setAuthState] = useState({ username: '', password: '' });
  const [session, setSession] = useState<Session | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [existingCoverImageUrl, setExistingCoverImageUrl] = useState('');
  const [contentBlocks, setContentBlocks] = useState<AdminBlock[]>([createEmptyTextBlock()]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
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
  const [editorSearchTerm, setEditorSearchTerm] = useState('');
  const textEditorRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const inlineImageInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

  const selectedPost = useMemo(() => {
    if (!postId) {
      return undefined;
    }

    const normalizedPostId = decodeURIComponent(postId);
    return sortedPosts.find(
      (post) => post.id === normalizedPostId || slugifyPostTitle(post.title) === normalizedPostId
    );
  }, [postId, sortedPosts]);
  const suggestedPosts = useMemo(
    () => sortedPosts.filter((post) => post.id !== selectedPost?.id).slice(0, 4),
    [selectedPost?.id, sortedPosts]
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
  const filteredEditorPosts = useMemo(() => {
    const normalized = editorSearchTerm.trim().toLowerCase();
    if (!normalized) {
      return sortedPosts;
    }

    return sortedPosts.filter((post) =>
      `${post.title} ${post.category} ${post.summary}`.toLowerCase().includes(normalized)
    );
  }, [editorSearchTerm, sortedPosts]);

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

  const applyTextFormat = (
    blockId: string,
    wrapperStart: string,
    wrapperEnd: string,
    placeholder: string
  ) => {
    const target = textEditorRefs.current[blockId];
    if (!target) {
      return;
    }

    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;
    const currentValue = target.value;
    const selection = currentValue.slice(start, end) || placeholder;
    const nextValue =
      currentValue.slice(0, start) + wrapperStart + selection + wrapperEnd + currentValue.slice(end);

    updateBlock(blockId, { content: nextValue });

    window.requestAnimationFrame(() => {
      target.focus();
      const caret = start + wrapperStart.length + selection.length + wrapperEnd.length;
      target.setSelectionRange(caret, caret);
    });
  };

  const insertHtmlAtCursor = (blockId: string, html: string) => {
    const target = textEditorRefs.current[blockId];
    if (!target) {
      return;
    }

    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;
    const currentValue = target.value;
    const nextValue = currentValue.slice(0, start) + html + currentValue.slice(end);

    updateBlock(blockId, { content: nextValue });

    window.requestAnimationFrame(() => {
      target.focus();
      const caret = start + html.length;
      target.setSelectionRange(caret, caret);
    });
  };

  const handleInlineImageSelect = async (blockId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session) {
      return;
    }

    try {
      setIsPublishing(true);
      const imageUrl = await uploadImage(file, session.user.id, 'inline');
      insertHtmlAtCursor(
        blockId,
        `\n<figure><img src="${imageUrl}" alt="" /><figcaption>Pie de foto</figcaption></figure>\n`
      );
      setSuccessMessage('Imagen insertada dentro del texto.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No pude insertar la imagen.';
      setErrorMessage(message);
    } finally {
      setIsPublishing(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleEmbedYoutube = (blockId: string) => {
    const input = window.prompt('Pega aquí el enlace de YouTube');
    if (!input) {
      return;
    }

    const embedUrl = getYouTubeEmbedUrl(input);
    if (!embedUrl) {
      setErrorMessage('Ese enlace de YouTube no parece válido.');
      return;
    }

    insertHtmlAtCursor(
      blockId,
      `\n<div class="video-embed"><iframe src="${embedUrl}" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>\n`
    );
    setSuccessMessage('Video de YouTube insertado.');
  };

  const startEditingPost = (post: SurveyPost) => {
    setEditingPostId(post.id);
    setFormState({
      title: post.title,
      category: post.category,
      summary: post.summary,
      pdfUrl: post.pdfUrl,
      publishedAt: post.publishedAt
    });
    setSelectedImage(null);
    setExistingCoverImageUrl(post.imageUrl);
    setContentBlocks(
      normalizeContentBlocks(post).map((block) =>
        block.type === 'text'
          ? {
              id: block.id,
              type: 'text' as const,
              content: block.content
            }
          : {
              id: block.id,
              type: 'image' as const,
              caption: block.caption || '',
              imageUrl: block.imageUrl,
              file: null
            }
      )
    );
    setErrorMessage('');
    setSuccessMessage(`Editando: ${post.title}`);
  };

  const resetEditor = () => {
    setEditingPostId(null);
    setFormState(emptyForm);
    setSelectedImage(null);
    setExistingCoverImageUrl('');
    setContentBlocks([createEmptyTextBlock()]);
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
    if (!selectedImage && !existingCoverImageUrl) {
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
      const heroImageUrl = selectedImage
        ? await uploadImage(selectedImage, session.user.id, 'cover')
        : existingCoverImageUrl;
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

        if (!block.file && block.imageUrl) {
          uploadedBlocks.push({
            id: block.id,
            type: 'image',
            imageUrl: block.imageUrl,
            caption: block.caption.trim()
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
        .map((block) => stripHtml(block.content))
        .join('\n\n');

      const payload = {
          title: normalizedPost.title,
          category: normalizedPost.category,
          summary: normalizedPost.summary,
          content: plainContent,
          content_blocks: uploadedBlocks,
          image_url: heroImageUrl,
          pdf_url: normalizedPost.pdfUrl,
          published_at: normalizedPost.publishedAt,
          user_id: session.user.id
      };

      let data:
        | {
            id: string;
            title: string;
            category: string;
            summary: string;
            content: string;
            content_blocks: SurveyContentBlock[] | null;
            image_url: string;
            pdf_url: string;
            published_at: string;
            created_at: string;
          }
        | null = null;
      let error: Error | null = null;

      if (editingPostId) {
        const response = await supabase
          .from('survey_posts')
          .update(payload)
          .eq('id', editingPostId)
          .select(
            'id, title, category, summary, content, content_blocks, image_url, pdf_url, published_at, created_at'
          )
          .single();
        data = response.data;
        error = response.error;
      } else {
        const response = await supabase
          .from('survey_posts')
          .insert(payload)
          .select(
            'id, title, category, summary, content, content_blocks, image_url, pdf_url, published_at, created_at'
          )
          .single();
        data = response.data;
        error = response.error;
      }

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
      resetEditor();
      setSuccessMessage(editingPostId ? 'Artículo actualizado correctamente.' : 'Artículo publicado correctamente.');
      navigate(getSurveyPostPath(publishedPost));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No pude subir las imágenes en este momento.';
      setErrorMessage(message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeletePost = async (post: SurveyPost) => {
    if (!supabase || !session) {
      setErrorMessage('Debes iniciar sesión para eliminar artículos.');
      return;
    }

    const shouldDelete = window.confirm(`¿Eliminar definitivamente "${post.title}"?`);
    if (!shouldDelete) {
      return;
    }

    setIsPublishing(true);
    setErrorMessage('');
    setSuccessMessage('');

    const { error } = await supabase.from('survey_posts').delete().eq('id', post.id);

    setIsPublishing(false);

    if (error) {
      setErrorMessage('No pude eliminar el artículo. Inténtalo otra vez.');
      return;
    }

    if (editingPostId === post.id) {
      resetEditor();
    }

    onDeleted(post.id);
    setSuccessMessage('Artículo eliminado correctamente.');
  };

  if (mode === 'detail') {
    return (
    <>
    <section className="bg-[#081a3a] pt-24 pb-16 text-white">
      <div className="container mx-auto px-6">
          <div className="flex items-center justify-between gap-4 mb-10">
            <Link
              to="/encuestas"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[#9fcbf2] hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Volver al home de encuestas
            </Link>
            <img src={researchLogo} alt="Acción Política Research" className="h-12 w-auto object-contain" />
          </div>

          {isLoading ? (
            <div className="min-h-[60vh] flex items-center justify-center gap-3 text-[#c2dbf5]">
              <Loader className="animate-spin" size={20} />
              Cargando artículo...
            </div>
          ) : selectedPost ? (
            <div className="max-w-5xl">
              <article className="space-y-8">
                <div className="space-y-5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-xs uppercase tracking-[0.3em] font-mono text-[#9fcbf2]">
                    <FileText size={14} />
                    {selectedPost.category}
                  </span>
                  <h1 className="max-w-4xl font-heading text-4xl leading-[0.94] text-white md:text-6xl">
                    {selectedPost.title}
                  </h1>
                  <div className="inline-flex items-center gap-2 text-sm text-[#d2e9ff]">
                    <CalendarDays size={16} />
                    {formatDate(selectedPost.publishedAt)}
                  </div>
                  <p className="max-w-3xl text-lg leading-relaxed text-[#d7e7f7] md:text-[1.2rem]">
                    {selectedPost.summary}
                  </p>
                </div>
              </article>
            </div>
          ) : (
            <div className="min-h-[50vh] flex items-center justify-center text-center px-6 text-[#c2dbf5]">
              No encontré ese artículo.
            </div>
          )}
        </div>
      </section>

      {selectedPost ? (
        <section className="bg-white py-16 text-[#102553] md:py-20">
          <div className="container mx-auto px-6">
            <div className="mx-auto grid max-w-6xl gap-14 xl:grid-cols-[minmax(0,1fr)_320px]">
              <article className="space-y-8">
                <div className="space-y-8 text-[#243b5f]">
                  {normalizeContentBlocks(selectedPost).map((block) =>
                    block.type === 'text' ? (
                      <div
                        key={block.id}
                        className="text-[1rem] md:text-[1.05rem] leading-relaxed text-[#334c73] space-y-4 [&_strong]:font-extrabold [&_em]:italic [&_u]:underline [&_h3]:font-heading [&_h3]:text-xl [&_h3]:uppercase [&_h3]:text-[#102553] [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-2 [&_figure]:my-8 [&_figure]:space-y-3 [&_figure]:text-center [&_img]:block [&_img]:w-auto [&_img]:max-w-full [&_img]:max-h-[560px] [&_img]:mx-auto [&_img]:rounded-[28px] [&_img]:object-contain [&_img]:bg-[#eef5fb] [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-[24px]"
                        dangerouslySetInnerHTML={{ __html: toRichHtml(block.content) }}
                      />
                    ) : (
                      <figure key={block.id} className="space-y-3 text-center">
                        <img
                          src={block.imageUrl}
                          alt={block.caption || selectedPost.title}
                          className="block w-auto max-w-full max-h-[560px] mx-auto object-contain rounded-[28px] border border-[#d9e6f2] bg-[#eef5fb]"
                        />
                        {block.caption ? (
                          <figcaption className="text-sm text-[#6482a8] text-center">{block.caption}</figcaption>
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
              </article>

              <aside className="xl:border-l xl:border-[#d9e6f2] xl:pl-8">
                <div className="sticky top-24 space-y-5">
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-[#7b98bc]">Sugerencias</p>
                    <h2 className="font-heading text-2xl uppercase leading-none text-[#102553]">
                      Otros artículos
                    </h2>
                    <p className="text-sm leading-relaxed text-[#6482a8]">
                      Sigue explorando otros análisis publicados en Research.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {suggestedPosts.map((post) => (
                      <Link
                        key={post.id}
                        to={getSurveyPostPath(post)}
                        className="group block rounded-[24px] border border-[#d9e6f2] bg-[#f7fbff] p-4 transition-colors hover:border-[#94cfff] hover:bg-white"
                      >
                        <p className="mb-2 text-[10px] uppercase tracking-[0.26em] text-[#7b98bc]">
                          {post.category}
                        </p>
                        <h3 className="text-base font-semibold leading-snug text-[#102553] transition-colors group-hover:text-[#1f5d9f]">
                          {post.title}
                        </h3>
                        <p className="mt-3 text-xs text-[#6482a8]">{formatDate(post.publishedAt)}</p>
                      </Link>
                    ))}
                  </div>

                  <Link
                    to="/encuestas"
                    className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[#5d82aa] hover:text-[#102553] transition-colors"
                  >
                    <ArrowLeft size={14} />
                    Ver todas las encuestas
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </section>
      ) : null}

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

                <div className="mt-8 rounded-[28px] border border-[#94cfff]/16 bg-white/[0.04] p-5">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-heading text-2xl uppercase leading-none text-white mb-2">Artículos</h3>
                      <p className="text-sm text-[#b8d8f4]">
                        Busca una nota existente para editarla o crea una nueva desde cero.
                      </p>
                    </div>
                    {editingPostId ? (
                      <button
                        type="button"
                        onClick={resetEditor}
                        className="rounded-full border border-[#94cfff]/30 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white hover:bg-[#94cfff]/10"
                      >
                        Nueva nota
                      </button>
                    ) : null}
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center gap-3 rounded-full border border-[#94cfff]/16 bg-[#081a3a]/50 px-4 py-3">
                      <Search size={14} className="text-[#8bbce9]" />
                      <input
                        type="text"
                        value={editorSearchTerm}
                        onChange={(event) => setEditorSearchTerm(event.target.value)}
                        placeholder="Buscar artículo para editar"
                        className="w-full bg-transparent text-sm text-white placeholder:text-[#7eaad1] outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {filteredEditorPosts.map((post) => (
                      <div
                        key={post.id}
                        className={`rounded-2xl border px-4 py-4 ${
                          editingPostId === post.id
                            ? 'border-[#94cfff]/40 bg-[#94cfff]/10'
                            : 'border-[#94cfff]/12 bg-[#081a3a]/40'
                        }`}
                      >
                        <p className="text-sm uppercase tracking-[0.16em] text-[#8bbce9] mb-2">{post.category}</p>
                        <p className="text-base font-bold text-white leading-tight mb-3">{post.title}</p>
                        <div className="flex flex-wrap items-center gap-4">
                          <button
                            type="button"
                            onClick={() => startEditingPost(post)}
                            className="text-xs uppercase tracking-[0.18em] text-[#94cfff] hover:text-white"
                          >
                            Editar artículo
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeletePost(post)}
                            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#ffb3b3] hover:text-white"
                          >
                            <Trash2 size={13} />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                    {filteredEditorPosts.length === 0 ? (
                      <div className="rounded-2xl border border-[#94cfff]/12 bg-[#081a3a]/40 px-4 py-6 text-sm text-[#8bbce9]">
                        No encontré artículos con esa búsqueda.
                      </div>
                    ) : null}
                  </div>
                </div>
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
                        {selectedImage ? selectedImage.name : existingCoverImageUrl ? 'Portada actual cargada' : 'Seleccionar imagen principal'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverImageChange}
                        disabled={!session || isPublishing}
                        className="hidden"
                      />
                    </label>
                    {existingCoverImageUrl && !selectedImage ? (
                      <img
                        src={existingCoverImageUrl}
                        alt="Portada actual"
                        className="mt-4 w-full max-h-64 object-cover rounded-[20px] border border-[#d6e6f8]"
                      />
                    ) : null}
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
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => applyTextFormat(block.id, '<strong>', '</strong>', 'Texto en negrita')}
                                  className="inline-flex items-center gap-1 rounded-full border border-[#c9def6] px-3 py-2 text-xs font-semibold text-[#16295d] hover:bg-[#eef6ff]"
                                >
                                  <Bold size={12} />
                                  Negrita
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyTextFormat(block.id, '<em>', '</em>', 'Texto en cursiva')}
                                  className="inline-flex items-center gap-1 rounded-full border border-[#c9def6] px-3 py-2 text-xs font-semibold text-[#16295d] hover:bg-[#eef6ff]"
                                >
                                  <Italic size={12} />
                                  Cursiva
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyTextFormat(block.id, '<u>', '</u>', 'Texto subrayado')}
                                  className="inline-flex items-center gap-1 rounded-full border border-[#c9def6] px-3 py-2 text-xs font-semibold text-[#16295d] hover:bg-[#eef6ff]"
                                >
                                  <Underline size={12} />
                                  Subrayado
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyTextFormat(block.id, '<h3>', '</h3>', 'Subtítulo')}
                                  className="inline-flex items-center gap-1 rounded-full border border-[#c9def6] px-3 py-2 text-xs font-semibold text-[#16295d] hover:bg-[#eef6ff]"
                                >
                                  H3
                                </button>
                                <button
                                  type="button"
                                  onClick={() => inlineImageInputRefs.current[block.id]?.click()}
                                  className="inline-flex items-center gap-1 rounded-full border border-[#c9def6] px-3 py-2 text-xs font-semibold text-[#16295d] hover:bg-[#eef6ff]"
                                >
                                  <ImagePlus size={12} />
                                  Imagen
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEmbedYoutube(block.id)}
                                  className="inline-flex items-center gap-1 rounded-full border border-[#c9def6] px-3 py-2 text-xs font-semibold text-[#16295d] hover:bg-[#eef6ff]"
                                >
                                  Video
                                </button>
                                <input
                                  ref={(node) => {
                                    inlineImageInputRefs.current[block.id] = node;
                                  }}
                                  type="file"
                                  accept="image/*"
                                  onChange={(event) => {
                                    void handleInlineImageSelect(block.id, event);
                                  }}
                                  className="hidden"
                                />
                              </div>
                              <textarea
                                ref={(node) => {
                                  textEditorRefs.current[block.id] = node;
                                }}
                                value={block.content}
                                onChange={(event) => updateBlock(block.id, { content: event.target.value })}
                                disabled={!session || isPublishing}
                                rows={8}
                                className="w-full rounded-2xl bg-white border border-[#c9def6] px-4 py-3 text-[#16295d] placeholder:text-[#7a8cab] outline-none focus:border-[#6cb7f3] disabled:opacity-40"
                                placeholder="Escribe un párrafo del artículo"
                              />
                              <div className="rounded-2xl border border-[#d6e6f8] bg-[#fbfdff] p-4">
                                <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#4c6aa1]">Vista previa</p>
                                <div
                                  className="space-y-3 text-[#16295d] [&_strong]:font-extrabold [&_em]:italic [&_u]:underline [&_h3]:font-heading [&_h3]:text-xl [&_h3]:uppercase [&_ul]:list-disc [&_ul]:pl-6 [&_figure]:my-4 [&_figure]:space-y-2 [&_figure]:text-center [&_img]:block [&_img]:w-auto [&_img]:max-w-full [&_img]:max-h-72 [&_img]:mx-auto [&_img]:rounded-[18px] [&_img]:object-contain [&_img]:bg-[#eef6ff] [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-[18px]"
                                  dangerouslySetInnerHTML={{ __html: block.content ? toRichHtml(block.content) : '<p>Sin contenido todavía.</p>' }}
                                />
                              </div>
                            </div>
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
                                  className="block w-auto max-w-full max-h-72 mx-auto object-contain rounded-[20px] border border-[#d6e6f8] bg-[#eef6ff]"
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
                      {editingPostId ? 'Guardar cambios' : 'Publicar artículo'}
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
                    <Link to={getSurveyPostPath(post)} className="block overflow-hidden rounded-[18px]">
                      <img src={post.imageUrl} alt={post.title} className="h-[230px] w-full object-cover" />
                    </Link>
                    <div>
                      <span className="mb-3 inline-flex text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8bbce9]">
                        {post.category}
                      </span>
                      <Link to={getSurveyPostPath(post)} className="block">
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
