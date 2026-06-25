// CSDN风格博客前端应用
class CSDNBlogApp {
    constructor() {
        this.apiBaseUrl = window.location.origin;
        this.currentUser = null;
        this.currentPage = 'home';
        this.currentPostId = null;
        this.postsPerPage = 9;
        this.currentPageNum = 1;
        this.totalPosts = 0;
        this.allPosts = [];
        
        this.init();
    }

    init() {
        this.checkApiStatus();
        this.loadCurrentUser();
        this.setupEventListeners();
        this.showPage('home');
        this.updateSidebarUserInfo();
    }

    // 检查API状态
    async checkApiStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/health`);
            if (response.ok) {
                document.getElementById('api-status').textContent = '正常';
                document.getElementById('api-status').className = 'badge bg-success';
            }
        } catch (error) {
            document.getElementById('api-status').textContent = '异常';
            document.getElementById('api-status').className = 'badge bg-danger';
        }
    }

    // 加载当前用户
    loadCurrentUser() {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
            try {
                this.currentUser = JSON.parse(userData);
            } catch (e) {
                this.clearUserData();
            }
        }
        this.updateAuthButtons();
        this.updateSidebarUserInfo();
    }

    // 更新认证按钮
    updateAuthButtons() {
        const authButtons = document.getElementById('auth-buttons');
        
        if (this.currentUser) {
            authButtons.innerHTML = `
                <div class="dropdown">
                    <button class="btn btn-outline-light dropdown-toggle" type="button" data-bs-toggle="dropdown">
                        <i class="bi bi-person-circle"></i> ${this.currentUser.username}
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="#" data-page="my-posts"><i class="bi bi-journal-text"></i> 我的文章</a></li>
                        <li><a class="dropdown-item" href="#" data-page="create-post"><i class="bi bi-pencil"></i> 写文章</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" id="logout-btn"><i class="bi bi-box-arrow-right"></i> 退出登录</a></li>
                    </ul>
                </div>
            `;
            
            document.getElementById('logout-btn').addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        } else {
            authButtons.innerHTML = `
                <button class="btn btn-outline-light" data-page="login">
                    <i class="bi bi-person"></i> 登录/注册
                </button>
            `;
        }
        this.bindPageLinks();
    }

    // 更新侧边栏用户信息
    updateSidebarUserInfo() {
        const userInfoCard = document.getElementById('user-info-card');
        const sidebarUsername = document.getElementById('sidebar-username');
        const sidebarLoginBtn = document.getElementById('sidebar-login-btn');
        
        if (this.currentUser) {
            sidebarUsername.textContent = this.currentUser.username;
            userInfoCard.innerHTML = `
                <div class="card-body text-center">
                    <div class="user-avatar-large mb-3">
                        ${this.currentUser.username.charAt(0).toUpperCase()}
                    </div>
                    <h5>${this.currentUser.username}</h5>
                    <p class="text-muted small mb-3">欢迎回来</p>
                    <div class="d-grid gap-2">
                        <button class="btn btn-outline-primary" data-page="my-posts">
                            <i class="bi bi-journal-text"></i> 我的文章
                        </button>
                        <button class="btn btn-primary" data-page="create-post">
                            <i class="bi bi-pencil"></i> 写文章
                        </button>
                    </div>
                </div>
            `;
        } else {
            sidebarUsername.textContent = '游客';
            sidebarLoginBtn.classList.remove('d-none');
        }
        this.bindPageLinks();
    }

    // 设置事件监听
    setupEventListeners() {
        this.bindPageLinks();
        
        // 表单提交
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('create-post-form').addEventListener('submit', (e) => this.handleCreatePost(e));
        
        // 表单切换
        document.querySelectorAll('[data-form]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchAuthForm(e.target.getAttribute('data-form'));
            });
        });
        
        // 搜索
        document.getElementById('search-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const keyword = document.getElementById('search-input').value.trim();
            if (keyword) this.searchPosts(keyword);
        });
        
        // 排序
        document.getElementById('sort-select').addEventListener('change', () => {
            this.currentPageNum = 1;
            this.renderPostsList();
        });
        
        // 保存草稿
        document.getElementById('save-draft-btn').addEventListener('click', () => this.saveDraft());
        
        // 关闭登录模态框
        document.querySelector('.login-header .btn-close').addEventListener('click', () => {
            this.showPage('home');
        });
        
        // 侧边栏登录按钮
        document.getElementById('sidebar-login-btn')?.addEventListener('click', () => {
            this.showPage('login');
        });
    }

    bindPageLinks() {
        document.querySelectorAll('[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.getAttribute('data-page');
                this.showPage(page);
            });
        });
    }

    switchAuthForm(formType) {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const loginTab = document.querySelector('[data-form="login"]');
        const registerTab = document.querySelector('[data-form="register"]');
        
        if (formType === 'login') {
            loginForm.classList.remove('d-none');
            registerForm.classList.add('d-none');
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
        } else {
            loginForm.classList.add('d-none');
            registerForm.classList.remove('d-none');
            loginTab.classList.remove('active');
            registerTab.classList.add('active');
        }
    }

    // 显示页面
    showPage(page) {
        this.currentPage = page;
        
        // 隐藏所有页面
        document.getElementById('welcome-section').classList.add('d-none');
        document.getElementById('posts-page').classList.add('d-none');
        document.getElementById('my-posts-page').classList.add('d-none');
        document.getElementById('post-detail-page').classList.add('d-none');
        document.getElementById('login-page').classList.add('d-none');
        document.getElementById('create-post-page').classList.add('d-none');
        document.getElementById('search-page').classList.add('d-none');
        
        // 更新导航栏激活状态
        document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            }
        });
        
        switch (page) {
            case 'home':
                document.getElementById('welcome-section').classList.remove('d-none');
                this.loadStats();
                this.loadLatestPosts();
                break;
            case 'posts':
                document.getElementById('posts-page').classList.remove('d-none');
                this.loadPosts();
                break;
            case 'my-posts':
                if (!this.currentUser) {
                    this.showPage('login');
                    this.showToast('请先登录', 'warning');
                    return;
                }
                document.getElementById('my-posts-page').classList.remove('d-none');
                this.loadMyPosts();
                break;
            case 'post-detail':
                document.getElementById('post-detail-page').classList.remove('d-none');
                if (this.currentPostId) this.loadPostDetail(this.currentPostId);
                break;
            case 'login':
                document.getElementById('login-page').classList.remove('d-none');
                this.switchAuthForm('login');
                break;
            case 'create-post':
                if (!this.currentUser) {
                    this.showPage('login');
                    this.showToast('请先登录', 'warning');
                    return;
                }
                document.getElementById('create-post-page').classList.remove('d-none');
                this.initPostForm();
                break;
        }
    }

    // 加载统计数据
    async loadStats() {
        try {
            const posts = await this.apiRequest('/posts');
            const users = await this.apiRequest('/users');
            
            // 更新侧边栏统计
            document.getElementById('sidebar-stat-posts').textContent = posts.length;
            document.getElementById('sidebar-stat-users').textContent = users?.length || 0;
            
            // 今日更新
            const today = new Date().toDateString();
            const todayPosts = posts.filter(p => new Date(p.created_at).toDateString() === today);
            document.getElementById('sidebar-stat-updates').textContent = todayPosts.length;
        } catch (error) {
            console.error('加载统计失败:', error);
        }
    }

    // 加载最新文章
    async loadLatestPosts() {
        const container = document.getElementById('latest-posts');
        try {
            const posts = await this.apiRequest('/posts');
            const latest = posts.slice(0, 6);
            
            if (latest.length === 0) {
                container.innerHTML = '<div class="col-12 text-center text-muted py-3">暂无文章</div>';
                return;
            }
            
            container.innerHTML = '';
            latest.forEach(post => {
                container.appendChild(this.createPostCard(post));
            });
            
            document.querySelectorAll('.post-card').forEach(card => {
                card.addEventListener('click', () => {
                    this.showPostDetail(card.getAttribute('data-post-id'));
                });
            });
        } catch (error) {
            container.innerHTML = '<div class="col-12 text-center text-danger py-3">加载失败</div>';
        }
    }

    // 加载所有文章
    async loadPosts() {
        try {
            const posts = await this.apiRequest('/posts');
            this.allPosts = posts;
            this.totalPosts = posts.length;
            this.renderPostsList();
        } catch (error) {
            this.showToast('加载文章失败', 'danger');
        }
    }

    // 渲染文章列表
    renderPostsList() {
        const container = document.getElementById('posts-list');
        const sortType = document.getElementById('sort-select').value;
        
        // 排序
        let sorted = [...this.allPosts];
        switch (sortType) {
            case 'newest':
                sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'oldest':
                sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'title':
                sorted.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
                break;
        }
        
        // 分页
        const start = (this.currentPageNum - 1) * this.postsPerPage;
        const paged = sorted.slice(start, start + this.postsPerPage);
        
        if (paged.length === 0) {
            container.innerHTML = '<div class="col-12 text-center text-muted py-5">暂无文章</div>';
            document.getElementById('pagination').classList.add('d-none');
            return;
        }
        
        container.innerHTML = '';
        paged.forEach(post => {
            container.appendChild(this.createPostCard(post));
        });
        
        // 绑定事件
        document.querySelectorAll('.post-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.action-buttons')) {
                    this.showPostDetail(card.getAttribute('data-post-id'));
                }
            });
        });
        
        // 分页
        this.renderPagination();
    }

    // 渲染分页
    renderPagination() {
        const totalPages = Math.ceil(this.totalPosts / this.postsPerPage);
        const pagination = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            pagination.classList.add('d-none');
            return;
        }
        
        pagination.classList.remove('d-none');
        const ul = pagination.querySelector('ul');
        ul.innerHTML = `
            <li class="page-item ${this.currentPageNum === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="prev">上一页</a>
            </li>
        `;
        
        for (let i = 1; i <= totalPages; i++) {
            ul.innerHTML += `
                <li class="page-item ${i === this.currentPageNum ? 'active' : ''}">
                    <a class="page-link" href="#" data-page-num="${i}">${i}</a>
                </li>
            `;
        }
        
        ul.innerHTML += `
            <li class="page-item ${this.currentPageNum === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="next">下一页</a>
            </li>
        `;
        
        // 绑定分页点击
        ul.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.getAttribute('data-page');
                const pageNum = e.target.getAttribute('data-page-num');
                
                if (page === 'prev' && this.currentPageNum > 1) {
                    this.currentPageNum--;
                } else if (page === 'next' && this.currentPageNum < totalPages) {
                    this.currentPageNum++;
                } else if (pageNum) {
                    this.currentPageNum = parseInt(pageNum);
                }
                
                this.renderPostsList();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }

    // 加载我的文章
    async loadMyPosts() {
        const container = document.getElementById('my-posts-list');
        try {
            const posts = await this.apiRequest('/posts');
            const myPosts = posts.filter(p => p.author_id === this.currentUser.id);
            
            if (myPosts.length === 0) {
                container.innerHTML = '<div class="col-12 text-center text-muted py-5">你还没有发表过文章</div>';
                return;
            }
            
            container.innerHTML = '';
            myPosts.forEach(post => {
                container.appendChild(this.createPostCard(post, true));
            });
            
            document.querySelectorAll('.post-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (!e.target.closest('.action-buttons')) {
                        this.showPostDetail(card.getAttribute('data-post-id'));
                    }
                });
            });
        } catch (error) {
            this.showToast('加载失败', 'danger');
        }
    }

    // 创建文章卡片
    createPostCard(post, showActions = false) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 mb-4';
        
        const date = new Date(post.created_at).toLocaleDateString('zh-CN');
        const isOwner = this.currentUser && this.currentUser.id === post.author_id;
        
        col.innerHTML = `
            <div class="card post-card h-100" data-post-id="${post.id}">
                <div class="card-body d-flex flex-column">
                    <h5 class="post-title">${this.escapeHtml(post.title)}</h5>
                    <p class="post-content flex-grow-1">${this.escapeHtml(post.content.substring(0, 100))}${post.content.length > 100 ? '...' : ''}</p>
                    <div class="post-meta">
                        <div><i class="bi bi-person"></i> ${this.escapeHtml(post.author_name)}</div>
                        <div><i class="bi bi-calendar"></i> ${date}</div>
                    </div>
                    ${(showActions || isOwner) ? `
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-outline-primary edit-post-btn">
                                <i class="bi bi-pencil"></i> 编辑
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-post-btn">
                                <i class="bi bi-trash"></i> 删除
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        // 绑定编辑删除
        if (isOwner) {
            col.querySelector('.edit-post-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editPost(post.id);
            });
            col.querySelector('.delete-post-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deletePost(post.id);
            });
        }
        
        return col;
    }

    // 显示文章详情
    showPostDetail(postId) {
        this.currentPostId = postId;
        this.showPage('post-detail');
    }

    // 加载文章详情
    async loadPostDetail(postId) {
        const container = document.getElementById('post-detail-content');
        container.innerHTML = '<div class="text-center py-5"><div class="spinner"></div></div>';
        
        try {
            const post = await this.apiRequest(`/posts/${postId}`);
            const date = new Date(post.created_at).toLocaleDateString('zh-CN');
            const isOwner = this.currentUser && this.currentUser.id === post.author_id;
            
            container.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h1 class="post-detail-title">${this.escapeHtml(post.title)}</h1>
                        <div class="post-detail-meta mb-4">
                            <div class="row">
                                <div class="col-md-6">
                                    <div><i class="bi bi-person"></i> 作者: ${this.escapeHtml(post.author_name)}</div>
                                    <div><i class="bi bi-calendar"></i> 发布时间: ${date}</div>
                                </div>
                            </div>
                        </div>
                        <div class="post-detail-content">${this.formatContent(post.content)}</div>
                        ${isOwner ? `
                            <div class="action-buttons mt-4">
                                <button class="btn btn-primary edit-post-btn">
                                    <i class="bi bi-pencil"></i> 编辑文章
                                </button>
                                <button class="btn btn-danger delete-post-btn">
                                    <i class="bi bi-trash"></i> 删除文章
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            if (isOwner) {
                container.querySelector('.edit-post-btn')?.addEventListener('click', () => this.editPost(postId));
                container.querySelector('.delete-post-btn')?.addEventListener('click', () => this.deletePost(postId));
            }
        } catch (error) {
            container.innerHTML = '<div class="alert alert-danger">加载文章失败</div>';
        }
    }

    // 初始化文章表单
    initPostForm() {
        const editId = localStorage.getItem('editPostId');
        const draft = this.getDraft();
        
        if (editId) {
            // 编辑模式
            document.getElementById('post-form-title').innerHTML = '<i class="bi bi-pencil"></i> 编辑文章';
            document.getElementById('post-form-breadcrumb').textContent = '编辑文章';
            this.loadPostForEdit(editId);
            localStorage.removeItem('editPostId');
        } else if (draft) {
            // 草稿
            document.getElementById('post-title').value = draft.title || '';
            document.getElementById('post-content').value = draft.content || '';
            document.getElementById('post-form-title').innerHTML = '<i class="bi bi-pencil"></i> 写文章（草稿）';
            document.getElementById('post-form-breadcrumb').textContent = '写文章（草稿）';
        } else {
            // 新建
            document.getElementById('create-post-form').reset();
            document.getElementById('edit-post-id').value = '';
            document.getElementById('post-form-title').innerHTML = '<i class="bi bi-pencil"></i> 写文章';
            document.getElementById('post-form-breadcrumb').textContent = '写文章';
        }
    }

    // 加载文章用于编辑
    async loadPostForEdit(postId) {
        try {
            const post = await this.apiRequest(`/posts/${postId}`);
            document.getElementById('edit-post-id').value = postId;
            document.getElementById('post-title').value = post.title;
            document.getElementById('post-content').value = post.content;
        } catch (error) {
            this.showToast('加载文章失败', 'danger');
        }
    }

    // 编辑文章
    editPost(postId) {
        localStorage.setItem('editPostId', postId);
        this.showPage('create-post');
    }

    // 删除文章
    async deletePost(postId) {
        if (!confirm('确定要删除这篇文章吗？此操作不可撤销。')) return;
        
        try {
            await this.apiRequest(`/posts/${postId}`, { method: 'DELETE' });
            this.showToast('删除成功', 'success');
            
            if (this.currentPage === 'post-detail') {
                this.showPage('posts');
            } else if (this.currentPage === 'my-posts') {
                this.loadMyPosts();
            } else {
                this.loadPosts();
            }
        } catch (error) {}
    }

    // 保存草稿
    saveDraft() {
        const title = document.getElementById('post-title').value;
        const content = document.getElementById('post-content').value;
        
        if (!title && !content) {
            this.showToast('没有内容可保存', 'warning');
            return;
        }
        
        localStorage.setItem('postDraft', JSON.stringify({ title, content, savedAt: new Date().toISOString() }));
        this.showToast('草稿已保存', 'success');
    }

    getDraft() {
        try {
            return JSON.parse(localStorage.getItem('postDraft'));
        } catch {
            return null;
        }
    }

    // 搜索文章
    async searchPosts(keyword) {
        const container = document.getElementById('search-results');
        document.getElementById('search-keyword').textContent = keyword;
        
        try {
            const posts = await this.apiRequest('/posts');
            const results = posts.filter(p => 
                p.title.toLowerCase().includes(keyword.toLowerCase()) ||
                p.content.toLowerCase().includes(keyword.toLowerCase())
            );
            
            document.getElementById('search-page').classList.remove('d-none');
            document.getElementById('welcome-section').classList.add('d-none');
            document.getElementById('posts-page').classList.add('d-none');
            
            if (results.length === 0) {
                container.innerHTML = '<div class="col-12 text-center text-muted py-5">没有找到匹配的文章</div>';
                return;
            }
            
            container.innerHTML = '';
            results.forEach(post => {
                container.appendChild(this.createPostCard(post));
            });
            
            document.querySelectorAll('.post-card').forEach(card => {
                card.addEventListener('click', () => {
                    this.showPostDetail(card.getAttribute('data-post-id'));
                });
            });
        } catch (error) {
            this.showToast('搜索失败', 'danger');
        }
    }

    // 处理登录
    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const data = await this.apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            this.currentUser = data.user;
            this.updateAuthButtons();
            this.updateSidebarUserInfo();
            this.showToast('登录成功！', 'success');
            this.showPage('home');
            e.target.reset();
        } catch (error) {}
    }

    // 处理注册
    async handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        if (password !== confirmPassword) {
            this.showToast('两次密码不一致', 'warning');
            return;
        }
        
        try {
            await this.apiRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });
            this.showToast('注册成功！请登录', 'success');
            this.switchAuthForm('login');
            e.target.reset();
        } catch (error) {}
    }

    // 处理创建/更新文章
    async handleCreatePost(e) {
        e.preventDefault();
        const editId = document.getElementById('edit-post-id').value;
        const title = document.getElementById('post-title').value;
        const content = document.getElementById('post-content').value;
        
        try {
            if (editId) {
                await this.apiRequest(`/posts/${editId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ title, content }),
                });
                this.showToast('文章更新成功', 'success');
            } else {
                await this.apiRequest('/posts', {
                    method: 'POST',
                    body: JSON.stringify({ title, content }),
                });
                this.showToast('文章发布成功', 'success');
            }
            
            // 清除草稿
            localStorage.removeItem('postDraft');
            localStorage.removeItem('editPostId');
            
            this.showPage('posts');
            e.target.reset();
        } catch (error) {}
    }

    // 退出登录
    logout() {
        this.clearUserData();
        this.showToast('已退出登录', 'info');
        this.showPage('home');
    }

    clearUserData() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('postDraft');
        localStorage.removeItem('editPostId');
        this.currentUser = null;
        this.updateAuthButtons();
        this.updateSidebarUserInfo();
    }

    // API请求
    async apiRequest(endpoint, options = {}) {
        const defaultOptions = { headers: { 'Content-Type': 'application/json' } };
        const token = localStorage.getItem('token');
        if (token) defaultOptions.headers.Authorization = `Bearer ${token}`;
        
        const response = await fetch(`${this.apiBaseUrl}/api${endpoint}`, { ...defaultOptions, ...options });
        
        if (response.status === 401) {
            this.clearUserData();
            this.showToast('登录已过期', 'warning');
            this.showPage('login');
            throw new Error('未授权');
        }
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    }

    // 工具函数
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatContent(content) {
        return content.replace(/\n/g, '<br>');
    }

    // Toast提示
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast show align-items-center text-white bg-${type === 'info' ? 'primary' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'danger'}`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.blogApp = new CSDNBlogApp();
});