import * as React from "react";
import cn from "classnames";
import { useSelector, useDispatch } from "react-redux";
import todoSlice from "../store/todos";
import { selectIsTodoCompleted, selectTodoMessage } from "../store/selectors";

const Todo = ({ todoId }: { todoId: string }) => {
  const dispatch = useDispatch();
  const message = useSelector(selectTodoMessage({ todoId }));
  const isCompleted = useSelector(selectIsTodoCompleted({ todoId }));
  return (
    <div
      key={todoId}
      className={cn("todo", {
        completeTodo: isCompleted
      })}
    >
      <input
        className="todoCheck"
        type="checkbox"
        checked={isCompleted}
        onChange={() => dispatch(todoSlice.actions.completeTodo(todoId))}
      />
      <span className="todoMessage">{message}</span>
      <button
        type="button"
        className="todoDelete"
        onClick={() => dispatch(todoSlice.actions.deleteTodo(todoId))}
      >
        X
      </button>
    </div>
  );
};

export default Todo;
