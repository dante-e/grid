import {
  EditorView,
  keymap,
  highlightActiveLine,
  lineNumbers,
  drawSelection,
} from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import {
  indentOnInput,
  bracketMatching,
  syntaxHighlighting,
  defaultHighlightStyle,
  HighlightStyle,
} from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { linter, lintGutter } from '@codemirror/lint';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';

// ─── Dracula theme ────────────────────────────────────────────────────────────
const draculaTheme = EditorView.theme(
  {
    '&':                     { backgroundColor: '#282a36', color: '#f8f8f2', height: '100%' },
    '.cm-content':           { caretColor: '#f8f8f2' },
    '.cm-scroller':          { fontFamily: '"IBM Plex Mono", monospace', fontSize: '11px', overflow: 'auto' },
    '.cm-gutters':           { backgroundColor: '#21222c', borderRight: '1px solid #393c4e', color: '#6272a4' },
    '.cm-activeLineGutter':  { backgroundColor: '#44475a55' },
    '.cm-activeLine':        { backgroundColor: '#44475a22' },
    '.cm-selectionBackground, .cm-focused .cm-selectionBackground, ::selection':
                             { backgroundColor: '#44475a !important' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#f8f8f2' },
    '.cm-matchingBracket':   { outline: '1px solid #f1fa8c44', color: 'inherit' },
    '.cm-lintRange-error':   { backgroundImage: 'none', borderBottom: '1px dashed #ff5555' },
    '.cm-tooltip':           { backgroundColor: '#44475a', border: '1px solid #6272a4', color: '#f8f8f2' },
  },
  { dark: true },
);

// ─── Light theme ─────────────────────────────────────────────────────────────
const lightTheme = EditorView.theme(
  {
    '&':                     { backgroundColor: '#f8f8f8', color: '#333', height: '100%' },
    '.cm-content':           { caretColor: '#333' },
    '.cm-scroller':          { fontFamily: '"IBM Plex Mono", monospace', fontSize: '11px', overflow: 'auto' },
    '.cm-gutters':           { backgroundColor: '#f0f0f0', borderRight: '1px solid #ddd', color: '#aaa' },
    '.cm-activeLineGutter':  { backgroundColor: '#e0e0e0' },
    '.cm-activeLine':        { backgroundColor: '#e8e8e822' },
    '.cm-selectionBackground, .cm-focused .cm-selectionBackground, ::selection':
                             { backgroundColor: '#c8c8c8 !important' },
  },
  { dark: false },
);

// ─── Dracula syntax highlight style ─────────────────────────────────────────
const draculaHighlight = HighlightStyle.define([
  // JSON property keys ("key":)
  { tag: tags.propertyName,           color: '#8be9fd' },
  // String values
  { tag: tags.string,                 color: '#f1fa8c' },
  // Numbers
  { tag: tags.number,                 color: '#bd93f9' },
  // true / false
  { tag: tags.bool,                   color: '#50fa7b' },
  // null
  { tag: tags.null,                   color: '#ff79c6' },
  // Punctuation  {} [] : ,
  { tag: tags.punctuation,            color: '#f8f8f2' },
  { tag: tags.bracket,                color: '#f8f8f2' },
  // Anything else — plain text
  { tag: tags.content,                color: '#f8f8f2' },
]);

const themeCompartment    = new Compartment();
const syntaxCompartment   = new Compartment();
const languageCompartment = new Compartment();
const readOnlyCompartment = new Compartment();

function _jsonLanguageExtensions() {
  return [json(), lintGutter(), linter(jsonParseLinter())];
}

function _xmlLanguageExtensions() {
  return [xml()];
}

function buildExtensions(onChangeCb, theme = 'dark') {
  return [
    history(),
    drawSelection(),
    lineNumbers(),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    syntaxCompartment.of(
      theme === 'dark'
        ? syntaxHighlighting(draculaHighlight)
        : syntaxHighlighting(defaultHighlightStyle, { fallback: true })
    ),
    languageCompartment.of(_jsonLanguageExtensions()),
    readOnlyCompartment.of(EditorState.readOnly.of(false)),
    highlightActiveLine(),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...historyKeymap,
      ...completionKeymap,
      indentWithTab,
    ]),
    themeCompartment.of(theme === 'dark' ? draculaTheme : lightTheme),
    ...(onChangeCb
      ? [EditorView.updateListener.of((u) => { if (u.docChanged) onChangeCb(u.state.doc.toString()); })]
      : []),
  ];
}

// ─── EditorWrapper ────────────────────────────────────────────────────────────
export class EditorWrapper {
  constructor(mountEl, initialValue = '', onChangeCb, theme = 'dark') {
    this._onChangeCb = onChangeCb;
    const state = EditorState.create({
      doc: initialValue,
      extensions: buildExtensions(onChangeCb, theme),
    });
    this._view = new EditorView({ state, parent: mountEl });
  }

  getValue() {
    return this._view.state.doc.toString();
  }

  setValue(value) {
    if (this._view.state.doc.toString() === value) return;
    this._view.dispatch({
      changes: { from: 0, to: this._view.state.doc.length, insert: value },
    });
  }

  setTheme(isDark) {
    this._view.dispatch({
      effects: [
        themeCompartment.reconfigure(isDark ? draculaTheme : lightTheme),
        syntaxCompartment.reconfigure(
          isDark
            ? syntaxHighlighting(draculaHighlight)
            : syntaxHighlighting(defaultHighlightStyle, { fallback: true })
        ),
      ],
    });
  }

  setLanguage(format) {
    this._view.dispatch({
      effects: [
        languageCompartment.reconfigure(
          format === 'xml' ? _xmlLanguageExtensions() : _jsonLanguageExtensions()
        ),
      ],
    });
  }

  setReadOnly(bool) {
    this._view.dispatch({
      effects: [readOnlyCompartment.reconfigure(EditorState.readOnly.of(bool))],
    });
  }

  focus() { this._view.focus(); }

  destroy() { this._view.destroy(); }
}
