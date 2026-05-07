import { renderToString } from 'react-dom/server';
import { App } from './App.jsx';

export function renderApp() {
  return renderToString(<App />);
}
