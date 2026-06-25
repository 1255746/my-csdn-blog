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
        this.allUsers = [];
        this.sidebarOpen = false;
        
        this.init();
    }

    init() {
        this.checkApiStatus();
        this.loadCurrentUser();
        this.setupEventListeners();
        this.setupSidebar();
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
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="#" data-page="my-posts"><i class="bi bi-journal-text"></i> 我的文章</a></li>
                        <li><a class="dropdown-item" href="#" data-page="favorites"><i class="bi bi-star"></i> 我的收藏</a></li>
                        <li><a class="dropdown-item" href="#" data-page="following"><i class="bi bi-person-plus"></i> 我的关注</a></li>
                        <li><a class="dropdown-item" href="#" data-page="history"><i class="bi bi-clock-history"></i> 浏览历史</a></li>
                        <li><hr class="dropdown-divider"></li>
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
        const sidebarUserMini = document.getElementById('sidebar-user-mini');
        const sidebarUserMenu = document.getElementById('sidebar-user-menu');
        
        if (this.currentUser) {
            // 右侧大卡片
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
            
            // 左侧小卡片
            sidebarUserMini.innerHTML = `
                <div class="user-avatar-sm">${this.currentUser.username.charAt(0).toUpperCase()}</div>
                <div class="user-info">
                    <div class="user-name">${this.currentUser.username}</div>
                    <div class="user-status">查看个人中心</div>
                </div>
            `;
            sidebarUserMini.setAttribute('data-page', 'my-posts');
            
            // 显示个人中心菜单
            sidebarUserMenu.classList.remove('d-none');
        } else {
            sidebarUsername.textContent = '游客';
            sidebarLoginBtn.classList.remove('d-none');
            
            sidebarUserMini.innerHTML = `
                <div class="user-avatar-sm"><i class="bi bi-person-circle"></i></div>
                <div class="user-info">
                    <div class="user-name">游客</div>
                    <div class="user-status">登录后享受更多功能</div>
                </div>
            `;
            sidebarUserMini.setAttribute('data-page', 'login');
            
            // 隐藏个人中心菜单
            sidebarUserMenu.classList.add('d-none');
        }
        this.bindPageLinks();
    }

    // 设置侧边栏交互
    setupSidebar() {
        const sidebar = document.getElementById('left-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const toggleBtn = document.getElementById('sidebar-toggle');
        const closeBtn = document.getElementById('sidebar-close');
        
        const openSidebar = () => {
            sidebar.classList.add('active');
            this.sidebarOpen = true;
            document.body.style.overflow = 'hidden';
        };
        
        const closeSidebar = () => {
            sidebar.classList.remove('active');
            this.sidebarOpen = false;
            document.body.style.overflow = '';
        };
        
        toggleBtn?.addEventListener('click', openSidebar);
        closeBtn?.addEventListener('click', closeSidebar);
        overlay?.addEventListener('click', closeSidebar);
        
        // 点击侧边栏链接后自动关闭
        sidebar?.querySelectorAll('.menu-item a, .sidebar-user').forEach(link => {
            link.addEventListener('click', () => {
                setTimeout(closeSidebar, 150);
            });
        });
        
        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.sidebarOpen) {
                closeSidebar();
            }
        });
    }

    // 设置事件监听
    setupEventListeners() {
        this.bindPageLinks();
        
        // 表单提交
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('create-post-form').addEventListener('submit', (e) => this.handleCreatePost(e));
        document.getElementById('contact-form')?.addEventListener('submit', (e) => this.handleContact(e));
        
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
        
        // 提问按钮
        document.getElementById('ask-question-btn')?.addEventListener('click', () => {
            if (!this.currentUser) {
                this.showToast('请先登录', 'warning');
                this.showPage('login');
                return;
            }
            this.askQuestion();
        });
    }

    bindPageLinks() {
        document.querySelectorAll('[data-page]').forEach(link => {
            // 避免重复绑定
            if (link.dataset.bound) return;
            link.dataset.bound = 'true';
            
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.getAttribute('data-page');
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
        const pages = [
            'welcome-section', 'posts-page', 'my-posts-page', 'post-detail-page',
            'login-page', 'create-post-page', 'search-page', 'columns-page',
            'qa-page', 'contests-page', 'downloads-page', 'learn-page',
            'community-page', 'favorites-page', 'following-page', 'history-page',
            'about-page', 'contact-page'
        ];
        pages.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('d-none');
        });
        
        // 更新顶部导航激活状态
        document.querySelectorAll('.top-nav-menu .nav-link, .navbar-nav .nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            }
        });
        
        // 更新左侧边栏激活状态
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === page) {
                item.classList.add('active');
            }
        });
        
        // 需要登录的页面
        const requireAuth = ['my-posts', 'favorites', 'following', 'history', 'create-post'];
        if (requireAuth.includes(page) && !this.currentUser) {
            this.showPage('login');
            this.showToast('请先登录', 'warning');
            return;
        }
        
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
            case 'columns':
                document.getElementById('columns-page').classList.remove('d-none');
                this.loadColumns();
                break;
            case 'qa':
                document.getElementById('qa-page').classList.remove('d-none');
                this.loadQA();
                break;
            case 'contests':
                document.getElementById('contests-page').classList.remove('d-none');
                this.loadContests();
                break;
            case 'downloads':
                document.getElementById('downloads-page').classList.remove('d-none');
                this.loadDownloads();
                break;
            case 'learn':
                document.getElementById('learn-page').classList.remove('d-none');
                this.loadLearn();
                break;
            case 'community':
                document.getElementById('community-page').classList.remove('d-none');
                this.loadCommunity();
                break;
            case 'my-posts':
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
                document.getElementById('create-post-page').classList.remove('d-none');
                this.initPostForm();
                break;
            case 'search':
                document.getElementById('search-page').classList.remove('d-none');
                break;
            case 'favorites':
                document.getElementById('favorites-page').classList.remove('d-none');
                this.loadFavorites();
                break;
            case 'following':
                document.getElementById('following-page').classList.remove('d-none');
                this.loadFollowing();
                break;
            case 'history':
                document.getElementById('history-page').classList.remove('d-none');
                this.loadHistory();
                break;
            case 'about':
                document.getElementById('about-page').classList.remove('d-none');
                break;
            case 'contact':
                document.getElementById('contact-page').classList.remove('d-none');
                break;
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 加载统计数据
    async loadStats() {
        try {
            const posts = await this.apiRequest('/posts');
            const users = await this.apiRequest('/users');
            this.allPosts = posts;
            this.allUsers = users || [];
            
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
            
            this.bindPostCardEvents();
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
            this.currentPageNum = 1;
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
        
        this.bindPostCardEvents();
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
                container.innerHTML = this.createEmptyState('你还没有发表过文章', 'bi-journal-x');
                return;
            }
            
            container.innerHTML = '';
            myPosts.forEach(post => {
                container.appendChild(this.createPostCard(post, true));
            });
            
            this.bindPostCardEvents();
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
        const isFav = this.isFavorite(post.id);
        
        col.innerHTML = `
            <div class="card post-card h-100" data-post-id="${post.id}">
                <div class="card-body d-flex flex-column">
                    <h5 class="post-title">${this.escapeHtml(post.title)}</h5>
                    <p class="post-content flex-grow-1">${this.escapeHtml(post.content.substring(0, 100))}${post.content.length > 100 ? '...' : ''}</p>
                    <div class="post-meta">
                        <div><i class="bi bi-person"></i> ${this.escapeHtml(post.author_name)}</div>
                        <div><i class="bi bi-calendar"></i> ${date}</div>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-2">
                        ${(showActions || isOwner) ? `
                            <div class="action-buttons">
                                <button class="btn btn-sm btn-outline-primary edit-post-btn">
                                    <i class="bi bi-pencil"></i> 编辑
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-post-btn">
                                    <i class="bi bi-trash"></i> 删除
                                </button>
                            </div>
                        ` : '<div></div>'}
                        <button class="btn btn-sm ${isFav ? 'btn-warning' : 'btn-outline-warning'} favorite-btn" data-post-id="${post.id}">
                            <i class="bi ${isFav ? 'bi-star-fill' : 'bi-star'}"></i>
                        </button>
                    </div>
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
        
        // 绑定收藏
        col.querySelector('.favorite-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(post.id);
        });
        
        return col;
    }

    // 绑定文章卡片点击事件
    bindPostCardEvents() {
        document.querySelectorAll('.post-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.action-buttons') && !e.target.closest('.favorite-btn')) {
                    this.showPostDetail(card.getAttribute('data-post-id'));
                }
            });
        });
    }

    // 显示文章详情
    showPostDetail(postId) {
        this.currentPostId = postId;
        this.addHistory(postId);
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
            const isFav = this.isFavorite(post.id);
            const isFollowed = this.isFollowing(post.author_id);
            
            container.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h1 class="post-detail-title">${this.escapeHtml(post.title)}</h1>
                        <div class="post-detail-meta mb-4">
                            <div class="row align-items-center">
                                <div class="col-md-6">
                                    <div><i class="bi bi-person"></i> 作者: ${this.escapeHtml(post.author_name)}</div>
                                    <div><i class="bi bi-calendar"></i> 发布时间: ${date}</div>
                                </div>
                                <div class="col-md-6 text-md-end mt-2 mt-md-0">
                                    ${this.currentUser && !isOwner ? `
                                        <button class="btn btn-sm ${isFollowed ? 'btn-secondary' : 'btn-outline-primary'} follow-author-btn me-2">
                                            <i class="bi ${isFollowed ? 'bi-person-check' : 'bi-person-plus'}"></i> ${isFollowed ? '已关注' : '关注作者'}
                                        </button>
                                    ` : ''}
                                    <button class="btn btn-sm ${isFav ? 'btn-warning' : 'btn-outline-warning'} favorite-detail-btn">
                                        <i class="bi ${isFav ? 'bi-star-fill' : 'bi-star'}"></i> ${isFav ? '已收藏' : '收藏'}
                                    </button>
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
            
            container.querySelector('.favorite-detail-btn')?.addEventListener('click', () => {
                this.toggleFavorite(post.id);
                this.loadPostDetail(postId);
            });
            
            container.querySelector('.follow-author-btn')?.addEventListener('click', (e) => {
                this.toggleFollow(post.author_id, post.author_name);
                e.target.innerHTML = this.isFollowing(post.author_id) 
                    ? '<i class="bi bi-person-check"></i> 已关注' 
                    : '<i class="bi bi-person-plus"></i> 关注作者';
                e.target.className = this.isFollowing(post.author_id)
                    ? 'btn btn-sm btn-secondary follow-author-btn me-2'
                    : 'btn btn-sm btn-outline-primary follow-author-btn me-2';
            });
        } catch (error) {
            container.innerHTML = '<div class="alert alert-danger">加载文章失败</div>';
        }
    }

    // 初始化文章表单
    initPostForm() {
        const editId = localStorage.getItem('editPostId');
        const draft = this.getDraft();
        
        if (editId) {
            document.getElementById('post-form-title').innerHTML = '<i class="bi bi-pencil"></i> 编辑文章';
            document.getElementById('post-form-breadcrumb').textContent = '编辑文章';
            this.loadPostForEdit(editId);
            localStorage.removeItem('editPostId');
        } else if (draft) {
            document.getElementById('post-title').value = draft.title || '';
            document.getElementById('post-content').value = draft.content || '';
            document.getElementById('post-form-title').innerHTML = '<i class="bi bi-pencil"></i> 写文章（草稿）';
            document.getElementById('post-form-breadcrumb').textContent = '写文章（草稿）';
        } else {
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
            this.removeFavorite(postId);
            this.removeHistory(postId);
            this.showToast('删除成功', 'success');
            
            if (this.currentPage === 'post-detail') {
                this.showPage('posts');
            } else if (this.currentPage === 'my-posts') {
                this.loadMyPosts();
            } else if (this.currentPage === 'favorites') {
                this.loadFavorites();
            } else if (this.currentPage === 'history') {
                this.loadHistory();
            } else {
                this.loadPosts();
            }
        } catch (error) {
            this.showToast('删除失败', 'danger');
        }
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
            
            this.showPage('search');
            
            if (results.length === 0) {
                container.innerHTML = this.createEmptyState('没有找到匹配的文章', 'bi-search');
                return;
            }
            
            container.innerHTML = '';
            results.forEach(post => {
                container.appendChild(this.createPostCard(post));
            });
            
            this.bindPostCardEvents();
        } catch (error) {
            this.showToast('搜索失败', 'danger');
        }
    }

    // ==================== 收藏功能 ====================
    getFavorites() {
        try {
            return JSON.parse(localStorage.getItem('favorites') || '[]');
        } catch {
            return [];
        }
    }

    isFavorite(postId) {
        return this.getFavorites().includes(parseInt(postId));
    }

    toggleFavorite(postId) {
        if (!this.currentUser) {
            this.showToast('请先登录', 'warning');
            this.showPage('login');
            return;
        }
        
        postId = parseInt(postId);
        let favorites = this.getFavorites();
        
        if (favorites.includes(postId)) {
            favorites = favorites.filter(id => id !== postId);
            this.showToast('已取消收藏', 'info');
        } else {
            favorites.push(postId);
            this.showToast('收藏成功', 'success');
        }
        
        localStorage.setItem('favorites', JSON.stringify(favorites));
        
        // 刷新当前页面显示
        if (this.currentPage === 'favorites') {
            this.loadFavorites();
        } else if (this.currentPage === 'posts' || this.currentPage === 'home' || this.currentPage === 'columns') {
            this.refreshPostCards();
        }
    }

    removeFavorite(postId) {
        let favorites = this.getFavorites().filter(id => id !== parseInt(postId));
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }

    async loadFavorites() {
        const container = document.getElementById('favorites-list');
        const favorites = this.getFavorites();
        
        if (favorites.length === 0) {
            container.innerHTML = this.createEmptyState('你还没有收藏任何文章', 'bi-star');
            return;
        }
        
        try {
            const posts = await this.apiRequest('/posts');
            const favPosts = posts.filter(p => favorites.includes(p.id));
            
            if (favPosts.length === 0) {
                container.innerHTML = this.createEmptyState('收藏的文章不存在了', 'bi-star');
                return;
            }
            
            container.innerHTML = '';
            favPosts.forEach(post => {
                container.appendChild(this.createPostCard(post));
            });
            this.bindPostCardEvents();
        } catch (error) {
            this.showToast('加载失败', 'danger');
        }
    }

    // ==================== 关注功能 ====================
    getFollowing() {
        try {
            return JSON.parse(localStorage.getItem('following') || '[]');
        } catch {
            return [];
        }
    }

    isFollowing(userId) {
        return this.getFollowing().some(item => item.id === parseInt(userId));
    }

    toggleFollow(userId, username) {
        if (!this.currentUser) {
            this.showToast('请先登录', 'warning');
            this.showPage('login');
            return;
        }
        
        userId = parseInt(userId);
        if (userId === this.currentUser.id) {
            this.showToast('不能关注自己', 'warning');
            return;
        }
        
        let following = this.getFollowing();
        
        if (following.some(item => item.id === userId)) {
            following = following.filter(item => item.id !== userId);
            this.showToast('已取消关注', 'info');
        } else {
            following.push({ id: userId, username: username, followedAt: new Date().toISOString() });
            this.showToast(`已关注 ${username}`, 'success');
        }
        
        localStorage.setItem('following', JSON.stringify(following));
        
        if (this.currentPage === 'following') {
            this.loadFollowing();
        }
    }

    async loadFollowing() {
        const container = document.getElementById('following-list');
        const following = this.getFollowing();
        
        if (following.length === 0) {
            container.innerHTML = this.createEmptyState('你还没有关注任何人', 'bi-person-plus');
            return;
        }
        
        container.innerHTML = '';
        following.forEach(user => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4 mb-4';
            col.innerHTML = `
                <div class="card text-center h-100">
                    <div class="card-body">
                        <div class="user-avatar-large mx-auto mb-3">${user.username.charAt(0).toUpperCase()}</div>
                        <h5>${this.escapeHtml(user.username)}</h5>
                        <p class="text-muted small">关注于 ${new Date(user.followedAt).toLocaleDateString('zh-CN')}</p>
                        <button class="btn btn-outline-danger btn-sm unfollow-btn" data-user-id="${user.id}">
                            <i class="bi bi-person-x"></i> 取消关注
                        </button>
                    </div>
                </div>
            `;
            col.querySelector('.unfollow-btn').addEventListener('click', () => {
                this.toggleFollow(user.id, user.username);
                this.loadFollowing();
            });
            container.appendChild(col);
        });
    }

    // ==================== 浏览历史 ====================
    getHistory() {
        try {
            return JSON.parse(localStorage.getItem('history') || '[]');
        } catch {
            return [];
        }
    }

    addHistory(postId) {
        postId = parseInt(postId);
        let history = this.getHistory().filter(id => id !== postId);
        history.unshift(postId);
        // 最多保存50条
        if (history.length > 50) history = history.slice(0, 50);
        localStorage.setItem('history', JSON.stringify(history));
    }

    removeHistory(postId) {
        let history = this.getHistory().filter(id => id !== parseInt(postId));
        localStorage.setItem('history', JSON.stringify(history));
    }

    async loadHistory() {
        const container = document.getElementById('history-list');
        const history = this.getHistory();
        
        if (history.length === 0) {
            container.innerHTML = this.createEmptyState('还没有浏览记录', 'bi-clock-history');
            return;
        }
        
        try {
            const posts = await this.apiRequest('/posts');
            const historyPosts = history.map(id => posts.find(p => p.id === id)).filter(Boolean);
            
            container.innerHTML = '';
            historyPosts.forEach(post => {
                container.appendChild(this.createPostCard(post));
            });
            this.bindPostCardEvents();
        } catch (error) {
            this.showToast('加载失败', 'danger');
        }
    }

    // ==================== 专栏功能 ====================
    async loadColumns() {
        const container = document.getElementById('columns-list');
        
        try {
            const posts = await this.apiRequest('/posts');
            const categories = this.getCategories(posts);
            
            if (categories.length === 0) {
                container.innerHTML = this.createEmptyState('暂无专栏内容', 'bi-columns');
                return;
            }
            
            container.innerHTML = '';
            categories.forEach(cat => {
                const col = document.createElement('div');
                col.className = 'col-md-6 col-lg-4 mb-4';
                col.innerHTML = `
                    <div class="card h-100 column-card" data-category="${this.escapeHtml(cat.name)}">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-3">
                                <div class="resource-icon me-3">
                                    <i class="bi ${cat.icon}"></i>
                                </div>
                                <div>
                                    <h5 class="mb-1">${this.escapeHtml(cat.name)}</h5>
                                    <small class="text-muted">${cat.count} 篇文章</small>
                                </div>
                            </div>
                            <p class="text-muted small">${this.escapeHtml(cat.description)}</p>
                            <div class="mt-3">
                                ${cat.samples.slice(0, 3).map(p => `<div class="small text-truncate text-primary">• ${this.escapeHtml(p.title)}</div>`).join('')}
                            </div>
                        </div>
                        <div class="card-footer bg-transparent">
                            <button class="btn btn-sm btn-outline-primary w-100 view-column-btn">
                                <i class="bi bi-eye"></i> 查看专栏
                            </button>
                        </div>
                    </div>
                `;
                col.querySelector('.view-column-btn').addEventListener('click', () => {
                    this.showColumnPosts(cat.name);
                });
                container.appendChild(col);
            });
        } catch (error) {
            this.showToast('加载专栏失败', 'danger');
        }
    }

    getCategories(posts) {
        const categoryMap = {
            '前端': { icon: 'bi-layout-wtf', description: 'HTML、CSS、JavaScript等前端技术' },
            '后端': { icon: 'bi-server', description: 'Node.js、Python、Java等后端技术' },
            '数据库': { icon: 'bi-database', description: 'MySQL、MongoDB、Redis等数据库技术' },
            '算法': { icon: 'bi-graph-up', description: '数据结构与算法' },
            '人工智能': { icon: 'bi-cpu', description: 'AI、机器学习、深度学习' },
            '运维': { icon: 'bi-cloud', description: 'Linux、Docker、K8s等运维技术' },
            '移动开发': { icon: 'bi-phone', description: 'Android、iOS、小程序开发' },
            '其他': { icon: 'bi-folder', description: '其他技术文章' }
        };
        
        const keywords = {
            '前端': ['前端', 'html', 'css', 'javascript', 'js', 'vue', 'react', 'angular', 'bootstrap'],
            '后端': ['后端', 'node', 'python', 'java', 'go', 'rust', 'spring', 'express', 'django'],
            '数据库': ['数据库', 'mysql', 'mongodb', 'redis', 'sql', 'sqlite', 'orm'],
            '算法': ['算法', '排序', '链表', '树', '图', '动态规划', 'leetcode'],
            '人工智能': ['ai', '人工智能', '机器学习', '深度学习', '神经网络', 'gpt', 'llm'],
            '运维': ['linux', 'docker', 'k8s', 'kubernetes', 'nginx', '运维', '服务器'],
            '移动开发': ['android', 'ios', '小程序', 'flutter', 'react native', '移动端']
        };
        
        const categories = {};
        
        posts.forEach(post => {
            const text = (post.title + ' ' + post.content).toLowerCase();
            let matched = false;
            
            for (const [catName, words] of Object.entries(keywords)) {
                if (words.some(w => text.includes(w.toLowerCase()))) {
                    if (!categories[catName]) {
                        categories[catName] = { name: catName, count: 0, samples: [], ...categoryMap[catName] };
                    }
                    categories[catName].count++;
                    categories[catName].samples.push(post);
                    matched = true;
                    break;
                }
            }
            
            if (!matched) {
                if (!categories['其他']) {
                    categories['其他'] = { name: '其他', count: 0, samples: [], ...categoryMap['其他'] };
                }
                categories['其他'].count++;
                categories['其他'].samples.push(post);
            }
        });
        
        return Object.values(categories).sort((a, b) => b.count - a.count);
    }

    async showColumnPosts(categoryName) {
        const container = document.getElementById('columns-list').parentElement;
        
        try {
            const posts = await this.apiRequest('/posts');
            const keywords = {
                '前端': ['前端', 'html', 'css', 'javascript', 'js', 'vue', 'react', 'angular', 'bootstrap'],
                '后端': ['后端', 'node', 'python', 'java', 'go', 'rust', 'spring', 'express', 'django'],
                '数据库': ['数据库', 'mysql', 'mongodb', 'redis', 'sql', 'sqlite', 'orm'],
                '算法': ['算法', '排序', '链表', '树', '图', '动态规划', 'leetcode'],
                '人工智能': ['ai', '人工智能', '机器学习', '深度学习', '神经网络', 'gpt', 'llm'],
                '运维': ['linux', 'docker', 'k8s', 'kubernetes', 'nginx', '运维', '服务器'],
                '移动开发': ['android', 'ios', '小程序', 'flutter', 'react native', '移动端'],
                '其他': []
            };
            
            let filtered;
            if (categoryName === '其他') {
                const allKeywords = Object.values(keywords).flat();
                filtered = posts.filter(p => !allKeywords.some(w => (p.title + ' ' + p.content).toLowerCase().includes(w.toLowerCase())));
            } else {
                const words = keywords[categoryName] || [];
                filtered = posts.filter(p => words.some(w => (p.title + ' ' + p.content).toLowerCase().includes(w.toLowerCase())));
            }
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4><i class="bi bi-columns"></i> ${this.escapeHtml(categoryName)} 专栏</h4>
                    <button class="btn btn-outline-primary btn-sm back-to-columns">
                        <i class="bi bi-arrow-left"></i> 返回专栏列表
                    </button>
                </div>
                <div class="row" id="column-posts-list"></div>
            `;
            
            container.innerHTML = '';
            container.appendChild(tempDiv);
            
            const list = document.getElementById('column-posts-list');
            if (filtered.length === 0) {
                list.innerHTML = this.createEmptyState('该专栏暂无文章', 'bi-columns');
            } else {
                filtered.forEach(post => {
                    list.appendChild(this.createPostCard(post));
                });
                this.bindPostCardEvents();
            }
            
            document.querySelector('.back-to-columns').addEventListener('click', () => {
                document.getElementById('columns-list').innerHTML = '';
                this.loadColumns();
            });
        } catch (error) {
            this.showToast('加载失败', 'danger');
        }
    }

    refreshPostCards() {
        if (this.currentPage === 'posts') this.renderPostsList();
        else if (this.currentPage === 'home') this.loadLatestPosts();
        else if (this.currentPage === 'columns') this.loadColumns();
    }

    // ==================== 问答功能 ====================
    getQuestions() {
        try {
            return JSON.parse(localStorage.getItem('questions') || '[]');
        } catch {
            return [];
        }
    }

    saveQuestions(questions) {
        localStorage.setItem('questions', JSON.stringify(questions));
    }

    loadQA() {
        const container = document.getElementById('qa-list');
        let questions = this.getQuestions();
        
        // 如果没有问题，初始化一些示例
        if (questions.length === 0) {
            questions = [
                {
                    id: 1,
                    title: '如何学习Node.js？',
                    author: '新手小白',
                    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
                    views: 128,
                    answers: 5,
                    votes: 12,
                    solved: true
                },
                {
                    id: 2,
                    title: 'React和Vue该怎么选择？',
                    author: '前端爱好者',
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    views: 256,
                    answers: 8,
                    votes: 23,
                    solved: false
                },
                {
                    id: 3,
                    title: '数据库索引优化有什么技巧？',
                    author: '后端工程师',
                    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
                    views: 89,
                    answers: 3,
                    votes: 7,
                    solved: false
                }
            ];
            this.saveQuestions(questions);
        }
        
        container.innerHTML = '';
        questions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(q => {
            const item = document.createElement('div');
            item.className = 'qa-item';
            item.innerHTML = `
                <div class="d-flex">
                    <div class="qa-stats me-4 flex-shrink-0">
                        <div class="qa-stat">
                            <div class="qa-stat-number">${q.votes}</div>
                            <div class="qa-stat-label">投票</div>
                        </div>
                        <div class="qa-stat">
                            <div class="qa-stat-number ${q.solved ? 'text-success' : ''}">${q.answers}</div>
                            <div class="qa-stat-label">${q.solved ? '已解决' : '回答'}</div>
                        </div>
                    </div>
                    <div class="flex-grow-1">
                        <div class="qa-title">${this.escapeHtml(q.title)}</div>
                        <div class="qa-meta">
                            <span><i class="bi bi-person"></i> ${this.escapeHtml(q.author)}</span>
                            <span><i class="bi bi-clock"></i> ${new Date(q.createdAt).toLocaleDateString('zh-CN')}</span>
                            <span><i class="bi bi-eye"></i> ${q.views} 浏览</span>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(item);
        });
    }

    askQuestion() {
        const title = prompt('请输入问题标题：');
        if (!title || !title.trim()) return;
        
        const questions = this.getQuestions();
        questions.push({
            id: Date.now(),
            title: title.trim(),
            author: this.currentUser.username,
            createdAt: new Date().toISOString(),
            views: 0,
            answers: 0,
            votes: 0,
            solved: false
        });
        
        this.saveQuestions(questions);
        this.showToast('问题已提交', 'success');
        this.loadQA();
    }

    // ==================== 竞赛功能 ====================
    loadContests() {
        const container = document.getElementById('contests-list');
        const contests = [
            {
                title: 'AI编程挑战赛',
                status: 'ongoing',
                statusText: '进行中',
                time: '报名截止：2026-07-15',
                prize: '奖金池 ¥50,000',
                icon: 'bi-robot'
            },
            {
                title: '全栈开发黑客松',
                status: 'upcoming',
                statusText: '即将开始',
                time: '开始时间：2026-08-01',
                prize: '奖金池 ¥30,000',
                icon: 'bi-laptop'
            },
            {
                title: '算法竞赛月赛',
                status: 'ongoing',
                statusText: '进行中',
                time: '每周六 20:00',
                prize: '积分 + 徽章',
                icon: 'bi-trophy'
            },
            {
                title: '开源项目贡献赛',
                status: 'upcoming',
                statusText: '即将开始',
                time: '开始时间：2026-07-20',
                prize: '实习机会',
                icon: 'bi-github'
            }
        ];
        
        container.innerHTML = '';
        contests.forEach(c => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4 mb-4';
            col.innerHTML = `
                <div class="card contest-card h-100">
                    <div class="contest-banner">
                        <i class="bi ${c.icon}"></i>
                    </div>
                    <div class="card-body">
                        <span class="contest-status ${c.status}">${c.statusText}</span>
                        <h5 class="card-title">${this.escapeHtml(c.title)}</h5>
                        <p class="text-muted small mb-2"><i class="bi bi-clock"></i> ${c.time}</p>
                        <p class="text-primary small mb-3"><i class="bi bi-gift"></i> ${c.prize}</p>
                        <button class="btn btn-primary btn-sm w-100 join-contest-btn">
                            ${c.status === 'ongoing' ? '立即参加' : '预约提醒'}
                        </button>
                    </div>
                </div>
            `;
            col.querySelector('.join-contest-btn').addEventListener('click', () => {
                if (!this.currentUser) {
                    this.showToast('请先登录', 'warning');
                    this.showPage('login');
                    return;
                }
                this.showToast(c.status === 'ongoing' ? '报名成功！' : '已设置提醒', 'success');
            });
            container.appendChild(col);
        });
    }

    // ==================== 下载功能 ====================
    loadDownloads() {
        const container = document.getElementById('downloads-list');
        const resources = [
            { title: 'VS Code 配置包', desc: '包含常用插件和主题配置', size: '2.3 MB', icon: 'bi-file-earmark-zip' },
            { title: '前端面试题合集', desc: '2026年最新前端面试题整理', size: '1.5 MB', icon: 'bi-file-earmark-pdf' },
            { title: 'API 接口文档模板', desc: 'RESTful API设计文档模板', size: '856 KB', icon: 'bi-file-earmark-word' },
            { title: 'Docker 部署脚本', desc: '常用服务的Docker Compose配置', size: '45 KB', icon: 'bi-file-earmark-code' },
            { title: 'SQL 面试题库', desc: '数据库面试常见SQL题目', size: '320 KB', icon: 'bi-database' },
            { title: '算法笔记 PDF', desc: '常用算法与数据结构笔记', size: '5.2 MB', icon: 'bi-journal-bookmark' }
        ];
        
        container.innerHTML = '';
        resources.forEach(r => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4 mb-4';
            col.innerHTML = `
                <div class="card resource-card h-100">
                    <div class="resource-icon">
                        <i class="bi ${r.icon}"></i>
                    </div>
                    <h5 class="card-title">${this.escapeHtml(r.title)}</h5>
                    <p class="text-muted small">${this.escapeHtml(r.desc)}</p>
                    <p class="text-primary small"><i class="bi bi-hdd"></i> ${r.size}</p>
                    <button class="btn btn-outline-primary btn-sm w-100 download-btn mt-auto">
                        <i class="bi bi-download"></i> 立即下载
                    </button>
                </div>
            `;
            col.querySelector('.download-btn').addEventListener('click', () => {
                this.showToast('开始下载：' + r.title, 'success');
            });
            container.appendChild(col);
        });
    }

    // ==================== 学习功能 ====================
    loadLearn() {
        const container = document.getElementById('learn-list');
        const courses = [
            { title: 'JavaScript 从入门到精通', level: '入门', lessons: 48, icon: 'bi-filetype-js' },
            { title: 'Node.js 后端开发实战', level: '进阶', lessons: 36, icon: 'bi-server' },
            { title: 'React 18 核心技术', level: '进阶', lessons: 42, icon: 'bi-bootstrap' },
            { title: '数据库设计与优化', level: '中级', lessons: 28, icon: 'bi-database' },
            { title: 'Docker 容器化部署', level: '进阶', lessons: 20, icon: 'bi-docker' },
            { title: '算法与数据结构', level: '中级', lessons: 60, icon: 'bi-diagram-3' }
        ];
        
        container.innerHTML = '';
        courses.forEach(c => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4 mb-4';
            col.innerHTML = `
                <div class="card resource-card h-100">
                    <div class="resource-icon">
                        <i class="bi ${c.icon}"></i>
                    </div>
                    <h5 class="card-title">${this.escapeHtml(c.title)}</h5>
                    <div class="d-flex gap-2 mb-3">
                        <span class="badge bg-info">${c.level}</span>
                        <span class="badge bg-secondary">${c.lessons} 课时</span>
                    </div>
                    <button class="btn btn-primary btn-sm w-100 mt-auto learn-btn">
                        <i class="bi bi-play-circle"></i> 开始学习
                    </button>
                </div>
            `;
            col.querySelector('.learn-btn').addEventListener('click', () => {
                this.showToast('开始学习：' + c.title, 'success');
            });
            container.appendChild(col);
        });
    }

    // ==================== 社区功能 ====================
    async loadCommunity() {
        const container = document.getElementById('community-list');
        
        try {
            const users = await this.apiRequest('/users');
            const posts = await this.apiRequest('/posts');
            
            container.innerHTML = '';
            
            // 社区统计
            const statsCol = document.createElement('div');
            statsCol.className = 'col-12 mb-4';
            statsCol.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <div class="row text-center">
                            <div class="col-4">
                                <div class="stat-number text-primary">${users.length}</div>
                                <div class="stat-label">社区成员</div>
                            </div>
                            <div class="col-4">
                                <div class="stat-number text-success">${posts.length}</div>
                                <div class="stat-label">原创文章</div>
                            </div>
                            <div class="col-4">
                                <div class="stat-number text-warning">${this.getQuestions().length}</div>
                                <div class="stat-label">技术问答</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(statsCol);
            
            // 活跃用户
            const activeUsers = users.slice(0, 6);
            activeUsers.forEach(user => {
                const col = document.createElement('div');
                col.className = 'col-md-6 col-lg-4 mb-4';
                const isFollowed = this.isFollowing(user.id);
                col.innerHTML = `
                    <div class="card text-center h-100">
                        <div class="card-body">
                            <div class="user-avatar-large mx-auto mb-3">${user.username.charAt(0).toUpperCase()}</div>
                            <h5>${this.escapeHtml(user.username)}</h5>
                            <p class="text-muted small">加入于 ${new Date(user.created_at).toLocaleDateString('zh-CN')}</p>
                            ${this.currentUser && this.currentUser.id !== user.id ? `
                                <button class="btn btn-sm ${isFollowed ? 'btn-secondary' : 'btn-outline-primary'} follow-user-btn">
                                    <i class="bi ${isFollowed ? 'bi-person-check' : 'bi-person-plus'}"></i> ${isFollowed ? '已关注' : '关注'}
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
                const followBtn = col.querySelector('.follow-user-btn');
                if (followBtn) {
                    followBtn.addEventListener('click', () => {
                        this.toggleFollow(user.id, user.username);
                        this.loadCommunity();
                    });
                }
                container.appendChild(col);
            });
        } catch (error) {
            this.showToast('加载社区失败', 'danger');
        }
    }

    // ==================== 联系我们 ====================
    handleContact(e) {
        e.preventDefault();
        const name = document.getElementById('contact-name').value;
        const email = document.getElementById('contact-email').value;
        const message = document.getElementById('contact-message').value;
        
        // 保存到本地存储
        const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
        messages.push({ name, email, message, createdAt: new Date().toISOString() });
        localStorage.setItem('contactMessages', JSON.stringify(messages));
        
        this.showToast('留言已发送，我们会尽快回复！', 'success');
        e.target.reset();
    }

    // ==================== 登录注册 ====================
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
        } catch (error) {
            this.showToast(error.message || '登录失败', 'danger');
        }
    }

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
        } catch (error) {
            this.showToast(error.message || '注册失败', 'danger');
        }
    }

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
            
            localStorage.removeItem('postDraft');
            localStorage.removeItem('editPostId');
            
            this.showPage('posts');
            e.target.reset();
        } catch (error) {
            this.showToast(error.message || '发布失败', 'danger');
        }
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

    createEmptyState(message, icon = 'bi-inbox') {
        const div = document.createElement('div');
        div.className = 'col-12';
        div.innerHTML = `
            <div class="empty-state">
                <i class="bi ${icon}"></i>
                <h5>${message}</h5>
                <p class="text-muted">暂无内容</p>
            </div>
        `;
        return div;
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

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CSDNBlogApp();
});