import { COLLAB_CONFIG } from "../config.js";

const MONACO_BASE_URL = "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs";

let monacoReadyPromise = null;

function loadMonaco() {
  if (monacoReadyPromise) {
    return monacoReadyPromise;
  }

  monacoReadyPromise = new Promise((resolve, reject) => {
    if (window.monaco) {
      resolve(window.monaco);
      return;
    }

    const loader = window.require || window.requirejs;
    if (!loader) {
      reject(new Error("Monaco loader not found"));
      return;
    }

    loader.config({ paths: { vs: MONACO_BASE_URL } });
    loader(["vs/editor/editor.main"], () => {
      resolve(window.monaco);
    }, reject);
  });

  return monacoReadyPromise;
}

export async function initializeEditor(container) {
  const monaco = await loadMonaco();

  const model = monaco.editor.createModel(
    COLLAB_CONFIG.defaultContent,
    COLLAB_CONFIG.defaultLanguage
  );

  const instance = monaco.editor.create(container, {
    model,
    language: COLLAB_CONFIG.defaultLanguage,
    theme: "vs-dark",
    automaticLayout: true,
    minimap: { enabled: true },
    fontSize: 14,
    scrollBeyondLastLine: false,
    wordWrap: "on",
    scrollbar: {
      horizontal: "hidden",
    },
  });

  return { instance, monaco, model };
}

export function setEditorLanguage(editorContext, language) {
  try {
    const { monaco, model } = editorContext;
    if (!monaco || !model) return false;
    monaco.editor.setModelLanguage(model, language);
    return true;
  } catch (e) {
    console.error('Failed to set language', e);
    return false;
  }
}
