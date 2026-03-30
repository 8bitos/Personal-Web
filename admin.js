/* =============================================
   🔧 ADMIN PANEL — CRUD with GitHub API
   ============================================= */
;(function () {
    'use strict';

    /* ---------- CONFIG ---------- */
    const REPO_OWNER = '8bitos';
    const REPO_NAME  = 'Personal-Web';
    const FILE_PATH  = 'content.json';
    const LS_TOKEN   = 'admin_github_token';

    /* ---------- STATE ---------- */
    let contentData   = null;   // current working copy
    let originalJSON  = '';      // stringified snapshot after last save/load
    let githubToken   = null;
    let isOpen        = false;
    let activeTab     = 'skills';

    /* ---------- INIT ---------- */
    function init() {
        githubToken = localStorage.getItem(LS_TOKEN) || null;
        buildDOM();
        bindShortcut();
    }

    /* ---------- KEYBOARD SHORTCUT ---------- */
    function bindShortcut() {
        document.addEventListener('keydown', e => {
            if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
                e.preventDefault();
                togglePanel();
            }
        });
    }

    /* ---------- TOGGLE PANEL ---------- */
    function togglePanel() {
        isOpen = !isOpen;
        const panel    = document.getElementById('admin-panel');
        const backdrop = document.getElementById('admin-backdrop');
        if (!panel || !backdrop) return;

        if (isOpen) {
            panel.classList.add('open');
            backdrop.classList.add('active');
            if (!contentData) loadData();
        } else {
            panel.classList.remove('open');
            backdrop.classList.remove('active');
        }
    }

    /* ---------- LOAD DATA (fetch content.json) ---------- */
    async function loadData() {
        try {
            const res  = await fetch('content.json?_t=' + Date.now());
            contentData = await res.json();
            originalJSON = JSON.stringify(contentData);
            renderCurrentTab();
            updateUnsaved();
        } catch (err) {
            toast('Failed to load content.json', 'error');
        }
    }

    /* ---------- SAVE TO GITHUB ---------- */
    async function saveToGitHub() {
        if (!githubToken) {
            renderTokenSetup();
            return;
        }
        if (!contentData) return;

        const btn = document.getElementById('admin-publish-btn');
        if (btn) {
            btn.disabled = true;
            btn.classList.add('saving');
            btn.innerHTML = '<span class="admin-spinner"></span> Publishing…';
        }

        try {
            // 1. Get current file SHA
            const fileRes = await fetch(
                `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
                { headers: { Authorization: `token ${githubToken}` } }
            );

            if (fileRes.status === 401) {
                toast('❌ Invalid token. Please re-enter.', 'error');
                localStorage.removeItem(LS_TOKEN);
                githubToken = null;
                renderTokenSetup();
                return;
            }

            const fileInfo = await fileRes.json();

            // 2. Commit update
            const newContent = JSON.stringify(contentData, null, 2) + '\n';
            const encoded    = btoa(unescape(encodeURIComponent(newContent)));

            const putRes = await fetch(
                `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization:  `token ${githubToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: '✏️ Update content via Admin Panel',
                        content: encoded,
                        sha:     fileInfo.sha,
                    }),
                }
            );

            if (putRes.ok) {
                originalJSON = JSON.stringify(contentData);
                updateUnsaved();
                toast('✅ Published successfully!', 'success');
                if (btn) {
                    btn.classList.remove('saving');
                    btn.classList.add('success');
                    btn.innerHTML = '✅ Published!';
                    setTimeout(() => {
                        btn.classList.remove('success');
                        btn.innerHTML = '🚀 Save & Publish';
                        btn.disabled = false;
                    }, 2000);
                }
            } else {
                const err = await putRes.json();
                toast('❌ Publish failed: ' + (err.message || 'Unknown error'), 'error');
                resetPublishBtn(btn);
            }
        } catch (err) {
            toast('❌ Network error: ' + err.message, 'error');
            resetPublishBtn(btn);
        }
    }

    function resetPublishBtn(btn) {
        if (!btn) return;
        btn.disabled = false;
        btn.classList.remove('saving');
        btn.innerHTML = '🚀 Save & Publish';
    }

    /* ---------- LIVE PREVIEW ---------- */
    function livePreview() {
        if (!contentData) return;
        if (typeof window.renderSkills === 'function')     window.renderSkills(contentData.skills);
        if (typeof window.renderProjects === 'function')   window.renderProjects(contentData.projects);
        if (typeof window.renderExperience === 'function') window.renderExperience(contentData.experience);
        // Re-init lucide, skill bars, scroll reveal, tilt
        if (window.lucide) lucide.createIcons();
        if (typeof window.initSkillBars === 'function')    window.initSkillBars();
        if (typeof window.initScrollReveal === 'function') window.initScrollReveal();
        if (typeof window.initTiltEffect === 'function')   window.initTiltEffect();
    }

    /* ---------- HAS CHANGES? ---------- */
    function hasChanges() {
        return contentData && JSON.stringify(contentData) !== originalJSON;
    }

    function updateUnsaved() {
        const dot = document.getElementById('admin-unsaved-dot');
        if (dot) dot.classList.toggle('visible', hasChanges());
    }

    /* ---------- TOAST NOTIFICATION ---------- */
    function toast(msg, type = 'success') {
        let el = document.getElementById('admin-toast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'admin-toast';
            el.className = 'admin-toast';
            document.body.appendChild(el);
        }
        el.textContent = msg;
        el.className = 'admin-toast ' + type;
        requestAnimationFrame(() => el.classList.add('show'));
        setTimeout(() => el.classList.remove('show'), 3000);
    }

    /* ====================================
       BUILD DOM
       ==================================== */
    function buildDOM() {
        // Backdrop
        const backdrop = document.createElement('div');
        backdrop.id = 'admin-backdrop';
        backdrop.className = 'admin-backdrop';
        backdrop.addEventListener('click', togglePanel);
        document.body.appendChild(backdrop);

        // Panel
        const panel = document.createElement('div');
        panel.id = 'admin-panel';
        panel.className = 'admin-panel';
        panel.innerHTML = `
            <div class="admin-header">
                <h2>Admin Panel <span id="admin-unsaved-dot" class="admin-unsaved-dot"></span></h2>
                <button class="admin-close-btn" id="admin-close-btn" title="Close (Ctrl+Shift+A)">✕</button>
            </div>
            <div class="admin-tabs" id="admin-tabs">
                <button class="admin-tab active" data-tab="skills">Skills</button>
                <button class="admin-tab" data-tab="projects">Projects</button>
                <button class="admin-tab" data-tab="experience">Experience</button>
            </div>
            <div class="admin-body" id="admin-body">
                <div id="admin-content-skills" class="admin-tab-content active"></div>
                <div id="admin-content-projects" class="admin-tab-content"></div>
                <div id="admin-content-experience" class="admin-tab-content"></div>
                <div id="admin-content-token" class="admin-tab-content"></div>
            </div>
            <div class="admin-footer">
                <div class="admin-footer-row">
                    <button class="admin-publish-btn" id="admin-publish-btn">🚀 Save & Publish</button>
                </div>
                <div class="admin-footer-row">
                    <button class="admin-secondary-btn" id="admin-export-btn" title="Download content.json">📥 Export</button>
                    <button class="admin-secondary-btn" id="admin-import-btn" title="Import content.json">📤 Import</button>
                    <button class="admin-secondary-btn danger" id="admin-reset-btn" title="Reset to content.json default">🔄 Reset</button>
                    <button class="admin-secondary-btn" id="admin-token-btn" title="GitHub Token Settings">🔑 Token</button>
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        // Event: Close
        document.getElementById('admin-close-btn').addEventListener('click', togglePanel);

        // Event: Tabs
        document.getElementById('admin-tabs').addEventListener('click', e => {
            const tab = e.target.closest('.admin-tab');
            if (!tab) return;
            activeTab = tab.dataset.tab;
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            const target = document.getElementById('admin-content-' + activeTab);
            if (target) target.classList.add('active');
            renderCurrentTab();
        });

        // Event: Publish
        document.getElementById('admin-publish-btn').addEventListener('click', saveToGitHub);

        // Event: Export
        document.getElementById('admin-export-btn').addEventListener('click', () => {
            if (!contentData) return;
            const blob = new Blob([JSON.stringify(contentData, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'content.json';
            a.click();
            URL.revokeObjectURL(a.href);
            toast('📥 Exported content.json');
        });

        // Event: Import
        document.getElementById('admin-import-btn').addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.addEventListener('change', e => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                    try {
                        contentData = JSON.parse(ev.target.result);
                        renderCurrentTab();
                        livePreview();
                        updateUnsaved();
                        toast('📤 Imported successfully!');
                    } catch {
                        toast('❌ Invalid JSON file', 'error');
                    }
                };
                reader.readAsText(file);
            });
            input.click();
        });

        // Event: Reset
        document.getElementById('admin-reset-btn').addEventListener('click', () => {
            showConfirm('Reset to Default?', 'This will reload the original content.json and discard all unsaved changes.', async () => {
                await loadData();
                livePreview();
                toast('🔄 Reset to default');
            });
        });

        // Event: Token
        document.getElementById('admin-token-btn').addEventListener('click', () => {
            activeTab = 'token';
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            const target = document.getElementById('admin-content-token');
            if (target) target.classList.add('active');
            renderTokenSetup();
        });
    }

    /* ====================================
       RENDER CURRENT TAB
       ==================================== */
    function renderCurrentTab() {
        if (!contentData) return;
        switch (activeTab) {
            case 'skills':     renderSkillsTab(); break;
            case 'projects':   renderProjectsTab(); break;
            case 'experience': renderExperienceTab(); break;
            case 'token':      renderTokenSetup(); break;
        }
    }

    /* ====================================
       SKILLS TAB
       ==================================== */
    function renderSkillsTab() {
        const el = document.getElementById('admin-content-skills');
        if (!el || !contentData?.skills?.categories) return;

        let html = '';
        contentData.skills.categories.forEach((cat, ci) => {
            html += `
                <div class="admin-category-header">
                    <span class="admin-category-title">📂 ${esc(cat.title)}</span>
                    <div class="admin-category-actions">
                        <button class="admin-action-btn edit" onclick="AdminPanel.editCategory(${ci})" title="Edit Category">✏️</button>
                        <button class="admin-action-btn delete" onclick="AdminPanel.deleteCategory(${ci})" title="Delete Category">🗑️</button>
                    </div>
                </div>
            `;
            (cat.skills || []).forEach((sk, si) => {
                html += `
                    <div class="admin-item-card">
                        <div class="admin-item-header">
                            <div style="flex:1;min-width:0">
                                <div class="admin-item-title">${esc(sk.name)}</div>
                            </div>
                            <div class="admin-item-actions">
                                ${si > 0 ? `<button class="admin-action-btn move-up" onclick="AdminPanel.moveSkill(${ci},${si},-1)" title="Move Up">↑</button>` : ''}
                                ${si < cat.skills.length - 1 ? `<button class="admin-action-btn move-down" onclick="AdminPanel.moveSkill(${ci},${si},1)" title="Move Down">↓</button>` : ''}
                                <button class="admin-action-btn edit" onclick="AdminPanel.editSkill(${ci},${si})" title="Edit">✏️</button>
                                <button class="admin-action-btn delete" onclick="AdminPanel.deleteSkill(${ci},${si})" title="Delete">🗑️</button>
                            </div>
                        </div>
                        <div class="admin-skill-level-bar">
                            <div class="admin-skill-level-fill" style="width:${sk.level||0}%"></div>
                        </div>
                    </div>
                `;
            });
            html += `<button class="admin-add-btn" onclick="AdminPanel.addSkill(${ci})">+ Add Skill to ${esc(cat.title)}</button>`;
        });
        html += `<button class="admin-add-btn" onclick="AdminPanel.addCategory()">+ Add Category</button>`;
        el.innerHTML = html;
    }

    /* ====================================
       PROJECTS TAB
       ==================================== */
    function renderProjectsTab() {
        const el = document.getElementById('admin-content-projects');
        if (!el || !contentData?.projects?.items) return;

        let html = '';
        if (contentData.projects.items.length === 0) {
            html = '<div class="admin-empty-state"><div class="empty-icon">📁</div>No projects yet</div>';
        }
        contentData.projects.items.forEach((p, i) => {
            const tags = (p.tech || []).map(t => `<span class="admin-item-tag">${esc(t)}</span>`).join('');
            html += `
                <div class="admin-item-card">
                    <div class="admin-item-header">
                        <div style="flex:1;min-width:0">
                            <div class="admin-item-title">${esc(p.title)}</div>
                            <div class="admin-item-subtitle">${esc(p.desc || '')}</div>
                        </div>
                        <div class="admin-item-actions">
                            ${i > 0 ? `<button class="admin-action-btn move-up" onclick="AdminPanel.moveProject(${i},-1)" title="Move Up">↑</button>` : ''}
                            ${i < contentData.projects.items.length - 1 ? `<button class="admin-action-btn move-down" onclick="AdminPanel.moveProject(${i},1)" title="Move Down">↓</button>` : ''}
                            <button class="admin-action-btn edit" onclick="AdminPanel.editProject(${i})" title="Edit">✏️</button>
                            <button class="admin-action-btn delete" onclick="AdminPanel.deleteProject(${i})" title="Delete">🗑️</button>
                        </div>
                    </div>
                    ${tags ? '<div class="admin-item-meta">' + tags + '</div>' : ''}
                </div>
            `;
        });
        html += `<button class="admin-add-btn" onclick="AdminPanel.addProject()">+ Add Project</button>`;
        el.innerHTML = html;
    }

    /* ====================================
       EXPERIENCE TAB
       ==================================== */
    function renderExperienceTab() {
        const el = document.getElementById('admin-content-experience');
        if (!el || !contentData?.experience?.items) return;

        let html = '';
        if (contentData.experience.items.length === 0) {
            html = '<div class="admin-empty-state"><div class="empty-icon">📋</div>No experience yet</div>';
        }
        contentData.experience.items.forEach((exp, i) => {
            html += `
                <div class="admin-item-card">
                    <div class="admin-item-header">
                        <div style="flex:1;min-width:0">
                            <div class="admin-item-title">${esc(exp.title)}</div>
                            <div class="admin-item-subtitle">${esc(exp.date || '')} — ${esc(exp.desc || '')}</div>
                        </div>
                        <div class="admin-item-actions">
                            ${i > 0 ? `<button class="admin-action-btn move-up" onclick="AdminPanel.moveExperience(${i},-1)" title="Move Up">↑</button>` : ''}
                            ${i < contentData.experience.items.length - 1 ? `<button class="admin-action-btn move-down" onclick="AdminPanel.moveExperience(${i},1)" title="Move Down">↓</button>` : ''}
                            <button class="admin-action-btn edit" onclick="AdminPanel.editExperience(${i})" title="Edit">✏️</button>
                            <button class="admin-action-btn delete" onclick="AdminPanel.deleteExperience(${i})" title="Delete">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += `<button class="admin-add-btn" onclick="AdminPanel.addExperience()">+ Add Experience</button>`;
        el.innerHTML = html;
    }

    /* ====================================
       TOKEN SETUP
       ==================================== */
    function renderTokenSetup() {
        const el = document.getElementById('admin-content-token');
        if (!el) return;

        const masked = githubToken ? githubToken.slice(0, 6) + '••••••••' + githubToken.slice(-4) : '';

        el.innerHTML = `
            <div class="admin-token-setup">
                <div class="token-icon">🔑</div>
                <h3>GitHub Token</h3>
                <p>${githubToken
                    ? 'Token connected: <strong>' + esc(masked) + '</strong>'
                    : 'Connect your GitHub Personal Access Token to publish changes to your repo.'}</p>
                <div class="admin-token-steps">
                    <ol>
                        <li>Go to <a href="https://github.com/settings/tokens" target="_blank">GitHub → Settings → Tokens</a></li>
                        <li>Click <strong>"Generate new token (classic)"</strong></li>
                        <li>Select scope: <strong>repo</strong> (full access)</li>
                        <li>Copy the token and paste below</li>
                    </ol>
                </div>
                <div class="admin-field">
                    <label>Personal Access Token</label>
                    <input type="password" id="admin-token-input" placeholder="ghp_xxxxxxxxxxxx" value="${esc(githubToken || '')}">
                </div>
                <button class="admin-connect-btn" id="admin-connect-token-btn">
                    ${githubToken ? '🔄 Update Token' : '🔗 Connect'}
                </button>
                ${githubToken ? '<button class="admin-secondary-btn danger" id="admin-disconnect-token-btn" style="width:100%;margin-top:8px">🗑️ Disconnect Token</button>' : ''}
            </div>
        `;

        document.getElementById('admin-connect-token-btn').addEventListener('click', () => {
            const val = document.getElementById('admin-token-input').value.trim();
            if (!val) {
                toast('❌ Please enter a token', 'error');
                return;
            }
            githubToken = val;
            localStorage.setItem(LS_TOKEN, val);
            toast('🔑 Token saved!');
            renderTokenSetup();
            // Switch back to skills
            activeTab = 'skills';
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'skills'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById('admin-content-skills')?.classList.add('active');
            renderCurrentTab();
        });

        const disconnectBtn = document.getElementById('admin-disconnect-token-btn');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => {
                localStorage.removeItem(LS_TOKEN);
                githubToken = null;
                toast('🗑️ Token disconnected');
                renderTokenSetup();
            });
        }
    }

    /* ====================================
       MODAL SYSTEM
       ==================================== */
    function showModal(title, bodyHTML, onSave) {
        removeModal();
        const backdrop = document.createElement('div');
        backdrop.className = 'admin-modal-backdrop';
        backdrop.id = 'admin-modal-backdrop';
        backdrop.innerHTML = `
            <div class="admin-modal">
                <div class="admin-modal-header">
                    <h3>${title}</h3>
                    <button class="admin-close-btn" id="admin-modal-close">✕</button>
                </div>
                <div class="admin-modal-body">${bodyHTML}</div>
                <div class="admin-modal-footer">
                    <button class="admin-secondary-btn" id="admin-modal-cancel">Cancel</button>
                    <button class="admin-publish-btn" id="admin-modal-save" style="flex:none;padding:10px 24px">💾 Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(backdrop);
        requestAnimationFrame(() => backdrop.classList.add('active'));

        document.getElementById('admin-modal-close').addEventListener('click', removeModal);
        document.getElementById('admin-modal-cancel').addEventListener('click', removeModal);
        document.getElementById('admin-modal-save').addEventListener('click', () => {
            if (onSave) onSave();
            removeModal();
            renderCurrentTab();
            livePreview();
            updateUnsaved();
        });

        // Close on backdrop click
        backdrop.addEventListener('click', e => {
            if (e.target === backdrop) removeModal();
        });
    }

    function showConfirm(title, message, onConfirm) {
        removeModal();
        const backdrop = document.createElement('div');
        backdrop.className = 'admin-modal-backdrop';
        backdrop.id = 'admin-modal-backdrop';
        backdrop.innerHTML = `
            <div class="admin-modal">
                <div class="admin-modal-header">
                    <h3>⚠️ ${title}</h3>
                    <button class="admin-close-btn" id="admin-modal-close">✕</button>
                </div>
                <div class="admin-modal-body">
                    <p class="admin-confirm-text">${message}</p>
                </div>
                <div class="admin-modal-footer">
                    <button class="admin-secondary-btn" id="admin-modal-cancel">Cancel</button>
                    <button class="admin-publish-btn" id="admin-modal-confirm" style="flex:none;padding:10px 24px;background:linear-gradient(135deg,#ef4444,#dc2626)">🗑️ Confirm</button>
                </div>
            </div>
        `;
        document.body.appendChild(backdrop);
        requestAnimationFrame(() => backdrop.classList.add('active'));

        document.getElementById('admin-modal-close').addEventListener('click', removeModal);
        document.getElementById('admin-modal-cancel').addEventListener('click', removeModal);
        document.getElementById('admin-modal-confirm').addEventListener('click', () => {
            removeModal();
            if (onConfirm) onConfirm();
        });
        backdrop.addEventListener('click', e => {
            if (e.target === backdrop) removeModal();
        });
    }

    function removeModal() {
        const el = document.getElementById('admin-modal-backdrop');
        if (el) {
            el.classList.remove('active');
            setTimeout(() => el.remove(), 350);
        }
    }

    /* ====================================
       CRUD — SKILLS
       ==================================== */
    function addCategory() {
        showModal('Add Category', `
            <div class="admin-field">
                <label>Category Title</label>
                <input type="text" id="modal-cat-title" placeholder="e.g. Frontend, Backend…">
            </div>
            <div class="admin-field">
                <label>Icon (Lucide name)</label>
                <input type="text" id="modal-cat-icon" placeholder="e.g. layout, server, wrench">
                <div class="field-hint">Browse icons at <a href="https://lucide.dev/icons" target="_blank" style="color:#00d4ff">lucide.dev/icons</a></div>
            </div>
        `, () => {
            const title = document.getElementById('modal-cat-title').value.trim();
            const icon  = document.getElementById('modal-cat-icon').value.trim() || 'star';
            if (!title) return;
            contentData.skills.categories.push({ title, icon, skills: [] });
        });
    }

    function editCategory(ci) {
        const cat = contentData.skills.categories[ci];
        if (!cat) return;
        showModal('Edit Category', `
            <div class="admin-field">
                <label>Category Title</label>
                <input type="text" id="modal-cat-title" value="${esc(cat.title)}">
            </div>
            <div class="admin-field">
                <label>Icon (Lucide name)</label>
                <input type="text" id="modal-cat-icon" value="${esc(cat.icon || '')}">
                <div class="field-hint">Browse icons at <a href="https://lucide.dev/icons" target="_blank" style="color:#00d4ff">lucide.dev/icons</a></div>
            </div>
        `, () => {
            cat.title = document.getElementById('modal-cat-title').value.trim() || cat.title;
            cat.icon  = document.getElementById('modal-cat-icon').value.trim() || 'star';
        });
    }

    function deleteCategory(ci) {
        const cat = contentData.skills.categories[ci];
        if (!cat) return;
        showConfirm('Delete Category', `Delete <strong>${esc(cat.title)}</strong> and all its skills?`, () => {
            contentData.skills.categories.splice(ci, 1);
            renderCurrentTab();
            livePreview();
            updateUnsaved();
        });
    }

    function addSkill(ci) {
        const cat = contentData.skills.categories[ci];
        if (!cat) return;
        showModal(`Add Skill to ${esc(cat.title)}`, `
            <div class="admin-field">
                <label>Skill Name</label>
                <input type="text" id="modal-sk-name" placeholder="e.g. JavaScript, Python…">
            </div>
            <div class="admin-field">
                <label>Icon (Lucide name)</label>
                <input type="text" id="modal-sk-icon" placeholder="e.g. zap, cpu, code-2">
                <div class="field-hint">Browse at <a href="https://lucide.dev/icons" target="_blank" style="color:#00d4ff">lucide.dev/icons</a></div>
            </div>
            <div class="admin-field">
                <div class="admin-range-label">
                    <label>Level</label>
                    <span class="admin-range-value" id="modal-sk-level-val">50</span>
                </div>
                <input type="range" id="modal-sk-level" min="0" max="100" value="50" oninput="document.getElementById('modal-sk-level-val').textContent=this.value">
            </div>
        `, () => {
            const name  = document.getElementById('modal-sk-name').value.trim();
            const icon  = document.getElementById('modal-sk-icon').value.trim() || 'sparkles';
            const level = parseInt(document.getElementById('modal-sk-level').value) || 50;
            if (!name) return;
            cat.skills.push({ name, icon, level });
        });
    }

    function editSkill(ci, si) {
        const sk = contentData.skills.categories[ci]?.skills?.[si];
        if (!sk) return;
        showModal('Edit Skill', `
            <div class="admin-field">
                <label>Skill Name</label>
                <input type="text" id="modal-sk-name" value="${esc(sk.name)}">
            </div>
            <div class="admin-field">
                <label>Icon (Lucide name)</label>
                <input type="text" id="modal-sk-icon" value="${esc(sk.icon || '')}">
                <div class="field-hint">Browse at <a href="https://lucide.dev/icons" target="_blank" style="color:#00d4ff">lucide.dev/icons</a></div>
            </div>
            <div class="admin-field">
                <div class="admin-range-label">
                    <label>Level</label>
                    <span class="admin-range-value" id="modal-sk-level-val">${sk.level || 0}</span>
                </div>
                <input type="range" id="modal-sk-level" min="0" max="100" value="${sk.level || 0}" oninput="document.getElementById('modal-sk-level-val').textContent=this.value">
            </div>
        `, () => {
            sk.name  = document.getElementById('modal-sk-name').value.trim() || sk.name;
            sk.icon  = document.getElementById('modal-sk-icon').value.trim() || 'sparkles';
            sk.level = parseInt(document.getElementById('modal-sk-level').value) || 0;
        });
    }

    function deleteSkill(ci, si) {
        const sk = contentData.skills.categories[ci]?.skills?.[si];
        if (!sk) return;
        showConfirm('Delete Skill', `Delete <strong>${esc(sk.name)}</strong>?`, () => {
            contentData.skills.categories[ci].skills.splice(si, 1);
            renderCurrentTab();
            livePreview();
            updateUnsaved();
        });
    }

    function moveSkill(ci, si, dir) {
        const arr = contentData.skills.categories[ci]?.skills;
        if (!arr) return;
        const newIdx = si + dir;
        if (newIdx < 0 || newIdx >= arr.length) return;
        [arr[si], arr[newIdx]] = [arr[newIdx], arr[si]];
        renderCurrentTab();
        livePreview();
        updateUnsaved();
    }

    /* ====================================
       CRUD — PROJECTS
       ==================================== */
    function addProject() {
        showModal('Add Project', projectFormHTML(), () => {
            const title   = document.getElementById('modal-pj-title').value.trim();
            const desc    = document.getElementById('modal-pj-desc').value.trim();
            const icon    = document.getElementById('modal-pj-icon').value.trim() || 'layers';
            const codeUrl = document.getElementById('modal-pj-code').value.trim();
            const liveUrl = document.getElementById('modal-pj-live').value.trim();
            const tech    = getTagsFromWrap('modal-pj-tags-wrap');
            if (!title) return;
            contentData.projects.items.push({ title, desc, icon, tech, codeUrl: codeUrl || undefined, liveUrl: liveUrl || undefined });
        });
        initTagInput('modal-pj-tags-wrap', 'modal-pj-tag-input');
    }

    function editProject(i) {
        const p = contentData.projects.items[i];
        if (!p) return;
        showModal('Edit Project', projectFormHTML(p), () => {
            p.title   = document.getElementById('modal-pj-title').value.trim() || p.title;
            p.desc    = document.getElementById('modal-pj-desc').value.trim();
            p.icon    = document.getElementById('modal-pj-icon').value.trim() || 'layers';
            p.codeUrl = document.getElementById('modal-pj-code').value.trim() || undefined;
            p.liveUrl = document.getElementById('modal-pj-live').value.trim() || undefined;
            p.tech    = getTagsFromWrap('modal-pj-tags-wrap');
        });
        initTagInput('modal-pj-tags-wrap', 'modal-pj-tag-input');
    }

    function deleteProject(i) {
        const p = contentData.projects.items[i];
        if (!p) return;
        showConfirm('Delete Project', `Delete <strong>${esc(p.title)}</strong>?`, () => {
            contentData.projects.items.splice(i, 1);
            renderCurrentTab();
            livePreview();
            updateUnsaved();
        });
    }

    function moveProject(i, dir) {
        const arr = contentData.projects.items;
        const newIdx = i + dir;
        if (newIdx < 0 || newIdx >= arr.length) return;
        [arr[i], arr[newIdx]] = [arr[newIdx], arr[i]];
        renderCurrentTab();
        livePreview();
        updateUnsaved();
    }

    function projectFormHTML(p = {}) {
        const techChips = (p.tech || []).map(t => `<span class="admin-tag-chip">${esc(t)}<span class="admin-tag-remove" data-tag="${esc(t)}">×</span></span>`).join('');
        return `
            <div class="admin-field">
                <label>Project Title</label>
                <input type="text" id="modal-pj-title" value="${esc(p.title || '')}" placeholder="My Awesome Project">
            </div>
            <div class="admin-field">
                <label>Description</label>
                <textarea id="modal-pj-desc" placeholder="Brief description of the project">${esc(p.desc || '')}</textarea>
            </div>
            <div class="admin-field">
                <label>Icon (Lucide name)</label>
                <input type="text" id="modal-pj-icon" value="${esc(p.icon || '')}" placeholder="e.g. cpu, gamepad-2, film">
                <div class="field-hint">Browse at <a href="https://lucide.dev/icons" target="_blank" style="color:#00d4ff">lucide.dev/icons</a></div>
            </div>
            <div class="admin-field">
                <label>Tech Stack <span style="color:#475569">(Enter to add)</span></label>
                <div class="admin-tags-wrap" id="modal-pj-tags-wrap">
                    ${techChips}
                    <input type="text" class="admin-tag-input" id="modal-pj-tag-input" placeholder="Add tech…">
                </div>
            </div>
            <div class="admin-field">
                <label>Code URL <span style="color:#475569">(optional)</span></label>
                <input type="url" id="modal-pj-code" value="${esc(p.codeUrl || '')}" placeholder="https://github.com/…">
            </div>
            <div class="admin-field">
                <label>Live/Demo URL <span style="color:#475569">(optional)</span></label>
                <input type="url" id="modal-pj-live" value="${esc(p.liveUrl || '')}" placeholder="https://…">
            </div>
        `;
    }

    /* ====================================
       CRUD — EXPERIENCE
       ==================================== */
    function addExperience() {
        showModal('Add Experience', experienceFormHTML(), () => {
            const date  = document.getElementById('modal-exp-date').value.trim();
            const title = document.getElementById('modal-exp-title').value.trim();
            const desc  = document.getElementById('modal-exp-desc').value.trim();
            if (!title) return;
            contentData.experience.items.push({ date, title, desc });
        });
    }

    function editExperience(i) {
        const exp = contentData.experience.items[i];
        if (!exp) return;
        showModal('Edit Experience', experienceFormHTML(exp), () => {
            exp.date  = document.getElementById('modal-exp-date').value.trim();
            exp.title = document.getElementById('modal-exp-title').value.trim() || exp.title;
            exp.desc  = document.getElementById('modal-exp-desc').value.trim();
        });
    }

    function deleteExperience(i) {
        const exp = contentData.experience.items[i];
        if (!exp) return;
        showConfirm('Delete Experience', `Delete <strong>${esc(exp.title)}</strong>?`, () => {
            contentData.experience.items.splice(i, 1);
            renderCurrentTab();
            livePreview();
            updateUnsaved();
        });
    }

    function moveExperience(i, dir) {
        const arr = contentData.experience.items;
        const newIdx = i + dir;
        if (newIdx < 0 || newIdx >= arr.length) return;
        [arr[i], arr[newIdx]] = [arr[newIdx], arr[i]];
        renderCurrentTab();
        livePreview();
        updateUnsaved();
    }

    function experienceFormHTML(exp = {}) {
        return `
            <div class="admin-field">
                <label>Date / Period</label>
                <input type="text" id="modal-exp-date" value="${esc(exp.date || '')}" placeholder="e.g. 2024 — Present">
            </div>
            <div class="admin-field">
                <label>Title / Role</label>
                <input type="text" id="modal-exp-title" value="${esc(exp.title || '')}" placeholder="e.g. Frontend Developer">
            </div>
            <div class="admin-field">
                <label>Description</label>
                <textarea id="modal-exp-desc" placeholder="Brief description of this experience">${esc(exp.desc || '')}</textarea>
            </div>
        `;
    }

    /* ====================================
       TAG INPUT (Tech Stack)
       ==================================== */
    function initTagInput(wrapId, inputId) {
        const wrap  = document.getElementById(wrapId);
        const input = document.getElementById(inputId);
        if (!wrap || !input) return;

        // Click on wrap focuses input
        wrap.addEventListener('click', () => input.focus());

        // Enter to add tag
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const val = input.value.trim();
                if (!val) return;
                // Check duplicate
                const existing = getTagsFromWrap(wrapId);
                if (existing.includes(val)) return;
                const chip = document.createElement('span');
                chip.className = 'admin-tag-chip';
                chip.innerHTML = `${esc(val)}<span class="admin-tag-remove" data-tag="${esc(val)}">×</span>`;
                wrap.insertBefore(chip, input);
                input.value = '';
            }
            // Backspace to remove last tag
            if (e.key === 'Backspace' && !input.value) {
                const chips = wrap.querySelectorAll('.admin-tag-chip');
                if (chips.length) chips[chips.length - 1].remove();
            }
        });

        // Click remove on existing chips
        wrap.addEventListener('click', e => {
            if (e.target.classList.contains('admin-tag-remove')) {
                e.target.closest('.admin-tag-chip').remove();
            }
        });
    }

    function getTagsFromWrap(wrapId) {
        const wrap = document.getElementById(wrapId);
        if (!wrap) return [];
        return Array.from(wrap.querySelectorAll('.admin-tag-chip')).map(c => {
            const clone = c.cloneNode(true);
            const rm = clone.querySelector('.admin-tag-remove');
            if (rm) rm.remove();
            return clone.textContent.trim();
        });
    }

    /* ====================================
       UTILS
       ==================================== */
    function esc(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /* ====================================
       EXPOSE PUBLIC API
       ==================================== */
    window.AdminPanel = {
        toggle:          togglePanel,
        // Skills
        addCategory,     editCategory,    deleteCategory,
        addSkill,        editSkill,       deleteSkill,     moveSkill,
        // Projects
        addProject,      editProject,     deleteProject,   moveProject,
        // Experience
        addExperience,   editExperience,  deleteExperience, moveExperience,
    };

    /* ---- Kick off ---- */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
