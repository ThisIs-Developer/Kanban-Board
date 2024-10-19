let tasks = {
    todo: [],
    inprogress: [],
    done: [],
};

let nextTaskId = 1;
let taskModal;
let editingTaskId = null;
let draggedCard = null;

document.addEventListener("DOMContentLoaded", () => {
    taskModal = new bootstrap.Modal(document.getElementById("taskModal"));
    loadFromLocalStorage();
    renderAllTasks();
    setupDragAndDrop();

    const themeToggle = document.querySelector(".theme-toggle");
    const themeIcon = themeToggle.querySelector("i");

    themeToggle.addEventListener("click", () => {
        document.documentElement.classList.toggle("dark-mode");
        themeIcon.classList.toggle("fa-moon");
        themeIcon.classList.toggle("fa-sun");
    });
});

function setupDragAndDrop() {
    const columns = document.querySelectorAll(".kanban-column");

    columns.forEach((column) => {
        column.addEventListener("dragover", (e) => {
            e.preventDefault();
            const taskList = column.querySelector(".task-list");
            const afterElement = getDragAfterElement(taskList, e.clientY);

            if (draggedCard) {
                if (afterElement) {
                    taskList.insertBefore(draggedCard, afterElement);
                } else {
                    taskList.appendChild(draggedCard);
                }
            }
        });

        column.addEventListener("drop", (e) => {
            e.preventDefault();
            if (draggedCard) {
                const newColumn = column.getAttribute("data-column");
                const taskId = parseInt(draggedCard.getAttribute("data-task-id"));
                moveTask(taskId, newColumn);
            }
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [
        ...container.querySelectorAll(".task-card:not(.dragging)"),
    ];

    return draggableElements.reduce(
        (closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        },
        { offset: Number.NEGATIVE_INFINITY }
    ).element;
}

function renderAllTasks() {
    Object.keys(tasks).forEach((columnId) => {
        const taskList = document.querySelector(
            `[data-column="${columnId}"] .task-list`
        );
        taskList.innerHTML = "";
        tasks[columnId].forEach((task) => {
            renderTask(task, taskList);
        });
    });
}

function renderTask(task, container) {
    const taskElement = document.createElement("div");
    taskElement.className = "task-card";
    taskElement.draggable = true;
    taskElement.setAttribute("data-task-id", task.id);

    taskElement.innerHTML = `
        <div class="task-actions">
            <button class="task-action-btn" onclick="editTask(${task.id})">
                <i class="fas fa-edit"></i>
            </button>
            <button class="task-action-btn" onclick="deleteTask(${task.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <h3 class="task-title">${task.title}</h3>
        <p class="task-description">${task.description}</p>
      `;

    taskElement.addEventListener("dragstart", () => {
        taskElement.classList.add("dragging");
        draggedCard = taskElement;
    });

    taskElement.addEventListener("dragend", () => {
        taskElement.classList.remove("dragging");
        draggedCard = null;
    });

    container.appendChild(taskElement);
}

function openAddTaskModal(columnId) {
    editingTaskId = null;
    document.getElementById("taskModalLabel").textContent = "Add New Task";
    document.getElementById("taskForm").reset();
    document.getElementById("columnId").value = columnId;
    taskModal.show();
}

function editTask(taskId) {
    editingTaskId = taskId;
    document.getElementById("taskModalLabel").textContent = "Edit Task";

    let task;
    let columnId;
    Object.entries(tasks).forEach(([col, taskList]) => {
        const found = taskList.find((t) => t.id === taskId);
        if (found) {
            task = found;
            columnId = col;
        }
    });

    if (task) {
        document.getElementById("taskTitle").value = task.title;
        document.getElementById("taskDescription").value = task.description;
        document.getElementById("columnId").value = columnId;
        taskModal.show();
    }
}

function saveTask() {
    const title = document.getElementById("taskTitle").value;
    const description = document.getElementById("taskDescription").value;
    const columnId = document.getElementById("columnId").value;

    if (editingTaskId) {
        Object.values(tasks).forEach((columnTasks) => {
            const task = columnTasks.find((t) => t.id === editingTaskId);
            if (task) {
                task.title = title;
                task.description = description;
            }
        });
    } else {
        const newTask = {
            id: nextTaskId++,
            title,
            description,
        };
        tasks[columnId].push(newTask);
    }

    renderAllTasks();
    saveToLocalStorage();
    taskModal.hide();
}

function deleteTask(taskId) {
    if (confirm("Are you sure you want to delete this task?")) {
        Object.keys(tasks).forEach((columnId) => {
            tasks[columnId] = tasks[columnId].filter(
                (task) => task.id !== taskId
            );
        });
        renderAllTasks();
        saveToLocalStorage();
    }
}

function moveTask(taskId, newColumn) {
    let taskToMove;
    let oldColumn;

    Object.entries(tasks).forEach(([columnId, columnTasks]) => {
        const taskIndex = columnTasks.findIndex((task) => task.id === taskId);
        if (taskIndex !== -1) {
            taskToMove = columnTasks[taskIndex];
            oldColumn = columnId;
            columnTasks.splice(taskIndex, 1);
        }
    });

    if (taskToMove && oldColumn !== newColumn) {
        tasks[newColumn].push(taskToMove);
        saveToLocalStorage();
    }

    renderAllTasks();
}

function saveToLocalStorage() {
    localStorage.setItem("kanbanTasks", JSON.stringify(tasks));
    localStorage.setItem("nextTaskId", nextTaskId.toString());
}

function loadFromLocalStorage() {
    const savedTasks = localStorage.getItem("kanbanTasks");
    const savedNextTaskId = localStorage.getItem("nextTaskId");

    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }

    if (savedNextTaskId) {
        nextTaskId = parseInt(savedNextTaskId);
    }
}

window.addEventListener("beforeunload", saveToLocalStorage);