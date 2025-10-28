import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import SideBar from "../../common/adminSidebar";
import { roomsAPI } from "../../../services/roomsAPI";
import contractsAPI from "../../../services/contractsAPI";
import invoicesAPI from "../../../services/invoicesAPI";
import "../admin-global.css";
import "./dashboard.css";

const Dashboard = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    totalTenants: 0,
    activeContracts: 0,
    monthlyRevenue: 0,
    occupancyRate: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch room statistics
      const roomStatsResponse = await roomsAPI.getAllRooms({ limit: 1000 });
      const rooms = roomStatsResponse?.data?.rooms || [];
      
      const totalRooms = rooms.length;
      const occupiedRooms = rooms.filter(r => r.status === 'rented').length;
      const availableRooms = rooms.filter(r => r.status === 'available').length;
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

      // Calculate total tenants from rooms (count tenants in room.tenants array)
      const totalTenants = rooms.reduce((sum, room) => {
        return sum + (room.tenants?.length || 0);
      }, 0);

      // Fetch contract statistics
      const contractsResponse = await contractsAPI.searchContracts({ limit: 1000 });
      const contracts = contractsResponse?.data?.items || [];
      const activeContracts = contracts.filter(c => c.status === 'active').length;

      // Calculate revenue from paid invoices
      const invoicesResponse = await invoicesAPI.getInvoices({ limit: 10000 });
      const invoices = invoicesResponse?.data?.items || invoicesResponse?.data?.invoices || [];
      
      // Get current month's revenue from paid invoices
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyRevenue = invoices
        .filter(inv => {
          const isPaid = inv.status === 'paid';
          const paidDate = inv.paidDate ? new Date(inv.paidDate) : null;
          const isCurrentMonth = paidDate && paidDate >= currentMonthStart;
          return isPaid && isCurrentMonth;
        })
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

      setStats({
        totalRooms,
        occupiedRooms,
        availableRooms,
        totalTenants,
        activeContracts,
        monthlyRevenue,
        occupancyRate
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `₫${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `₫${(amount / 1000).toFixed(1)}K`;
    }
    return `₫${amount}`;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <SideBar />
        <div className="dashboard-content">
          <div className="dashboard-header">
            <h1 className="dashboard-title">{t('dashboard.title')}</h1>
            <p className="dashboard-subtitle">{t('dashboard.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <SideBar />
      <div className="dashboard-content">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">{t('dashboard.title')}</h1>
          <p className="dashboard-subtitle">{t('dashboard.subtitle')}</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-header">
              <div>
                <div className="stat-number">{stats.totalRooms}</div>
                <div className="stat-label">{t('dashboard.stats.totalRooms')}</div>
              </div>
              <div className="stat-icon primary">
                <i className="fas fa-home"></i>
              </div>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-header">
              <div>
                <div className="stat-number">{stats.occupiedRooms}</div>
                <div className="stat-label">{t('dashboard.stats.occupiedRooms')}</div>
              </div>
              <div className="stat-icon success">
                <i className="fas fa-key"></i>
              </div>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-header">
              <div>
                <div className="stat-number">{stats.availableRooms}</div>
                <div className="stat-label">{t('dashboard.stats.availableRooms')}</div>
              </div>
              <div className="stat-icon warning">
                <i className="fas fa-door-open"></i>
              </div>
            </div>
          </div>

          <div className="stat-card danger">
            <div className="stat-header">
              <div>
                <div className="stat-number">{formatCurrency(stats.monthlyRevenue)}</div>
                <div className="stat-label">{t('dashboard.stats.monthlyRevenue')}</div>
              </div>
              <div className="stat-icon danger">
                <i className="fas fa-chart-line"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">{t('dashboard.charts.monthlyRevenue')}</h3>
              <select className="chart-period">
                <option>{t('dashboard.charts.last6Months')}</option>
                <option>{t('dashboard.charts.1Year')}</option>
                <option>{t('dashboard.charts.all')}</option>
              </select>
            </div>
            <div className="chart-placeholder">
              📊 {t('dashboard.charts.totalRevenue')}: {formatCurrency(stats.monthlyRevenue)}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">{t('dashboard.charts.occupancyRate')}</h3>
            </div>
            <div className="occupancy-chart">
              <div className="occupancy-rate">{stats.occupancyRate}%</div>
              <div className="occupancy-label">{t('dashboard.charts.roomOccupancyRate')}</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-section">
          <div className="activity-card">
            <div className="activity-header">
              <h3 className="activity-title">{t('dashboard.activity.recentActivity')}</h3>
            </div>
            <div className="activity-summary">
              <div className="summary-item">
                <i className="fas fa-users"></i>
                <div>
                  <div className="summary-number">{stats.totalTenants}</div>
                  <div className="summary-label">{t('dashboard.activity.totalTenants')}</div>
                </div>
              </div>
              <div className="summary-item">
                <i className="fas fa-file-contract"></i>
                <div>
                  <div className="summary-number">{stats.activeContracts}</div>
                  <div className="summary-label">{t('dashboard.activity.activeContracts')}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="activity-card">
            <div className="activity-header">
              <h3 className="activity-title">{t('dashboard.activity.systemInfo')}</h3>
            </div>
            <div className="activity-summary">
              <div className="summary-item">
                <i className="fas fa-door-closed"></i>
                <div>
                  <div className="summary-number">{stats.occupiedRooms}/{stats.totalRooms}</div>
                  <div className="summary-label">{t('dashboard.activity.occupiedRooms')}</div>
                </div>
              </div>
              <div className="summary-item">
                <i className="fas fa-percentage"></i>
                <div>
                  <div className="summary-number">{stats.occupancyRate}%</div>
                  <div className="summary-label">{t('dashboard.activity.occupancyRate')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
