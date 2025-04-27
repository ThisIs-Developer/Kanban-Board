// Data structure
let boardData = {
  columns: [],
  nextColumnId: 1,
  nextTaskId: 1,
};

// DOM Elements
const columnsContainer = document.getElementById("columnsContainer");
const taskModal = new bootstrap.Modal(document.getElementById("taskModal"));
const columnModal = new bootstrap.Modal(document.getElementById("columnModal"));
const taskForm = document.getElementById("taskForm");
const columnForm = document.getElementById("columnForm");
const deviceToggle = document.getElementById("deviceToggle");
const deviceContainer = document.getElementById("deviceContainer");
const mobileTaskList = document.getElementById("mobileTaskList");

// Initialize the board
function initBoard() {
  // Load data from localStorage or create default
  const savedData = localStorage.getItem("taskflowData");
  if (savedData) {
    boardData = JSON.parse(savedData);
  } else {
    // Set up default columns
    boardData.columns = [
      { id: 1, title: "To Do", tasks: [] },
      { id: 2, title: "In Progress", tasks: [] },
      { id: 3, title: "Done", tasks: [] },
    ];
    boardData.nextColumnId = 4;
    boardData.nextTaskId = 1;
    saveData();
  }

  renderBoard();
  updateMobileView();
}

// Save data to localStorage
function saveData() {
  localStorage.setItem("taskflowData", JSON.stringify(boardData));
}

// Render the entire board
function renderBoard() {
  columnsContainer.innerHTML = "";

  boardData.columns.forEach((column) => {
    const columnElement = createColumnElement(column);
    columnsContainer.appendChild(columnElement);
  });

  // Add "Add Column" button after all columns
  const addColumnBtn = document.createElement("div");
  addColumnBtn.className = "add-column-btn";
  addColumnBtn.innerHTML = '<i class="fas fa-plus me-2"></i> Add Column';
  addColumnBtn.addEventListener("click", openAddColumnModal);
  columnsContainer.appendChild(addColumnBtn);

  // Set up drag and drop after rendering
  setupDragAndDrop();
}

// Create column DOM element
function createColumnElement(column) {
  const columnEl = document.createElement("div");
  columnEl.className = "column";
  columnEl.dataset.columnId = column.id;

  // Column header
  const headerEl = document.createElement("div");
  headerEl.className = "column-header";
  headerEl.innerHTML = `
        <h3>${column.title}</h3>
        <div class="column-actions">
            <button class="btn-icon edit-column-btn" data-column-id="${column.id}">
                <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn-icon delete-column-btn" data-column-id="${column.id}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
  columnEl.appendChild(headerEl);

  // Container for tasks with drag and drop
  const taskContainer = document.createElement("div");
  taskContainer.className = "task-container";
  taskContainer.dataset.columnId = column.id;
  columnEl.appendChild(taskContainer);

  // Render tasks in this column
  column.tasks.forEach((task) => {
    const taskEl = createTaskElement(task);
    taskContainer.appendChild(taskEl);
  });

  // Add task button
  const addTaskBtn = document.createElement("button");
  addTaskBtn.className = "add-task-btn";
  addTaskBtn.innerHTML = '<i class="fas fa-plus me-1"></i> Add Task';
  addTaskBtn.addEventListener("click", () => openAddTaskModal(column.id));
  columnEl.appendChild(addTaskBtn);

  // Add event listeners for column actions
  columnEl
    .querySelector(".edit-column-btn")
    .addEventListener("click", () => openEditColumnModal(column.id));
  columnEl
    .querySelector(".delete-column-btn")
    .addEventListener("click", () => deleteColumn(column.id));

  return columnEl;
}

// Create task DOM element
function createTaskElement(task) {
  const taskEl = document.createElement("div");
  taskEl.className = "task fade-in";
  taskEl.dataset.taskId = task.id;
  taskEl.draggable = true;

  // Determine priority class
  const priorityClass = `priority-${task.priority || "low"}`;

  // Create due date display if exists
  let dueDateHtml = "";
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const formattedDate = dueDate.toLocaleDateString();
    dueDateHtml = `<span class="task-due-date"><i class="far fa-calendar me-1"></i>${formattedDate}</span>`;
  }

  // Create assignee display if exists
  let assigneeHtml = "";
  if (task.assignee) {
    assigneeHtml = `
            <span class="assigned-user">
                <i class="fas fa-user"></i> ${task.assignee}
            </span>
        `;
  }

  // Create tags display
  let tagsHtml = "";
  if (task.tags && task.tags.length > 0) {
    tagsHtml = task.tags
      .map((tag) => `<span class="custom-tag">${tag}</span>`)
      .join("");
  }

  // Create checklist summary if exists
  let checklistHtml = "";
  if (task.checklist && task.checklist.length > 0) {
    const completedItems = task.checklist.filter((item) => item.checked).length;
    checklistHtml = `
            <div class="subtasks">
                <div class="subtask-progress">
                    <i class="fas fa-list-check me-1"></i>
                    ${completedItems}/${task.checklist.length} completed
                </div>
            </div>
        `;
  }

  // Create attachments count if exists
  let attachmentsHtml = "";
  if (task.attachments && task.attachments.length > 0) {
    attachmentsHtml = `
            <span class="badge-custom badge-blue">
                <i class="fas fa-paperclip"></i> ${task.attachments.length}
            </span>
        `;
  }

  // Create comments count if exists
  let commentsHtml = "";
  if (task.comments && task.comments.length > 0) {
    commentsHtml = `
            <span class="badge-custom badge-purple">
                <i class="fas fa-comment"></i> ${task.comments.length}
            </span>
        `;
  }

  taskEl.innerHTML = `
        <div class="task-title">${task.title}</div>
        <div class="task-description">${task.description || ""}</div>
        <div class="tags-container mb-2">${tagsHtml}</div>
        ${checklistHtml}
        <div class="task-footer">
            <div>
                <span class="task-priority ${priorityClass}">${
    task.priority || "low"
  }</span>
                ${attachmentsHtml}
                ${commentsHtml}
            </div>
            <div>
                ${assigneeHtml}
                ${dueDateHtml}
            </div>
        </div>
        <div class="task-actions">
            <button class="btn-icon edit-task-btn" data-task-id="${task.id}">
                <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn-icon delete-task-btn" data-task-id="${task.id}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

  // Add event listeners for task actions
  taskEl.querySelector(".edit-task-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    openEditTaskModal(task.id);
  });

  taskEl.querySelector(".delete-task-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    deleteTask(task.id);
  });

  // Open edit modal when clicking on the task
  taskEl.addEventListener("click", () => openEditTaskModal(task.id));

  return taskEl;
}

// Setup drag and drop functionality
function setupDragAndDrop() {
  const draggables = document.querySelectorAll(".task");
  const containers = document.querySelectorAll(".task-container");

  draggables.forEach((draggable) => {
    draggable.addEventListener("dragstart", () => {
      draggable.classList.add("dragging");
    });

    draggable.addEventListener("dragend", () => {
      draggable.classList.remove("dragging");
      saveTasksOrder();
    });
  });

  containers.forEach((container) => {
    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(container, e.clientY);
      const draggable = document.querySelector(".dragging");
      if (afterElement == null) {
        container.appendChild(draggable);
      } else {
        container.insertBefore(draggable, afterElement);
      }
    });
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll(".task:not(.dragging)"),
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

function saveTasksOrder() {
  // Update the data model based on the DOM order
  const columns = document.querySelectorAll(".task-container");

  columns.forEach((column) => {
    const columnId = parseInt(column.dataset.columnId);
    const columnData = boardData.columns.find((col) => col.id === columnId);

    if (columnData) {
      // Clear the existing tasks array
      columnData.tasks = [];

      // Get all tasks in this column and add to the column's tasks array
      const tasks = column.querySelectorAll(".task");
      tasks.forEach((task) => {
        const taskId = parseInt(task.dataset.taskId);

        // Find the task in all columns
        let foundTask = null;
        boardData.columns.forEach((col) => {
          const taskData = col.tasks.find((t) => t.id === taskId);
          if (taskData) {
            foundTask = taskData;
          }
        });

        // Remove task from its original column if it exists
        if (foundTask) {
          boardData.columns.forEach((col) => {
            col.tasks = col.tasks.filter((t) => t.id !== taskId);
          });

          // Add to the new column
          columnData.tasks.push(foundTask);
        }
      });
    }
  });

  // Save the updated data
  saveData();
  updateMobileView();
}

// Open the add task modal
function openAddTaskModal(columnId) {
  // Reset form
  taskForm.reset();
  document.getElementById("taskId").value = "";
  document.getElementById("columnId").value = columnId;
  document.getElementById("taskModalTitle").textContent = "Add New Task";

  // Clear tags, checklist, comments, attachments
  document.getElementById("taskTags").innerHTML = "";
  document.getElementById("checklistContainer").innerHTML = "";
  document.getElementById("commentsContainer").innerHTML = "";
  document.getElementById("attachmentsContainer").innerHTML = "";

  taskModal.show();
}

// Open the edit task modal
function openEditTaskModal(taskId) {
  // Find the task
  let taskData = null;
  let columnId = null;

  boardData.columns.forEach((column) => {
    const foundTask = column.tasks.find((task) => task.id === taskId);
    if (foundTask) {
      taskData = foundTask;
      columnId = column.id;
    }
  });

  if (!taskData) return;

  // Reset and populate form
  taskForm.reset();
  document.getElementById("taskId").value = taskId;
  document.getElementById("columnId").value = columnId;
  document.getElementById("taskTitle").value = taskData.title;
  document.getElementById("taskDescription").value = taskData.description || "";
  document.getElementById("taskPriority").value = taskData.priority || "low";
  document.getElementById("taskDueDate").value = taskData.dueDate || "";
  document.getElementById("taskAssignee").value = taskData.assignee || "";
  document.getElementById("taskModalTitle").textContent = "Edit Task";

  // Render tags
  const tagsContainer = document.getElementById("taskTags");
  tagsContainer.innerHTML = "";
  if (taskData.tags && taskData.tags.length > 0) {
    taskData.tags.forEach((tag) => {
      addTagToForm(tag);
    });
  }

  // Render checklist
  const checklistContainer = document.getElementById("checklistContainer");
  checklistContainer.innerHTML = "";
  if (taskData.checklist && taskData.checklist.length > 0) {
    taskData.checklist.forEach((item) => {
      addChecklistItemToForm(item.text, item.checked);
    });
  }

  // Render comments
  const commentsContainer = document.getElementById("commentsContainer");
  commentsContainer.innerHTML = "";
  if (taskData.comments && taskData.comments.length > 0) {
    taskData.comments.forEach((comment) => {
      addCommentToForm(comment);
    });
  }

  // Render attachments
  const attachmentsContainer = document.getElementById("attachmentsContainer");
  attachmentsContainer.innerHTML = "";
  if (taskData.attachments && taskData.attachments.length > 0) {
    taskData.attachments.forEach((attachment) => {
      addAttachmentToForm(attachment.name, attachment.link);
    });
  }

  taskModal.show();
}

// Add tag to the form
function addTagToForm(tagText) {
  const tagsContainer = document.getElementById("taskTags");
  const tagEl = document.createElement("span");
  tagEl.className = "custom-tag me-1 mb-1";
  tagEl.innerHTML = `
${tagText} 
<button type="button" class="btn-close btn-close-white ms-1" style="font-size: 0.5rem;" aria-label="Remove"></button>
`;

  tagEl.querySelector(".btn-close").addEventListener("click", () => {
    tagEl.remove();
  });

  tagsContainer.appendChild(tagEl);
}

// Add checklist item to the form
function addChecklistItemToForm(text, checked = false) {
  const checklistContainer = document.getElementById("checklistContainer");
  const itemDiv = document.createElement("div");
  itemDiv.className = "checklist-item";
  itemDiv.innerHTML = `
<div class="form-check flex-grow-1">
    <input class="form-check-input" type="checkbox" ${checked ? "checked" : ""}>
    <input type="text" class="form-control form-control-sm" value="${text}" placeholder="Checklist item">
</div>
<button type="button" class="btn btn-sm btn-outline-danger ms-2">
    <i class="fas fa-times"></i>
</button>
`;

  itemDiv.querySelector("button").addEventListener("click", () => {
    itemDiv.remove();
  });

  checklistContainer.appendChild(itemDiv);
}

// Add comment to the form
function addCommentToForm(comment) {
  const commentsContainer = document.getElementById("commentsContainer");
  const commentDiv = document.createElement("div");
  commentDiv.className = "comment mb-2";
  commentDiv.innerHTML = `
<div class="comment-header d-flex justify-content-between">
    <span class="comment-author">User</span>
    <button type="button" class="btn-close" style="font-size: 0.5rem;" aria-label="Remove"></button>
</div>
<div class="comment-text">${comment}</div>
`;

  commentDiv.querySelector(".btn-close").addEventListener("click", () => {
    commentDiv.remove();
  });

  commentsContainer.appendChild(commentDiv);
}

// Add attachment to the form
function addAttachmentToForm(name, link) {
  const attachmentsContainer = document.getElementById("attachmentsContainer");
  const attachmentDiv = document.createElement("div");
  attachmentDiv.className = "attachment-item";
  attachmentDiv.innerHTML = `
<i class="fas fa-paperclip"></i>
<a href="${link}" target="_blank" class="flex-grow-1">${name}</a>
<button type="button" class="btn-close ms-2" style="font-size: 0.5rem;" aria-label="Remove"></button>
`;

  attachmentDiv.querySelector(".btn-close").addEventListener("click", () => {
    attachmentDiv.remove();
  });

  attachmentsContainer.appendChild(attachmentDiv);
}

// Save task
function saveTask() {
  const taskId = document.getElementById("taskId").value;
  const columnId = parseInt(document.getElementById("columnId").value);
  const title = document.getElementById("taskTitle").value;
  const description = document.getElementById("taskDescription").value;
  const priority = document.getElementById("taskPriority").value;
  const dueDate = document.getElementById("taskDueDate").value;
  const assignee = document.getElementById("taskAssignee").value;

  // Collect tags
  const tagElements = document
    .getElementById("taskTags")
    .querySelectorAll(".custom-tag");
  const tags = Array.from(tagElements).map((el) => el.textContent.trim());

  // Collect checklist items
  const checklistItems = Array.from(
    document
      .getElementById("checklistContainer")
      .querySelectorAll(".checklist-item")
  ).map((item) => {
    return {
      text: item.querySelector('input[type="text"]').value,
      checked: item.querySelector('input[type="checkbox"]').checked,
    };
  });

  // Collect comments
  const commentElements = document
    .getElementById("commentsContainer")
    .querySelectorAll(".comment");
  const comments = Array.from(commentElements).map(
    (el) => el.querySelector(".comment-text").textContent
  );

  // Collect attachments
  const attachmentElements = document
    .getElementById("attachmentsContainer")
    .querySelectorAll(".attachment-item");
  const attachments = Array.from(attachmentElements).map((el) => {
    return {
      name: el.querySelector("a").textContent,
      link: el.querySelector("a").href,
    };
  });

  if (taskId) {
    // Edit existing task
    const taskIdInt = parseInt(taskId);

    // Find and update the task
    boardData.columns.forEach((column) => {
      const taskIndex = column.tasks.findIndex((task) => task.id === taskIdInt);
      if (taskIndex !== -1) {
        // Remove the task from its current column if it's moving
        if (column.id !== columnId) {
          const taskData = column.tasks[taskIndex];
          column.tasks.splice(taskIndex, 1);

          // Add to new column
          const targetColumn = boardData.columns.find(
            (col) => col.id === columnId
          );
          if (targetColumn) {
            targetColumn.tasks.push({
              ...taskData,
              title,
              description,
              priority,
              dueDate,
              assignee,
              tags,
              checklist: checklistItems,
              comments,
              attachments,
            });
          }
        } else {
          // Update task in the same column
          column.tasks[taskIndex] = {
            ...column.tasks[taskIndex],
            title,
            description,
            priority,
            dueDate,
            assignee,
            tags,
            checklist: checklistItems,
            comments,
            attachments,
          };
        }
      }
    });
  } else {
    // Create new task
    const newTask = {
      id: boardData.nextTaskId++,
      title,
      description,
      priority,
      dueDate,
      assignee,
      tags,
      checklist: checklistItems,
      comments,
      attachments,
      createdAt: new Date().toISOString(),
    };

    // Add to column
    const targetColumn = boardData.columns.find((col) => col.id === columnId);
    if (targetColumn) {
      targetColumn.tasks.push(newTask);
    }
  }

  // Save data and update UI
  saveData();
  renderBoard();
  updateMobileView();

  // Close modal
  taskModal.hide();
}

// Delete task
function deleteTask(taskId) {
  if (confirm("Are you sure you want to delete this task?")) {
    boardData.columns.forEach((column) => {
      column.tasks = column.tasks.filter((task) => task.id !== taskId);
    });

    saveData();
    renderBoard();
    updateMobileView();
  }
}

// Open the add column modal
function openAddColumnModal() {
  // Reset form
  columnForm.reset();
  document.getElementById("editColumnId").value = "";
  document.getElementById("columnModalTitle").textContent = "Add New Column";

  columnModal.show();
}

// Open the edit column modal
function openEditColumnModal(columnId) {
  const column = boardData.columns.find((col) => col.id === columnId);
  if (!column) return;

  // Populate form
  document.getElementById("editColumnId").value = columnId;
  document.getElementById("columnTitle").value = column.title;
  document.getElementById("columnModalTitle").textContent = "Edit Column";

  columnModal.show();
}

// Save column
function saveColumn() {
  const columnTitle = document.getElementById("columnTitle").value;
  const editColumnId = document.getElementById("editColumnId").value;

  if (editColumnId) {
    // Edit existing column
    const columnIdInt = parseInt(editColumnId);
    const column = boardData.columns.find((col) => col.id === columnIdInt);
    if (column) {
      column.title = columnTitle;
    }
  } else {
    // Create new column
    const newColumn = {
      id: boardData.nextColumnId++,
      title: columnTitle,
      tasks: [],
    };

    boardData.columns.push(newColumn);
  }

  saveData();
  renderBoard();

  // Close modal
  columnModal.hide();
}

// Delete column
function deleteColumn(columnId) {
  const column = boardData.columns.find((col) => col.id === columnId);

  if (column && column.tasks.length > 0) {
    if (
      !confirm(
        `This column contains ${column.tasks.length} tasks that will also be deleted. Continue?`
      )
    ) {
      return;
    }
  } else {
    if (!confirm("Are you sure you want to delete this column?")) {
      return;
    }
  }

  boardData.columns = boardData.columns.filter((col) => col.id !== columnId);

  saveData();
  renderBoard();
  updateMobileView();
}

// Update mobile view
function updateMobileView() {
  mobileTaskList.innerHTML = "";

  // Create a flat list of all tasks for mobile view
  const allTasks = [];
  boardData.columns.forEach((column) => {
    column.tasks.forEach((task) => {
      allTasks.push({ ...task, columnTitle: column.title });
    });
  });

  // Sort by due date (if available)
  allTasks.sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  // Render mobile view
  allTasks.forEach((task) => {
    const taskCard = document.createElement("div");
    taskCard.className = "card mb-3";

    let priorityBadge = "";
    if (task.priority === "high") {
      priorityBadge = '<span class="badge bg-danger ms-2">High</span>';
    } else if (task.priority === "medium") {
      priorityBadge =
        '<span class="badge bg-warning text-dark ms-2">Medium</span>';
    }

    let dueDateStr = "";
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      dueDateStr = `
        <div class="small text-muted mt-1">
            <i class="far fa-calendar me-1"></i> Due: ${dueDate.toLocaleDateString()}
        </div>
    `;
    }

    taskCard.innerHTML = `
    <div class="card-header d-flex justify-content-between align-items-center">
        <div>
            <span class="badge bg-secondary">${task.columnTitle}</span>
            ${priorityBadge}
        </div>
        <button class="btn btn-sm btn-outline-primary edit-mobile-task" data-task-id="${
          task.id
        }">
            <i class="fa-solid fa-pen-to-square"></i> Edit
        </button>
    </div>
    <div class="card-body">
        <h5 class="card-title">${task.title}</h5>
        <p class="card-text">${task.description || ""}</p>
        ${dueDateStr}
        ${
          task.assignee
            ? `<div class="small text-muted"><i class="fas fa-user me-1"></i> ${task.assignee}</div>`
            : ""
        }
    </div>
`;

    taskCard
      .querySelector(".edit-mobile-task")
      .addEventListener("click", () => {
        openEditTaskModal(task.id);
      });

    mobileTaskList.appendChild(taskCard);
  });

  if (allTasks.length === 0) {
    mobileTaskList.innerHTML = `
    <div class="text-center py-5 text-muted">
        <i class="fas fa-tasks fa-3x mb-3"></i>
        <p>No tasks available</p>
    </div>
`;
  }
}

// Set up event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Initialize the board
  initBoard();

  // Save task button
  document.getElementById("saveTaskBtn").addEventListener("click", saveTask);

  // Save column button
  document
    .getElementById("saveColumnBtn")
    .addEventListener("click", saveColumn);

  // Add new column button
  document
    .getElementById("addNewColumnBtn")
    .addEventListener("click", openAddColumnModal);

  // Add checklist item button
  document
    .getElementById("addChecklistItemBtn")
    .addEventListener("click", () => {
      addChecklistItemToForm("");
    });

  // Add tag button
  document.getElementById("addTagBtn").addEventListener("click", () => {
    const tagInput = document.getElementById("newTagInput");
    if (tagInput.value.trim()) {
      addTagToForm(tagInput.value.trim());
      tagInput.value = "";
    }
  });

  // Add comment button
  document.getElementById("addCommentBtn").addEventListener("click", () => {
    const commentInput = document.getElementById("newCommentInput");
    if (commentInput.value.trim()) {
      addCommentToForm(commentInput.value.trim());
      commentInput.value = "";
    }
  });

  // Add attachment button
  document.getElementById("addAttachmentBtn").addEventListener("click", () => {
    const nameInput = document.getElementById("attachmentName");
    const linkInput = document.getElementById("attachmentLink");

    if (nameInput.value.trim() && linkInput.value.trim()) {
      addAttachmentToForm(nameInput.value.trim(), linkInput.value.trim());
      nameInput.value = "";
      linkInput.value = "";
    }
  });

  // Clear all data button
  document.getElementById("clearDataBtn").addEventListener("click", () => {
    if (
      confirm("Are you sure you want to reset all data? This cannot be undone.")
    ) {
      localStorage.removeItem("taskflowData");
      initBoard();
    }
  });

  // Device toggle
  deviceToggle.addEventListener("click", () => {
    deviceContainer.classList.toggle("active");
    updateMobileView();
  });

  // Set up reminders check
  setInterval(checkReminders, 60000); // Check every minute
});

// Check for due date reminders
function checkReminders() {
  const now = new Date();

  boardData.columns.forEach((column) => {
    column.tasks.forEach((task) => {
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const timeDiff = dueDate - now;

        // If due within 30 minutes and notification not shown yet
        if (timeDiff > 0 && timeDiff <= 30 * 60 * 1000 && !task.reminderShown) {
          showNotification(task.title, `Task "${task.title}" is due soon!`);
          task.reminderShown = true;
          saveData();
        }

        // Reset reminder flag for next day if it's passed
        if (timeDiff < 0 && task.reminderShown) {
          const daysPassed = Math.abs(
            Math.floor(timeDiff / (1000 * 60 * 60 * 24))
          );
          if (daysPassed >= 1) {
            task.reminderShown = false;
            saveData();
          }
        }
      }
    });
  });
}

// Show browser notification
function showNotification(title, message) {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return;
  }

  if (Notification.permission === "granted") {
    new Notification(title, { body: message });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(title, { body: message });
      }
    });
  }
}
