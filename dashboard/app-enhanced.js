    // Authentication
    function checkAuth() {
      console.log('checkAuth called');
      var hash = 0, s = document.getElementById('auth-input').value;
      console.log('Password entered:', s);
      for (var i = 0; i < s.length; i++) { hash = ((hash << 5) - hash) + s.charCodeAt(i); hash |= 0; }
      console.log('Hash calculated:', hash);
      if (hash === (window.DASHBOARD_AUTH_HASH || -982936170)) {
        console.log('Password accepted!');
        localStorage.setItem('dashboard-auth', Date.now().toString());
        document.getElementById('auth-gate').style.display = 'none';
        document.getElementById('main-dashboard').style.display = 'block';
        loadDashboardData();
        return false;
      }
      console.log('Password rejected');
      document.getElementById('auth-error').style.display = 'block';
      // Clear any stored auth on failed attempt
      localStorage.removeItem('dashboard-auth');
      return false;
    }
    
    function resetAuth() {
      localStorage.removeItem('dashboard-auth');
      localStorage.removeItem('dashboard-view');
      location.reload();
    }
    
    var authTime = parseInt(localStorage.getItem('dashboard-auth') || '0');
    var sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (authTime && (Date.now() - authTime) < sevenDays) {
      document.getElementById('auth-gate').style.display = 'none';
      document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('main-dashboard').style.display = 'block';
        loadDashboardData();
      });
    } else {
      localStorage.removeItem('dashboard-auth');
      document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('main-dashboard').style.display = 'none';
        document.getElementById('auth-input').focus();
      });
    }
    
    // Data loading
    let dashboardData = null;
    
    async function loadDashboardData() {
      try {
        const response = await fetch('/data-enhanced.json');
        dashboardData = await response.json();
        renderDashboard();
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        // Try fallback
        try {
          const fallbackResponse = await fetch('/data.json');
          dashboardData = await fallbackResponse.json();
          renderDashboard();
        } catch (fallbackError) {
          document.getElementById('main-dashboard').innerHTML = '<div style="padding: 40px; text-align: center; color: #f38ba8;">Failed to load dashboard data</div>';
        }
      }
    }
    
    function renderDashboard() {
      if (!dashboardData) return;
      
      updateTime();
      renderProjectsTab();
      renderOrganizationTab();
      renderCostsTab();
      
      // Start clock
      setInterval(updateTime, 1000);
    }
    
    function updateTime() {
      var now = new Date();
      var opts = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' };
      var timeStr = now.toLocaleDateString('en-US', opts);
      
      // Update all time displays
      document.getElementById('live-time').textContent = timeStr;
      document.getElementById('org-live-time').textContent = timeStr;
      document.getElementById('billing-live-time').textContent = timeStr;
      
      var shortDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
      document.getElementById('last-updated').textContent = 'Updated ' + shortDate;
      document.getElementById('org-last-updated').textContent = 'Updated ' + shortDate;
      document.getElementById('billing-last-updated').textContent = 'Updated ' + shortDate;
    }
    
    // Tab switching
    function switchView(view) {
      var views = ['projects', 'organization', 'costs'];
      var projectsView = document.getElementById('projects-view');
      var orgView = document.getElementById('organization-view');
      var costsView = document.getElementById('costs-view');
      
      // Hide all views
      projectsView.style.display = 'none';
      orgView.style.display = 'none';
      costsView.style.display = 'none';
      
      // Deactivate all tabs
      views.forEach(function(v) {
        var tab = document.getElementById('tab-' + v);
        if (tab) tab.classList.remove('active');
      });
      
      // Show selected view
      if (view === 'organization') {
        orgView.style.display = 'block';
        document.getElementById('tab-organization').classList.add('active');
      } else if (view === 'costs') {
        costsView.style.display = 'block';
        document.getElementById('tab-costs').classList.add('active');
      } else {
        projectsView.style.display = 'block';
        document.getElementById('tab-projects').classList.add('active');
      }
      localStorage.setItem('dashboard-view', view);
    }
    
    // Projects Tab Rendering
    function renderProjectsTab() {
      // Needs Attention
      const attentionGrid = document.getElementById('attention-grid');
      const items = dashboardData.needsAttention || [];
      attentionGrid.innerHTML = items.map(item => `
        <div class="attention-card ${item.urgency}">
          <div class="attention-card-header">
            <div>
              <div class="icon">${item.icon}</div>
              <div class="title">${item.title}</div>
              <div class="status">${item.status}</div>
              <div class="detail">${item.detail}</div>
            </div>
          </div>
        </div>
      `).join('');
      
      // Sprint Progress
      const sprint = dashboardData.sprintProgress || {};
      const sprintSection = document.getElementById('sprint-section');
      sprintSection.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div class="sprint-bars">
            <div class="progress-row">
              <div class="progress-label">Backend</div>
              <div class="progress-bar"><div class="progress-fill complete" style="width: ${sprint.backendProgress || 100}%"></div></div>
              <div class="progress-value">${sprint.backendProgress || 100}%</div>
            </div>
            <div class="progress-row">
              <div class="progress-label">Mobile</div>
              <div class="progress-bar"><div class="progress-fill" style="width: ${sprint.mobileProgress || 85}%"></div></div>
              <div class="progress-value">${sprint.mobileProgress || 85}%</div>
            </div>
            <div class="progress-row">
              <div class="progress-label">Web</div>
              <div class="progress-bar"><div class="progress-fill" style="width: ${sprint.webProgress || 70}%"></div></div>
              <div class="progress-value">${sprint.webProgress || 70}%</div>
            </div>
            <div class="progress-row">
              <div class="progress-label">Overall</div>
              <div class="progress-bar"><div class="progress-fill overall" style="width: ${sprint.overallProgress || 85}%"></div></div>
              <div class="progress-value">${sprint.overallProgress || 85}%</div>
            </div>
          </div>
          <div class="sprint-stats">
            <div class="stat-card">
              <div class="stat-label">Launch Date</div>
              <div class="stat-value">${sprint.launchDate || '2026-03-01'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Open Issues</div>
              <div class="stat-value">${sprint.openIssues || 6}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Current Build</div>
              <div class="stat-value">${sprint.currentBuild || 'TestFlight 18'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Days Remaining</div>
              <div class="stat-value">${sprint.daysRemaining || 12}</div>
            </div>
          </div>
        </div>
      `;
      
      // Projects
      const projects = dashboardData.projects || [];
      const projectGrid = document.getElementById('project-grid');
      projectGrid.innerHTML = projects.map(project => `
        <div class="project-card">
          <div class="project-header">
            <div class="project-icon">${project.icon}</div>
            <div class="project-title">${project.name}</div>
            <div class="project-status ${project.status}">${project.status}</div>
          </div>
          <div class="project-progress">
            <div class="progress-bar"><div class="progress-fill" style="width: ${project.progress}%"></div></div>
            <div class="progress-value">${project.progress}%</div>
          </div>
          <div class="project-detail">${project.detail}</div>
          <div class="project-deadline">${project.deadline}</div>
        </div>
      `).join('');
      
      // To-Dos
      const todos = dashboardData.todos || [];
      const todoSection = document.getElementById('todo-section');
      todoSection.innerHTML = todos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}">
          <div class="todo-checkbox">${todo.completed ? '✅' : '⬜'}</div>
          <div class="todo-text">${todo.text}</div>
          <div class="todo-context">${todo.context || ''}</div>
        </div>
      `).join('');
      
      // Time Chart
      const ctx = document.getElementById('time-chart').getContext('2d');
      const timeData = dashboardData.timeAllocation || {};
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Development', 'Diving', 'Business', 'Admin', 'Learning', 'Personal'],
          datasets: [{
            data: [timeData.development || 35, timeData.diving || 30, timeData.business || 15, timeData.admin || 10, timeData.learning || 5, timeData.personal || 5],
            backgroundColor: [
              'rgba(137, 180, 250, 0.8)',
              'rgba(166, 227, 161, 0.8)',
              'rgba(203, 166, 247, 0.8)',
              'rgba(148, 226, 213, 0.8)',
              'rgba(249, 226, 175, 0.8)',
              'rgba(250, 179, 135, 0.8)'
            ],
            borderColor: [
              'rgba(137, 180, 250, 1)',
              'rgba(166, 227, 161, 1)',
              'rgba(203, 166, 247, 1)',
              'rgba(148, 226, 213, 1)',
              'rgba(249, 226, 175, 1)',
              'rgba(250, 179, 135, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
      
      // Time detail panel
      const detailPanel = document.getElementById('time-detail-panel');
      detailPanel.innerHTML = `
        <div class="time-detail-row">
          <div class="time-detail-label">Development</div>
          <div class="time-detail-value">${timeData.development || 35}%</div>
        </div>
        <div class="time-detail-row">
          <div class="time-detail-label">Diving</div>
          <div class="time-detail-value">${timeData.diving || 30}%</div>
        </div>
        <div class="time-detail-row">
          <div class="time-detail-label">Business</div>
          <div class="time-detail-value">${timeData.business || 15}%</div>
        </div>
        <div class="time-detail-row">
          <div class="time-detail-label">Admin</div>
          <div class="time-detail-value">${timeData.admin || 10}%</div>
        </div>
        <div class="time-detail-row">
          <div class="time-detail-label">Learning</div>
          <div class="time-detail-value">${timeData.learning || 5}%</div>
        </div>
        <div class="time-detail-row">
          <div class="time-detail-label">Personal</div>
          <div class="time-detail-value">${timeData.personal || 5}%</div>
        </div>
      `;
      
      // Recent Activity
      const activities = dashboardData.recentActivity || [];
      const activityList = document.getElementById('activity-list');
      activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
          <div class="activity-icon">${activity.icon}</div>
          <div class="activity-content">
            <div class="activity-text">${activity.text}</div>
            <div class="activity-time">${activity.time}</div>
          </div>
        </div>
      `).join('');
      
      // Deadlines
      const deadlines = dashboardData.deadlines || [];
      const deadlinesList = document.getElementById('deadlines-list');
      deadlinesList.innerHTML = deadlines.map(deadline => `
        <div class="deadline-item ${deadline.urgency}">
          <div class="deadline-icon">${deadline.icon}</div>
          <div class="deadline-content">
            <div class="deadline-title">${deadline.title}</div>
            <div class="deadline-date">${deadline.date}</div>
          </div>
        </div>
      `).join('');
    }
    
    // Organization Tab Rendering
    let allAgents = [];
    
    function renderOrganizationTab() {
      const orgData = dashboardData.organization || {};
      allAgents = dashboardData.agents || [];
      
      // Cost Overview
      const totalCost = orgData.monthlyCosts?.total || 1280;
      const targetCost = orgData.monthlyCosts?.target || 150;
      const overspend = totalCost - targetCost;
      const overspendPercent = Math.min(100, Math.round((overspend / targetCost) * 100));
      
      document.getElementById('org-total-cost').textContent = `$${totalCost}`;
      document.getElementById('org-target-cost').textContent = `$${targetCost}`;
      document.getElementById('org-overspend').textContent = `$${overspend}`;
      document.getElementById('org-cost-detail').textContent = `Last 30 days • ${orgData.monthlyCosts?.trend === 'up' ? '+' : ''}14% vs last month`;
      document.getElementById('org-cost-progress').style.width = `${Math.min(100, Math.round((totalCost / 1500) * 100))}%`;
      
      // Render all agents initially
      renderAgents('all');
    }
    
    function renderAgents(filter) {
      const agentsGrid = document.getElementById('org-agents-grid');
      
      // Filter agents
      let filteredAgents = allAgents;
      if (filter === 'Core Team') {
        filteredAgents = allAgents.filter(a => a.team === 'Core Team');
      } else if (filter === 'Scheduled Crew') {
        filteredAgents = allAgents.filter(a => a.team === 'Scheduled Crew');
      } else if (filter === 'On-Demand Specialists') {
        filteredAgents = allAgents.filter(a => a.team === 'On-Demand Specialists');
      }
      
      agentsGrid.innerHTML = filteredAgents.map(agent => {
        // Format last active time
        const lastActive = new Date(agent.lastActive);
        const now = new Date();
        const diffHours = Math.floor((now - lastActive) / (1000 * 60 * 60));
        let lastActiveText = '';
        
        if (diffHours < 1) {
          lastActiveText = 'Just now';
        } else if (diffHours < 24) {
          lastActiveText = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else {
          const diffDays = Math.floor(diffHours / 24);
          lastActiveText = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        }
        
        // Get team badge class
        let badgeClass = '';
        if (agent.team === 'Core Team') badgeClass = 'badge-core';
        else if (agent.team === 'Scheduled Crew') badgeClass = 'badge-scheduled';
        else if (agent.team === 'On-Demand Specialists') badgeClass = 'badge-specialist';
        
        return `
        <div class="agent-card-enhanced">
          <div class="agent-header-enhanced">
            <div class="agent-avatar-enhanced">${agent.emoji}</div>
            <div class="agent-info-enhanced">
              <div class="agent-name-enhanced">
                ${agent.name}
                <span class="team-badge ${badgeClass}">${agent.team}</span>
              </div>
              <div class="agent-role-enhanced">${agent.role}</div>
              <div class="station-indicator">📍 ${agent.station}</div>
            </div>
            <div class="agent-status-badge status-${agent.status}">${agent.status.toUpperCase()}</div>
          </div>
          
          <div class="agent-focus">
            <div class="agent-focus-label">Current Focus</div>
            <div class="agent-focus-text">${agent.currentTask}</div>
          </div>
          
          <div class="agent-metrics-enhanced">
            <div class="agent-metric">
              <div class="agent-metric-label">Cost This Month</div>
              <div class="agent-metric-value">$${agent.costThisMonth}</div>
            </div>
            <div class="agent-metric">
              <div class="agent-metric-label">Tasks Completed</div>
              <div class="agent-metric-value">${agent.tasksCompleted}</div>
            </div>
          </div>
          
          <div style="margin-top: 12px; font-size: 0.85rem; color: var(--text-muted);">
            <div>Last active: ${lastActiveText}</div>
            <div>Productivity: ${agent.productivity}%</div>
          </div>
        </div>
      `}).join('');
    }
    
    function filterAgents(team) {
      // Update filter buttons
      document.querySelectorAll('.team-filter').forEach(btn => {
        btn.classList.remove('active');
      });
      event.target.classList.add('active');
      
      // Render filtered agents
      renderAgents(team);
    }
      
      // API Costs
      const apis = orgData.apiCosts || [];
      apis.forEach(api => {
        if (api.name.includes('Anthropic')) {
          document.getElementById('api-anthropic').textContent = `$${api.cost}`;
          document.getElementById('api-anthropic-detail').textContent = api.detail;
          document.getElementById('api-anthropic-progress').style.width = `${api.percent}%`;
        } else if (api.name.includes('OpenAI')) {
          document.getElementById('api-openai').textContent = `$${api.cost}`;
          document.getElementById('api-openai-detail').textContent = api.detail;
          document.getElementById('api-openai-progress').style.width = `${api.percent}%`;
        } else if (api.name.includes('Google')) {
          document.getElementById('api-google').textContent = `$${api.cost}`;
          document.getElementById('api-google-detail').textContent = api.detail;
          document.getElementById('api-google-progress').style.width = `${api.percent}%`;
        }
      });
      
      // Infrastructure
      const infra = orgData.infrastructure || {};
      document.getElementById('org-hosting-list').innerHTML = (infra.hosting || []).map(item => `
        <div class="cost-item">
          <div class="cost-label">${item.name}</div>
          <div class="cost-amount">$${item.cost}</div>
          <div class="cost-detail">${item.detail}</div>
        </div>
      `).join('');
      
      document.getElementById('org-services-list').innerHTML = (infra.services || []).map(item => `
        <div class="cost-item">
          <div class="cost-label">${item.name}</div>
          <div class="cost-amount">$${item.cost}</div>
          <div class="cost-detail">${item.detail}</div>
        </div>
      `).join('');
      
      // Alerts
      const alerts = orgData.alerts || [];
      const alertsContainer = document.getElementById('org-alerts');
      alertsContainer.innerHTML = alerts.map(alert => `
        <div class="alert">
          <div class="alert-icon">⚠️</div>
          <div class="alert-content">
            <div class="alert-title">${alert.title}</div>
            <div class="alert-desc">${alert.detail}</div>
            <div class="alert-action">${alert.action}</div>
          </div>
        </div>
      `).join('');
    }
    
    // Costs Tab Rendering
    function renderCostsTab() {
      const billing = dashboardData.billing || {};
      
      // Subscriptions
      const subscriptions = billing.subscriptions || [];
      const subscriptionsGrid = document.getElementById('subscriptions-grid');
      subscriptionsGrid.innerHTML = subscriptions.map(sub => `
        <div class="subscription-card">
          <div class="subscription-status">${sub.status}</div>
          <div class="subscription-name">${sub.name}</div>
          <div class="subscription-cost">$${sub.cost}/${sub.period}</div>
          <div class="subscription-period">${sub.period} subscription</div>
          <div class="subscription-next">Next charge: ${sub.nextCharge}</div>
          <a href="${sub.url}" target="_blank" class="billing-portal-link">Manage →</a>
        </div>
      `).join('');
      
      // Billing Portals
      const portals = billing.portals || [];
      const portalsGrid = document.getElementById('billing-portals-grid');
      portalsGrid.innerHTML = portals.map(portal => `
        <a href="${portal.url}" target="_blank" class="billing-portal-card">
          <div class="billing-portal-header">
            <div class="billing-portal-name">${portal.name}</div>
            <div class="billing-portal-cost">$${portal.cost}</div>
          </div>
          <div class="billing-portal-category">${portal.category}</div>
          <div class="billing-portal-link">Open billing portal →</div>
        </a>
      `).join('');
      
      // Monthly Summary
      const summary = billing.monthlySummary || {};
      document.getElementById('monthly-total').textContent = `$${summary.total || 1280}`;
      
      const breakdown = document.getElementById('monthly-breakdown');
      breakdown.innerHTML = `
        <div class="summary-item">
          <div class="summary-item-label">AI APIs</div>
          <div class="summary-item-value">$${summary.aiApis || 847}</div>
        </div>
        <div class="summary-item">
          <div class="summary-item-label">Infrastructure</div>
          <div class="summary-item-value">$${summary.infrastructure || 186}</div>
        </div>
        <div class="summary-item">
          <div class="summary-item-label">Subscriptions</div>
          <div class="summary-item-value">$${summary.subscriptions || 40}</div>
        </div>
        <div class="summary-item">
          <div class="summary-item-label">Agents</div>
          <div class="summary-item-value">$${summary.agents || 207}</div>
        </div>
        <div class="summary-item" style="border-top: 2px solid var(--border); padding-top: 16px; margin-top: 8px;">
          <div class="summary-item-label" style="font-weight: 700;">TOTAL</div>
          <div class="summary-item-value" style="font-size: 1.3rem; color: var(--accent-red);">$${summary.total || 1280}</div>
          <span class="summary-change ${summary.change?.includes('+') ? 'change-up' : 'change-down'}">${summary.change || '+14%'}</span>
        </div>
      `;
    }
    
    // Restore saved view
    document.addEventListener('DOMContentLoaded', function() {
      const savedView = localStorage.getItem('dashboard-view') || 'projects';
      switchView(savedView);
    });
