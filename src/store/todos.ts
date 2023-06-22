import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Todo {
  id: string;
  message: string;
  completed: boolean;
}

export type Todos = {
  allIds: string[];
  byId: { [id: string]: Todo };
};

const initialState: Todos = { allIds: [], byId: {} };

const todos = createSlice({
  name: "todos",
  initialState,
  reducers: {
    addTodo: (state, action: PayloadAction<Todo>) => {
      const todo = action.payload;
      state.allIds.push(todo.id);
      state.byId[todo.id] = todo;
    },
    deleteTodo: (state, action: PayloadAction<string>) => {
      state.allIds = state.allIds.filter((id) => id !== action.payload);
      delete state.byId[action.payload];
    },
    completeTodo: (state, action: PayloadAction<string>) => {
      state.byId[action.payload].completed = true;
    },
    sort: (state) => {
      state.allIds.sort((a, b) =>
        state.byId[a].message.localeCompare(state.byId[b].message)
      );
    }
  }
});

export default todos;
