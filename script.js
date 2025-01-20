/********************************************************
 * 全局设置
 ********************************************************/
const SERVER_URL = 'https://18.183.175.8'; // 后端服务器地址
const CURRENT_USERNAME = 'rex';            // 当前用户(示例)

/********************************************************
 * 页面加载时运行
 ********************************************************/
window.onload = function () {
    // 1. 加载用户属性 & 更新雷达图
    initializeStatusCharts();
    fetchAttributes();
    fetchSkills();
    fetchBonus();
    fetchCurrentPoint();
    fetchTasks();
    fetchStatus(); // 加载用户状态
    // 绑定“添加技能”按钮事件
    document.getElementById('btnAddSkill').addEventListener('click', onAddSkillClicked);
};

window.hasUnsavedChanges = false;

// 当用户关闭或刷新页面时，如果有未保存数据，做提示
window.addEventListener('beforeunload', (event) => {
    if (!window.hasUnsavedChanges) return;
    event.preventDefault();
    event.returnValue = '';
});

/********************************************************
 * 时间显示
 ********************************************************/
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

/********************************************************
 * 属性面板 (含雷达图)
 ********************************************************/
// 初始化雷达图
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

// 更新雷达图数据
function updateRadarChart() {
    const attributes = [
        'strength',
        'agility',
        'endurance',
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

// 属性增减
function increment(id) {
    const input = document.getElementById(id);
    if (parseInt(input.value) < 100) {
        input.value = parseInt(input.value) + 1;
        updateAttribute(id, 0);
    }
}

function decrement(id) {
    const input = document.getElementById(id);
    if (parseInt(input.value) > 0) {
        input.value = parseInt(input.value) - 1;
        updateAttribute(id, 0);
    }
}

// 更新属性值（带雷达图刷新）
function updateAttribute(attr, delta) {
    const input = document.getElementById(attr);
    if (input) {
        let newValue = parseInt(input.value) || 0;
        newValue += delta;
        newValue = Math.max(0, Math.min(100, newValue));
        input.value = newValue;
    }
    window.hasUnsavedChanges = true;
    updateRadarChart();
}

// 从后端获取属性
function fetchAttributes() {
    fetch(`${SERVER_URL}/get_user_attributes/${CURRENT_USERNAME}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
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

// 提交属性更新
function saveAttributes() {
    const ALLOWED_KEYS = [
        'strength',
        'agility',
        'endurance',
        'intelligence',
        'wisdom',
        'charisma',
        'luck',
        'creativity'
    ];

    // 收集所有输入框
    const rawAttributes = {};
    document.querySelectorAll('#attributes-list input').forEach(input => {
        rawAttributes[input.id] = parseInt(input.value) || 0;
    });

    // 过滤只保留我们关心的 8 个属性
    const attributes = {};
    ALLOWED_KEYS.forEach(key => {
        if (key in rawAttributes) {
            attributes[key] = rawAttributes[key];
        }
    });

    // 发送给后端
    fetch(`${SERVER_URL}/update_user_attributes/${CURRENT_USERNAME}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

// 提示信息
function showTooltip(message) {
    alert(message);
}

/********************************************************
 * 技能面板
 ********************************************************/

function fetchSkills() {
    fetch(`${SERVER_URL}/get_skill_by_user/${CURRENT_USERNAME}`, {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('后端返回:', data);
    
        // 验证 skill_list 是否存在且是数组
        if (!data.skill_list || !Array.isArray(data.skill_list)) {
            throw new Error('后端返回格式不符合预期，skill_list 不存在或不是数组');
        }
        
        // 这里才可安全调用 forEach
        const skillArr = data.skill_list;
    
        // 清空当前列表
        const ul = document.getElementById('skills-list');
        ul.innerHTML = '';
    
        // 遍历技能数组
        skillArr.forEach(skill => {
            // 创建 <li>
            const li = document.createElement('li');
            // 显示格式可以自由调整，这里示例为 “写作 (4)”
            li.textContent = `${skill.skillname} (${skill.proficiency}) `;
    
            // 删除按钮
            const btnDelete = document.createElement('button');
            btnDelete.textContent = '删除';
            btnDelete.onclick = function() {
                deleteSkill(skill.skillname, li);
            };
            li.appendChild(btnDelete);
    
            // 将 li 加到 ul
            ul.appendChild(li);
        });
    })
    .catch(error => {
        console.error('加载技能出错：', error);
        alert('加载技能出错：' + error.message);
    });
}

/**********************************************
 * 2. 添加技能
 **********************************************/
function onAddSkillClicked() {
    // 简单用 prompt 获取技能名称与熟练度
    const skillName = prompt('请输入技能名称:');
    if (!skillName) return; // 用户取消或空输入则不继续

    const profStr = prompt('请输入技能熟练度(数字):', '0');
    const proficiency = parseInt(profStr, 10) || 0;

    addSkill(skillName.trim(), proficiency);
}

/** 向后端发送添加技能请求 */
function addSkill(skillName, proficiency) {
    const payload = {
        username: CURRENT_USERNAME,
        skillname: skillName,
        proficiency: proficiency
    };

    fetch(`${SERVER_URL}/add_skill`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`添加技能失败: ${response.status}`);
        }
        return response.json(); // 假设返回 { "status": "ok" } 之类
    })
    .then(data => {
        console.log('添加技能成功:', data);
        // 添加成功后重新拉取刷新页面
        fetchSkills();
    })
    .catch(err => {
        console.error('添加技能出错：', err);
        alert('添加技能出错：' + err.message);
    });
}

/**********************************************
 * 3. 删除技能
 **********************************************/
function deleteSkill(skillName, liElement) {
    // 调用后端的删除接口
    fetch(`${SERVER_URL}/delete_skill_by_user/${CURRENT_USERNAME}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillname: skillName })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`删除技能失败: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('删除技能成功:', data);
        // 同步从页面移除
        if (liElement && liElement.parentNode) {
            liElement.parentNode.removeChild(liElement);
        }
    })
    .catch(err => {
        console.error('删除技能出错：', err);
        alert('删除技能出错：' + err.message);
    });
}

/**
 * ===== 前端本地操作，用于UI中 + - 按钮控制技能熟练度 =====
 */

// 在 <li> 中的“+”按钮点击时调用
function incrementSkill(button) {
    const input = button.previousElementSibling;
    if (parseInt(input.value) < 100) {
        input.value = parseInt(input.value) + 1;
    }
}

// 在 <li> 中的“-”按钮点击时调用
function decrementSkill(button) {
    const input = button.nextElementSibling;
    if (parseInt(input.value) > 0) {
        input.value = parseInt(input.value) - 1;
    }
}

/**
 * 在前端界面新增一行空白技能，让用户自行填写
 * 注意：此处只是前端UI上的添加行，真正插入数据库需要点“保存到服务器”逻辑
 */
function addSkillRow() {
    const skillsList = document.getElementById("skills-list");
    const newSkill = document.createElement("li");
    newSkill.innerHTML = `
        <input type="text" placeholder="技能名称" class="skill-name">
        <button class="control-btn" onclick="decrementSkill(this)">-</button>
        <input type="text" value="0" class="value" readonly>
        <button class="control-btn" onclick="incrementSkill(this)">+</button>
        <button class="delete-btn" onclick="this.parentElement.remove()">删除(仅前端)</button>
        <button class="delete-btn" onclick="saveNewSkill(this)">保存到服务器</button>
    `;
    skillsList.appendChild(newSkill);
}

/**
 * 将刚刚添加的技能行保存到服务器
 */
function saveNewSkill(button) {
    const li = button.parentElement;
    if (!li) return;

    const skillNameInput = li.querySelector(".skill-name");
    const proficiencyInput = li.querySelector(".value");

    const skillName = skillNameInput.value.trim();
    const proficiency = parseInt(proficiencyInput.value, 10);

    // 调用添加接口
    addSkillToServer(skillName, proficiency);
}

/********************************************************
 * 角色状态面板 (如有需要可自行完善)
 ********************************************************/
function updateStatus(id, delta) {
    const input = document.getElementById(id);
    if (input) {
        let newValue = parseInt(input.value) || 0;
        newValue += delta; 
        newValue = Math.max(0, Math.min(100, newValue));
        input.value = newValue;
    }
    window.hasUnsavedChanges = true;
}
function saveStatus() {
    // TODO: 与后端交互保存角色状态
    console.log("角色状态保存成功(示例)");
    window.hasUnsavedChanges = false;
}

/********************************************************
 * 目标及任务 (示例)
 ********************************************************/
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
    if (button && button.parentElement) {
        button.parentElement.remove();
    }
}

/**********************************************
 * bonus 增删查
 **********************************************/

/**
 * 查询并加载当前用户的所有 bonus
 */
function fetchBonus() {
    // 假设后端接口是 /get_bonus_by_user/<username>
    fetch(`${SERVER_URL}/get_bonus_by_user/${CURRENT_USERNAME}`, {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`查询 bonus 失败: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('后端返回:', data);

        // 验证 bonus_list 是否存在且是数组
        if (!data.bonus_list || !Array.isArray(data.bonus_list)) {
            throw new Error('后端返回格式不符合预期，bonus_list 不存在或不是数组');
        }
        
        // 清空当前列表
        const ul = document.getElementById('bonus-list');
        ul.innerHTML = '';
    
        // 遍历 bonus 数组
        data.bonus_list.forEach(b => {
            // 创建 <li>
            const li = document.createElement('li');
            // 显示格式示例: “奖励名称(积分)”
            li.textContent = `${b.bonusname} (${b.bonuspoint})`;

            // 删除按钮
            const btnDelete = document.createElement('button');
            btnDelete.textContent = '删除';
            btnDelete.onclick = function() {
                deleteBonus(b.bonusid, li);
            };
            li.appendChild(btnDelete);
    
            // 将 li 加到 ul
            ul.appendChild(li);
        });
    })
    .catch(error => {
        console.error('加载 bonus 出错：', error);
        alert('加载 bonus 出错：' + error.message);
    });
}

/**
 * 添加一条 bonus
 */
function onAddBonusClicked() {
    // 简单用 prompt 获取 bonus 名称
    const bonusName = prompt('请输入 bonus 名称:');
    if (!bonusName) return; // 用户取消或空输入则不继续

    // 获取积分
    const pointStr = prompt('请输入 bonus 积分(数字):', '0');
    const bonusPoint = parseInt(pointStr, 10) || 0;

    addBonus(bonusName.trim(), bonusPoint);
}

/** 向后端发送添加 bonus 请求 */
function addBonus(bonusName, bonusPoint) {
    const payload = {
        username: CURRENT_USERNAME,
        bonusname: bonusName,
        bonuspoint: bonusPoint
    };

    // 假设后端接口是 /add_bonus
    fetch(`${SERVER_URL}/add_bonus`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`添加 bonus 失败: ${response.status}`);
        }
        return response.json(); // 假设返回 { "status": "ok" } 之类
    })
    .then(data => {
        console.log('添加 bonus 成功:', data);
        // 添加成功后重新拉取刷新页面
        fetchBonus();
    })
    .catch(err => {
        console.error('添加 bonus 出错：', err);
        alert('添加 bonus 出错：' + err.message);
    });
}

/**
 * 删除一条 bonus
 */
function deleteBonus(bonusId) {
    // 调用后端的删除接口
    fetch(`${SERVER_URL}/delete_bonus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: CURRENT_USERNAME, bonusid: bonusId }) // 包含 username 和 bonusid
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('未找到要删除的 Bonus。');
            } else {
                throw new Error(`删除 bonus 失败: ${response.status}`);
            }
        }
        return response.json();
    })
    .then(data => {
        console.log('删除 bonus 成功:', data);
        // 成功后重新加载列表
        fetchBonus();
    })
    .catch(err => {
        console.error('删除 bonus 出错：', err.message);
        alert('删除 bonus 出错：' + err.message);
    });
}



function fetchCurrentPoint() {
    // 假设后端接口是 /get_user_point/<username>
    fetch(`${SERVER_URL}/get_user_point/${CURRENT_USERNAME}`, {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`查询 currentpoint 失败: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('后端返回:', data);

        // 验证返回的对象是否包含 currentpoint
        if (!data.currentpoint) {
            throw new Error('后端返回格式不符合预期或 currentpoint 不存在');
        }
        
        // 更新页面上的积分显示
        const pointDisplay = document.getElementById('current-point');
        pointDisplay.textContent = `当前积分: ${data.currentpoint}`;
    })
    .catch(error => {
        console.error('加载 currentpoint 出错：', error);
        alert('加载 currentpoint 出错：' + error.message);
    });
}

/**********************************************
 * tasks 增删查
 **********************************************/

/**
 * 查询并加载当前用户的所有 tasks
 */
function fetchTasks() {
    // 假设后端接口是 /get_tasks
    fetch(`${SERVER_URL}/get_tasks`, {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`查询 tasks 失败: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('后端返回:', data);

        // 验证 tasks 是否存在且是数组
        if (!data.tasks || !Array.isArray(data.tasks)) {
            throw new Error('后端返回格式不符合预期，tasks 不存在或不是数组');
        }
        
        // 清空当前列表
        const ul = document.getElementById('tasks-list');
        ul.innerHTML = '';
    
        // 创建表格
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        // 添加标题行
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th style="border: 1px solid #ccc; padding: 10px;">任务名称</th>
                <th style="border: 1px solid #ccc; padding: 10px;">任务等级</th>
                <th style="border: 1px solid #ccc; padding: 10px;">积分</th>
                <th style="border: 1px solid #ccc; padding: 10px;">属性</th>
                <th style="border: 1px solid #ccc; padding: 10px;">技能</th>
                <th style="border: 1px solid #ccc; padding: 10px;">奖励</th>
                <th style="border: 1px solid #ccc; padding: 10px;">开始时间</th>
                <th style="border: 1px solid #ccc; padding: 10px;">结束时间</th>
                <th style="border: 1px solid #ccc; padding: 10px;">状态</th>
                <th style="border: 1px solid #ccc; padding: 10px;">操作</th>
            </tr>
        `;
        table.appendChild(thead);

        // 添加任务行
        const tbody = document.createElement('tbody');
        data.tasks.forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="border: 1px solid #ccc; padding: 10px;">${t.taskname}</td>
                <td style="border: 1px solid #ccc; padding: 10px;">${t.tasklevel}</td>
                <td style="border: 1px solid #ccc; padding: 10px;">${t.point}</td>
                <td style="border: 1px solid #ccc; padding: 10px;">${JSON.stringify(t.attribute)}</td>
                <td style="border: 1px solid #ccc; padding: 10px;">${JSON.stringify(t.skill)}</td>
                <td style="border: 1px solid #ccc; padding: 10px;">${t.bonus}</td>
                <td style="border: 1px solid #ccc; padding: 10px;">${t.starttime}</td>
                <td style="border: 1px solid #ccc; padding: 10px;">${t.endtime}</td>
                <td style="border: 1px solid #ccc; padding: 10px;">${t.status}</td>
                <td style="border: 1px solid #ccc; padding: 10px;">
                    <button onclick="deleteTask(${t.taskid})" style="padding: 5px 10px; border: none; border-radius: 5px; background-color: #e74c3c; color: white;">删除</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        // 将表格添加到 ul
        ul.appendChild(table);
    })
    .catch(error => {
        console.error('加载 tasks 出错：', error);
        alert('加载 tasks 出错：' + error.message);
    });
}

/**
 * 添加一条 task
 */
function onAddTaskClicked() {
    // 简单用 prompt 获取 task 名称
    const taskName = prompt('请输入 task 名称:');
    if (!taskName) return; // 用户取消或空输入则不继续

    // 获取任务等级
    const taskLevelStr = prompt('请输入 task 等级(数字):', '1');
    const taskLevel = parseInt(taskLevelStr, 10) || 1;

    // 获取积分
    const pointStr = prompt('请输入 task 积分(数字):', '0');
    const taskPoint = parseInt(pointStr, 10) || 0;

    // 获取属性
    const attributeStr = prompt('请输入 task 属性(JSON):', '{"wisdom":1}');
    const attribute = JSON.parse(attributeStr);

    // 获取技能
    const skillStr = prompt('请输入 task 技能(JSON):', '{"写作":1}');
    const skill = JSON.parse(skillStr);

    // 获取奖励
    const bonusStr = prompt('请输入 task 奖励(数字):', '0');
    const bonus = parseInt(bonusStr, 10) || 0;

    // 获取开始时间
    const startTime = prompt('请输入 task 开始时间:', '2025-01-19 15:30:00');

    // 获取结束时间
    const endTime = prompt('请输入 task 结束时间:', '2025-01-19 16:30:00');

    // 获取状态
    const statusStr = prompt('请输入 task 状态(数字):', '0');
    const status = parseInt(statusStr, 10) || 0;

    addTask(taskName.trim(), taskLevel, taskPoint, attribute, skill, bonus, startTime, endTime, status);
}

/** 向后端发送添加 task 请求 */
function addTask(taskName, taskLevel, taskPoint, attribute, skill, bonus, startTime, endTime, status) {
    const payload = {
        username: CURRENT_USERNAME,
        taskname: taskName,
        tasklevel: taskLevel,
        point: taskPoint,
        attribute: attribute,
        skill: skill,
        bonus: bonus,
        starttime: startTime,
        endtime: endTime,
        status: status
    };

    // 假设后端接口是 /add_task
    fetch(`${SERVER_URL}/add_task`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`添加 task 失败: ${response.status}`);
        }
        return response.json(); // 假设返回 { "status": "ok" } 之类
    })
    .then(data => {
        console.log('添加 task 成功:', data);
        // 添加成功后重新拉取刷新页面
        fetchTasks();
    })
    .catch(err => {
        console.error('添加 task 出错：', err);
        alert('添加 task 出错：' + err.message);
    });
}

/**
 * 删除一条 task
 */
function deleteTask(taskId) {
    // 调用后端的删除接口
    fetch(`${SERVER_URL}/delete_task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: CURRENT_USERNAME, taskid: taskId }) // 包含 username 和 taskid
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('未找到要删除的 Task。');
            } else {
                throw new Error(`删除 task 失败: ${response.status}`);
            }
        }
        return response.json();
    })
    .then(data => {
        console.log('删除 task 成功:', data);
        // 成功后重新加载列表
        fetchTasks();
    })
    .catch(err => {
        console.error('删除 task 出错：', err.message);
        alert('删除 task 出错：' + err.message);
    });
}

/********************************************************
 * 状态面板
 ********************************************************/

// 初始化条形图
let statusCharts = {};

function initializeStatusCharts() {
    const statuses = ['health', 'energy', 'fatigue', 'mental'];
    const colors = {
        health: 'rgba(255, 99, 132, 0.2)',
        energy: 'rgba(54, 162, 235, 0.2)',
        fatigue: 'rgba(255, 159, 64, 0.2)',
        mental: 'rgba(75, 192, 192, 0.2)'
    };
    const borderColors = {
        health: 'rgba(255, 99, 132, 1)',
        energy: 'rgba(54, 162, 235, 1)',
        fatigue: 'rgba(255, 159, 64, 1)',
        mental: 'rgba(75, 192, 192, 1)'
    };
    statuses.forEach(status => {
        const ctx = document.getElementById(`${status}Chart`).getContext('2d');
        statusCharts[status] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [''],
                datasets: [{
                    label: status,
                    data: [0],
                    backgroundColor: colors[status],
                    borderColor: borderColors[status],
                    borderWidth: 2,
                }],
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                            stepSize: 1, // 只显示整数刻度
                            padding: 2 // 调整刻度之间的间隔长度
                        }
                    },
                    y: {
                        display: false,
                    },
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                },
            },
        });
    });
}

// 更新条形图数据
function updateStatusCharts() {
    const statuses = ['health', 'energy', 'fatigue', 'mental'];
    statuses.forEach(status => {
        if (statusCharts[status]) {
            statusCharts[status].data.datasets[0].data[0] = parseInt(document.getElementById(status).value) || 0;
            statusCharts[status].update();
        }
    });
}

// 状态增减
function incrementStatus(id) {
    const input = document.getElementById(id);
    if (parseInt(input.value) < 5) {
        input.value = parseInt(input.value) + 1;
        updateStatus(id, 0);
    }
}

function decrementStatus(id) {
    const input = document.getElementById(id);
    if (parseInt(input.value) > 0) {
        input.value = parseInt(input.value) - 1;
        updateStatus(id, 0);
    }
}

// 更新状态值（带条形图刷新）
function updateStatus(status, delta) {
    const input = document.getElementById(status);
    if (input) {
        let newValue = parseInt(input.value) || 0;
        newValue += delta;
        newValue = Math.max(0, Math.min(5, newValue));
        input.value = newValue;
    }
    window.hasUnsavedChanges = true;
    updateStatusCharts();
}

// 从后端获取状态
function fetchStatus() {
    fetch(`${SERVER_URL}/get_user_status/${CURRENT_USERNAME}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status) {
            const status = data.status;
            Object.keys(status).forEach(key => {
                const input = document.getElementById(key);
                if (input) {
                    input.value = status[key];
                }
                const select = document.getElementById(`${key}-select`);
                if (select) {
                    for (const option of select.options) {
                        if (parseInt(option.value, 10) === status[key]) {
                            option.selected = true;
                            break;
                        }
                    }
                }
            });
            document.getElementById('queryResult').textContent = '状态已加载';
            // 更新条形图数据
            updateStatusCharts();
        } else {
            document.getElementById('queryResult').textContent = '未找到状态';
        }
    })
    .catch(error => console.error('Error:', error));
}

// 提交状态更新
function saveStatus() {
    const ALLOWED_KEYS = [
        'health',
        'energy',
        'fatigue',
        'mental'
    ];

    // 收集所有输入框
    const rawStatus = {};
    document.querySelectorAll('.panel.status-panel ul li input').forEach(input => {
        rawStatus[input.id] = parseInt(input.value) || 0;
    });

    // 过滤只保留我们关心的 4 个状态
    const status = {};
    ALLOWED_KEYS.forEach(key => {
        if (key in rawStatus) {
            status[key] = rawStatus[key];
        }
    });

    // 发送给后端
    fetch(`${SERVER_URL}/update_user_status/${CURRENT_USERNAME}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(status)
    })
    .then(response => response.json().then(data => ({
        status: response.status,
        body: data
    })))
    .then(({ status, body }) => {
        if (status === 200) {
            alert(body.message || '状态已成功保存！');
            console.log('状态已成功保存！');
            window.hasUnsavedChanges = false;
        } else {
            alert(body.error || body.message || '保存失败！');
            throw new Error(body.error || '保存失败！');
        }
    })
    .catch(error => {
        console.error(error.message);
        alert(`保存失败: ${error.message}`);
    });
}