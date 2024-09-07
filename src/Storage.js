import { createProject } from './Project.js';
import { createTodo } from './Todo.js';

const createStorage = () => {
    const LOCAL_STORAGE_KEY = 'toDoList.projects';
    let projects = loadProjects() || [];

    // After getting the projects from local storage, return a new array of Project objects with its associated methods back
    // Map over projects and create new Project objects
    projects = projects.map(project => {
        const projectData = createProject(project.name);
        // Map over each Project's todos and create new Todo objects
        projectData.todos = project.todos.map(todo => {
            const todoData = createTodo(todo.title, todo.description, todo.dueDate, todo.priority, todo.checked);
            return todoData;
        });
        return projectData;
    });

    function loadProjects() {
        // Parse converts JSON string to objects
        const projectsJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
        return projectsJSON ? JSON.parse(projectsJSON) : null;
    }

    function saveProjects() {
        // Stringify converts objects to JSON string
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
    }

    return {
        getProjects() {
            return projects;
        },
        addProject(name) {
            const project = createProject(name);
            projects.push(project);
            saveProjects();
            return project;
        },
        removeProject(projectName) {
            const index = projects.findIndex(project => project.name === projectName);
            if (index !== -1) {
                projects.splice(index, 1);
                saveProjects();
                return true;
            }
            return false;
        },
        findProject(projectName) {
            return projects.find(project => project.name === projectName);
        },
        addTodoToProject(projectName, todo) {
            const project = this.findProject(projectName);
            if (project) {
                project.addTodo(todo);
                saveProjects();
            }
        },
        removeTodoFromProject(projectName, todoTitle) {
            const project = this.findProject(projectName);
            if (project) {
                project.removeTodo(todoTitle);
                saveProjects();
            }
        },

        saveProjects,
    };
};

export { createStorage };
