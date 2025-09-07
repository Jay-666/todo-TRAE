// DOM元素
const todoType = document.getElementById('todo-type');
const todoObject = document.getElementById('todo-object');
const todoAction = document.getElementById('todo-action');
const todoDate = document.getElementById('todo-date');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const filterBtns = document.querySelectorAll('.filter-btn');
const taskCount = document.getElementById('task-count');
const clearBtn = document.getElementById('clear-btn');
const inheritBtn = document.getElementById('inherit-btn');
const calendar = document.getElementById('calendar');
const currentMonthEl = document.getElementById('current-month');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const selectedDateEl = document.getElementById('selected-date');
const subtaskContainer = document.getElementById('subtask-container');
const subtaskList = document.getElementById('subtask-list');
const addSubtaskBtn = document.getElementById('add-subtask-btn');

// 当前待添加的子事项列表
let currentSubtasks = [];

// 待办事项列表
let todos = [];
let currentFilter = 'all';
let currentDate = new Date();
let selectedDate = formatDate(new Date());

// 初始化日期选择器为今天
const today = new Date();
const formattedToday = today.toISOString().split('T')[0];
todoDate.value = formattedToday;

// 格式化日期为YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 从本地存储加载待办事项
function loadTodos() {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
        todos = JSON.parse(savedTodos);
        
        // 为旧数据添加缺少的字段，确保兼容性
        todos = todos.map(todo => {
            // 如果没有date字段，默认为今天
            if (!todo.date) {
                const today = formatDate(new Date());
                return {
                    ...todo,
                    date: today,
                    createdAt: today,
                    inherited: false
                };
            }
            // 如果有date但没有createdAt，默认为date
            if (!todo.createdAt) {
                return {
                    ...todo,
                    createdAt: todo.date,
                    inherited: false
                };
            }
            // 如果没有inherited字段，默认为false
            if (todo.inherited === undefined) {
                return {
                    ...todo,
                    inherited: false
                };
            }
            return todo;
        });
        
        saveTodos(); // 保存更新后的数据
        renderTodos();
        renderCalendar(); // 加载后渲染日历
    }
}

// 保存待办事项到本地存储
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// 添加新的待办事项
function addTodo() {
    const type = todoType.value.trim();
    const object = todoObject.value.trim();
    const action = todoAction.value.trim();
    const date = todoDate.value || formatDate(new Date());
    
    // 至少需要一个字段有内容
    if (type || object || action) {
        // 构建完整的待办事项文本 - 使用"-"连接各要素
        let fullText = [type, object, action].filter(Boolean).join(' - ');
        
        const newTodo = {
            id: Date.now().toString(),
            text: fullText,
            type: type,
            object: object,
            action: action,
            completed: false,
            date: date,
            createdAt: date, // 记录原始创建日期
            inherited: false, // 是否是继承的任务
            subtasks: currentSubtasks.map(subtask => ({
                id: subtask.id,
                text: subtask.text,
                completed: false
            }))
        };
        
        todos.push(newTodo);
        
        // 清空输入
        todoType.value = '';
        todoObject.value = '';
        todoAction.value = '';
        currentSubtasks = [];
        renderSubtasks();
        
        saveTodos();
        renderTodos();
        renderCalendar(); // 添加任务后更新日历显示
    }
}

// 编辑待办事项
function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    // 创建编辑表单
    const form = document.createElement('form');
    form.className = 'edit-todo-form';
    form.innerHTML = `
        <div class="edit-input-group">
            <input type="text" name="type" value="${todo.type || ''}" placeholder="类型">
            <span>-</span>
            <input type="text" name="object" value="${todo.object || ''}" placeholder="对象">
            <span>-</span>
            <input type="text" name="action" value="${todo.action || ''}" placeholder="行为">
        </div>
        <div class="form-actions">
            <button type="submit">保存</button>
            <button type="button" class="cancel-edit">取消</button>
        </div>
    `;
    
    // 找到对应的待办事项项
    const todosItems = document.querySelectorAll('.todo-item');
    let targetItem;
    
    todosItems.forEach(item => {
        const deleteBtn = item.querySelector(`.delete-btn[data-id="${id}"]`);
        if (deleteBtn) {
            targetItem = item;
        }
    });
    
    if (targetItem) {
        const originalContent = targetItem.innerHTML;
        const originalClasses = targetItem.className;
        
        // 清空并添加表单
        targetItem.innerHTML = '';
        targetItem.appendChild(form);
        
        // 提交表单
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            todo.type = form.elements.type.value;
            todo.object = form.elements.object.value;
            todo.action = form.elements.action.value;
            saveTodos();
            renderTodos();
        });
        
        // 取消编辑
        form.querySelector('.cancel-edit').addEventListener('click', () => {
            targetItem.innerHTML = originalContent;
            targetItem.className = originalClasses;
            bindEventListeners();
        });
    }
}

// 添加子事项
function addSubtask() {
    const subtaskId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    currentSubtasks.push({
        id: subtaskId,
        text: ''
    });
    renderSubtasks();
    
    // 自动聚焦到新添加的子事项输入框
    const newInput = document.querySelector(`[data-subtask-id="${subtaskId}"]`);
    if (newInput) {
        newInput.focus();
    }
}

// 渲染子事项输入框
function renderSubtasks() {
    subtaskList.innerHTML = '';
    
    currentSubtasks.forEach((subtask, index) => {
        const subtaskItem = document.createElement('div');
        subtaskItem.className = 'subtask-item';
        subtaskItem.innerHTML = `
            <input type="text" data-subtask-id="${subtask.id}" value="${subtask.text}" placeholder="子事项 ${index + 1}">
            <button class="remove-subtask-btn" data-subtask-id="${subtask.id}">移除</button>
        `;
        subtaskList.appendChild(subtaskItem);
    });
    
    // 绑定子事项输入框事件
    document.querySelectorAll('.subtask-item input').forEach(input => {
        input.addEventListener('input', (e) => {
            const subtaskId = e.target.dataset.subtaskId;
            const subtask = currentSubtasks.find(s => s.id === subtaskId);
            if (subtask) {
                subtask.text = e.target.value;
            }
        });
    });
    
    // 绑定移除子事项按钮事件
    document.querySelectorAll('.remove-subtask-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const subtaskId = e.currentTarget.dataset.subtaskId;
            currentSubtasks = currentSubtasks.filter(s => s.id !== subtaskId);
            renderSubtasks();
        });
    });
}

// 切换子事项的完成状态
function toggleSubtask(todoId, subtaskId) {
    const todo = todos.find(t => t.id === todoId);
    if (todo && todo.subtasks) {
        const subtask = todo.subtasks.find(s => s.id === subtaskId);
        if (subtask) {
            subtask.completed = !subtask.completed;
            saveTodos();
            renderTodos();
        }
    }
}

// 删除待办事项
function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos();
}

// 切换待办事项的完成状态
function toggleTodo(id) {
    todos = todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos();
    renderTodos();
}

// 清除已完成的待办事项
function clearCompleted() {
    todos = todos.filter(todo => !todo.completed);
    saveTodos();
    renderTodos();
}

// 设置筛选器
function setFilter(filter) {
    currentFilter = filter;
    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderTodos();
}

// 渲染待办事项列表
function renderTodos() {
    todoList.innerHTML = '';
    
    // 根据当前筛选器过滤待办事项
    let filteredTodos = todos;
    
    if (currentFilter === 'active') {
        filteredTodos = todos.filter(todo => !todo.completed);
    } else if (currentFilter === 'completed') {
        filteredTodos = todos.filter(todo => todo.completed);
    } else if (currentFilter === 'today') {
        const today = formatDate(new Date());
        filteredTodos = todos.filter(todo => todo.date === today);
    } else if (currentFilter !== 'all') {
        // 按日期筛选
        filteredTodos = todos.filter(todo => todo.date === currentFilter);
    }
    
    // 创建并添加待办事项元素
    filteredTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        
        // 格式化显示日期
        const displayDate = formatDisplayDate(todo.date);
        
        // 如果是继承的任务，添加原始创建日期标记
        let inheritedBadge = '';
        if (todo.inherited && todo.date !== todo.createdAt) {
            const originalDate = formatDisplayDate(todo.createdAt);
            inheritedBadge = `<span class="inherited-badge" title="创建于 ${originalDate}">继承自 ${originalDate}</span>`;
        }
        
        // 构建子事项HTML（带展开收起功能）
        let subtasksHtml = '';
        if (todo.subtasks && todo.subtasks.length > 0) {
            subtasksHtml = `
                <div class="subtasks-wrapper">
                    <button class="toggle-subtasks-btn" data-todo-id="${todo.id}">
                        <i class="fas fa-chevron-right"></i> 展开(${todo.subtasks.length})
                    </button>
                    <div class="subtasks-list hidden" id="subtasks-${todo.id}">
                        ${todo.subtasks.map(subtask => `
                            <div class="subtask" draggable="true" data-todo-id="${todo.id}" data-subtask-id="${subtask.id}">
                                <span class="drag-handle"><i class="fas fa-grip-lines"></i></span>
                                <input type="checkbox" data-todo-id="${todo.id}" data-subtask-id="${subtask.id}" ${subtask.completed ? 'checked' : ''}>
                                <span class="subtask-text ${subtask.completed ? 'subtask-completed' : ''}">${subtask.text}</span>
                            </div>
                        `).join('')}
                        <div class="add-subtask-wrapper">
                            <button class="add-subtask-inline-btn" data-todo-id="${todo.id}">
                                <i class="fas fa-plus"></i> 添加子事项
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        li.innerHTML = `
            <input type="checkbox" id="todo-${todo.id}" ${todo.completed ? 'checked' : ''}>
            <label for="todo-${todo.id}">${todo.text}</label>
            <span class="todo-date">${displayDate}</span>
            ${inheritedBadge}
            <div class="todo-actions">
                <button class="edit-btn" data-id="${todo.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" data-id="${todo.id}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            ${subtasksHtml}
        `;
        todoList.appendChild(li);
    });
    
    // 更新任务数量统计
    const activeCount = todos.filter(todo => !todo.completed).length;
    taskCount.textContent = `${activeCount} 个待办事项`;
    
    // 绑定事件监听器
    bindEventListeners();
}

// 格式化显示日期（显示为 月/日 格式）
function formatDisplayDate(dateStr) {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
}

// 绑定事件监听器
function bindEventListeners() {
    // 为待办事项复选框绑定点击事件
    document.querySelectorAll('#todo-list input[type="checkbox"]:not([data-subtask-id])').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const id = e.target.id.replace('todo-', '');
            toggleTodo(id);
        });
    });
    
    // 为子事项复选框绑定点击事件
    document.querySelectorAll('#todo-list input[type="checkbox"][data-subtask-id]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const todoId = e.target.dataset.todoId;
            const subtaskId = e.target.dataset.subtaskId;
            toggleSubtask(todoId, subtaskId);
        });
    });
    
    // 为删除按钮绑定点击事件
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            deleteTodo(id);
        });
    });
    
    // 为编辑按钮绑定点击事件
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            editTodo(id);
        });
    });
    
    // 为子事项展开收起按钮绑定点击事件
    document.querySelectorAll('.toggle-subtasks-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const todoId = e.currentTarget.dataset.todoId;
            const subtasksList = document.getElementById(`subtasks-${todoId}`);
            const icon = btn.querySelector('i');
            const text = btn.textContent.trim();
            
            if (subtasksList) {
                subtasksList.classList.toggle('hidden');
                if (icon) {
                    if (subtasksList.classList.contains('hidden')) {
                        icon.classList.remove('fa-chevron-down');
                        icon.classList.add('fa-chevron-right');
                        btn.innerHTML = '<i class="fas fa-chevron-right"></i> 展开(' + text.match(/\d+/)[0] + ')';
                    } else {
                        icon.classList.remove('fa-chevron-right');
                        icon.classList.add('fa-chevron-down');
                        btn.innerHTML = '<i class="fas fa-chevron-down"></i> 收起(' + text.match(/\d+/)[0] + ')';
                    }
                }
            }
        });
    });
    
    // 为内联添加子事项按钮绑定点击事件
    document.querySelectorAll('.add-subtask-inline-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const todoId = e.currentTarget.dataset.todoId;
            addSubtaskToExistingTodo(todoId);
        });
    });
    
    // 设置子事项拖拽排序
    setupDragAndDrop();
}

// 向现有事项添加子事项
function addSubtaskToExistingTodo(todoId) {
    const todo = todos.find(t => t.id === todoId);
    if (todo) {
        // 如果没有subtasks数组，先创建
        if (!todo.subtasks) {
            todo.subtasks = [];
        }
        
        // 添加新的子事项
        const newSubtaskId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        todo.subtasks.push({
            id: newSubtaskId,
            text: '新子事项',
            completed: false
        });
        
        saveTodos();
        renderTodos();
        
        // 聚焦到新添加的子事项进行编辑
        setTimeout(() => {
            const subtask = document.querySelector(`[data-subtask-id="${newSubtaskId}"]`);
            if (subtask) {
                // 这里可以触发编辑模式
                console.log('新子事项已添加，可在此处实现编辑模式');
            }
        }, 100);
    }
}

// 设置子事项拖拽排序
function setupDragAndDrop() {
    let draggedItem = null;
    
    document.querySelectorAll('.subtask[draggable="true"]').forEach(item => {
        // 拖拽开始
        item.addEventListener('dragstart', (e) => {
            draggedItem = e.target;
            setTimeout(() => {
                e.target.style.opacity = '0.5';
            }, 0);
        });
        
        // 拖拽结束
        item.addEventListener('dragend', (e) => {
            draggedItem = null;
            document.querySelectorAll('.subtask').forEach(subtask => {
                subtask.style.opacity = '1';
                subtask.classList.remove('drag-over');
            });
        });
        
        // 拖拽经过
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            return false;
        });
        
        // 拖拽进入
        item.addEventListener('dragenter', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('subtask') && e.target !== draggedItem) {
                e.target.classList.add('drag-over');
            }
        });
        
        // 拖拽离开
        item.addEventListener('dragleave', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('subtask')) {
                e.target.classList.remove('drag-over');
            }
        });
        
        // 拖拽放置
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('subtask') && e.target !== draggedItem) {
                const todoId = draggedItem.dataset.todoId;
                const draggedSubtaskId = draggedItem.dataset.subtaskId;
                const targetSubtaskId = e.target.dataset.subtaskId;
                
                // 找到对应的todo和子事项
                const todo = todos.find(t => t.id === todoId);
                if (todo && todo.subtasks) {
                    const draggedIndex = todo.subtasks.findIndex(s => s.id === draggedSubtaskId);
                    const targetIndex = todo.subtasks.findIndex(s => s.id === targetSubtaskId);
                    
                    if (draggedIndex !== -1 && targetIndex !== -1) {
                        // 重新排序子事项
                        const [draggedSubtask] = todo.subtasks.splice(draggedIndex, 1);
                        todo.subtasks.splice(targetIndex, 0, draggedSubtask);
                        
                        saveTodos();
                        renderTodos();
                    }
                }
            }
            return false;
        });
    });
}

// 渲染日历
function renderCalendar() {
    calendar.innerHTML = '';
    
    // 设置当前月份显示
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    currentMonthEl.textContent = `${currentDate.getFullYear()}年 ${monthNames[currentDate.getMonth()]}`;
    
    // 获取当月第一天和最后一天
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // 获取当月第一天是星期几（0-6，0是星期日）
    const firstDayIndex = firstDay.getDay();
    
    // 填充日历网格
    // 先填充上个月的日期
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendar.appendChild(emptyDay);
    }
    
    // 获取当月有任务的日期
    const datesWithTasks = new Set();
    todos.forEach(todo => {
        const date = todo.date;
        const dateObj = new Date(date);
        if (dateObj.getMonth() === currentDate.getMonth() && dateObj.getFullYear() === currentDate.getFullYear()) {
            datesWithTasks.add(dateObj.getDate());
        }
    });
    
    // 填充当月的日期
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = i;
        dayEl.dataset.day = i;
        
        // 检查是否是今天
        const today = new Date();
        if (i === today.getDate() && 
            currentDate.getMonth() === today.getMonth() && 
            currentDate.getFullYear() === today.getFullYear()) {
            dayEl.classList.add('today');
        }
        
        // 检查是否是选中的日期
        const selectedDateObj = new Date(selectedDate);
        if (i === selectedDateObj.getDate() && 
            currentDate.getMonth() === selectedDateObj.getMonth() && 
            currentDate.getFullYear() === selectedDateObj.getFullYear()) {
            dayEl.classList.add('selected');
        }
        
        // 检查是否有任务
        if (datesWithTasks.has(i)) {
            dayEl.classList.add('has-tasks');
            dayEl.style.position = 'relative';
        }
        
        // 添加点击事件
        dayEl.addEventListener('click', () => {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            selectedDate = formatDate(date);
            setFilter(selectedDate);
            selectedDateEl.textContent = `选中: ${formatDisplayDate(selectedDate)}`;
            renderCalendar();
        });
        
        calendar.appendChild(dayEl);
    }
}

// 切换到上个月
function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

// 切换到下个月
function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

// 将未完成的任务继承到明天
function inheritToTomorrow() {
    const today = formatDate(new Date());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatDate(tomorrow);
    
    // 找出今天未完成的任务
    const todayUncompletedTasks = todos.filter(todo => 
        todo.date === today && !todo.completed
    );
    
    // 为每个未完成的任务创建一个新的继承任务
    todayUncompletedTasks.forEach(task => {
        const inheritedTask = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            text: task.text, // 保持原始文本格式（已使用"-"连接）
            type: task.type,
            object: task.object,
            action: task.action,
            completed: false,
            date: tomorrowStr,
            createdAt: task.createdAt,
            inherited: true,
            subtasks: task.subtasks ? task.subtasks.map(subtask => ({
                ...subtask,
                completed: false
            })) : []
        };
        todos.push(inheritedTask);
    });
    
    saveTodos();
    renderTodos();
    renderCalendar();
    
    // 显示提示
    alert(`已将 ${todayUncompletedTasks.length} 个未完成的任务继承到明天！`);
}

// 添加示例任务（仅当没有任务时）
function addSampleTasks() {
    if (todos.length === 0) {
        const today = formatDate(new Date());
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = formatDate(yesterday);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = formatDate(tomorrow);
        
        const sampleTasks = [
            {
                id: 'sample-1',
                text: '工作 - 项目提案 - 完成初稿', // 使用"-"连接
                type: '工作',
                object: '项目提案',
                action: '完成初稿',
                completed: false,
                date: today,
                createdAt: today,
                inherited: false,
                subtasks: [
                    {
                        id: 'sub-1-1',
                        text: '收集项目需求',
                        completed: false
                    },
                    {
                        id: 'sub-1-2',
                        text: '撰写项目概述',
                        completed: false
                    },
                    {
                        id: 'sub-1-3',
                        text: '制定时间表',
                        completed: false
                    }
                ]
            },
            {
                id: 'sample-2',
                text: '工作 - 重要邮件 - 回复客户', // 使用"-"连接
                type: '工作',
                object: '重要邮件',
                action: '回复客户',
                completed: true,
                date: today,
                createdAt: today,
                inherited: false,
                subtasks: [
                    {
                        id: 'sub-2-1',
                        text: '确认会议时间',
                        completed: true
                    },
                    {
                        id: 'sub-2-2',
                        text: '发送会议议程',
                        completed: true
                    }
                ]
            },
            {
                id: 'sample-3',
                text: '学习 - 会议材料 - 准备演示文稿', // 使用"-"连接
                type: '学习',
                object: '会议材料',
                action: '准备演示文稿',
                completed: false,
                date: yesterdayStr,
                createdAt: yesterdayStr,
                inherited: true,
                subtasks: [
                    {
                        id: 'sub-3-1',
                        text: '整理数据',
                        completed: true
                    },
                    {
                        id: 'sub-3-2',
                        text: '制作PPT',
                        completed: false
                    }
                ]
            },
            {
                id: 'sample-4',
                text: '生活 - 身体健康 - 锻炼30分钟', // 使用"-"连接
                type: '生活',
                object: '身体健康',
                action: '锻炼30分钟',
                completed: false,
                date: tomorrowStr,
                createdAt: tomorrowStr,
                inherited: false,
                subtasks: [
                    {
                        id: 'sub-4-1',
                        text: '热身10分钟',
                        completed: false
                    },
                    {
                        id: 'sub-4-2',
                        text: '有氧运动20分钟',
                        completed: false
                    }
                ]
            }
        ];
        
        todos = sampleTasks;
        saveTodos();
        renderTodos();
        renderCalendar();
    }
}

// 添加Tab键切换功能
function setupTabNavigation() {
    const inputs = [todoType, todoObject, todoAction];
    
    inputs.forEach((input, index) => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const nextIndex = (index + 1) % inputs.length;
                inputs[nextIndex].focus();
            }
        });
    });
}

// 初始化应用
function initApp() {
    // 加载待办事项
    loadTodos();
    
    // 添加示例任务（如果没有任务）
    setTimeout(addSampleTasks, 100);
    
    // 初始化日历
    renderCalendar();
    
    // 初始化子事项输入区域
    renderSubtasks();
    
    // 设置Tab键导航
    setupTabNavigation();
    
    // 添加事件监听器（添加null检查）
    if (addBtn) addBtn.addEventListener('click', addTodo);
    if (addSubtaskBtn) addSubtaskBtn.addEventListener('click', addSubtask);
    
    // 按Enter键添加待办事项
    [todoType, todoObject, todoAction].forEach(input => {
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addTodo();
                }
            });
        }
    });
    
    // 为筛选按钮添加事件监听器
    if (filterBtns) {
        filterBtns.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    const filter = btn.dataset.filter;
                    setFilter(filter);
                    
                    // 更新选中日期显示
                    if (selectedDateEl) {
                        if (filter === 'all') {
                            selectedDateEl.textContent = '所有日期';
                        } else if (filter === 'today') {
                            selectedDateEl.textContent = '今天';
                        } else if (filter === 'active' || filter === 'completed') {
                            selectedDateEl.textContent = '所有日期';
                        } else {
                            selectedDate = filter;
                            selectedDateEl.textContent = `选中: ${formatDisplayDate(selectedDate)}`;
                            renderCalendar();
                        }
                    }
                });
            }
        });
    }
    
    // 为清除按钮添加事件监听器
    if (clearBtn) clearBtn.addEventListener('click', clearCompleted);
    
    // 为继承按钮添加事件监听器
    if (inheritBtn) inheritBtn.addEventListener('click', inheritToTomorrow);
    
    // 为月份切换按钮添加事件监听器
    if (prevMonthBtn) prevMonthBtn.addEventListener('click', prevMonth);
    if (nextMonthBtn) nextMonthBtn.addEventListener('click', nextMonth);
}

// 启动应用
initApp();