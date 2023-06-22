import React, { useState } from "react";
import { useDispatch } from "react-redux";
import todos from "../store/todos";
import { AppDispatch } from "../store/store";

const TodoInput: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const [inputValue, setInputValue] = useState("");

  return (
    <form
      className="todoInput"
      onSubmit={(event) => {
        event.preventDefault();
        dispatch(
          todos.actions.addTodo({
            id: crypto.randomUUID(),
            message: inputValue,
            completed: false
          })
        );
        setInputValue("");
      }}
    >
      <label htmlFor="todo-input">Enter Todo Here</label>
      <input
        id="todo-input"
        value={inputValue}
        onChange={(event) => setInputValue(event.currentTarget.value)}
      />
      <button type="submit">Add Todo</button>
    </form>
  );
};

export default TodoInput;
