import React from 'react';
import ReactDOM from 'react-dom/client';
import { sitePath } from './lib/site';
import { SafChessboardShortcut } from './features/SafChessboardShortcut';

const root = ReactDOM.createRoot(document.getElementById('root')!);

if (sitePath().replace(/\/$/, '') === '/sandbox/zems-tour') {
  import('./sandbox/ZemsTour').then(({ default: ZemsTour }) => {
    root.render(<React.StrictMode><ZemsTour /><SafChessboardShortcut standalone /></React.StrictMode>);
  });
} else if (sitePath().replace(/\/$/, '') === '/sandbox/greybox-tour') {
  import('./sandbox/GreyboxTour').then(({ default: GreyboxTour }) => {
    root.render(<React.StrictMode><GreyboxTour /><SafChessboardShortcut standalone /></React.StrictMode>);
  });
} else {
  import('./App').then(({ default: App }) => {
    root.render(<React.StrictMode><App /></React.StrictMode>);
  });
}
