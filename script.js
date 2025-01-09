function increment(id) {
    const input = document.getElementById(id);
    if (parseInt(input.value) < 5) {
        input.value = parseInt(input.value) + 1;
    }
}

function decrement(id) {
    const input = document.getElementById(id);
    if (parseInt(input.value) > 0) {
        input.value = parseInt(input.value) - 1;
    }
}

function incrementSkill(button) {
    const input = button.previousElementSibling;
    if (parseInt(input.value) < 5) {
        input.value = parseInt(input.value) + 1;
    }
}

function decrementSkill(button) {
    const input = button.nextElementSibling;
    if (parseInt(input.value) > 0) {
        input.value = parseInt(input.value) - 1;
    }
}

function addSkill() {
    const skillsList = document.getElementById("skills-list");
    const newSkill = document.createElement("li");
    newSkill.innerHTML = `
        <input type="text" placeholder="技能名称" class="skill-name">
        <button class="control-btn" onclick="decrementSkill(this)">-</button>
        <input type="text" value="0" class="value" readonly>
        <button class="control-btn" onclick="incrementSkill(this)">+</button>
        <button class="delete-btn" onclick="deleteTask(this)">删除</button>
    `;
    skillsList.appendChild(newSkill);
}

function deleteSkill(button) {
    const task = button.parentElement;
    task.remove();
}

function showTooltip(message) {
    alert(message);
}

// 动态添加任务行
function addTask() {
    const goalsList = document.getElementById("goals-list");
    const newTask = document.createElement("li");

    newTask.innerHTML = `
        <input type="text" placeholder="任务名称" class="task-name">
        开始日期: <input type="date" class="task-date">
        结束日期: <input type="date" class="task-date">
        <button class="delete-btn" onclick="deleteTask(this)">删除</button>
    `;

    goalsList.appendChild(newTask);
}

// 删除任务行
function deleteTask(button) {
    const task = button.parentElement;
    task.remove();
}

function updateDateTime() {
    const now = new Date();
    const formattedTime = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('datetime').textContent = formattedTime;
}

// 每秒更新一次时间
setInterval(updateDateTime, 100);

const ctx = document.getElementById('radarChart').getContext('2d');
const radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
        labels: ['体力', '敏捷', '体质', '智力', '精神', '魅力', '幸运', '创造力'],
        datasets: [{
            label: '角色属性',
            data: [0, 0, 0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
        }],
    },
    options: {
        responsive: true,
        scales: {
            r: {
                beginAtZero: true,
                max: 5,
            },
        },
    },
});

// 更新雷达图函数
function updateRadarChart() {
    const attributes = [
        'strength',
        'agility',
        'constitution',
        'intelligence',
        'wisdom',
        'charisma',
        'luck',
        'creativity',
    ];
    radarChart.data.datasets[0].data = attributes.map(attr => {
        return parseInt(document.getElementById(attr).value);
    });
    radarChart.update();
}

// 更新属性值并刷新雷达图
function updateAttribute(attr, delta) {
    const input = document.getElementById(attr);
    const newValue = Math.max(0, Math.min(5, parseInt(input.value) + delta));
    input.value = newValue;
    updateRadarChart();
}