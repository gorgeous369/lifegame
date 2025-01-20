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
    fetchAttributes();
    fetchSkills();
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
        'constitution',
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