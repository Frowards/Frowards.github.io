# Portfolio - Pierre Bernard-Darmann

Portfolio personnel : une page de présentation qui se vit de quatre façons
(Classique, Rétro, Spatial, Gamer), en visite guidée ou libre, en clair ou
en sombre (avec un mode daltonien), et une mascotte interactive.

**Aucune dépendance, aucun outil de build** : HTML, CSS et JavaScript natifs
(modules ES). Le code est organisé en composants, sur le modèle de Ceres,
l'ERP web dont je conçois l'interface.

## Lancer en local

Les modules ES ne se chargent pas depuis un fichier ouvert en double-clic
(`file://`) : il faut un petit serveur local.

- Windows : double-cliquer sur `lancer-en-local.cmd`
- ou, dans ce dossier : `python -m http.server 8000` puis http://localhost:8000

En ligne, le site est servi tel quel par GitHub Pages.

## Arborescence

```
index.html                  balisage sémantique de la page (contenu, aucune logique)
assets/
  img/                      photo, logos
  sprites/                  planches de la mascotte et du dragon
css/
  main.css                  point d'entrée : importe toutes les feuilles dans l'ordre
  base/                     jetons (variables), remise à zéro, typographie, mise en page
  themes/                   palettes sombre / claire
  components/               briques réutilisables (bouton, carte, pastille, infobulle...)
  sections/                 une feuille par section de la page (héros, Ceres, parcours...)
  features/<fonction>/      styles propres à une fonctionnalité (visite, mascotte...)
  animations/               images clés partagées
js/
  boot/anti-flash.js        script classique du <head> : applique le thème avant l'affichage
  main.js                   point d'entrée : initialise les modules dans l'ordre
  core/                     socle : Lang (i18n), Storage, Events (bus)
  utils/                    fonctions pures partagées (DOM, animation)
  components/               composants d'interface génériques (Icon, Flag, Tooltip,
                            Reveal, SegmentedControl, Toast) et registres d'icônes
  features/<fonction>/      fonctionnalités : theme, theme-panel (options d'affichage),
                            experience, tour, toc (sommaire), mascot, contact,
                            header, orientation
  effects/                  effets visuels sur canvas (particules, fluide WebGL...)
languages/
  index.js                  assemble les dictionnaires
  <domaine>/fr.js, en.js    une paire de dictionnaires par domaine
```

## Conventions

- **Un module = une responsabilité.** Un fichier exporte un objet ou une classe
  (`export default`), nommé comme le fichier en PascalCase (`ThemePanel.js`) ;
  les fichiers de données ou de fonctions pures sont en minuscules
  (`presets.js`, `dom.js`). Au-delà de ~400 lignes, un module se découpe en
  modules frères dans son dossier.
- **Aucune variable globale.** Les dépendances passent par `import`. Les modules
  qui n'ont pas à se connaître communiquent par le bus `Events`
  (`lang:change`, `theme:change`, `experience:change`, `tour:step`...).
- **Aucun texte en dur** : tout passe par `Lang` (`data-i18n` dans le HTML,
  `t('CLE')` en JS), clé en français ET en anglais.
- **Aucune icône recopiée** : `Icon.svg('nom')` en JS, `<svg data-icon="nom">`
  en HTML ; chaque domaine enregistre ses icônes dans son registre.
- **Aucun accès direct au localStorage** : `Storage` et ses clés `KEYS`.
- **Couleurs et tailles** : jetons CSS (`--pb-*`) déclarés dans `css/base` et
  `css/themes`, jamais de valeur en dur dans un composant.
- **Accessibilité** : navigation clavier, `aria-*` à jour, `prefers-reduced-motion`
  respecté par chaque animation (`prefersReducedMotion()`).
- **Typographie** : tiret simple `-` uniquement ; en français, espace insécable
  avant `: ! ?`.

## Contrats entre modules

| Module | Rôle | API publique |
|---|---|---|
| `core/Lang.js` | traductions | `init()`, `t(cle, params)`, `set(lang)`, `toggle()`, `translate(root)`, `onChange(fn)`, `lang` |
| `core/Storage.js` | localStorage sûr | `get`, `set`, `getJSON`, `setJSON`, `remove`, `KEYS` |
| `core/Events.js` | bus d'événements | `on(nom, fn)` (renvoie le désabonnement), `off`, `emit(nom, detail)` |
| `components/Icon.js` | icônes SVG | `register(map, famille)`, `svg(nom, classe)`, `hydrate(root)` |
| `features/theme/Theme.js` | thème de l'expérience, mode clair / sombre, mode daltonien | `init`, `set({ mode, cvd })`, `effectiveMode`, `applyPreset`, `setBase`, `config` |
| `features/theme-panel/ThemePanel.js` | options d'affichage (mascotte, mode daltonien) | `init`, `open`, `close` |
| `features/toc/Toc.js` | sommaire flottant, déplaçable | `init` |
| `features/experience/Experience.js` | écran d'accueil et expériences | `prepareTheme`, `init`, `open`, `set(exp, mode)`, `setTour`, `refresh`, `current` |
| `features/tour/Tour.js` | visite guidée | `init`, `enable(etape)`, `disable`, `go(n)`, `syncExp`, `setZone`, `warp`, `resumeScroll`, `savedStep`, `active`, `index`, `count` |
| `features/mascot/Mascot.js` | mascotte | `init`, `show`, `hide`, `open` |
| `components/Toast.js` | notifications | `show(titre, texte, { variant, exclusive })` |
| `features/contact/Contact.js` | coordonnées protégées des robots | `mail`, `tel`, `telShown`, `hydrate(root)` |
| `effects/particles/Particles.js` | fonds animés | `setEffect`, `setParams`, `param`, `current`... |
| `effects/fluid/Fluid.js` | fluide WebGL | `start(canvas, options)`, `stop`, `setOptions`, `supported` |

## Vérification

Chaque modification est contrôlée avec Playwright : 6 formats d'écran
(du petit téléphone au grand écran), 4 expériences, clair et sombre, visite
guidée et libre ; aucun débordement horizontal, aucune erreur JavaScript.
