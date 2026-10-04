/**
 * Gaia's lexicon — her own quiet language, kept in one place so it can evolve.
 * Supports multiple languages with Dutch as the default.
 * Ported from Gaia Desktop to ensure both clients speak with one voice.
 */
export const LANGUAGES = {
  nl: {
    // Conversation
    newPage: 'Nieuw gesprek',
    untitled: 'Naamloos gesprek',
    
    // Composer and dropzone
    composerPlaceholder: 'Zeg wat je wilt, of denk hardop…',
    dropOverlay: 'Sleep bestanden hierheen om bij te voegen',

    // Conversation actions and status
    healthWhisper: 'Ik kan mijn denkmotor momenteel niet bereiken. Neem je tijd — ik ben er als je klaar bent om het opnieuw te proberen.',
    retry: 'Opnieuw proberen',
    
    // Sidebar footer
    footLine1: 'Een levenslange persoonlijke intelligentie,',
    footLine2: 'die groeit door begrip.',

    // Mobile navigation
    openMenu: 'Menu openen',
    closeMenu: 'Menu sluiten',

    // Presence words
    thinking: 'denken',
    speaking: 'spreken',
    listening: 'luisteren',

    // Library
    library: 'Bibliotheek',
    libraryTitle: 'Bibliotheek',
    libraryHint: 'Bestanden die je aan Gaia geeft, bewaard in Gaia Cloud — niet alleen op dit apparaat.',
    libraryUpload: 'Bestand toevoegen',
    libraryUploading: 'Toevoegen…',
    libraryUploadFailed: 'Toevoegen is niet gelukt. Probeer het opnieuw.',
    libraryDownload: 'Downloaden',
    libraryDownloadFailed: 'Downloaden is niet gelukt.',
    libraryDelete: 'Verwijderen',
    libraryDeleteFailed: 'Verwijderen is niet gelukt.',
    libraryEmpty: 'Nog geen bestanden.',
    composerAttach: 'Bestand toevoegen als context',

    // History
    history: 'Geschiedenis',
    historyTitle: 'Geschiedenis',
    historyHint: 'Gesprekken die Gaia Cloud heeft bewaard, over al je sessies heen — niet alleen deze.',
    historyEmpty: 'Nog geen bewaarde gesprekken.',
    historyMessages: 'berichten',
    historyOpenFailed: 'Dit gesprek kon niet worden geopend.',
    historyDelete: 'Verwijderen',
    historyDeleteFailed: 'Verwijderen is niet gelukt.',
    historyExport: 'Exporteren',
    historyExportFailed: 'Exporteren is niet gelukt.',

    // Cognition review (human Absolute Override)
    cognition: 'Begrip',
    cognitionTitle: 'Wat ik begrijp',
    cognitionHint: 'Wat ik meen op te merken, wacht op jouw oordeel. Jij bevestigt — ik niet.',
    cognitionEmpty: 'Er wacht nu niets op je oordeel.',
    cognitionLoading: 'Laden…',
    cognitionLoadFailed: 'Dit kon ik niet ophalen.',
    cognitionConfirm: 'Bevestigen',
    cognitionReject: 'Loslaten',
    cognitionTesting: 'Onderzoeken',
    cognitionConfirmed: 'Bevestigd',
    cognitionRejected: 'Losgelaten',
    cognitionActionFailed: 'Dit is niet gelukt. Probeer het opnieuw.',
    cognitionStatusProposed: 'voorgesteld',
    cognitionStatusTesting: 'in onderzoek',
    cognitionStatusCorroborated: 'bevestigd door herhaling',
    cognitionStatusConfirmed: 'bevestigd',
    cognitionStatusRejected: 'losgelaten',
    cognitionScopeMicro: 'micro',
    cognitionScopeMacro: 'wezenlijk',
    cognitionCounterHypothesis: 'Tegenhypothese',
    cognitionCounterHint: 'De tegenwerping die ik tegenhield — geen feit, alleen voor jouw oordeel.',
    cognitionShowCounter: 'Bekijk de tegenhypothese',
    cognitionHideCounter: 'Verberg de tegenhypothese',
    cognitionCounterMissing: 'Nog geen tegenhypothese — bevestigen kan pas zodra die er is.',
    cognitionEvidence: 'Bewijs',
    cognitionEvidenceFor: 'voor',
    cognitionEvidenceAgainst: 'tegen',
    cognitionNoEvidence: 'Nog geen bewijs gekoppeld.',
    cognitionMacroNote: 'Dit raakt iets wezenlijks. Bevestigen vraagt een bewuste afweging.',
    cognitionImplicationPrompt: 'Wat betekent bevestigen hier?',
    cognitionImplicationEstablish: 'Ik stel deze stelling vast, zoals hierboven.',
    cognitionImplicationCounter: 'Ik stel de tegenhypothese vast.',
    cognitionImplicationSoft: 'Ik geef alleen het vertrouwen een zetje.',
    cognitionImplicationPickCorrect: 'Kies eerst wat vaststellen hier betekent.',
    cognitionNuance: 'Nuanceren',
    cognitionNuanceHint: 'Herschrijf de stelling zoals jij het bedoelt (optioneel).',
    cognitionNuancePlaceholder: 'Jouw formulering…',
    cognitionReopen: 'Heroverwegen',
    cognitionReopenHint: 'Je hebt dit losgelaten. Wil je het toch weer in onderzoek nemen? Zeg waarom.',
    cognitionReopenPlaceholder: 'Waarom heroverwegen?',
    cognitionReopenRequired: 'Een reden is verplicht om te heroverwegen.',

    // Settings
    settings: 'Instellingen',
    settingsTitle: 'Instellingen',
    settingsCloud: 'Gaia Cloud',
    settingsServerUrl: 'Server-URL',
    settingsAuthToken: 'Authenticatietoken',
    settingsTest: 'Verbinding testen',
    settingsTesting: 'Testen…',
    settingsBehaviour: 'Gedrag',
    settingsNotifications: 'Notificaties',
    settingsQuiet: 'Stille aanwezigheid (niet storen)',
    settingsCapabilities: 'Lokale mogelijkheden',
    settingsMicrophone: 'Microfoon',
    settingsCaptureSources: 'Capturebronnen',
    settingsCaptureNone: 'nog geen geregistreerd',
    settingsSave: 'Bewaren',
    settingsSaving: 'Behouden…',
    settingsSaved: 'Bewaard',
    settingsClose: 'Sluiten',
    deleteConversation: 'Gesprek verwijderen',
    send: 'Versturen',

    // Turn failure phrases
    turnNoServer: 'Gaia is nog niet verbonden met haar server. Je kunt er een toevoegen in de instellingen.',
    turnUnreachable: 'Gaia is nu even niet te bereiken.',
    turnCapture: 'Dit apparaat kon dat niet vastleggen.',
    turnFallback: 'Er ging hier iets mis. Je bericht staat er nog.',
    
    // Thought process
    thoughtProcess: 'Gedachtegang',

    // About
    aboutTitle: 'Over Gaia',
    aboutCloud: 'Cloud',
    aboutDesktop: 'Web',
    aboutBuild: 'build',
    aboutVersion: 'Versie',
    aboutUnavailable: 'niet beschikbaar',
    aboutConnected: 'verbonden',
    aboutClose: 'Sluiten',
  },
  en: {
    // Conversation
    newPage: 'New conversation',
    untitled: 'Untitled conversation',
    
    // Composer and dropzone
    composerPlaceholder: 'Say anything, or just think out loud…',
    dropOverlay: 'Drop files to attach',

    // Conversation actions and status
    healthWhisper: "I can't reach my reason engine right now. Take your time — I'm here when you're ready to try again.",
    retry: 'Retry',

    // Sidebar footer
    footLine1: 'A lifelong personal intelligence,',
    footLine2: 'growing through understanding.',

    // Mobile navigation
    openMenu: 'Open menu',
    closeMenu: 'Close menu',

    // Presence words
    thinking: 'thinking',
    speaking: 'speaking',
    listening: 'listening',

    // Library
    library: 'Library',
    libraryTitle: 'Library',
    libraryHint: 'Files you give Gaia, stored in Gaia Cloud — not just on this device.',
    libraryUpload: 'Add file',
    libraryUploading: 'Adding…',
    libraryUploadFailed: 'Could not add the file. Please try again.',
    libraryDownload: 'Download',
    libraryDownloadFailed: 'Could not download the file.',
    libraryDelete: 'Delete',
    libraryDeleteFailed: 'Could not delete the file.',
    libraryEmpty: 'No files yet.',
    composerAttach: 'Attach a file as context',

    // History
    history: 'History',
    historyTitle: 'History',
    historyHint: 'Conversations Gaia Cloud has saved, across every past session — not just this one.',
    historyEmpty: 'No saved conversations yet.',
    historyMessages: 'messages',
    historyOpenFailed: 'Could not open this conversation.',
    historyDelete: 'Delete',
    historyDeleteFailed: 'Could not delete this conversation.',
    historyExport: 'Export',
    historyExportFailed: 'Could not export this conversation.',

    // Cognition review (human Absolute Override)
    cognition: 'Understanding',
    cognitionTitle: 'What I understand',
    cognitionHint: 'What I think I notice, waiting for your judgement. You confirm — I do not.',
    cognitionEmpty: 'Nothing is awaiting your judgement right now.',
    cognitionLoading: 'Loading…',
    cognitionLoadFailed: 'Could not fetch this.',
    cognitionConfirm: 'Confirm',
    cognitionReject: 'Let go',
    cognitionTesting: 'Examine',
    cognitionConfirmed: 'Confirmed',
    cognitionRejected: 'Let go',
    cognitionActionFailed: 'That did not work. Please try again.',
    cognitionStatusProposed: 'proposed',
    cognitionStatusTesting: 'under examination',
    cognitionStatusCorroborated: 'corroborated',
    cognitionStatusConfirmed: 'confirmed',
    cognitionStatusRejected: 'let go',
    cognitionScopeMicro: 'micro',
    cognitionScopeMacro: 'high-impact',
    cognitionCounterHypothesis: 'Counter-hypothesis',
    cognitionCounterHint: 'The objection I held back — not a fact, only for your judgement.',
    cognitionShowCounter: 'View the counter-hypothesis',
    cognitionHideCounter: 'Hide the counter-hypothesis',
    cognitionCounterMissing: 'No counter-hypothesis yet — confirmation is only possible once there is one.',
    cognitionEvidence: 'Evidence',
    cognitionEvidenceFor: 'for',
    cognitionEvidenceAgainst: 'against',
    cognitionNoEvidence: 'No evidence linked yet.',
    cognitionMacroNote: 'This touches something high-impact. Confirming asks for a deliberate weighing.',
    cognitionImplicationPrompt: 'What does confirming mean here?',
    cognitionImplicationEstablish: 'I settle this statement, as written above.',
    cognitionImplicationCounter: 'I settle the counter-hypothesis.',
    cognitionImplicationSoft: 'I only nudge the confidence.',
    cognitionImplicationPickCorrect: 'First choose what settling means here.',
    cognitionNuance: 'Nuance',
    cognitionNuanceHint: 'Rewrite the statement the way you mean it (optional).',
    cognitionNuancePlaceholder: 'Your wording…',
    cognitionReopen: 'Reconsider',
    cognitionReopenHint: 'You let this go. Take it back under examination? State why.',
    cognitionReopenPlaceholder: 'Why reconsider?',
    cognitionReopenRequired: 'A reason is required to reconsider.',

    // Settings
    settings: 'Settings',
    settingsTitle: 'Settings',
    settingsCloud: 'Gaia Cloud',
    settingsServerUrl: 'Server URL',
    settingsAuthToken: 'Auth token',
    settingsTest: 'Test connection',
    settingsTesting: 'Testing…',
    settingsBehaviour: 'Behaviour',
    settingsNotifications: 'Notifications',
    settingsQuiet: 'Quiet presence (do not disturb)',
    settingsCapabilities: 'Local capabilities',
    settingsMicrophone: 'Microphone',
    settingsCaptureSources: 'Capture sources',
    settingsCaptureNone: 'none registered yet',
    settingsSave: 'Save',
    settingsSaving: 'Saving…',
    settingsSaved: 'Saved',
    settingsClose: 'Close',
    deleteConversation: 'Delete conversation',
    send: 'Send',

    // Turn failure phrases
    turnNoServer: 'Gaia is not connected to her server yet. You can add one in settings.',
    turnUnreachable: 'Gaia cannot be reached right now.',
    turnCapture: 'This device could not capture that.',
    turnFallback: 'Something went wrong on this side. Your message is still here.',
    
    // Thought process
    thoughtProcess: 'Thought process',

    // About
    aboutTitle: 'About Gaia',
    aboutCloud: 'Cloud',
    aboutDesktop: 'Web',
    aboutBuild: 'build',
    aboutVersion: 'Version',
    aboutUnavailable: 'unavailable',
    aboutConnected: 'connected',
    aboutClose: 'Close',
  }
};

const defaultLang = 'nl';

export const L = new Proxy(
  {},
  {
    get(target, prop) {
      const currentLang = localStorage.getItem('gaia.lang') || defaultLang;
      const langData = LANGUAGES[currentLang] || LANGUAGES[defaultLang];
      return langData[prop] || LANGUAGES.en[prop] || prop;
    },
  }
);

export const DOMAIN_LABEL = new Proxy(
  {},
  {
    get(target, prop) {
      const currentLang = localStorage.getItem('gaia.lang') || defaultLang;
      const langData = LANGUAGES[currentLang] || LANGUAGES[defaultLang];
      return langData[prop] || LANGUAGES.en[prop] || prop;
    },
  }
);
