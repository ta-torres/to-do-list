const createProject = (name) => {
    return {
        name,
        todos: [],

        addTodo(todo) {
            this.todos.push(todo);
        },
        removeTodo(todoTitle) {
            this.todos = this.todos.filter(todo => todo.title !== todoTitle);
        },
        getTodos() {
            return this.todos;
        },
    };
};

export { createProject };