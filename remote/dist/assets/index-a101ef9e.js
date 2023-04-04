import { importShared } from './__federation_fn_import.js';
import { j as jsxs, a as jsx, Button } from './__federation_expose_Button-859a9b0c.js';
import { r as reactDomExports } from './index-938c67f9.js';
import useCount from './__federation_expose_Store-637648aa.js';

var client = {};

var m = reactDomExports;
{
  client.createRoot = m.createRoot;
  client.hydrateRoot = m.hydrateRoot;
}

const App$1 = '';

function App() {
  const [count, setCount] = useCount();
  return /* @__PURE__ */ jsxs("div", { className: "App", children: [
    /* @__PURE__ */ jsx("h1", { children: "Remote Application" }),
    /* @__PURE__ */ jsx(Button, {}),
    /* @__PURE__ */ jsx("div", { className: "card", children: /* @__PURE__ */ jsxs("button", { onClick: () => setCount((count2) => count2 + 1), children: [
      "count is ",
      count
    ] }) })
  ] });
}

const index = '';

const React = await importShared('react');
client.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsx(React.StrictMode, { children: /* @__PURE__ */ jsx(App, {}) })
);
