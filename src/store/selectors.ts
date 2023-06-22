import { combineSelectors, selectArgument, selectRoot } from "./combineSelectors";

const selectTodos = combineSelectors(
  [selectRoot] as const,
  (state) => state.todos,
)

const selectTodo = combineSelectors(
  [selectTodos, selectArgument("todoId")<string>] as const,
  (todos, todoId) => todos.byId[todoId],
)

export const selectTodoIds = combineSelectors(
  [selectTodos] as const,
  (todos) => todos.allIds,
)

export const selectTodoMessage = combineSelectors(
  [selectTodo] as const,
  (todo) => todo.message,
)

export const selectIsTodoCompleted = combineSelectors(
  [selectTodo] as const,
  (todo) => todo.completed,
)

// Example of derived data, computes an array of strings
export const selectIncompleteTodoMessages = combineSelectors(
  [selectTodos] as const,
  (todos) => todos.allIds.flatMap(todoId => {
    const {completed, message} = todos.byId[todoId];
    if (completed) {
      return [];
    } else {
      return [message];
    }
  }),
  {shallowEquality: true},
)
