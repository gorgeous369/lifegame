// 页面加载时获取属性并更新雷达图
window.onload = function () {
    fetchAttributes();
};

window.hasUnsavedChanges = false;

// ------------------ 监听 beforeunload 事件，提示用户未保存就离开 ------------------ //
window.addEventListener('beforeunload', (event) => {
    // 如果没有未保存的改动，则不需要提示
    if (!window.hasUnsavedChanges) return;

    // 有未保存修改时，阻止默认卸载
    event.preventDefault();
    // 某些浏览器需要设置 event.returnValue
    event.returnValue = '';
    // 这里会触发浏览器显示默认提示（文本不可自定义）
});

// ------------------ 属性增减函数 ------------------ //
function increment(id) {
    const input = document.getElementById(id);
    if (parseInt(input.value) < 100) {
        input.value = parseInt(input.value) + 1;
        updateAttribute(id, 0); // 触发雷达图更新
    }
}

function decrement(id) {
    const input = document.getElementById(id);
    if (parseInt(input.value) > 0) {
        input.value = parseInt(input.value) - 1;
        updateAttribute(id, 0); // 触发雷达图更新
    }
}

// ------------------ 技能增减函数 ------------------ //
function incrementSkill(button) {
    const input = button.previousElementSibling;
    if (parseInt(input.value) < 100) {
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
        <button class="delete-btn" onclick="deleteSkill(this)">删除</button>
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

// ------------------ 动态添加/删除任务行 ------------------ //
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

function deleteTask(button) {
    const task = button.parentElement;
    task.remove();
}

// ------------------ 时间显示 ------------------ //
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
setInterval(updateDateTime, 100);

// ------------------ 雷达图初始化 ------------------ //
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
                max: 100,
            },
        },
    },
});

// ------------------ 更新雷达图函数 ------------------ //
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
        return parseInt(document.getElementById(attr).value) || 0;
    });
    radarChart.update();
}

// ------------------ fetchAttributes() & saveAttributes() ------------------ //
function fetchAttributes() {
    fetch(`https://18.183.175.8/get_user_attributes/rex`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.attributes) {
            const attributes = data.attributes;
            Object.keys(attributes).forEach(key => {
                const input = document.getElementById(key);
                if (input) {
                    input.value = attributes[key];
                }
            });
            document.getElementById('queryResult').textContent = '属性已加载';
        } else {
            document.getElementById('queryResult').textContent = '未找到属性';
        }
        // 加载完属性后更新雷达图
        updateRadarChart();
    })
    .catch(error => console.error('Error:', error));
}

function updateAttribute(attr, delta) {
    const input = document.getElementById(attr);
    if (input) {
        let newValue = parseInt(input.value) || 0;
        newValue += delta; // 可以根据需要，若不在这里加，就直接用 input.value
        newValue = Math.max(0, Math.min(100, newValue));
        input.value = newValue;
    }
    // 更新雷达图
    updateRadarChart();
}

// 提交更新
const ALLOWED_KEYS = [
    'strength',
    'agility',
    'constitution',
    'intelligence',
    'wisdom',
    'charisma',
    'luck',
    'creativity'
];

function saveAttributes() {
    // 收集所有输入框
    const rawAttributes = {};
    document.querySelectorAll('#attributes-list input').forEach(input => {
        rawAttributes[input.id] = parseInt(input.value) || 0;
    });

    // 过滤只保留我们关心的 8 个属性
    const attributes = {};
    ALLOWED_KEYS.forEach(key => {
        // 如果 rawAttributes 里存在这个键，就保留下来
        if (key in rawAttributes) {
            attributes[key] = rawAttributes[key];
        }
    });

    // 发送给后端
    fetch('https://18.183.175.8/update_user_attributes/rex', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(attributes)
    })
    .then(response => {
        if (response.ok) {
            console.log('属性已成功保存！');
            window.hasUnsavedChanges = false;
        } else {
            throw new Error('保存失败！');
        }
    })
    .catch(error => console.error(error.message));
}

function updateAttribute(attr, delta) {
    const input = document.getElementById(attr);
    if (input) {
      let newValue = parseInt(input.value) || 0;
      newValue += delta; 
      // 这里假设属性最高值是 100，最低值是 0
      newValue = Math.max(0, Math.min(100, newValue));
      input.value = newValue;
    }
    window.hasUnsavedChanges = true;
    // 更新雷达图
    updateRadarChart();
  }