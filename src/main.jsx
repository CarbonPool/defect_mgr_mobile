import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { unstableSetRender } from 'antd-mobile'
import App from './App.jsx'
import './i18n'
import i18n from './i18n'
import LocaleConfig from './components/LocaleConfig.jsx'
import './index.css'

unstableSetRender((node, container) => {
  container._reactRoot ||= createRoot(container);
  const root = container._reactRoot;
  root.render(node);
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    root.unmount();
  };
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <LocaleConfig>
        <HashRouter>
          <App />
        </HashRouter>
      </LocaleConfig>
    </I18nextProvider>
  </StrictMode>,
)
