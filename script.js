// DOM元素
const todoInput = document.getElementById('todo-input');
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
    const text = todoInput.value.trim();
    const date = todoDate.value || formatDate(new Date());
    if (text) {
        const newTodo = {
            id: Date.now().toString(),
            text,
            completed: false,
            date: date,
            createdAt: date, // 记录原始创建日期
            inherited: false // 是否是继承的任务
        };
        todos.push(newTodo);
        todoInput.value = '';
        saveTodos();
        renderTodos();
        renderCalendar(); // 添加任务后更新日历显示
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
        
        li.innerHTML = `
            <input type="checkbox" id="todo-${todo.id}" ${todo.completed ? 'checked' : ''}>
            <label for="todo-${todo.id}">${todo.text}</label>
            <span class="todo-date">${displayDate}</span>
            ${inheritedBadge}
            <button class="delete-btn" data-id="${todo.id}">
                <i class="fas fa-times"></i>
            </button>
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
    // 为复选框绑定点击事件
    document.querySelectorAll('#todo-list input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const id = e.target.id.replace('todo-', '');
            toggleTodo(id);
        });
    });
    
    // 为删除按钮绑定点击事件
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            deleteTodo(id);
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
            text: task.text,
            completed: false,
            date: tomorrowStr,
            createdAt: task.createdAt,
            inherited: true
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
                text: '完成项目提案',
                completed: false,
                date: today,
                createdAt: today,
                inherited: false
            },
            {
                id: 'sample-2',
                text: '回复重要邮件',
                completed: true,
                date: today,
                createdAt: today,
                inherited: false
            },
            {
                id: 'sample-3',
                text: '准备会议材料',
                completed: false,
                date: yesterdayStr,
                createdAt: yesterdayStr,
                inherited: true
            },
            {
                id: 'sample-4',
                text: '锻炼30分钟',
                completed: false,
                date: tomorrowStr,
                createdAt: tomorrowStr,
                inherited: false
            }
        ];
        
        todos = sampleTasks;
        saveTodos();
        renderTodos();
        renderCalendar();
    }
}

// 初始化应用
function initApp() {
    // 加载待办事项
    loadTodos();
    
    // 添加示例任务（如果没有任务）
    setTimeout(addSampleTasks, 100);
    
    // 初始化日历
    renderCalendar();
    
    // 添加事件监听器
    addBtn.addEventListener('click', addTodo);
    
    // 按Enter键添加待办事项
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
    
    // 为筛选按钮添加事件监听器
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            setFilter(filter);
            
            // 更新选中日期显示
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
        });
    });
    
    // 为清除按钮添加事件监听器
    clearBtn.addEventListener('click', clearCompleted);
    
    // 为继承按钮添加事件监听器
    inheritBtn.addEventListener('click', inheritToTomorrow);
    
    // 为月份切换按钮添加事件监听器
    prevMonthBtn.addEventListener('click', prevMonth);
    nextMonthBtn.addEventListener('click', nextMonth);
}

// 启动应用
initApp();