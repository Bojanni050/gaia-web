import React from 'react';
// Order matters: gaia/styles.css is the shared base design language (ported
// 1:1 with gaia-desktop, no responsive rules of its own); App.css is this
// web client's own responsive layer on top, including the @media
// (max-width: 900px) mobile drawer/grid overrides. Both files declare an
// unconditional `.gaia-shell { grid-template-columns: ... }` at equal
// specificity, so whichever loads LAST wins the cascade tie — with the
// import order reversed, gaia/styles.css's unconditional rule was loading
// after App.css's media query and always winning, even on mobile, which
// squeezed the entire app into a 264px-wide column with the rest of the
// screen left blank.
import './gaia/styles.css';
import './App.css';
import GaiaDesktop from './gaia/GaiaDesktop';

function App() {
  return <GaiaDesktop />;
}

export default App;
