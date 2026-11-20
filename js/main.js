/**
 * Point d'entrée du portfolio.
 *
 * Initialise les modules dans l'ordre où ils dépendent les uns des autres :
 *   1. traductions, puis icônes et coordonnées injectées dans le balisage
 *   2. thème (préparé par l'expérience mémorisée, pour éviter tout flash)
 *   3. interface : en-tête, panneau de personnalisation, infobulles
 *   4. expériences et visite guidée, mascotte
 *   5. effets décoratifs
 *
 * Aucun module ne s'initialise tout seul à l'import : tout part d'ici.
 */
import Lang from './core/Lang.js';
import languages from '../languages/index.js';

import Icon from './components/Icon.js';
import Flag from './components/Flag.js';
import './components/icons/ui.js';
import './components/icons/brands.js';
import Tooltip from './components/Tooltip.js';
import Reveal from './components/Reveal.js';

import Theme from './features/theme/Theme.js';
import ThemePanel from './features/theme-panel/ThemePanel.js';
import Header from './features/header/Header.js';
import Contact from './features/contact/Contact.js';
import ContactForm from './features/contact/ContactForm.js';
import Experience from './features/experience/Experience.js';
import Tour from './features/tour/Tour.js';
import Mascot from './features/mascot/Mascot.js';
import OrientationHint from './features/orientation/OrientationHint.js';
import Toc from './features/toc/Toc.js';

import Particles from './effects/particles/Particles.js';
import LauncherFx from './effects/LauncherFx.js';
import ProjectFlow from './effects/project-flow/ProjectFlow.js';

/* 1. Contenu : langue, icônes, coordonnées protégées */
Lang.register(languages);
Lang.init();
Icon.hydrate();
Flag.hydrate();
Contact.hydrate();
/* CV dans la langue affichée : liens remis à jour au changement de langue */
Lang.onChange(() => Contact.hydrate());
ContactForm.init();

/* 2. Thème : le préréglage de l'expérience sert de base avant la lecture des réglages */
Experience.prepareTheme();
Theme.init();

/* 3. Interface commune */
Header.init();
ThemePanel.init();
Tooltip.init();
Reveal.init();

/* 4. Expériences, visite guidée et mascotte */
Tour.init();
Experience.init();
Mascot.init();
OrientationHint.init();
Toc.init();

/* 5. Effets décoratifs */
LauncherFx.init();
ProjectFlow.init();

/* Poignée de débogage (console et tests automatisés) : lecture seule,
   aucun module ne s'en sert */
window.PB = Object.freeze({ Lang, Theme, ThemePanel, Experience, Tour, Mascot, Particles, Contact });
