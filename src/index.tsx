import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { isFirebaseWebConfigPresent } from './config/firebaseEnv';
import { FirebaseConfigMissing } from './components/Common/FirebaseConfigMissing';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

if (!isFirebaseWebConfigPresent()) {
  root.render(
    <React.StrictMode>
      <FirebaseConfigMissing />
    </React.StrictMode>
  );
} else {
  void import('./App').then(({ default: App }) => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    void import('./reportWebVitals').then(({ default: reportWebVitals }) => {
      reportWebVitals();
    });
  });
}
