import * as React from "react";
import { useSelector, useDispatch } from "react-redux";
import todoSlice from "../store/todos";
import {
  selectIncompleteTodoMessages,
  selectTodoIds
} from "../store/selectors";
import Todo from "./Todo";

const TodoList: React.FC = () => {
  const dispatch = useDispatch();
  const todoIds = useSelector(selectTodoIds({}));
  const incompleteTodos = useSelector(selectIncompleteTodoMessages({}));
  return (
    <div className="todoList">
      {todoIds.map((todoId) => (
        <Todo key={todoId} todoId={todoId} />
      ))}
      <button onClick={() => dispatch(todoSlice.actions.sort())}>
        Sort 'em!
      </button>
      <div>(incompleteTodos: {incompleteTodos.join(", ")})</div>
    </div>
  );
};

export default TodoList;
