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
// Update character attributes
function submitForm() {
    const formData = {
        strength: document.getElementById('strength').value,
        agility: document.getElementById('agility').value,
        endurance: document.getElementById('constitution').value, // Change 'endurance' to 'constitution'
        intelligence: document.getElementById('intelligence').value,
        wisdom: document.getElementById('wisdom').value,
        charisma: document.getElementById('charisma').value,
        luck: document.getElementById('luck').value,
        creativity: document.getElementById('creativity').value
    };

    // Remove empty fields
    Object.keys(formData).forEach(key => {
        if (!formData[key]) {
            delete formData[key];
        }
    });

    // If no fields are filled, alert and exit
    if (Object.keys(formData).length === 0) {
        alert("请至少填写一个字段！");
        return;
    }

    fetch('https://18.183.175.8/update_user_attributes/rex', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (response.ok) {
            // Request successful, show success message
            alert("更新成功！");
            return response.json();
        } else {
            // Request failed, throw error
            throw new Error("更新失败！");
        }
    })
    .then(data => console.log(data))
    .catch(error => {
        // Show error message on request failure
        alert(error.message || "更新失败，请稍后重试！");
        console.error('Error:', error);
    });
}

// Query character attributes
function queryAttributes() {
    const username = document.getElementById('queryUsername').value;
    fetch(`https://18.183.175.8/get_user_attributes/${username}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const resultDiv = document.getElementById('queryResult');
        if (data.attributes) {
            resultDiv.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        } else {
            resultDiv.innerHTML = `<p>${data.message || 'Error occurred'}</p>`;
        }
    })
    .catch(error => console.error('Error:', error));
}
// Update attribute value and refresh radar chart
function updateAttribute(attr, delta) {
    const input = document.getElementById(attr);
    const newValue = Math.max(0, Math.min(5, parseInt(input.value) + delta));
    input.value = newValue;
    updateRadarChart();
    submitForm(); // Update attributes on the server
}
