import * as React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import store from "./store/store";
import TodoList from "./components/TodoList";
import TodoInput from "./components/TodoInput";

import "./styles.css";

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <h2>A simple todo list app to experiment with Redux Toolkit</h2>
        <TodoInput />
        <TodoList />
      </div>
    </Provider>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
