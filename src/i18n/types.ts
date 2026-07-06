export type Locale = 'zh-Hant' | 'en' | 'ja';

export type PageId = 'quotes' | 'authors' | 'settings' | 'focus';

export interface Messages {
  app: {
    name: string;
    description: string;
  };
  nav: {
    main: string;
    quotes: string;
    authors: string;
    settings: string;
  };
  page: Record<PageId, string>;
  theme: {
    toggle: string;
    dark: string;
  };
  hero: {
    eyebrow: string;
  };
  unknown: string;
  search: {
    placeholder: string;
    label: string;
  };
  quotes: {
    add: string;
    my: string;
    byAuthor: string;
    count: string;
    empty: string;
    emptyFiltered: string;
  };
  sidebar: {
    browseByAuthor: string;
    all: string;
  };
  authors: {
    title: string;
    count: string;
    empty: string;
    quotesCount: string;
  };
  focus: {
    loading: string;
    notFound: string;
    backHome: string;
    prev: string;
    next: string;
    viewSource: string;
    browseAuthor: string;
  };
  form: {
    dialogLabel: string;
    addTitle: string;
    editTitle: string;
    text: string;
    textPlaceholder: string;
    author: string;
    authorPlaceholder: string;
    sourceUrl: string;
    existingAuthors: string;
    delete: string;
    cancel: string;
    save: string;
    saving: string;
    confirmDelete: string;
  };
  card: {
    focusRead: string;
    viewSource: string;
    edit: string;
  };
  settings: {
    appearance: string;
    language: string;
    languageDesc: string;
    darkMode: string;
    darkModeDesc: string;
    pets: string;
    petsDesc: string;
    focusGroup: string;
    focusAuto: string;
    focusAutoDesc: string;
    focusAutoLabel: string;
    data: string;
    importDemo: string;
    importDemoDesc: string;
    importDemoBtn: string;
    export: string;
    exportDesc: string;
    exportBtn: string;
    import: string;
    importDesc: string;
    importBtn: string;
    clear: string;
    clearDesc: string;
    clearBtn: string;
    exported: string;
    importDone: string;
    importFailed: string;
    demoDone: string;
    demoFailed: string;
    clearConfirm: string;
    cleared: string;
    nothingToClear: string;
  };
  focusInterval: {
    off: string;
    minutes: string;
  };
  locale: {
    zhHant: string;
    en: string;
    ja: string;
  };
  pet: {
    layerLabel: string;
    clickHint: string;
    lines: string[];
    readLines: string[];
    focusLines: string[];
  };
}