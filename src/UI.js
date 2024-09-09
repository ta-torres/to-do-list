import './style.css';
import 'iconify-icon';
import logo from './assets/img/to-do.svg';
import { createStorage } from './Storage.js';
import { createTodo } from './Todo.js';
import { format, parseISO, isValid, nextFriday, isFuture } from 'date-fns';

const UI = (() => {
    const storage = createStorage();
    let currentProject;

    const initializeApp = () => {
        if (storage.getProjects().length === 0) {
            const defaultProject = storage.addProject('My Tasks');
            currentProject = defaultProject.name;
            placeholder();
        }
        else {
            currentProject = storage.getProjects()[0].name;
        }
        displayProjects();
        displayTodos(currentProject);
        setupEventListeners();
    };

    const placeholder = () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const thisWeekend = format(nextFriday(new Date()), 'yyyy-MM-dd');
        const myTasks = [
            { title: 'To-do List', description: '', dueDate: thisWeekend, priority: 'low', checked: false },
            { title: 'Initial release', description: 'Add, edit, and delete tasks', dueDate: today, priority: 'medium', checked: true },
        ];
        for (let task of myTasks) {
            storage.addTodoToProject(currentProject, createTodo(task.title, task.description, task.dueDate, task.priority, task.checked));
        }
    };

    const displayProjects = () => {
        const projects = storage.getProjects();
        const projectList = document.querySelector('.project-list');
        projectList.textContent = '';

        projects.forEach((project) => {
            const projectElement = document.createElement('li');
            projectElement.textContent = project.name;
            projectElement.addEventListener('click', () => {
                currentProject = project.name;
                displayTodos(project.name);
            });

            if (project.name !== "My Tasks") {
                const removeBtn = document.createElement('button');
                removeBtn.classList.add('remove-btn');
                removeBtn.textContent = 'X';
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    removeProject(project.name);
                });
                projectElement.append(removeBtn);
            }
            projectList.appendChild(projectElement);
        });
    };
    /*
    Make projectName optional, otherwise search all projects
    Get list of projects to search through
        Get all todos from the list
            Push todos + project name to new array
    Filter todos (today or from this week)
    Push filtered todos
    */
    const displayTodos = (projectName = null, filter = null) => {
        const searchProjects = projectName
            ? [storage.findProject(projectName)]
            : storage.getProjects();

        let searchTodos = [];
        searchProjects.forEach(project => {
            const projectTodos = project.getTodos();
            projectTodos.forEach(todo => {
                // to know which project the todo belongs to
                searchTodos.push({ ...todo, projectName: project.name });
            });
        });

        const filterTodos = searchTodos.filter(todo => {
            // If no filter is selected, return all todos
            return true;
        });

        const todoList = document.querySelector('.todo-list');
        todoList.textContent = '';

        filterTodos.forEach(todo => {
            const todoElement = createTodoElement(todo, todo.projectName);
            todoList.appendChild(todoElement);
        });
    };

    const createTodoElement = (todo, projectName) => {
        const project = storage.findProject(projectName);
        const todoElement = document.createElement('li');

        const todoDetails = document.createElement('div');
        todoDetails.classList.add('todo-details');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.checked;
        checkbox.addEventListener('change', () => {
            const todoInStorage = project.getTodos().find(storedTodo => storedTodo.title === todo.title);
            todoInStorage.toggleChecked();
            storage.saveProjects();
        });

        const details = document.createElement('div');
        details.classList.add('details');

        details.addEventListener('click', () => {
            displayTodoDetails(projectName, todo.title);
        });

        const name = document.createElement('span');
        name.classList.add('name');
        name.textContent = `${todo.title}`;

        const description = document.createElement('span');
        description.classList.add('description');
        description.textContent = `${todo.description}`;

        details.append(name, description);
        todoDetails.append(checkbox, details);

        const todoStatus = document.createElement('div');
        todoStatus.classList.add('todo-status');

        const status = document.createElement('div');
        status.classList.add('status');

        const dueDate = document.createElement('span');
        dueDate.classList.add('date');
        dueDate.textContent = todo.dueDate ? format(parseISO(todo.dueDate), 'PP') : '';

        const priorityLabel = document.createElement('span');
        priorityLabel.classList.add('priority-label', `${todo.priority}`);
        priorityLabel.textContent = `${todo.priority}`;

        status.append(dueDate, priorityLabel);

        const buttons = document.createElement('div');
        buttons.classList.add('buttons');

        const editBtn = document.createElement('button');
        editBtn.classList.add('edit-todo');
        const editIcon = document.createElement('iconify-icon');
        editIcon.setAttribute('icon', 'tabler:edit');
        editBtn.appendChild(editIcon);

        editBtn.addEventListener('click', () => {
            editTodoDetails(projectName, todo.title);
        });

        const removeBtn = document.createElement('button');
        removeBtn.classList.add('remove-todo');
        const removeIcon = document.createElement('iconify-icon');
        removeIcon.setAttribute('icon', 'tabler:trash');
        removeBtn.appendChild(removeIcon);

        removeBtn.addEventListener('click', () => {
            removeTodo(projectName, todo.title);
        });

        buttons.append(editBtn, removeBtn);
        todoStatus.append(status, buttons);
        todoElement.append(todoDetails, todoStatus);

        return todoElement;
    };

    const addProjectModal = () => {
        removeCurrentModal();
        const modal = document.createElement('div');
        modal.classList.add('modal');
        const modalContent = document.createElement('div');
        modalContent.classList.add('modal-content');

        modalContent.innerHTML = `
            <button class="close-modal">x</button>
            <h2>Add a Project</h2>
            <form>
                <div class="error"></div>
                <div>
                    <label for="project-name">Project Name</label>
                    <input type="text" name="project-name" id="project-name" required>
                    <button type="submit">Add Project</button>
                </div>
            </form>
        `;
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        modalContent.addEventListener('submit', (e) => {
            e.preventDefault();
            const projectName = e.target['project-name'].value;
            storage.addProject(projectName);
            displayProjects();
            modal.remove();
        });
        const closeModal = document.querySelector('.close-modal');
        closeModal.addEventListener('click', () => modal.remove());
    };

    const addTodoModal = () => {
        removeCurrentModal();
        const modal = document.createElement('div');
        modal.classList.add('modal');

        const modalContent = document.createElement('div');
        modalContent.classList.add('modal-content');

        modalContent.innerHTML = `  
            <button class="close-modal">x</button>
            <h2>Add a Todo to "${currentProject}"</h2>
            <form>
                <div class="error"></div>
                <div>
                    <label for="todo-title">Title</label>
                    <input type="text" name="todo-title" id="todo-title" minlength="3" maxlength="100" required>
                </div>
                <div>
                    <label for="todo-description">Description</label>
                    <textarea name="todo-description" id="todo-description"></textarea>
                </div>
                <div>
                    <label for="todo-due-date">Due Date</label>
                    <input type="date" name="todo-due-date" id="todo-due-date"> 
                </div>
                <div>
                    <div class="priority">
                        <label for="todo-priority">Priority:</label>
                        <label>
                            <input type="radio" name="todo-priority" value="high" required>
                            High
                        </label>
                        <label>
                            <input type="radio" name="todo-priority" value="medium" required>
                            Medium
                        </label>
                        <label>
                            <input type="radio" name="todo-priority" value="low" required>
                            Low
                        </label>
                    </div>
                </div>
                <div>
                    <button type="submit">Add Todo</button>
                </div>
            </form>
        `;
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        modalContent.addEventListener('submit', (e) => {
            e.preventDefault();
            const todoTitle = e.target['todo-title'].value;
            const todoDescription = e.target['todo-description'].value;
            const todoDueDate = e.target['todo-due-date'].value;
            const todoPriority = e.target['todo-priority'].value;

            if (validateTodo(todoDueDate)) {
                const todo = createTodo(todoTitle, todoDescription, todoDueDate, todoPriority);
                storage.addTodoToProject(currentProject, todo);
                displayTodos(currentProject);
                console.log(todo);
                modal.remove();
            }
        });
        const closeModal = document.querySelector('.close-modal');
        closeModal.addEventListener('click', () => modal.remove());
    };

    const validateTodo = (dueDate) => {
        // only validate if there is a due date  
        if (dueDate && !isValid(parseISO(dueDate))) {
            alert('Please enter a valid date.');
            return false;
        }
        return true;
    };

    const removeProject = (projectName) => {
        if (confirm(`Are you sure you want to remove the list "${projectName}" and all its todos?`)) {
            storage.removeProject(projectName);
            currentProject = storage.getProjects()[0].name;
            displayProjects();
            displayTodos(currentProject);
        }
    };

    const removeTodo = (projectName, todoTitle) => {
        if (confirm(`Are you sure you want to remove the todo "${todoTitle}"?`)) {
            storage.removeTodoFromProject(projectName, todoTitle);
            displayTodos(projectName);
        }
    };

    const removeCurrentModal = () => {
        const currentModal = document.querySelector('.modal');
        if (currentModal) currentModal.remove();
    };

    const editTodoDetails = (projectName, todoTitle) => {
        removeCurrentModal();
        const project = storage.findProject(projectName);
        const todo = project.getTodos().find(todo => todo.title === todoTitle);

        const modal = document.createElement('div');
        modal.classList.add('modal');
        const modalContent = document.createElement('div');
        modalContent.classList.add('modal-content');

        modalContent.innerHTML = `
            <button class="close-modal">x</button>
            <h2>${todo.title}</h2>
            <form>
                <div class="error"></div>
                <div>
                    <label for="todo-title">Title</label>
                    <input type="text" name="todo-title" id="todo-title" minlength="3" maxlength="100" value="${todo.title}" required>
                </div>
                <div>
                    <label for="todo-description">Description</label>
                    <textarea name="todo-description" id="todo-description">${todo.description}</textarea>
                </div>
                <div>
                    <label for="todo-due-date">Due Date</label>
                    <input type="date" name="todo-due-date" id="todo-due-date" value="${todo.dueDate}"> 
                </div>
                <div>
                    <div class="priority">
                        <label for="todo-priority">Priority:</label>
                        <label>
                            <input type="radio" name="todo-priority" value="high" ${todo.priority === 'high' ? 'checked' : ''}>
                            High
                        </label>
                        <label>
                            <input type="radio" name="todo-priority" value="medium" ${todo.priority === 'medium' ? 'checked' : ''}>
                            Medium
                        </label>
                        <label>
                            <input type="radio" name="todo-priority" value="low" ${todo.priority === 'low' ? 'checked' : ''}>
                            Low
                        </label>
                    </div>
                </div>
                <div>
                    <button type="submit">Update Todo</button>
                </div>
            </form>
        `;
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        modalContent.addEventListener('submit', (e) => {
            e.preventDefault();
            const todoTitle = e.target['todo-title'].value;
            const todoDescription = e.target['todo-description'].value;
            const todoDueDate = e.target['todo-due-date'].value;
            const todoPriority = e.target['todo-priority'].value;

            if (validateTodo(todoDueDate)) {
                todo.updateTodoDetails(todoTitle, todoDescription, todoDueDate, todoPriority);
                storage.saveProjects();
                displayTodos(projectName);
                modal.remove();
            }
            console.log(todo);
            console.log(storage.findProject(projectName).getTodos());
        });
        const closeModal = document.querySelector('.close-modal');
        closeModal.addEventListener('click', () => modal.remove());
    };

    const displayTodoDetails = (projectName, todoTitle) => {
        removeCurrentModal();
        const project = storage.findProject(projectName);
        const todo = project.getTodos().find(todo => todo.title === todoTitle);

        const modal = document.createElement('div');
        modal.classList.add('modal', 'todo-details-modal');
        const modalContent = document.createElement('div');
        modalContent.classList.add('modal-content');

        modalContent.innerHTML = `
            <button class="close-modal">x</button>
            <h2>${todo.title}</h2>
            <p>Description: <textarea class="description" readonly>${todo.description}</textarea></p>
            <p>Due Date: <span class="date">${todo.dueDate ? todo.dueDate : 'Not assigned'}</span></p>
            <p>Priority: <span class="priority-label ${todo.priority}">${todo.priority}</span></p>
            <div>
                <button class="remove-todo">Remove Todo</button>
                <button class="edit-todo">Edit Todo</button>
            </div>
        `;
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        modalContent.addEventListener('click', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('remove-todo')) {
                removeTodo(projectName, todo.title);
                modal.remove();
            } else if (e.target.classList.contains('edit-todo')) {
                editTodoDetails(projectName, todo.title);
                modal.remove();
            }
        });
        const closeModal = document.querySelector('.close-modal');
        closeModal.addEventListener('click', () => modal.remove());
    };

    const setupEventListeners = () => {
        // Header
        const myLogo = document.querySelector('.logo img');
        myLogo.src = logo;
        const projectBtn = document.querySelector('#project-btn');
        const todoBtn = document.querySelector('#todo-btn');
        projectBtn.addEventListener('click', () => {
            addProjectModal();
        });
        todoBtn.addEventListener('click', () => {
            addTodoModal();
        });
        // Sidebar
        const sidebar = document.querySelector('#sidebar');
        const sidebarToggle = document.querySelector('.sidebar-toggle');

        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            // If I click outside the sidebar or toggle, close it
            if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });
    };

    return { initializeApp };
})();

export { UI };