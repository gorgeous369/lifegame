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
    fetchStatus(); 
    document.getElementById('btnAddSkill').addEventListener('click', onAddSkillClicked);
    setInterval(updateDateTime, 1000);
    updateDateTime();
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
        } else {
            console.warn('未找到属性'); // 可以用控制台日志代替提示信息
        }
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
    document.querySelectorAll('#attributes-table input').forEach(input => {
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
            alert('状态已成功保存！');
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
    
        const tableBody = document.querySelector('#skills-table tbody'); // 选择 tbody
        tableBody.innerHTML = '';
    
        skillArr.forEach(skill => {
            // 创建 <tr>
            const tr = document.createElement('tr');
        
            // 创建技能名称列
            const tdSkillName = document.createElement('td');
            tdSkillName.textContent = `${skill.skillname}`;
        
            // 创建熟练度列
            const tdProficiency = document.createElement('td');
            tdProficiency.textContent = `${skill.proficiency}`;
        
            // 创建操作列
            const tdActions = document.createElement('td');
            const btnDelete = document.createElement('button');
            btnDelete.textContent = '删除';
            btnDelete.className = 'button-red';
            btnDelete.onclick = function () {
                deleteSkill(skill.skillname, tr);
            };
            tdActions.appendChild(btnDelete);
        
            // 将列添加到行
            tr.appendChild(tdSkillName);
            tr.appendChild(tdProficiency);
            tr.appendChild(tdActions);
        
            // 将行添加到表格
            tableBody.appendChild(tr);
        }
        );
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

            // 清空当前表格
            const table = document.getElementById('bonus-table');
            const tbody = table.querySelector('tbody');
            tbody.innerHTML = '';

            // 遍历 bonus 数组
            data.bonus_list.forEach(b => {
                // 创建 <tr>
                const tr = document.createElement('tr');
            
                // 奖励名称列
                const tdName = document.createElement('td');
                tdName.textContent = b.bonusname;
            
                // 奖励积分列
                const tdPoint = document.createElement('td');
                tdPoint.textContent = b.bonuspoint;
            
                // 操作列
                const tdActions = document.createElement('td');
            
                // 添加“实现奖励”按钮
                const btnClaim = document.createElement('button');
                btnClaim.textContent = '兑现';
                btnClaim.className = 'button-green';
                btnClaim.onclick = function () {
                    claimBonus(b.bonusid, b.bonuspoint, b.bonusname, tr);
                };
                tdActions.appendChild(btnClaim);
            
                // 添加“删除”按钮
                const btnDelete = document.createElement('button');
                btnDelete.textContent = '删除';
                btnDelete.className = 'button-red';
                btnDelete.onclick = function () {
                    deleteBonus(b.bonusid, tr);
                };
                tdActions.appendChild(btnDelete);
            
                // 将列添加到行
                tr.appendChild(tdName);
                tr.appendChild(tdPoint);
                tr.appendChild(tdActions);
            
                // 将行添加到表格
                tbody.appendChild(tr);
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
function deleteBonus(bonusId, tr) {
    fetch(`${SERVER_URL}/delete_bonus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: CURRENT_USERNAME, bonusid: bonusId })
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
        .then(() => {
            // 成功后同步移除该行
            if (tr && tr.parentNode) {
                tr.parentNode.removeChild(tr);
            }
            console.log('删除 bonus 成功');
        })
        .catch(err => {
            console.error('删除 bonus 出错：', err.message);
            alert('删除 bonus 出错：' + err.message);
        });
}

function claimBonus(bonusId, bonusPoint, bonusName, tr) {
    if (confirm(`奖励已实现: ${bonusName}，扣除 ${bonusPoint} 奖励点数`)) {
        // 获取当前积分并扣除
        fetch(`${SERVER_URL}/get_user_point/${CURRENT_USERNAME}`, {
            method: 'GET'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`获取当前积分失败: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const currentPoint = data.currentpoint || 0;

                // 检查是否有足够的奖励点数
                if (currentPoint < bonusPoint) {
                    alert('奖励点数不足，无法实现奖励。');
                    return;
                }

                // 扣除奖励点数
                const newPoint = currentPoint - bonusPoint;
                return fetch(`${SERVER_URL}/update_user_point/${CURRENT_USERNAME}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currentpoint: newPoint })
                });
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`扣除奖励点数失败: ${response.status}`);
                }
                return response.json();
            })
            .then(() => {
                // 删除奖励
                deleteBonus(bonusId, tr);
                fetchCurrentPoint();
            })
            .catch(error => {
                console.error('实现奖励出错：', error);
                alert('实现奖励出错：' + error.message);
            });
    }
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
        if (data.currentpoint === undefined || data.currentpoint === null) {
            throw new Error('后端返回格式不符合预期或 currentpoint 不存在');
        }

        // 更新页面上的积分显示
        const pointDisplay = document.getElementById('current-point');
        pointDisplay.textContent = `剩余奖励点数: ${data.currentpoint}`;
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
        table.style.textAlign = 'left';
        // 添加标题行
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>任务名称</th>
                <th>任务等级</th>
                <th>行动点</th>
                <th>属性</th>
                <th>技能</th>
                <th>奖励</th>
                <th>剩余时间</th>
                <th>状态</th>
                <th>操作</th>
            </tr>
        `;
        table.appendChild(thead);

        // 添加任务行
        const tbody = document.createElement('tbody');
        data.tasks.forEach(t => {
            const remainingTime = calculateRemainingTime(t.endtime);
            const attributesFormatted = formatJson(t.attribute);
            const skillsFormatted = formatJson(t.skill);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${t.taskname}</td>
                <td>${t.tasklevel}</td>
                <td>${t.point}</td>
                <td>${attributesFormatted}</td>
                <td>${skillsFormatted}</td>
                <td>${t.bonus}</td>
                <td>${remainingTime}</td>
                <td>${t.status === 0 ? '未完成' : '已完成'}</td>
                <td>
                    ${t.status === 0 ? `<button onclick='completeTask(${JSON.stringify(t)})' class="button-green">完成</button>` : ''}
                    <button onclick="deleteTask(${t.taskid})" class="button-red">删除</button>
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

// 计算剩余时间
function calculateRemainingTime(endtime) {
    const now = new Date();
    const endDate = new Date(endtime);

    const diffInMs = endDate - now;
    if (diffInMs <= 0) {
        return '已超时';
    }

    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return `${diffInDays}天${diffInHours}小时`;
}

// 格式化 JSON 数据为 "力量+1, 智力+2" 形式
function formatJson(jsonData) {
    if (!jsonData || typeof jsonData !== 'object') {
        return '无';
    }
    return Object.entries(jsonData)
        .map(([key, value]) => `${key}+${value}`)
        .join('，');
}

/**
 * 添加一条 task
 */

function closeTaskModal() {
    // 隐藏模态框
    document.getElementById("task-modal").style.display = "none";
}

function openTaskModal() {
    // 显示模态框
    document.getElementById("task-modal").style.display = "block";

    // 设置默认开始时间为当天的 0 点
    const now = new Date();
    const zeroTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const formattedDateTime = zeroTime.toISOString().slice(0, 16); // 格式化为 yyyy-MM-ddTHH:mm
    document.getElementById("start-time").value = formattedDateTime;
}

function onAddTaskClicked() {
    const taskName = document.getElementById("task-name").value.trim();
    if (!taskName) {
        alert("任务名称不能为空！");
        return;
    }

    const taskLevel = parseInt(document.getElementById("task-level").value, 10);
    const taskPoint = parseInt(document.getElementById("task-point").value, 10) || 0;
    const attributes = collectAttributes(); // 获取任务属性数据
    const skills = collectSkills(); // 获取任务技能数据
    const bonus = parseInt(document.getElementById("task-bonus").value, 10) || 0;
    const startTime = document.getElementById("start-time").value;
    const endTime = document.getElementById("end-time").value;
    const status = 0; // 默认状态为 0

    // 调用任务添加函数
    addTask(taskName, taskLevel, taskPoint, attributes, skills, bonus, startTime, endTime, status);

    // 关闭模态框并清空输入
    closeTaskModal();
    clearTaskModalInputs();
}

const ATTRIBUTE_OPTIONS = [
    "体力",
    "敏捷",
    "体质",
    "智力",
    "精神",
    "魅力",
    "幸运",
    "创造力",
];

function addAttributeRow() {
    const table = document.getElementById("attribute-table").querySelector("tbody");
    const row = document.createElement("tr");

    // 动态生成属性选项
    const selectOptions = ATTRIBUTE_OPTIONS.map(
        attr => `<option value="${attr}">${attr}</option>`
    ).join("");

    row.innerHTML = `
        <td>
            <select class="attribute-name">
                ${selectOptions}
            </select>
        </td>
        <td><input type="number" class="attribute-value" value="0" /></td>
        <td><button type="button" onclick="deleteRow(this)">删除</button></td>
    `;

    table.appendChild(row);
}

function addSkillRow() {
    const table = document.getElementById("skill-table").querySelector("tbody");
    const row = document.createElement("tr");

    row.innerHTML = `
        <td><input type="text" class="skill-name" placeholder="技能名称" /></td>
        <td><input type="number" class="skill-value" value="0" /></td>
        <td><button type="button" onclick="deleteRow(this)">删除</button></td>
    `;

    table.appendChild(row);
}

function deleteRow(button) {
    const row = button.parentElement.parentElement;
    row.remove();
}

function collectAttributes() {
    const attributes = {};
    const rows = document.querySelectorAll("#attribute-table tbody tr");
    rows.forEach(row => {
        const name = row.querySelector(".attribute-name").value.trim();
        const value = parseInt(row.querySelector(".attribute-value").value, 10);
        if (name) {
            attributes[name] = value || 0;
        }
    });
    return attributes;
}

function collectSkills() {
    const skills = {};
    const rows = document.querySelectorAll("#skill-table tbody tr");
    rows.forEach(row => {
        const name = row.querySelector(".skill-name").value.trim();
        const value = parseInt(row.querySelector(".skill-value").value, 10);
        if (name) {
            skills[name] = value || 0;
        }
    });
    return skills;
}

function clearTaskModalInputs() {
    document.getElementById("task-name").value = "";
    document.getElementById("task-level").value = "1";
    document.getElementById("task-point").value = "0";
    document.getElementById("task-attribute").value = '{"wisdom":1}';
    document.getElementById("task-skill").value = '{"写作":1}';
    document.getElementById("task-bonus").value = "0";
    document.getElementById("start-time").value = "";
    document.getElementById("end-time").value = "";
    document.getElementById("task-status").value = "0";
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

            // 更新页面状态输入框
            Object.keys(status).forEach(key => {
                const input = document.getElementById(key);
                if (input) {
                    input.value = status[key];
                }
            });

            // 更新行动点数显示
            if (status.actionpoint !== undefined && status.actionpoint !== null) {
                const actionPointDisplay = document.getElementById('action-point');
                if (actionPointDisplay) {
                    actionPointDisplay.textContent = `剩余体力：${status.actionpoint}`;
                }
            }

            // 更新条形图数据
            updateStatusCharts();
        } else {
            console.warn('未找到状态'); // 用控制台日志提示开发者
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
    document.querySelectorAll('#status-table input').forEach(input => {
        rawStatus[input.id] = parseInt(input.value) || 0;
    });

    // 过滤只保留我们关心的 4 个状态
    const status = {};
    ALLOWED_KEYS.forEach(key => {
        if (key in rawStatus) {
            status[key] = rawStatus[key];
        }
    });

    // 计算 actionpoint (状态值乘以 10 后求和)
    status.actionpoint = ALLOWED_KEYS.reduce((sum, key) => {
        return sum + (status[key] || 0) * 10;
    }, 0);

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
            fetchStatus();
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

function completeTask(task) {
    // 1. 更新属性点数
    const updatedAttributes = task.attribute;
    if (updatedAttributes) {
        Object.keys(updatedAttributes).forEach(attr => {
            incrementAttribute(attr, updatedAttributes[attr]);
        });
    }

    // 2. 更新技能熟练度
    const updatedSkills = task.skill;
    Object.keys(updatedSkills).forEach(skill => {
        incrementSkillValue(skill, updatedSkills[skill]);
    });

    // 3. 更新奖励点数
    incrementCurrentPoint(task.bonus);

    // 4. 更新行动点数
    updateActionPoint(-task.point);

    // 5. 修改任务状态为 1（完成）
    updateTaskStatus(task.taskid, 1);
}

function updateTaskStatus(taskId, status) {
    fetch(`${SERVER_URL}/update_task/${taskId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status }) // 仅更新状态字段
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`更新任务状态失败: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('任务状态已更新:', data);
            fetchTasks(); // 刷新任务列表
        })
        .catch(error => console.error('任务状态更新出错:', error));
}

function incrementCurrentPoint(value) {
    // 获取当前积分
    fetch(`${SERVER_URL}/get_user_point/${CURRENT_USERNAME}`, {
        method: 'GET'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`获取当前积分失败: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const currentPoint = data.currentpoint || 0;
            const newPoint = currentPoint + value;

            // 调用更新积分接口
            return fetch(`${SERVER_URL}/update_user_point/${CURRENT_USERNAME}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentpoint: newPoint })
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`更新积分失败: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('积分已更新:', data);
            fetchCurrentPoint(); // 刷新当前积分显示
        })
        .catch(error => {
            console.error('积分更新出错:', error);
        });
}

function incrementAttribute(attribute, value) {
    const input = document.getElementById(attribute);
    if (input) {
        const currentValue = parseInt(input.value, 10) || 0;
        const newValue = Math.min(100, currentValue + value); // 确保属性点数不超过 100
        input.value = newValue;
    }
    saveAttributes(); // 保存属性到后端
}

function incrementSkillValue(skillName, value) {
    fetch(`${SERVER_URL}/get_skill_by_name/${CURRENT_USERNAME}/${skillName}`, {
        method: 'GET'
    })
        .then(response => response.json())
        .then(skill => {
            if (skill) {
                const newProficiency = skill.proficiency + value;
                // 更新技能熟练度到后端
                addSkillToServer(skillName, newProficiency);
            } else {
                // 如果技能不存在，直接添加
                addSkillToServer(skillName, value);
            }
        })
        .catch(error => console.error('技能更新出错:', error));
}

function updateActionPoint(delta) {
    // 获取当前状态并更新行动点数
    fetch(`${SERVER_URL}/get_user_status/${CURRENT_USERNAME}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status && data.status.actionpoint !== undefined) {
            const newActionPoint = (data.status.actionpoint || 0) + delta;

            // 更新状态中的行动点数
            const updatedStatus = { actionpoint: newActionPoint };
            fetch(`${SERVER_URL}/update_user_status/${CURRENT_USERNAME}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedStatus)
            })
            .then(response => response.json())
            .then(() => {
                console.log(`行动点数更新成功: ${newActionPoint}`);
                fetchStatus(); // 刷新状态
            })
            .catch(error => console.error('更新行动点数时出错:', error));
        } else {
            console.warn('未找到当前行动点数，无法更新');
        }
    })
    .catch(error => console.error('获取当前状态时出错:', error));
}