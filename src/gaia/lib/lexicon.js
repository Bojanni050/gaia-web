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
    retract: 'Dit klopt niet',
    retractHint: 'Wijs in mijn antwoord de zin aan die niet klopt — dan staat die hieronder alvast klaar. Zeg er gerust bij wat wél waar is.',
    retractQuoteLabel: 'Wat er niet klopt',
    retractCorrectionLabel: 'Wat wél waar is (mag leeg blijven)',
    retractSend: 'Terugnemen',
    retractCancel: 'Annuleren',
    retractWorking: 'Terugnemen…',
    retractFailed: 'Dat kon ik nu niet terugnemen. Probeer het straks opnieuw.',
    retractPick: 'Welke van deze bedoel je?',

    // Research in the background (work Gaia put out at Hermes)
    researchRunningOne: 'Er loopt een onderzoek op de achtergrond.',
    researchRunningMany: 'Er lopen {count} onderzoeken op de achtergrond.',
    researchElsewhere: 'Een onderzoek is klaar in een ander gesprek.',
    researchQuestionTitle: 'Een onderzoek wacht op je beslissing.',
    researchAnswerFailed: 'De beslissing kon niet worden doorgegeven.',
    researchChoice_once: 'Eenmalig',
    researchChoice_session: 'Deze sessie',
    researchChoice_always: 'Altijd',
    researchChoice_deny: 'Weigeren',
    
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
    cognitionWaiting: 'Wachten op een volgende ronde: {n}',
    // De drie lijsten van dit blok. De tablabels staan hier apart van
    // cognitionConfirmed en cognitionReopen: de tab en het label op een kaart
    // heten hetzelfde, maar ze zijn niet hetzelfde ding.
    cognitionTabReview: 'Te beoordelen',
    cognitionTabConfirmed: 'Bevestigd',
    cognitionTabReopen: 'Heroverwegen',
    cognitionConfirmedEmpty: 'Je hebt nog niets bevestigd.',
    cognitionReopenEmpty: 'Je hebt nog niets losgelaten.',
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
    cognitionStatusExpired: 'verlopen',
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

    // Kairos — episodes (interpretation first, observations on request)
    logos: 'Tijdlijn',
    logosHint:
      'Wat ik in je activiteit herkende, als episodes. Wat je leest is een interpretatie — het bewijs zit eronder, op verzoek.',
    logosEmpty: 'Ik heb nog geen episode herkend.',
    logosLoading: 'Episodes laden…',
    logosLoadFailed: 'Ik kon de episodes niet ophalen.',
    logosClose: 'Sluiten',
    logosEpisodeBadge: 'Episode / Interpretatie',
    logosBadgeHint: 'Dit leidde ik af uit de observaties hieronder — het is geen letterlijk feit.',
    logosContext: 'Betrokken context',
    logosEvidenceToggle: 'Bekijk ruwe bewijslast',
    logosCaptures: 'captures',
    logosCapture: 'capture',
    logosEvidenceEmpty: 'Geen ruwe observaties gevonden.',
    logosEvidenceFailed: 'De ruwe bewijslast kon niet worden opgehaald.',
    logosRawObservations: 'Ruwe observaties',
    logosRawNote: 'Rechtstreeks vastgelegd door capture-rs — niet door mij geschreven.',
    logosOcr: 'OCR',
    logosAskGaia: 'Vraag hierover door',
    logosLive: 'Live',
    logosConnecting: 'Verbinden…',
    logosOffline: 'Offline',

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
    stop: 'Stoppen',

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
    retract: 'That is not right',
    retractHint: 'Point at the sentence in my reply that is not right — it will be here ready for you. Say what is true instead if you like.',
    retractQuoteLabel: 'What is not right',
    retractCorrectionLabel: 'What is true instead (can stay empty)',
    retractSend: 'Take it back',
    retractCancel: 'Cancel',
    retractWorking: 'Taking it back…',
    retractFailed: 'I could not take that back just now. Try again in a moment.',
    retractPick: 'Which of these do you mean?',

    // Research in the background (work Gaia put out at Hermes)
    researchRunningOne: 'A research task is running in the background.',
    researchRunningMany: '{count} research tasks are running in the background.',
    researchElsewhere: 'A research task finished in another conversation.',
    researchQuestionTitle: 'A research task is waiting for your decision.',
    researchAnswerFailed: 'The decision could not be passed on.',
    researchChoice_once: 'Once',
    researchChoice_session: 'This session',
    researchChoice_always: 'Always',
    researchChoice_deny: 'Deny',

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
    cognitionWaiting: 'Waiting for a later round: {n}',
    cognitionTabReview: 'To review',
    cognitionTabConfirmed: 'Confirmed',
    cognitionTabReopen: 'Reconsider',
    cognitionConfirmedEmpty: 'You have confirmed nothing yet.',
    cognitionReopenEmpty: 'You have let nothing go yet.',
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
    cognitionStatusExpired: 'lapsed',
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

    // Kairos — episodes (interpretation first, observations on request)
    logos: 'Timeline',
    logosHint:
      'What I recognised in your activity, as episodes. What you read is an interpretation — the evidence is underneath, on request.',
    logosEmpty: 'I have not recognised an episode yet.',
    logosLoading: 'Loading episodes…',
    logosLoadFailed: 'I could not fetch the episodes.',
    logosClose: 'Close',
    logosEpisodeBadge: 'Episode / Interpretation',
    logosBadgeHint: 'I inferred this from the observations below — it is not a literal fact.',
    logosContext: 'Involved context',
    logosEvidenceToggle: 'View raw evidence',
    logosCaptures: 'captures',
    logosCapture: 'capture',
    logosEvidenceEmpty: 'No raw observations found.',
    logosEvidenceFailed: 'Could not fetch the raw evidence.',
    logosRawObservations: 'Raw observations',
    logosRawNote: 'Recorded directly by capture-rs — not written by me.',
    logosOcr: 'OCR',
    logosAskGaia: 'Ask about this',
    logosLive: 'Live',
    logosConnecting: 'Connecting…',
    logosOffline: 'Offline',

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
    stop: 'Stop',

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
