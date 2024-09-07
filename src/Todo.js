const createTodo = (title, description, dueDate, priority, checked = false) => {
    return {
        title,
        description,
        dueDate,
        priority,
        checked,
        todoNotes: [],
        checklist: [],

        toggleChecked() {
            this.checked = !this.checked;
        },
        updateTodoDetails(title, description, dueDate, priority) {
            this.title = title;
            this.description = description;
            this.dueDate = dueDate;
            this.priority = priority;
        },
        addTodoNote(note) {
            this.todoNotes.push(note);
        },
        addChecklistItem(item) {
            this.checklist.push(item);
        },
    };
};

export { createTodo };
